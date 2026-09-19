import { useEffect } from "react";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { ParentHome } from "./components/ParentHome";
import { StaffHome } from "./components/StaffHome";
import { useOrgHome } from "./hooks/useOrgHome";

export function OrgHomePage() {
  const shell = useOrgShell();
  const home = useOrgHome();

  useEffect(() => {
    const name = shell.organization.name;
    document.title = `${name} · Course Wright`;
  }, [shell.organization.name]);

  if (home.parentPresentation) {
    return (
      <ParentHome
        key={shell.organization.slug}
        firstName={home.firstName}
        orgSlug={shell.organization.slug}
        dashboard={home.dashboard}
        loading={home.dashboardLoading}
        error={home.dashboardError}
        preview={home.parentViewIsPreview}
      />
    );
  }

  return (
    <StaffHome
      orgName={shell.organization.name}
      orgSlug={shell.organization.slug}
      dashboard={home.staffDashboard}
      loading={home.staffDashboardLoading}
      error={home.staffDashboardError}
    />
  );
}
