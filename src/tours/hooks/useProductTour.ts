import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { EventHandler, Step } from "react-joyride";
import { EVENTS, STATUS } from "react-joyride";
import { useStaffViewMode } from "@/app/layouts/stores/viewMode";
import { useSidebarStore } from "@/app/layouts/stores/sidebar";
import { staffShowsParentPresentation } from "@/app/layouts/model/viewMode";
import { useAuthSession } from "@/auth/hooks/useAuthSession";
import { courseQueryKeys, listCourses } from "@/courses/databridge/courses";
import { getOrganizationFeatures } from "@/organizations/databridge/features";
import {
  getMembershipByOrgSlug,
  orgQueryKeys,
} from "@/organizations/databridge/memberships";
import { TOUR_ANCHORS, tourSelector, type TourAnchor } from "@/tours/model/anchors";
import { selectActiveTour } from "@/tours/model/eligibility";
import { TOUR_KEYS, type TourKey, type TourStatus } from "@/tours/model/keys";
import { courseIdFromPath, locationMatches, orgSlugFromPath } from "@/tours/model/location";
import {
  clearTourStep,
  readTourLater,
  readTourStep,
  writeTourLater,
  writeTourStep,
} from "@/tours/model/sessionStep";
import {
  decideStep,
  shouldAdvanceFromAction,
  stepsForTour,
  type TourStep,
} from "@/tours/model/steps";
import {
  listMyTourProgress,
  productTourQueryKeys,
  upsertTourProgress,
} from "@/tours/databridge/productTours";

function anchorIsVisible(anchor: TourAnchor): boolean {
  const nodes = document.querySelectorAll(tourSelector(anchor));
  for (const node of nodes) {
    if (!(node instanceof HTMLElement)) continue;
    let parent: HTMLElement | null = node;
    let visible = true;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") {
        visible = false;
        break;
      }
      parent = parent.parentElement;
    }
    if (visible) return true;
  }
  return false;
}

function waitForStep(
  step: TourStep,
  cancelled: () => boolean,
): Promise<"show" | "skip"> {
  const started = performance.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (cancelled()) return;
      const decision = decideStep(step, {
        anchorVisible: anchorIsVisible(step.anchor),
        pathname: window.location.pathname,
        elapsedMs: performance.now() - started,
      });
      if (decision === "wait") {
        window.setTimeout(tick, 100);
        return;
      }
      resolve(decision);
    };
    tick();
  });
}

