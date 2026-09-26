import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { familyVisibleMaterials, staffCanEdit } from "@/app/layouts/model/viewMode";
import {
  courseQueryKeys,
  getCourse,
  listCourseInstructors,
} from "@/courses/databridge/courses";
import { staffCanManageCourse } from "@/courses/model/access";
import {
  getLessonPlan,
  lessonPlanQueryKeys,
  softDeleteLessonPlan,
  updateLessonPlanVisibility,
} from "@/lesson-plans/databridge/lessonPlans";
import { lessonPlanIsPublished } from "@/lesson-plans/model/visibility";
import type { LessonPlanVisibility } from "@/lesson-plans/model/visibility";
import { coursePath } from "@/courses/model/paths";
import { parentQueryKeys } from "@/parent/databridge/dashboard";

export function useLessonPlan() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const lessonPlanId = params.lessonPlanId ? Number(params.lessonPlanId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const staffEdit = staffCanEdit(role, parentPresentation);

  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const instructorsQuery = useQuery({
    queryKey: courseQueryKeys.instructors(courseId),
    queryFn: () => listCourseInstructors(courseId),
    enabled: Number.isFinite(courseId) && staffEdit,
  });
  const planQuery = useQuery({
    queryKey: lessonPlanQueryKeys.detail(lessonPlanId),
    queryFn: () => getLessonPlan(lessonPlanId),
    enabled: Number.isFinite(lessonPlanId),
  });

  const course = courseQuery.data ?? null;
  const plan = planQuery.data ?? null;
  const canEdit = staffCanManageCourse({
    role,
    parentPresentation,
    userId: user.id,
    instructorUserIds: (instructorsQuery.data ?? []).map((row) => row.userId),
  });
  const belongsHere =
    plan != null &&
    course != null &&
    plan.courseId === course.id &&
    plan.organizationId === organization.id &&
    course.organizationId === organization.id &&
    plan.deletedAt == null;
  const familyHidden =
    parentPresentation && plan != null && !lessonPlanIsPublished(plan.visibility);
  const days = (plan?.days ?? []).map((day) => ({
    ...day,
    materials: parentPresentation
      ? familyVisibleMaterials(day.materials)
      : day.materials,
  }));

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: lessonPlanQueryKeys.course(courseId),
    });
    void queryClient.invalidateQueries({
      queryKey: lessonPlanQueryKeys.org(organization.id),
    });
    void queryClient.invalidateQueries({
      queryKey: lessonPlanQueryKeys.detail(lessonPlanId),
    });
    void queryClient.invalidateQueries({
      queryKey: parentQueryKeys.dashboardPrefix(organization.id, user.id),
    });
  }

  const remove = useMutation({
    mutationFn: () => softDeleteLessonPlan(lessonPlanId, user.id),
    onSuccess: () => {
      invalidate();
      navigate(coursePath(organization.slug, courseId));
    },
  });

  const setVisibility = useMutation({
    mutationFn: (visibility: LessonPlanVisibility) =>
      updateLessonPlanVisibility(lessonPlanId, visibility),
    onSuccess: invalidate,
  });

  return {
    organization,
    courseId,
    lessonPlanId,
    canEdit,
    isParent: parentPresentation,
    course: belongsHere ? course : null,
    plan: belongsHere && !familyHidden ? plan : null,
    days: belongsHere && !familyHidden ? days : [],
    loading:
      courseQuery.isLoading ||
      planQuery.isLoading ||
      instructorsQuery.isLoading,
    error: courseQuery.error
      ? courseQuery.error.message
      : planQuery.error
        ? planQuery.error.message
        : remove.error?.message ?? setVisibility.error?.message ?? null,
    notFound:
      !courseQuery.isLoading &&
      !planQuery.isLoading &&
      (!belongsHere || !plan || plan.deletedAt != null),
    unavailable: Boolean(familyHidden && belongsHere && plan && plan.deletedAt == null),
    remove,
    setVisibility,
  };
}
