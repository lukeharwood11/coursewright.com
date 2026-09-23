import { useRef, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";
import { BellIcon } from "@heroicons/react/24/outline";
import { AccountMenu } from "@/auth/components/AccountMenu";
import { AnchoredPopup } from "./AnchoredPopup";
import { Avatar } from "./Avatar";
import { ActivityMenuPanel } from "@/notifications/activity-menu/components/ActivityMenuPanel";
import type { ActivityItem } from "@/notifications/model/activity";

const sampleActivity: ActivityItem[] = [
  {
    id: 1,
    organizationId: 1,
    kind: "discussion_mention",
    discussionId: 9,
    discussionMessageId: 4,
    announcementId: null,
    reportCardInstanceId: null,
    actorId: "a",
    actorName: "Maya Chen",
    title: "Field trip forms",
    preview: "Can you bring extra copies on Thursday?",
    audienceLabel: "Biology",
    createdAt: "2026-09-20T17:00:00Z",
    readAt: null,
  },
  {
    id: 2,
    organizationId: 1,
    kind: "discussion_message",
    discussionId: 3,
    discussionMessageId: 12,
    announcementId: null,
    reportCardInstanceId: null,
    actorId: "b",
    actorName: "Jon Reyes",
    title: "Week 3 plan",
    preview: "Posted the updated reading list.",
    audienceLabel: "Humanities",
    createdAt: "2026-09-20T16:00:00Z",
    readAt: null,
  },
];

function assertInViewport(selector: string) {
  const node = document.querySelector(selector);
  if (!(node instanceof HTMLElement)) {
    throw new Error(`Missing popup ${selector}`);
  }
  const rect = node.getBoundingClientRect();
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (rect.left < -0.5 || rect.top < -0.5) {
    throw new Error(
      `Popup overflows the origin (${rect.left}, ${rect.top})`,
    );
  }
  if (rect.right > width + 0.5 || rect.bottom > height + 0.5) {
    throw new Error(
      `Popup overflows the frame (${rect.right}>${width}, ${rect.bottom}>${height})`,
    );
  }
}

function MenuBody({ title }: { title: string }) {
  return (
    <div className="px-3.5 py-3">
      <p className="text-[11px] font-bold text-[var(--ink-faint)]">{title}</p>
      <p className="mt-2 text-[13.5px] font-extrabold text-[var(--ink)]">
        Home Grove Academy
      </p>
      <p className="mt-1 text-[12px] text-[var(--ink-soft)]">
        Settings, sign out, and switch stay on screen.
      </p>
    </div>
  );
}

function CornerTrigger({
  className,
  label,
  menuClassName,
  children,
}: {
  className: string;
  label: string;
  menuClassName: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={`rounded-full p-1.5 text-[var(--ink-soft)] hover:bg-[var(--green-tint)] ${className}`}
      >
        {label === "Activity" ? (
          <BellIcon className="h-6 w-6" aria-hidden />
        ) : (
          <Avatar name="Luke Harwood" size={28} />
        )}
      </button>
      <AnchoredPopup
        open
        dismiss={false}
        anchorRef={ref}
        label={label}
        className={menuClassName}
      >
        {children}
      </AnchoredPopup>
    </>
  );
}

const meta = {
  title: "UI/AnchoredPopup",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const MobileHeaderLeft: Story = {
  name: "Mobile header — left (account + activity)",
  play: async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    assertInViewport('[role="menu"][aria-label="Account"]');
  },
  render: () => (
    <MemoryRouter>
      <div className="min-h-screen bg-[var(--paper)]">
        <header className="flex flex-wrap items-center gap-3 border-b border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[13px] font-bold text-[var(--ink)]">
            Home Grove Academy
          </p>
        </header>
        <div className="relative flex items-center gap-1.5 bg-[var(--surface)] px-4 py-2">
          <CornerTrigger
            className="static"
            label="Account"
            menuClassName="w-[16.5rem]"
          >
            <MenuBody title="User" />
          </CornerTrigger>
        </div>
      </div>
    </MemoryRouter>
  ),
};

export const MobileActivityLeft: Story = {
  name: "Mobile header — left (activity)",
  play: async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    assertInViewport('[role="menu"][aria-label="Activity"]');
  },
  render: () => (
    <MemoryRouter>
      <div className="min-h-screen bg-[var(--paper)]">
        <header className="flex items-center gap-2 bg-[var(--surface)] px-4 py-3">
          <CornerTrigger
            className="static"
            label="Activity"
            menuClassName="w-[20rem]"
          >
            <ActivityMenuPanel
              preview={sampleActivity}
              remainingUnread={1}
              loading={false}
              error={null}
              openingId={null}
              activityHref="/my/home-grove-academy/activity"
              onOpen={() => undefined}
              onViewAll={() => undefined}
            />
          </CornerTrigger>
        </header>
      </div>
    </MemoryRouter>
  ),
};

export const BottomRightOpensUp: Story = {
  name: "Bottom of screen — opens up",
  play: async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    assertInViewport('[role="menu"][aria-label="More"]');
  },
  render: () => (
    <div className="relative min-h-screen bg-[var(--paper)]">
      <CornerTrigger
        className="absolute bottom-3 right-3"
        label="More"
        menuClassName="min-w-[11rem]"
      >
        <MenuBody title="Course" />
      </CornerTrigger>
    </div>
  ),
};

export const TopRight: Story = {
  name: "Top right — stays on screen",
  play: async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
    assertInViewport('[role="menu"][aria-label="Account"]');
  },
  render: () => (
    <div className="relative min-h-screen bg-[var(--paper)]">
      <CornerTrigger
        className="absolute right-3 top-3"
        label="Account"
        menuClassName="w-[16.5rem]"
      >
        <MenuBody title="User" />
      </CornerTrigger>
    </div>
  ),
};

export const AccountMenuLive: Story = {
  name: "Account menu (click to open)",
  render: () => (
    <MemoryRouter>
      <div className="flex min-h-screen flex-col bg-[var(--paper)]">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] bg-[var(--surface)] px-4 py-3">
          <p className="text-[13px] font-bold text-[var(--ink)]">
            Home Grove Academy
          </p>
          <AccountMenu
            name="Luke Harwood"
            email="luke@example.com"
            roleLabel="Owner"
            orgName="Home Grove Academy"
            orgSlug="home-grove-academy"
          />
        </header>
      </div>
    </MemoryRouter>
  ),
};
