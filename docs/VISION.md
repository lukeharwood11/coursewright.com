# Course Wright — Product Vision

## One-liner

Course Wright is an intuitive LMS for **homeschool co-ops and micro-schools** — a course builder with org management and role-based access, so admins run the org, instructors teach, and parents can **use the materials** (on screen or printed) without the clunky complexity of typical school software.

**Tagline:** Plan wright. Share wright. Course Wright.  
**Short:** Courses, done wright.

## Problems we solve

1. **Unified lesson material + planning** — Course content, plans, and resources live in one place instead of scattered across drives, email, and spreadsheets. **Print is part of this** — paper is a first-class way to use what you built.
2. **Communication with parents** — Invite parents by email; they create/log in with that email to view **and print** materials. Magic-link (no account) is a later option. Progress (grades, notes, checklists) in P1.
3. **Billing** — Course Wright charges **organizations** so they can run courses and serve parents. Orgs collecting payment from parents is **later**.
4. **Software that doesn't get in the way** — Existing LMS and co-op tools are often clunky, confusing, and overbuilt. Course Wright prioritizes clarity and ease of use so instructors and parents can get things done without a manual.
5. **Replace the patchwork** — Many co-ops today juggle **Microsoft (file sharing)**, **WhatsApp (day-to-day communication)**, and **Outlook (parent email)**. Course Wright consolidates materials and parent-facing communication into one obvious place.

## What users use today

| Tool | How it's used | Course Wright opportunity |
|------|---------------|---------------------------|
| **Microsoft (OneDrive/SharePoint/etc.)** | File sharing for lesson materials | Unified material storage in the course builder |
| **WhatsApp** | Quick communication between families and instructors | Materials and updates in-app |
| **Outlook / email** | Formal communication with parents | Email invites + in-app parent views |
| **Google Classroom** | Some orgs have tried it | Rejected as **too heavy-handed** |

## Who we serve

| Segment | Phase | Description |
|---------|-------|-------------|
| **Homeschool co-ops** | P0 | Admins, instructors, parents — course builder, RBAC, parent sharing |
| **Micro-schools** | P0 | Same workflows as co-ops |
| **Org admins / owners** | P0 | Anyone can create an org (they become first **owner**). Owners and admins manage the org; **only owners** manage billing. Multiple admins; invite extra admins by email. |
| **Instructors** | P0 | Build courses, enroll students, invite parents, share and **print** materials |
| **Parents** | P0 | Invited by email; **must have an account** to view. Same email as invite. **Design anchor:** parents who dislike technology. **Print** this week / each material is obvious |
| **Parents creating materials** | P0 | A parent can create an org, build a course, and **print** — roster optional. Smallest valuable loop |
| **Parents (progress)** | P1 | Grades, instructor notes, completion checklists, homework tracking |
| **Student profiles** | P0 | Org-level records (`student_profile`) — no login; created on first course enrollment |
| **Students (accounts)** | P2 | User accounts linked to existing student profiles |

## Product principles

1. **Intuitive above all** — Every screen should feel obvious. Usability is a constraint from day one.
2. **Extreme shareability** — Plan wright. **Share wright.** Print, links, and files are first-class. If a parent built materials and just wants them on paper, that is **one tap**. Sharing is not an export afterthought.
3. **Simple over comprehensive** — P0 is the course builder + org/RBAC + parent sharing + print. Depth comes later.
4. **Built for co-ops and micro-schools** — Not district-scale complexity.
5. **Reuse over rework** — In P0, create a course from another course (content copy). In P1, optional **templates** for linked blueprints.
6. **Templates are P1** — reusable blueprints with ACL, live link, promote, and sync. Not required for P0 course building.
7. **P0 course-from-course is a copy** — new course is independent; no live sync between source and copy.
8. **Versioned, reversible content** — course content is versioned (who changed what). Dangerous actions can be reverted. **Soft deletes** — never hard-delete user content. (**P1:** same for templates; deprecate vs delete on template resources.)
9. **Template access is simple (P1)** — creator is owner; org admins see everything; any instructor who can **view** a template can create a course from it.
10. **Courses are offerings** — optional dates, own roster, multiple instructors; created from scratch or from another course (P0); optionally from a template or promoted into one (P1).
11. **Low friction for parents, still authenticated** — Email invite, then sign up / log in. **If a tech-averse parent can't understand the screen immediately, we've failed.** Magic links may come later.
12. **Create → print is a complete product** — A parent (or instructor) can make materials and print them **without a roster, invites, or anyone else in the org**. Enrollment makes sharing richer; it is not the on-ramp to value.
13. **Access follows enrollment** — Parents belong to an org when their student profile is enrolled in a course with `status = active`.
14. **One hub for teaching** — Replaces scattered files, WhatsApp threads, and email chains where possible.

