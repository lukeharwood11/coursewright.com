import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { familyVisibleMaterials, staffCanEdit } from "@/app/layouts/model/viewMode";
import { getCourse } from "@/courses/databridge/courses";
import {
  bulletinQueryKeys,
  getBulletin,
  softDeleteBulletin,
} from "@/bulletins/databridge/bulletins";
import { isBulletinAvailable } from "@/bulletins/model/availability";
import { coursePath } from "@/courses/model/paths";
import { parentQueryKeys } from "@/parent/databridge/dashboard";
import { localIsoDate } from "@/parent/model/thisWeek";

export function useBulletin() {
  const params = useParams();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const bulletinId = params.bulletinId ? Number(params.bulletinId) : NaN;
  const { organization, role, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = staffCanEdit(role, parentPresentation);
  const today = localIsoDate();

  const courseQuery = useQuery({
    queryKey: ["courses", "detail", courseId],
    queryFn: () => getCourse(courseId),
    enabled: Number.isFinite(courseId),
  });
  const bulletinQuery = useQuery({
    queryKey: bulletinQueryKeys.detail(bulletinId),
    queryFn: () => getBulletin(bulletinId),
    enabled: Number.isFinite(bulletinId),
  });

  const course = courseQuery.data ?? null;
  const bulletin = bulletinQuery.data ?? null;
  const belongsHere =
    bulletin != null &&
    course != null &&
    bulletin.courseId === course.id &&
    bulletin.organizationId === organization.id &&
    course.organizationId === organization.id;
  const familyHidden =
    parentPresentation &&
    bulletin != null &&
    (!isBulletinAvailable(today, bulletin.startDate, bulletin.endDate) ||
      bulletin.deletedAt != null);
  const materials = parentPresentation
    ? familyVisibleMaterials(bulletin?.materials ?? [])
    : (bulletin?.materials ?? []);

  const remove = useMutation({
    mutationFn: () => softDeleteBulletin(bulletinId, user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: bulletinQueryKeys.course(courseId),
      });
      void queryClient.invalidateQueries({
        queryKey: bulletinQueryKeys.org(organization.id),
      });
      void queryClient.invalidateQueries({ queryKey: parentQueryKeys.dashboard(organization.id, user.id) });
      navigate(coursePath(organization.slug, courseId));
    },
  });

  return {
    organization,
    courseId,
    bulletinId,
    canEdit,
    isParent: parentPresentation,
    today,
    course: belongsHere ? course : null,
    bulletin: belongsHere && !familyHidden ? bulletin : null,
    materials,
    loading: courseQuery.isLoading || bulletinQuery.isLoading,
    error: courseQuery.error
      ? courseQuery.error.message
      : bulletinQuery.error
        ? bulletinQuery.error.message
        : remove.error?.message ?? null,
    notFound:
      !courseQuery.isLoading &&
      !bulletinQuery.isLoading &&
      (!belongsHere || familyHidden || !bulletin || bulletin.deletedAt != null),
    unavailable: Boolean(familyHidden && belongsHere && bulletin && !bulletin.deletedAt),
    remove,
  };
}
