import { useEffect } from "react";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { OrgProfileContent } from "./components/OrgProfileContent";

export function OrgProfilePage() {
  const { organization, role } = useOrgShell();

  useEffect(() => {
    document.title = `${organization.name} · Course Wright`;
  }, [organization.name]);

  return (
    <div className="px-5 py-4 md:px-8">
      <OrgProfileContent organization={organization} isOwner={role === "owner"} />
    </div>
  );
}
