import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  deletePushSubscription,
  fetchWebPushPublicKey,
  savePushSubscription,
} from "@/notifications/databridge/push";
import {
  PUSH_DEVICE_DISABLED_KEY,
  PUSH_PROMPT_DISMISSED_KEY,
  type PushPermission,
  isInstalledPwa,
} from "@/notifications/model/push";
import { ensurePushSubscription, pushSubscriptionKeys } from "../browser";

function readInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  const displayMode = window.matchMedia("(display-mode: standalone)").matches
    ? "standalone"
    : window.matchMedia("(display-mode: fullscreen)").matches
      ? "fullscreen"
      : "browser";
  return isInstalledPwa({ standalone, displayMode });
}

function readPermission(): PushPermission {
  if (typeof Notification === "undefined") return "unsupported";
  if (
    Notification.permission === "granted" ||
    Notification.permission === "denied" ||
    Notification.permission === "default"
  ) {
    return Notification.permission;
  }
  return "unsupported";
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    if (on) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  } catch {
    // Private mode can block storage. The in-memory flag still applies this visit.
  }
}

export function useActivityPush() {
  const [installed, setInstalled] = useState(readInstalled);
  const [permission, setPermission] = useState<PushPermission>(readPermission);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const [dismissed, setDismissed] = useState(() => readFlag(PUSH_PROMPT_DISMISSED_KEY));
  const [disabledOnDevice, setDisabledOnDevice] = useState(() =>
    readFlag(PUSH_DEVICE_DISABLED_KEY),
  );
  const [subscribed, setSubscribed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)");
    const update = () => setInstalled(readInstalled());
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    const check = () => {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        if (!cancelled) setServiceWorkerReady(Boolean(registration));
      });
    };
    check();
    window.addEventListener("load", check);
    window.addEventListener("cw-service-worker", check);
    navigator.serviceWorker.addEventListener("controllerchange", check);
    return () => {
      cancelled = true;
      window.removeEventListener("load", check);
      window.removeEventListener("cw-service-worker", check);
      navigator.serviceWorker.removeEventListener("controllerchange", check);
    };
  }, []);

  const keyQuery = useQuery({
    queryKey: ["web-push-public-key"],
    queryFn: fetchWebPushPublicKey,
    enabled: installed && serviceWorkerReady,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
  const publicKey = keyQuery.data ?? null;

  const sync = useCallback(async () => {
    if (!publicKey) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return;
    const subscription = await ensurePushSubscription(registration, publicKey);
    const keys = pushSubscriptionKeys(subscription);
    if (!keys) throw new Error("incomplete");
    await savePushSubscription(keys);
    setSubscribed(true);
  }, [publicKey]);

  useEffect(() => {
    if (!installed || !serviceWorkerReady || !publicKey) {
      if (!installed) setChecked(true);
      return;
    }
    if (permission !== "granted" || disabledOnDevice) {
      setSubscribed(false);
      setChecked(true);
      return;
    }
    let cancelled = false;
    void sync()
      .catch(() => {
        if (!cancelled) setSubscribed(false);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [installed, serviceWorkerReady, publicKey, permission, disabledOnDevice, sync]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "cw-activity-push-resubscribe") return;
      if (disabledOnDevice || permission !== "granted") return;
      void sync().catch(() => undefined);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [disabledOnDevice, permission, sync]);

  async function turnOn() {
    setError(null);
    setBusy(true);
    try {
      if (typeof Notification === "undefined") {
        setError("Couldn’t turn on notifications. Try again.");
        return;
      }
      const next = await Notification.requestPermission();
      setPermission(
        next === "granted" || next === "denied" || next === "default" ? next : "unsupported",
      );
      if (next !== "granted") return;
      writeFlag(PUSH_DEVICE_DISABLED_KEY, false);
      setDisabledOnDevice(false);
      await sync();
    } catch {
      setError("Couldn’t turn on notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setError(null);
    setBusy(true);
    try {
      writeFlag(PUSH_DEVICE_DISABLED_KEY, true);
      setDisabledOnDevice(true);
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await deletePushSubscription(endpoint);
      }
      setSubscribed(false);
    } catch {
      setError("Couldn’t turn off notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    writeFlag(PUSH_PROMPT_DISMISSED_KEY, true);
    setDismissed(true);
  }

  return {
    installed,
    permission,
    serviceWorkerReady,
    publicKeyReady: Boolean(publicKey),
    dismissed,
    disabledOnDevice,
    subscribed,
    checked,
    busy,
    error,
    turnOn,
    turnOff,
    dismiss,
  };
}

export function usePushNavigation() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | null;
      if (!data || data.type !== "cw-activity-push" || typeof data.url !== "string") return;
      const url = new URL(data.url, window.location.origin);
      if (url.origin !== window.location.origin) return;
      window.location.assign(url.href);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);
}
