import { useEffect } from "react";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { staffCanEdit } from "@/app/layouts/model/viewMode";
import { useToastOnError } from "@/ui/useToastOnError";
import { ParentHome } from "./components/ParentHome";
import { StaffHome } from "./components/StaffHome";
import { useOrgHome } from "./hooks/useOrgHome";

export function OrgHomePage() {
  const shell = useOrgShell();
  const home = useOrgHome();
  useToastOnError(home.dashboardError);
  useToastOnError(home.staffDashboardError);

  useEffect(() => {
    const name = shell.organization.name;
    document.title = `${name} · Course Wright`;
  }, [shell.organization.name]);

  if (home.parentPresentation) {
    return (
      <ParentHome
        key={shell.organization.slug}
        firstName={home.firstName}
        organization={shell.organization}
        orgSlug={shell.organization.slug}
        dashboard={home.dashboard}
        loading={home.dashboardLoading}
        error={home.dashboardError}
        preview={home.parentViewIsPreview}
        previewKind={
          home.isInstructorPreview
            ? "instructor"
            : home.parentViewIsPreview
              ? "empty-family"
              : null
        }
        weekStartParam={home.weekStartParam}
        isCurrentWeek={home.isCurrentWeek}
        onPrevWeek={home.goPrevWeek}
        onNextWeek={home.goNextWeek}
        onThisWeek={home.goThisWeek}
      />
    );
  }

  return (
    <StaffHome
      orgSlug={shell.organization.slug}
      dashboard={home.staffDashboard}
      loading={home.staffDashboardLoading}
      error={home.staffDashboardError}
      canCreate={staffCanEdit(shell.role, shell.parentPresentation)}
    />
  );
}
