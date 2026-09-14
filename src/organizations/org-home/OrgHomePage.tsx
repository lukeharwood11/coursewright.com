import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { ParentHome } from "./components/ParentHome";
import { StaffHome } from "./components/StaffHome";
import { useOrgHome } from "./hooks/useOrgHome";

export function OrgHomePage() {
  const { orgSlug } = useParams();
  const shell = useOrgShell();
  const home = useOrgHome(orgSlug);

  useEffect(() => {
    const name = shell.organization.name;
    document.title = `${name} · Course Wright`;
  }, [shell.organization.name]);

  if (shell.role === "parent") {
    return (
      <ParentHome
        firstName={home.firstName}
        orgSlug={shell.organization.slug}
        dashboard={home.dashboard}
        loading={home.dashboardLoading}
        error={home.dashboardError}
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
