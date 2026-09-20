/** Public help topics at `/docs`. Keep role copy aligned with FEATURES.md RBAC. */

export type HelpDocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; text: string };

export type HelpDocTopic = {
  /** URL segment after `/docs`. Empty string = `/docs` (Getting started). */
  slug: string;
  title: string;
  navLabel: string;
  description: string;
  body: HelpDocBlock[];
};

export type HelpDocNavGroup = {
  heading?: string;
  slugs: string[];
};

export const helpDocTopics: HelpDocTopic[] = [
  {
    slug: "",
    title: "Getting started",
    navLabel: "Getting started",
    description: "Create an account, start an organization, and find your way around.",
    body: [
      {
        type: "p",
        text: "Course Wright helps homeschool co-ops and micro-schools plan courses, share materials with parents, and run the program from one place. This short guide covers the basics.",
      },
      { type: "h2", text: "Create an account" },
      {
        type: "ol",
        items: [
          "Open Sign up and create an account with email and password, or continue with Google.",
          "You can also sign in later from Sign in — including a magic link sent to your email.",
          "After you sign in, you land on My organizations (`/my`), where you pick an organization or create one.",
        ],
      },
      { type: "h2", text: "Create your organization" },
      {
        type: "p",
        text: "Anyone can create an organization. The person who creates it becomes the first owner.",
      },
      {
        type: "ol",
        items: [
          "From My organizations, create a new organization and give it a name.",
          "Course Wright gives it a permalink (a short URL slug). You can change that later in organization settings — with a warning that existing links will break.",
          "Open the organization to reach its home. Staff see courses, roster, and settings in the sidebar.",
        ],
      },
      {
        type: "callout",
        text: "You do not need a roster to start. You can build a course and print materials on your own first.",
      },
      { type: "h2", text: "What to do next" },
      {
        type: "ul",
        items: [
          "Invite staff (owners, admins, and instructors) from organization settings — see Staff & roles.",
          "Add students and classes from Roster when you are ready to enroll families.",
          "Create a course, add units and materials, then share or print what parents need.",
        ],
      },
      {
        type: "p",
        text: "Parents join by invite only. They sign up or sign in with the invited email, then see this week’s work for their linked students.",
      },
    ],
  },
  {
    slug: "organization",
    title: "Your organization",
    navLabel: "Your organization",
    description: "Home, settings, grade scheme, and how the sidebar works.",
    body: [
      {
        type: "p",
        text: "Each organization is its own workspace: courses, roster, and staff. If you belong to more than one, switch from My organizations.",
      },
      { type: "h2", text: "Organization home" },
      {
        type: "p",
        text: "Staff home is a dashboard for running the program. Parents see a simpler “this week” view for their students once they are invited and enrolled.",
      },
      { type: "h2", text: "Sidebar" },
      {
        type: "ul",
        items: [
          "Home — organization dashboard",
          "Courses — list and open course offerings",
          "Roster — students and classes",
          "Settings — name, permalink, grade scheme, and staff (owners and admins manage; instructors may view)",
        ],
      },
      { type: "h2", text: "Settings" },
      {
        type: "ul",
        items: [
          "Name and organization type (co-op or micro-school)",
          "Permalink slug — changing it breaks existing links; confirm before you save",
          "Grade scheme — how student grades are labeled (for example K–12 or custom labels)",
          "Staff — invite people and manage roles (see Staff & roles)",
        ],
      },
      {
        type: "callout",
        text: "Billing (when it ships) is owner-only. Admins can run the organization; they cannot manage payment.",
      },
    ],
  },
  {
    slug: "courses",
    title: "Courses and materials",
    navLabel: "Courses & materials",
    description: "Build a course, add units and materials, and share or print work.",
    body: [
      {
        type: "p",
        text: "A course is an offering for a term or year. Inside it you add units, materials, and notices for families.",
      },
      { type: "h2", text: "Create a course" },
      {
        type: "ol",
        items: [
          "Open Courses in the sidebar and create a course (from scratch, or by copying another course).",
          "Set dates, status, instructors, and grade metadata in course settings when you need them.",
          "Add co-teachers from course settings so more than one instructor can build the same course.",
        ],
      },
      { type: "h2", text: "Units and materials" },
      {
        type: "ul",
        items: [
          "Units group work in order. Dates on units are optional.",
          "Materials can be a page (blocks of content, including quizzes), a link, or a file (including audio and video).",
          "New materials start unpublished. Publish when parents should see them.",
          "Mark items Important now when families need to notice them on home.",
        ],
      },
      { type: "h2", text: "Bulletins" },
      {
        type: "p",
        text: "A bulletin is a dated notice with materials attached. While today’s date falls in its start–end window, it appears on the parent home under From your teachers.",
      },
      { type: "h2", text: "Announcements" },
      {
        type: "p",
        text: "An announcement is a one-way note to a course, a class, or a student. Families see it on home while it is current. Opening it marks it read. There is no reply thread — that is later.",
      },
      { type: "h2", text: "Print and share" },
      {
        type: "ul",
        items: [
          "Use Print on a material or Print unit on a unit — print stays visible, not buried in menus.",
          "Parents can Print this week from their home for the current week’s work.",
          "Share links still require an account in this release; recipients sign in before they see the material.",
        ],
      },
    ],
  },
  {
    slug: "roster",
    title: "Roster",
    navLabel: "Roster",
    description: "Students, classes, course enrollments, and inviting parents.",
    body: [
      {
        type: "p",
        text: "Roster is how you manage people in the organization. Staff invites and roles live under organization settings; this page covers students, classes, enrollments, and parent invites.",
      },
      { type: "h2", text: "Three levels" },
      {
        type: "ul",
        items: [
          "Organization roster — student profiles and classes for the whole program",
          "Class — a named group of students (not a course; no materials)",
          "Course roster — who is enrolled in a specific offering",
        ],
      },
      { type: "h2", text: "Student profiles" },
      {
        type: "p",
        text: "Students do not need their own login in this release. Each student is a profile: name, optional grade, optional parent emails, and optional student email.",
      },
      {
        type: "ol",
        items: [
          "Open Roster and add students (one at a time or in a batch).",
          "Select students to add them to a class or enroll them in a course.",
          "Open a student profile to edit details and manage parent invites.",
        ],
      },
      {
        type: "callout",
        text: "A student profile is also created automatically the first time you enroll someone new in a course or class.",
      },
      { type: "h2", text: "Classes" },
      {
        type: "p",
        text: "Create a class from the roster, then add members from the class page or by selecting students on the org roster and choosing Add to class.",
      },
      { type: "h2", text: "Course enrollments" },
      {
        type: "p",
        text: "Enrollments live on each course’s roster. Parents only see materials for students enrolled in an active course, and only for published materials.",
      },
      { type: "h2", text: "Invite parents" },
      {
        type: "ol",
        items: [
          "From a student profile or course roster, invite one or more parent emails.",
          "Course Wright emails a claim link, and you can copy the same link to share yourself.",
          "The parent opens the link, creates an account or signs in with that email, then sees linked students once enrollments and publish rules are met.",
        ],
      },
      {
        type: "p",
        text: "To invite owners, admins, or instructors instead of parents, use Staff & roles.",
      },
    ],
  },
  {
    slug: "staff-roles",
    title: "Staff and roles",
    navLabel: "Staff & roles",
    description: "Invite staff and understand what owners, admins, instructors, and parents can do.",
    body: [
      {
        type: "p",
        text: "Owners and admins invite staff from Organization settings → Staff. Instructors build courses. Parents are invited from the roster, not from the staff list.",
      },
      { type: "h2", text: "Invite staff" },
      {
        type: "ol",
        items: [
          "Open Settings for your organization.",
          "In the Staff section, invite someone as owner, admin, or instructor by email.",
          "Course Wright emails a claim link. You can also copy the link to send yourself.",
          "The recipient opens the invite, signs up or signs in with that email, and joins the organization in the invited role.",
        ],
      },
      {
        type: "ul",
        items: [
          "Pending invites can be copied again, resent by email, or canceled.",
          "Owners and admins can change admin ↔ instructor for existing staff, or remove someone from staff.",
          "You cannot remove or demote the last remaining owner or admin — that protects the organization from lockout.",
          "Owner seats are invite-only; you do not promote someone to owner by flipping admin ↔ instructor.",
        ],
      },
      {
        type: "callout",
        text: "Changing or removing staff updates membership only (who can run settings and invites). It does not rewrite who sees course materials — families still need enrollment (and parent links where they apply).",
      },
      { type: "h2", text: "What each role can do" },
      {
        type: "ul",
        items: [
          "Owner — everything an admin can do, plus billing when billing ships. The creator of the organization is the first owner.",
          "Admin — manage the organization (name, permalink, grade scheme), invite staff, change or remove admins and instructors (except the last owner/admin), full roster, full org visibility. Cannot manage billing.",
          "Instructor — build and edit courses, manage course rosters, co-teach, upload and share files, print, invite parents, mark Important now. Does not manage org-wide staff or billing.",
          "Parent — view and print shared content for linked, enrolled students in active courses after claiming an invite. A parent who created an organization is an owner for that org, not the parent role.",
        ],
      },
      { type: "h2", text: "Teacher / Parent view" },
      {
        type: "p",
        text: "Owners, admins, and instructors can switch most organization pages to a parent-style presentation with Teacher / Parent view in the header. Parent-only accounts do not see that control.",
      },
    ],
  },
  {
    slug: "parents",
    title: "For families",
    navLabel: "For families",
    description: "How parents join and what they see on home.",
    body: [
      {
        type: "p",
        text: "Parents are invited by the organization. You need an account with the same email as the invite.",
      },
      { type: "h2", text: "Accept an invite" },
      {
        type: "ol",
        items: [
          "Open the invite link from email (or a link someone copied for you).",
          "Confirm the invited email on the page, then create an account or sign in with that address.",
          "After you claim the invite, you join as a parent for the linked student(s).",
        ],
      },
      {
        type: "callout",
        text: "Seeing materials also requires that student to be enrolled in an active course with published work. The invite alone does not open every course.",
      },
      { type: "h2", text: "Your home" },
      {
        type: "ul",
        items: [
          "This week — work assigned or due this calendar week",
          "Important now — items teachers flagged for attention",
          "Announcements — one-way notes for a course, class, or student, with a notification until you open them",
          "From your teachers — bulletins that are available today, with links to attached materials",
          "Print this week — print the week’s packet when you want it on paper",
        ],
      },
      {
        type: "p",
        text: "If you have more than one student, home groups work by child so it stays easy to scan.",
      },
    ],
  },
];

export const helpDocNav: HelpDocNavGroup[] = [
  { slugs: [""] },
  {
    heading: "Using Course Wright",
    slugs: ["organization", "courses", "roster", "staff-roles"],
  },
  {
    heading: "Families",
    slugs: ["parents"],
  },
];

export function helpDocPath(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function helpDocBySlug(slug: string | undefined): HelpDocTopic | undefined {
  const key = slug ?? "";
  return helpDocTopics.find((topic) => topic.slug === key);
}

export function helpDocTitle(pathname: string): string | undefined {
  if (pathname === "/docs" || pathname === "/docs/") {
    return helpDocBySlug("")?.title ?? "Help";
  }
  if (!pathname.startsWith("/docs/")) {
    return undefined;
  }
  const slug = pathname.slice("/docs/".length).replace(/\/$/, "");
  const topic = helpDocBySlug(slug);
  return topic ? topic.title : undefined;
}
