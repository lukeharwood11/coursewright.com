import { useEffect } from "react";
import {
  UserProfileContent,
  UserProfileNotFound,
} from "./components/UserProfileContent";
import { useUserProfile } from "./hooks/useUserProfile";

export function UserProfilePage() {
  const page = useUserProfile();

  useEffect(() => {
    document.title = page.profile
      ? `${page.profile.name} · Course Wright`
      : "Profile · Course Wright";
  }, [page.profile]);

  if (page.loading) {
    return (
      <div className="px-5 py-8 md:px-8">
        <p className="text-[14px] text-[var(--ink-soft)]">Loading profile…</p>
      </div>
    );
  }

  if (page.notFound || !page.profile) {
    return (
      <div className="px-5 py-8 md:px-8">
        <UserProfileNotFound
          orgSlug={page.organization.slug}
          orgName={page.organization.name}
          error={page.error}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-8 md:px-8">
      <UserProfileContent
        profile={page.profile}
        orgSlug={page.organization.slug}
        role={page.role}
      />
    </div>
  );
}
