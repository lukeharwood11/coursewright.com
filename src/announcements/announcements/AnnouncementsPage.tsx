import { useEffect } from "react";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { PageLoading } from "@/ui/PageLoading";
import { ButtonLink } from "@/ui/Button";
import { useToastOnError } from "@/ui/useToastOnError";
import { newAnnouncementPath } from "@/announcements/model/paths";
import { ParentAnnouncementsList } from "./components/ParentAnnouncementsList";
import { StaffAnnouncementList } from "./components/StaffAnnouncementList";
import { useAnnouncements } from "./hooks/useAnnouncements";

export function AnnouncementsPage() {
  const page = useAnnouncements();
  useToastOnError(page.error);

  useEffect(() => {
    document.title = "Announcements · Course Wright";
  }, []);

  if (page.loading) {
    return (
      <PageLoading label="Loading announcements…" />
    );
  }

  if (page.isParent) {
    return (
      <div className="px-5 py-4 md:px-8">
        <h1
          className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Announcements
        </h1>
        <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[var(--ink-soft)]">
          Notes from your teachers. Opening one marks it as seen.
        </p>
        <ParentAnnouncementsList
          orgSlug={page.organization.slug}
          items={page.parentAnnouncements}
          showStudent={page.showStudent}
        />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Announcements
          </h1>
        </div>
        {page.canEdit ? (
          <ButtonLink to={newAnnouncementPath(page.organization.slug)}>
            <MegaphoneIcon className="h-5 w-5" aria-hidden />
            New announcement
          </ButtonLink>
        ) : null}
      </div>

      {page.announcements.length === 0 ? (
        <p className="mt-6 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
          There are no announcements at this time.
        </p>
      ) : (
        <StaffAnnouncementList
          orgSlug={page.organization.slug}
          items={page.announcements}
          today={page.today}
        />
      )}
    </div>
  );
}
