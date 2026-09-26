/**
 * Seed Doxa Christian Academy on the testing Supabase project.
 *
 * Usage (via ./scripts/seed-doxa-org.sh):
 *   tsx scripts/seed-doxa/seed.ts [--reset] [--tier testing]
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COURSES,
  FAKE_STUDENTS,
  HARWOOD_KIDS,
  LANA,
  LUKE,
  ORG,
  SEED_TEACHERS,
  WEEK,
  WEEK_BULLETINS,
} from "./data.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");

const PARENT_REF = "hlecttkgrfhtzvwnxtyb";

type Args = { reset: boolean; tier: "testing" };

function parseArgs(argv: string[]): Args {
  const reset = argv.includes("--reset");
  const tierIdx = argv.indexOf("--tier");
  const tier = (tierIdx >= 0 ? argv[tierIdx + 1] : "testing") as Args["tier"];
  if (tier !== "testing") {
    throw new Error("This seed only targets the testing tier.");
  }
  return { reset, tier };
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function resolveCredentials(): Promise<{
  url: string;
  serviceRoleKey: string;
  projectRef: string;
}> {
  const envTesting = loadEnvFile(resolve(REPO_ROOT, ".env.testing"));
  const urlFromEnv =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    envTesting.VITE_SUPABASE_URL ||
    "";
  const serviceFromEnv =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    "";

  let url = urlFromEnv;
  let serviceRoleKey = serviceFromEnv;
  let projectRef = "";

  if (url) {
    try {
      projectRef = new URL(url).hostname.split(".")[0] || "";
    } catch {
      /* ignore */
    }
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if ((!serviceRoleKey || !url) && token) {
    if (!projectRef) {
      projectRef = "yplmaauelutcosqqvnya";
      url = `https://${projectRef}.supabase.co`;
    }
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch API keys (${res.status}): ${await res.text()}`);
    }
    const keys = (await res.json()) as Array<{
      name?: string;
      api_key?: string;
      tags?: string[];
    }>;
    const sr = keys.find(
      (k) =>
        k.name === "service_role" || (k.tags || []).includes("service_role"),
    );
    if (!sr?.api_key) throw new Error("service_role key not found via Management API");
    serviceRoleKey = sr.api_key;
  }

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Need SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ACCESS_TOKEN (+ .env.testing URL).",
    );
  }
  if (!projectRef) {
    projectRef = new URL(url).hostname.split(".")[0] || "";
  }
  if (projectRef === PARENT_REF) {
    throw new Error(
      `Refusing to seed parent/main project (${PARENT_REF}). Use the testing branch ref.`,
    );
  }

  return { url, serviceRoleKey, projectRef };
}

function lessonDayBody(paragraphs: string[]): string {
  return paragraphs.map((p) => p.trim()).filter(Boolean).join("\n\n");
}

function dayDateFor(day: "school" | "wednesday" | "friday"): string {
  if (day === "school") return WEEK.school;
  if (day === "wednesday") return WEEK.wednesday;
  return WEEK.friday;
}

async function findUserIdByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = email.toLowerCase();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (profile?.id) return profile.id as string;

  // Paginate auth admin list (small projects).
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === normalized);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function ensureUser(
  admin: SupabaseClient,
  email: string,
  name: string,
): Promise<string> {
  const existing = await findUserIdByEmail(admin, email);
  if (existing) {
    await admin.from("profiles").update({ name }).eq("id", existing);
    return existing;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: email.toLowerCase(),
    email_confirm: true,
    user_metadata: { name, full_name: name },
  });
  if (error) throw error;
  if (!data.user) throw new Error(`createUser returned no user for ${email}`);

  // Profile row comes from auth trigger; set display name.
  await admin.from("profiles").update({ name }).eq("id", data.user.id);
  return data.user.id;
}

async function ensureMembership(
  admin: SupabaseClient,
  orgId: number,
  userId: string,
  role: "owner" | "admin" | "instructor" | "parent",
) {
  const { data: existing } = await admin
    .from("memberships")
    .select("id, role, status")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.role !== role || existing.status !== "active") {
      // Prefer keeping owner over demoting to admin/instructor.
      const nextRole =
        existing.role === "owner" && role !== "owner" ? "owner" : role;
      const { error } = await admin
        .from("memberships")
        .update({ role: nextRole, status: "active" })
        .eq("id", existing.id);
      if (error) throw error;
    }
    return;
  }

  const { error } = await admin.from("memberships").insert({
    organization_id: orgId,
    user_id: userId,
    role,
    status: "active",
  });
  if (error) throw error;
}

async function resetOrg(admin: SupabaseClient, orgId: number, lukeId: string) {
  console.log("Reset: clearing org children…");

  const { data: courses } = await admin
    .from("courses")
    .select("id")
    .eq("organization_id", orgId);
  const courseIds = (courses || []).map((c) => c.id as number);

  if (courseIds.length) {
    await admin.from("important_now").delete().in("course_id", courseIds);
    await admin.from("enrollments").delete().in("course_id", courseIds);
    await admin.from("course_instructors").delete().in("course_id", courseIds);
    await admin.from("lesson_plans").delete().eq("organization_id", orgId);
    await admin.from("announcements").delete().eq("organization_id", orgId);

    const { data: materials } = await admin
      .from("materials")
      .select("id")
      .eq("organization_id", orgId);
    const materialIds = (materials || []).map((m) => m.id as number);
    if (materialIds.length) {
      await admin.from("blocks").delete().in("material_id", materialIds);
      await admin.from("material_versions").delete().in("material_id", materialIds);
      await admin.from("materials").delete().in("id", materialIds);
    }
    await admin.from("units").delete().eq("organization_id", orgId);
    await admin.from("courses").delete().eq("organization_id", orgId);
  }

  const { data: classes } = await admin
    .from("classes")
    .select("id")
    .eq("organization_id", orgId);
  const classIds = (classes || []).map((c) => c.id as number);
  if (classIds.length) {
    await admin.from("class_members").delete().in("class_id", classIds);
    await admin.from("classes").delete().in("id", classIds);
  }

  const { data: students } = await admin
    .from("org_profiles")
    .select("id")
    .eq("organization_id", orgId);
  const studentIds = (students || []).map((s) => s.id as number);
  if (studentIds.length) {
    await admin.from("parent_student_links").delete().in("student_profile_id", studentIds);
    await admin.from("admin_invites").delete().eq("organization_id", orgId);
    await admin.from("org_profiles").delete().in("id", studentIds);
  }

  // Keep Luke; drop other memberships (re-added below).
  await admin
    .from("memberships")
    .delete()
    .eq("organization_id", orgId)
    .neq("user_id", lukeId);

  console.log("Reset complete.");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const creds = await resolveCredentials();
  console.log(`Seeding Doxa → ${creds.projectRef} (${creds.url})`);

  const admin = createClient(creds.url, creds.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const lukeId = await ensureUser(admin, LUKE.email, LUKE.name);
  console.log(`Luke: ${lukeId}`);

  // Org
  let { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("*")
    .eq("slug", ORG.slug)
    .maybeSingle();
  if (orgErr) throw orgErr;

  if (!org) {
    const { data: created, error } = await admin
      .from("organizations")
      .insert({
        name: ORG.name,
        slug: ORG.slug,
        org_type: ORG.org_type,
        grade_scheme: ORG.grade_scheme,
        grade_labels: [],
      })
      .select("*")
      .single();
    if (error) throw error;
    org = created;
    console.log(`Created org id=${org.id}`);
  } else {
    console.log(`Using existing org id=${org.id}`);
  }

  const orgId = org.id as number;
  await ensureMembership(admin, orgId, lukeId, "owner");

  if (args.reset) {
    await resetOrg(admin, orgId, lukeId);
  }

  // Teachers
  const teacherIds = new Map<string, string>();
  const lanaId = await ensureUser(admin, LANA.email, LANA.name);
  await ensureMembership(admin, orgId, lanaId, "instructor");
  teacherIds.set("lana", lanaId);
  console.log(`Lana (instructor): ${lanaId}`);

  for (const t of SEED_TEACHERS) {
    const id = await ensureUser(admin, t.email, t.name);
    await ensureMembership(admin, orgId, id, "instructor");
    teacherIds.set(t.email, id);
    console.log(`Teacher ${t.name}: ${id}`);
  }

  function teacherForSubject(subject?: string): string {
    if (subject) {
      for (const t of SEED_TEACHERS) {
        if (t.subjects.some((s) => subject.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(subject.toLowerCase()))) {
          return teacherIds.get(t.email)!;
        }
      }
    }
    return lanaId;
  }

  // Classes
  const gradeClasses = ["4", "5", "6", "7", "8", "9"];
  const classIdByGrade = new Map<string, number>();
  for (const g of gradeClasses) {
    const title = `Grade ${g}`;
    let { data: cls } = await admin
      .from("classes")
      .select("id")
      .eq("organization_id", orgId)
      .eq("title", title)
      .is("deleted_at", null)
      .maybeSingle();
    if (!cls) {
      const { data: created, error } = await admin
        .from("classes")
        .insert({
          organization_id: orgId,
          title,
          description: `${title} cohort`,
        })
        .select("id")
        .single();
      if (error) throw error;
      cls = created;
    }
    classIdByGrade.set(g, cls.id as number);
  }
  console.log(`Classes: ${[...classIdByGrade.keys()].join(", ")}`);

  // Students
  const allStudents = [...HARWOOD_KIDS, ...FAKE_STUDENTS];
  const studentIdByName = new Map<string, { id: number; grade: string }>();
  for (const s of allStudents) {
    let { data: row } = await admin
      .from("org_profiles")
      .select("id, grade_level")
      .eq("organization_id", orgId)
      .eq("name", s.name)
      .maybeSingle();
    if (!row) {
      const { data: created, error } = await admin
        .from("org_profiles")
        .insert({
          organization_id: orgId,
          name: s.name,
          grade_level: s.grade,
          parent_email: s.parentEmail.toLowerCase(),
          counts_as_student: true,
        })
        .select("id, grade_level")
        .single();
      if (error) throw error;
      row = created;
    } else {
      await admin
        .from("org_profiles")
        .update({
          grade_level: s.grade,
          parent_email: s.parentEmail.toLowerCase(),
        })
        .eq("id", row.id);
    }
    studentIdByName.set(s.name, { id: row.id as number, grade: s.grade });

    const classId = classIdByGrade.get(s.grade);
    if (classId) {
      await admin.from("class_members").upsert(
        { class_id: classId, student_profile_id: row.id },
        { onConflict: "class_id,student_profile_id" },
      );
    }
  }
  console.log(`Students: ${studentIdByName.size}`);

  // Parent links for Lana ↔ Ava / Landon
  for (const kid of HARWOOD_KIDS) {
    const sp = studentIdByName.get(kid.name);
    if (!sp) continue;
    const { data: parentProfile, error: parentProfileError } = await admin
      .from("org_profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", lanaId)
      .maybeSingle();
    if (parentProfileError) throw parentProfileError;
    let parentOrgProfileId = parentProfile?.id as number | undefined;
    if (!parentOrgProfileId) {
      const { data: account, error: accountError } = await admin
        .from("profiles")
        .select("name, email")
        .eq("id", lanaId)
        .single();
      if (accountError) throw accountError;
      const { data: created, error: createError } = await admin
        .from("org_profiles")
        .insert({
          organization_id: orgId,
          name: account.name,
          email: account.email,
          user_id: lanaId,
          counts_as_student: false,
        })
        .select("id")
        .single();
      if (createError) throw createError;
      parentOrgProfileId = created.id as number;
    }
    await admin.from("parent_student_links").upsert(
      { parent_org_profile_id: parentOrgProfileId, student_profile_id: sp.id },
      { onConflict: "parent_org_profile_id,student_profile_id" },
    );
  }
  console.log("Linked Lana → Ava & Landon (parent_student_links).");
  console.log(
    "Note: Lana is instructor (one membership/org). Parent home needs parent role — staff can still open courses.",
  );

  // Courses + units + this week's lesson plans
  const courseIdByKey = new Map<string, number>();
  const instructorByCourse = new Map<number, string>();

  console.log(`Week window: ${WEEK.unitStart} → ${WEEK.unitEnd} (${WEEK.label})`);

  for (const c of COURSES) {
    let { data: course } = await admin
      .from("courses")
      .select("id")
      .eq("organization_id", orgId)
      .eq("title", c.title)
      .maybeSingle();

    if (!course) {
      const { data: created, error } = await admin
        .from("courses")
        .insert({
          organization_id: orgId,
          title: c.title,
          description: c.description,
          subject: c.subject,
          location: c.location || "DOXA",
          grade_levels: c.gradeLevels,
          status: "active",
          visibility: "published",
          start_date: WEEK.unitStart,
          end_date: "2027-05-30",
        })
        .select("id")
        .single();
      if (error) throw error;
      course = created;
    } else {
      await admin
        .from("courses")
        .update({
          description: c.description,
          subject: c.subject,
          grade_levels: c.gradeLevels,
          visibility: "published",
          status: "active",
        })
        .eq("id", course.id);
    }

    const courseId = course.id as number;
    courseIdByKey.set(c.key, courseId);

    const instructorId = teacherForSubject(c.teacherSubject || c.subject);
    instructorByCourse.set(courseId, instructorId);
    await admin.from("course_instructors").upsert(
      { course_id: courseId, user_id: instructorId },
      { onConflict: "course_id,user_id" },
    );
    // Also put Lana on Weekly Bulletin + a couple she "teaches"
    if (c.key === "weekly-bulletin" || c.teacherSubject === "Grammar") {
      await admin.from("course_instructors").upsert(
        { course_id: courseId, user_id: lanaId },
        { onConflict: "course_id,user_id" },
      );
    }

    // Unit for the week (scaffold; week content lives on the lesson plan)
    const unitTitle = `Week of ${WEEK.label}`;
    let { data: unit } = await admin
      .from("units")
      .select("id")
      .eq("course_id", courseId)
      .eq("title", unitTitle)
      .is("deleted_at", null)
      .maybeSingle();
    if (!unit) {
      const { data: created, error } = await admin
        .from("units")
        .insert({
          organization_id: orgId,
          course_id: courseId,
          title: unitTitle,
          start_date: WEEK.unitStart,
          end_date: WEEK.unitEnd,
          position: 0,
        })
        .select("id")
        .single();
      if (error) throw error;
      unit = created;
    } else {
      await admin
        .from("units")
        .update({
          start_date: WEEK.unitStart,
          end_date: WEEK.unitEnd,
        })
        .eq("id", unit.id);
    }

    // Enrollments
    for (const [, student] of studentIdByName) {
      if (!c.enrollGrades.includes(student.grade)) continue;
      await admin.from("enrollments").upsert(
        {
          student_profile_id: student.id,
          course_id: courseId,
          status: "active",
        },
        { onConflict: "student_profile_id,course_id" },
      );
    }
  }
  console.log(`Courses: ${courseIdByKey.size}`);

  // Published weekly lesson plans (Sunday–Saturday) from the packet copy.
  const itemsByCourse = new Map<string, typeof WEEK_BULLETINS>();
  for (const item of WEEK_BULLETINS) {
    const list = itemsByCourse.get(item.courseKey) || [];
    list.push(item);
    itemsByCourse.set(item.courseKey, list);
  }

  let planCount = 0;
  let dayCount = 0;
  for (const [courseKey, items] of itemsByCourse) {
    const courseId = courseIdByKey.get(courseKey);
    if (!courseId) {
      console.warn(`Skip lesson plan — missing course ${courseKey}`);
      continue;
    }

    const createdBy = instructorByCourse.get(courseId) || lukeId;
    const title = `Week of ${WEEK.label}`;

    let { data: plan } = await admin
      .from("lesson_plans")
      .select("id")
      .eq("course_id", courseId)
      .eq("week_start", WEEK.unitStart)
      .is("deleted_at", null)
      .maybeSingle();

    if (!plan) {
      const { data: created, error } = await admin
        .from("lesson_plans")
        .insert({
          organization_id: orgId,
          course_id: courseId,
          week_start: WEEK.unitStart,
          title,
          week_note: "",
          visibility: "published",
          created_by: createdBy,
        })
        .select("id")
        .single();
      if (error) throw error;
      plan = created;
    } else {
      const { error } = await admin
        .from("lesson_plans")
        .update({
          title,
          visibility: "published",
          deleted_at: null,
          deleted_by: null,
        })
        .eq("id", plan.id);
      if (error) throw error;
    }

    const bodyByDay = new Map<string, string[]>();
    for (const item of items) {
      const date = dayDateFor(item.day);
      const chunks = bodyByDay.get(date) || [];
      chunks.push(lessonDayBody([item.title, ...item.body]));
      bodyByDay.set(date, chunks);
    }

    for (const [dayDate, chunks] of bodyByDay) {
      const body = chunks.join("\n\n");
      let { data: day } = await admin
        .from("lesson_plan_days")
        .select("id")
        .eq("lesson_plan_id", plan.id)
        .eq("day_date", dayDate)
        .maybeSingle();
      if (!day) {
        const { data: created, error } = await admin
          .from("lesson_plan_days")
          .insert({
            lesson_plan_id: plan.id,
            day_date: dayDate,
            body,
          })
          .select("id")
          .single();
        if (error) throw error;
        day = created;
      } else {
        const { error } = await admin
          .from("lesson_plan_days")
          .update({ body })
          .eq("id", day.id);
        if (error) throw error;
      }
      dayCount += 1;
    }
    planCount += 1;
  }
  console.log(`Lesson plans: ${planCount} (${dayCount} days)`);

  console.log("\nDone.");
  console.log(`Org: /my/${ORG.slug}`);
  console.log(`Owner: ${LUKE.email}`);
  console.log(`Instructor + linked parent: ${LANA.email} (${LANA.name})`);
  console.log(`Students of note: Ava Harwood (8), Landon Harwood (5)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