### Usability bar

**Primary design persona:** The **tech-averse parent**. They open an invite link or log in and need to understand **what's going on the second they land**.

**Parent view requirements:**

- Instant clarity — student, course, and "what you need to know" visible immediately
- Parent dashboard: this calendar week's dated materials (P0), important now (P0), available bulletins (P0), summary (P1)
- **Print this week** and **Print** on each material — paper without extra software
- Plain language — no LMS jargon
- Works on a phone in a browser

## Short-term vision (0–12 months) — P0

**Goal:** Ship a **course builder** with **organizational management**, **roster management**, **RBAC**, **file sharing**, **parent access**, and **extreme shareability** (print + links) that co-ops, micro-schools, and a parent making materials at home can run on day one.

**Primary users:** Admins, instructors, and parents.

**Focus areas:**

- **Organization management** — anyone can create an org (they are first **owner**); **multiple admins** via email invite (claimable); owner vs admin = billing
- **Roster management** — students, parent links, enrollments, staff/instructors
- **RBAC** — owner, admin, instructor, parent roles; owners/admins manage accounts
- **Course builder** — **courses** with **units** (optional dates); create from scratch or **from another course**. (**Templates / sync / promote = P1**)
- **P0 "homework"** — dated materials in a unit (shows on parent "this week") — not a separate assignment type yet
- **Student profiles** — no accounts; created when first added to a course; linkable to accounts in P2
- **Instructor course roster** — instructors enroll students; new students auto-create org profiles; **multiple instructors** per course
- **File sharing (minimum)** — generous file types; upload as course materials; share with parents; **audio/video with in-app players**
- **Course grade metadata** — courses tagged with multiple grades and/or ranges
- **Advanced search** — native, cross-facet find (“where is this resource?”)
- **Families / parent directory** — org-scoped households from roster; parents belong to a family profile (names + TBD fields)
- **Extreme shareability** — print, resource links, files; **create → print works with an empty roster**
- **Print** — one-tap print of a material, a unit packet, or this week's work (generated PDF preview → Download / Print)
- **Parent invites** — email-based; **account required** in P0 to view (magic links later)
- **Parent org access** — gated on student profile enrolled in a course with `status = active`; parent profile stays **active** if enrollment ends (P0)
- **Parent dashboard** — this **Sunday–Saturday** week + important now + available **bulletins**
- **Product analytics** — PostHog

**Success looks like:**

- Growing **MAUs** (monthly active users)
- Admin manages roster and invites instructors without hand-holding
- Instructor uploads a file and parents can access it **without using Microsoft/OneDrive**
- Instructor finds a material via search instead of clicking through every unit
- Instructor builds a course (from scratch or from last term’s course) and invites parents in minutes
- Parent creates/logs in from their invite and **immediately understands** what their child needs this week
- Parent (or instructor) builds materials and **prints them in one tap** — no roster required
- Orgs reduce reliance on **WhatsApp + Outlook + shared folders** for routine sharing

## Medium-term vision (P1)

**Goal:** Progress visibility, auto-summaries, Course Wright charging organizations, and **course templates** (linked blueprints, ACL, promote, sync).

- **Course templates** — reusable blueprints; create course from template; promote; sync unmodified copies; deprecate vs delete
- **Course summary** — system-drafted, instructor-editable
- **Progress** — grades, instructor notes, completion checklists; assignment objects (TBD)
- **SaaS billing** — Course Wright collects from **orgs** (packaging: per teacher or per course — hypothesis)

## Long-term vision (P2)

- **Parent family management** across orgs (org-scoped Family is P0)
- **Student accounts** — link user logins to existing student profiles; materials, quizzes, assigned work
- **Orgs collecting payment from parents** — not now

## What we are not (for now)

- **No native mobile app** — web only
- **Not a district SIS**
- **Not Google Classroom** — lighter, co-op-scaled
- **Not open parent access** — parents must be invited and linked to enrolled students
- **Not parent-pay / tuition collection** — Course Wright bills orgs first

## Open questions

- **SaaS packaging** — per teacher vs per course (hypothesis only)
- **Assignment objects** — next conversation (beyond dated unit materials)
- **Grade scheme custom UX** — how orgs define custom / range labels