export function useProductTour() {
  const session = useAuthSession();
  const userId = session.user?.id ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orgSlug = orgSlugFromPath(location.pathname);

  const membershipQuery = useQuery({
    queryKey: orgQueryKeys.bySlug(orgSlug ?? "", userId ?? ""),
    queryFn: () => getMembershipByOrgSlug(userId ?? "", orgSlug ?? ""),
    enabled: Boolean(orgSlug && userId),
  });

  const organizationId = membershipQuery.data?.organization.id ?? null;
  const role = membershipQuery.data?.role ?? null;
  const { staffViewMode } = useStaffViewMode(orgSlug ?? undefined, {
    isParent: Boolean(membershipQuery.data?.isParent),
    isStudent: Boolean(membershipQuery.data?.isStudent),
    role,
  });
  const parentPresentation = staffShowsParentPresentation(role, staffViewMode);

  const featuresQuery = useQuery({
    queryKey: orgQueryKeys.features(organizationId ?? 0),
    queryFn: () => getOrganizationFeatures(organizationId ?? 0),
    enabled: organizationId != null,
  });

  const coursesQuery = useQuery({
    queryKey: courseQueryKeys.list(organizationId ?? 0),
    queryFn: () => listCourses(organizationId ?? 0),
    enabled: organizationId != null,
  });

  const progressQuery = useQuery({
    queryKey: productTourQueryKeys.mine(userId ?? ""),
    queryFn: () => listMyTourProgress(),
    enabled: Boolean(userId),
  });

  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const [trackedKey, setTrackedKey] = useState<TourKey | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [domTick, setDomTick] = useState(0);
  const [laterRevision, setLaterRevision] = useState(0);

  const pathCourseId = orgSlug ? courseIdFromPath(location.pathname, orgSlug) : null;
  const lessonCourseId = pathCourseId ?? coursesQuery.data?.[0]?.id ?? null;
  const hasCourse = (coursesQuery.data?.length ?? 0) > 0 || pathCourseId != null;
  const firstCourseInProgress =
    trackedKey === TOUR_KEYS.firstCourse ||
    Boolean(userId && readTourStep(userId, TOUR_KEYS.firstCourse) != null);

  const ready =
    session.status === "ready" &&
    Boolean(userId && orgSlug) &&
    membershipQuery.isSuccess &&
    featuresQuery.isSuccess &&
    coursesQuery.isSuccess &&
    progressQuery.isSuccess;

  const seen = useMemo(() => {
    const keys = new Set((progressQuery.data ?? []).map((row) => row.tourKey));
    for (const key of dismissed) keys.add(key);
    return keys;
  }, [progressQuery.data, dismissed]);

  const selected = ready
    ? selectActiveTour({
        role,
        parentPresentation,
        lessonPlansEnabled: Boolean(featuresQuery.data?.lessonPlans),
        hasCourse,
        firstCourseInProgress,
        seen,
      })
    : null;

  const specs = useMemo(
    () =>
      selected && orgSlug
        ? stepsForTour(selected, { orgSlug, courseId: lessonCourseId })
        : [],
    [selected, orgSlug, lessonCourseId],
  );

  const deferred =
    laterRevision >= 0 &&
    selected != null &&
    userId != null &&
    readTourLater(userId, selected);

  const pendingNav = useRef<number | null>(null);
  if (selected !== trackedKey) {
    setTrackedKey(selected);
    if (selected && userId && orgSlug && !readTourLater(userId, selected)) {
      const count = stepsForTour(selected, { orgSlug, courseId: lessonCourseId }).length;
      const saved = readTourStep(userId, selected);
      const start = saved != null && saved < count ? saved : 0;
      setStepIndex(start);
      pendingNav.current = start;
    } else {
      pendingNav.current = null;
      if (!selected) setStepIndex(0);
    }
  }

  const specsRef = useRef(specs);
  const locationRef = useRef(location);
  const selectedRef = useRef(selected);
  const userIdRef = useRef(userId);
  const stepIndexRef = useRef(stepIndex);
  specsRef.current = specs;
  locationRef.current = location;
  selectedRef.current = selected;
  userIdRef.current = userId;
  stepIndexRef.current = stepIndex;

  const endedKey = useRef<TourKey | null>(null);
  const tokenRef = useRef(0);
  const advancing = useRef(false);

  function prepare(step: TourStep) {
    if (
      step.openMobileNav &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      useSidebarStore.getState().setMobileOpen(true);
    }
    if (!step.route) return;
    const here = {
      pathname: locationRef.current.pathname,
      search: locationRef.current.search,
    };
    if (!locationMatches(here, step.route)) navigate(step.route);
  }

  useEffect(() => {
    if (!selected || deferred || pendingNav.current == null) return;
    const step = specs[pendingNav.current];
    pendingNav.current = null;
    if (step) prepare(step);
    // prepare reads the latest location ref; re-running on every location change would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, deferred, specs, stepIndex]);

  useEffect(() => {
    if (!userId || !selected || deferred) return;
    if (stepIndex < 0 || stepIndex >= specs.length) return;
    writeTourStep(userId, selected, stepIndex);
  }, [userId, selected, deferred, stepIndex, specs.length]);

  useEffect(() => {
    return () => {
      tokenRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        setDomTick((tick) => tick + 1);
      });
    });
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [selected]);

  useEffect(() => {
    const step = specs[stepIndex];
    if (!selected || deferred || !step?.openMobileNav) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    if (anchorIsVisible(step.anchor)) return;
    useSidebarStore.getState().setMobileOpen(true);
  }, [selected, deferred, stepIndex, specs, location.pathname, domTick]);

  async function persist(status: TourStatus) {
    const key = selectedRef.current;
    const user = userIdRef.current;
    if (!key || !user || endedKey.current === key) return;
    endedKey.current = key;
    clearTourStep(user, key);
    setDismissed((current) => {
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });
    try {
      await upsertTourProgress({
        tourKey: key,
        status,
        lastStepIndex: stepIndexRef.current < specsRef.current.length
          ? stepIndexRef.current
          : Math.max(specsRef.current.length - 1, 0),
      });
      await queryClient.invalidateQueries({ queryKey: productTourQueryKeys.mine(user) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't save the tour.";
      toast.error(message);
    }
  }

  useEffect(() => {
    if (!selected || specs.length === 0) return;
    if (stepIndex < specs.length) return;
    void persist("finished");
    // persist closes over the latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, stepIndex, specs.length]);

  function later() {
    const key = selectedRef.current;
    const user = userIdRef.current;
    if (!key || !user) return;
    writeTourLater(user, key);
    tokenRef.current += 1;
    advancing.current = false;
    setLaterRevision((revision) => revision + 1);
  }

  function advance(index: number) {
    const current = specsRef.current;
    if (!current.length || advancing.current) return;
    if (index >= current.length - 1) {
      setStepIndex(current.length);
      return;
    }
    advancing.current = true;
    const token = ++tokenRef.current;
    void (async () => {
      try {
        let cursor = index + 1;
        while (cursor < current.length) {
          const step = current[cursor];
          if (!step) break;
          prepare(step);
          const decision = await waitForStep(step, () => token !== tokenRef.current);
          if (token !== tokenRef.current) return;
          if (decision === "show") {
            setStepIndex(cursor);
            return;
          }
          cursor += 1;
        }
        setStepIndex(current.length);
      } finally {
        if (token === tokenRef.current) advancing.current = false;
      }
    })();
  }

  const onEvent: EventHandler = (data) => {
    if (data.type !== EVENTS.TOUR_END) return;
    if (data.status === STATUS.FINISHED) {
      void persist("finished");
      return;
    }
    if (data.status === STATUS.SKIPPED) {
      void persist("skipped");
    }
  };

  const steps: Step[] = specs.map((step) => ({
    target: tourSelector(step.anchor),
    title: step.title,
    content: step.body,
    placement: step.advance === "material" ? "top" : "auto",
    disableFocusTrap: step.advance !== "next",
    hideOverlay: step.advance === "material",
    blockTargetInteraction: step.anchor === TOUR_ANCHORS.previewAsFamily,
    data: { anchor: step.anchor, showNext: step.advance === "next" },
  }));

  useEffect(() => {
    const step = specs[stepIndex];
    if (!selected || deferred || !step || step.advance === "next") return;

    if (step.advance === "next-anchor") {
      const next = specs[stepIndex + 1];
      if (
        next &&
        anchorIsVisible(next.anchor) &&
        shouldAdvanceFromAction(step, { kind: "next-anchor-visible" })
      ) {
        advance(stepIndex);
      }
      return;
    }

    function onClick(event: MouseEvent) {
      const node = event.target;
      if (!(node instanceof Node)) return;
      const element = node instanceof Element ? node : node.parentElement;
      if (!element || !step) return;
      if (step.advance === "click") {
        const anchor = document.querySelector(tourSelector(step.anchor));
        if (!anchor?.contains(element)) return;
        if (!shouldAdvanceFromAction(step, { kind: "anchor-click" })) return;
        // Let the control's own click and the form's submit finish first.
        queueMicrotask(() => advance(stepIndex));
        return;
      }
      if (step.advance === "material") {
        const item = element.closest("[role='menuitem']");
        if (!item) return;
        const label = (item.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!shouldAdvanceFromAction(step, { kind: "menu-item", label })) return;
        queueMicrotask(() => advance(stepIndex));
      }
    }

    function onSubmit(event: Event) {
      if (!step || step.advance !== "submit") return;
      const form = event.target;
      if (!(form instanceof Element)) return;
      const anchor = document.querySelector(tourSelector(step.anchor));
      if (!anchor?.contains(form)) return;
      if (!shouldAdvanceFromAction(step, { kind: "anchor-submit" })) return;
      queueMicrotask(() => advance(stepIndex));
    }

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
    // advance reads refs. Rebinding on every identity change would drop clicks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, deferred, stepIndex, specs, domTick]);

  const current = specs[stepIndex];
  const anchorVisible = domTick >= 0 && current != null && anchorIsVisible(current.anchor);
  const run = Boolean(selected) && !deferred && stepIndex < specs.length && anchorVisible;

  return { run, steps, stepIndex, advance, later, onEvent };
}
