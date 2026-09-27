import {
  brandIconPublicUrl,
  chromeAccentFromHex,
} from "@/organizations/model/brand";
import {
  DEFAULT_ORG_FEATURES,
  type OrgFeatures,
} from "@/organizations/model/features";
import {
  EDITABLE_MEMBERSHIP_ROLES,
  EDITABLE_STAFF_ROLES,
  parseOrgRole,
  type OrgRole,
  type StaffInviteRole,
} from "@/organizations/model/role";
import { parseOrgTypeOrDefault, type OrgType } from "@/organizations/model/orgType";
import { parseHomeDays, type HomeDay } from "@/organizations/model/homeDays";
import { DEFAULT_SCHOOL_DAYS, parseSchoolDays, type SchoolDay } from "@/organizations/model/schoolDays";
import { staffMembershipWriteErrorMessage } from "@/organizations/model/staffAccount";
import { requireSupabase } from "./client";
import { orgContactsByUserId } from "./orgNames";

export const ORG_SUMMARY_SELECT =
  "id, name, slug, org_type, school_days, home_days, about, address, website, contact_email, phone, branding:organization_branding(accent_color, icon_path, updated_at)" as const;

export type OrganizationSummary = {
  id: number;
  name: string;
  slug: string;
  orgType: OrgType;
  schoolDays: SchoolDay[];
  homeDays: HomeDay[];
  about: string | null;
  address: string | null;
  website: string | null;
  contactEmail: string | null;
  phone: string | null;
  accentColor: string | null;
  iconUrl: string | null;
  /** Defaults all on; org shell overlays organization_features. */
  features: OrgFeatures;
};

type BrandingEmbed = {
  accent_color: string | null;
  icon_path: string | null;
  updated_at: string;
};

export type OrganizationSummaryRow = {
  id: number;
  name: string;
  slug: string;
  org_type?: string | null;
  school_days?: number[] | null;
  home_days?: number[] | null;
  about?: string | null;
  address?: string | null;
  website?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  branding?: BrandingEmbed | BrandingEmbed[] | null;
};

export function toOrganizationSummary(row: OrganizationSummaryRow): OrganizationSummary {
  const branding = unwrapBranding(row.branding);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    orgType: parseOrgTypeOrDefault(row.org_type),
    schoolDays: parseSchoolDays(row.school_days) ?? DEFAULT_SCHOOL_DAYS,
    homeDays: parseHomeDays(row.home_days ?? null),
    about: row.about ?? null,
    address: row.address ?? null,
    website: row.website ?? null,
    contactEmail: row.contact_email ?? null,
    phone: row.phone ?? null,
    accentColor: brandingAccent(branding),
    iconUrl: brandingIconUrl(branding),
    // Features load separately in the org shell (defaults all on).
    features: { ...DEFAULT_ORG_FEATURES },
  };
}

function unwrapBranding(
  value: OrganizationSummaryRow["branding"],
): BrandingEmbed | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function brandingAccent(branding: BrandingEmbed | null): string | null {
  if (!branding?.accent_color) return null;
  return chromeAccentFromHex(branding.accent_color)?.accent ?? null;
}

function brandingIconUrl(branding: BrandingEmbed | null): string | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!branding?.icon_path || !branding.updated_at || !supabaseUrl) return null;
  return brandIconPublicUrl(supabaseUrl, branding.icon_path, branding.updated_at);
}

export type OrgMembership = {
  membershipId: number;
  role: OrgRole;
  isParent: boolean;
  isStudent: boolean;
  organization: OrganizationSummary;
};

type MembershipRow = {
  id: number;
  role: string;
  is_parent?: boolean | null;
  is_student?: boolean | null;
  organization: OrganizationSummaryRow | OrganizationSummaryRow[] | null;
};

function unwrapOrg(
  value: MembershipRow["organization"],
): OrganizationSummary | null {
  if (!value) return null;
  const row = Array.isArray(value) ? (value[0] ?? null) : value;
  return row ? toOrganizationSummary(row) : null;
}

function toMembership(row: MembershipRow): OrgMembership | null {
  const role = parseOrgRole(row.role);
  const organization = unwrapOrg(row.organization);
  if (!role || !organization) return null;
  return {
    membershipId: row.id,
    role,
    isParent: Boolean(row.is_parent) || role === "parent",
    isStudent: Boolean(row.is_student) || role === "student",
    organization,
  };
}

export type OrgPerson = {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
};

export const orgQueryKeys = {
  memberships: (userId: string) => ["organizations", "memberships", userId] as const,
  bySlug: (slug: string, userId: string) =>
    ["organizations", "slug", slug, userId] as const,
  detail: (id: number) => ["organizations", "detail", id] as const,
  people: (orgId: number) => ["organizations", "people", orgId] as const,
  membersWithAccess: (orgId: number) =>
    ["organizations", "members-with-access", orgId] as const,
  branding: (orgId: number) => ["organizations", "branding", orgId] as const,
  features: (orgId: number) => ["organizations", "features", orgId] as const,
};

export type OrgMemberAccessStatus = "active" | "suspended";

export type OrgMemberAccessRow = {
  membershipId: number;
  userId: string;
  status: OrgMemberAccessStatus;
  role: OrgRole;
  isParent: boolean;
  isStudent: boolean;
  orgProfileId: number | null;
  name: string;
  email: string;
};

type MemberAccessMembershipRow = {
  id: number;
  user_id: string | null;
  role: string;
  status: string;
  is_parent?: boolean | null;
  is_student?: boolean | null;
};

export async function listMyMemberships(userId: string): Promise<OrgMembership[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select(`id, role, is_parent, is_student, organization:organizations(${ORG_SUMMARY_SELECT})`)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => toMembership(row as MembershipRow))
    .filter((row): row is OrgMembership => row !== null);
}

export async function getMembershipByOrgSlug(
  userId: string,
  slug: string,
): Promise<OrgMembership | null> {
  const db = requireSupabase();
  const { data: org, error: orgError } = await db
    .from("organizations")
    .select(ORG_SUMMARY_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);
  if (!org) return null;

  const { data: membership, error: membershipError } = await db
    .from("memberships")
    .select("id, role, is_parent, is_student")
    .eq("user_id", userId)
    .eq("organization_id", org.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw new Error(membershipError.message);
  if (!membership) return null;

  const role = parseOrgRole(membership.role);
  if (!role) return null;

  return {
    membershipId: membership.id,
    role,
    isParent: Boolean(membership.is_parent) || role === "parent",
    isStudent: Boolean(membership.is_student) || role === "student",
    organization: toOrganizationSummary(org),
  };
}

export async function listOrgPeople(
  organizationId: number,
): Promise<OrgPerson[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("user_id, role")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const contacts = await orgContactsByUserId(
    organizationId,
    (data ?? []).map((row) => row.user_id),
  );

  return (data ?? []).flatMap((row) => {
    const role = parseOrgRole(row.role);
    const contact = row.user_id ? contacts.get(row.user_id) : undefined;
    if (!role || !row.user_id || !contact) return [];
    return [
      {
        userId: row.user_id,
        name: contact.name,
        email: contact.email ?? "",
        role,
      },
    ];
  });
}

export async function updateStaffMembershipRole(input: {
  membershipId: number;
  role: StaffInviteRole;
}): Promise<void> {
  if (!Number.isFinite(input.membershipId)) {
    throw new Error("That staff member couldn’t be updated. Refresh and try again.");
  }
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .update({ role: input.role })
    .eq("id", input.membershipId)
    .eq("status", "active")
    .in("role", [...EDITABLE_MEMBERSHIP_ROLES])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to change that person’s role.");
  }
}

/** Drop the exclusive role and leave the additive parent or student membership. */
export async function releaseExclusiveMembershipRole(input: {
  membershipId: number;
  role: "parent" | "student";
}): Promise<void> {
  if (!Number.isFinite(input.membershipId)) {
    throw new Error("That staff member couldn’t be updated. Refresh and try again.");
  }
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .update({ role: input.role })
    .eq("id", input.membershipId)
    .eq("status", "active")
    .in("role", [...EDITABLE_STAFF_ROLES])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to change that person’s role.");
  }
}

export async function listOrgMembersWithAccess(
  organizationId: number,
): Promise<OrgMemberAccessRow[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("memberships")
    .select("id, user_id, role, status, is_parent, is_student")
    .eq("organization_id", organizationId)
    .in("status", ["active", "suspended"])
    .not("user_id", "is", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const contacts = await orgContactsByUserId(
    organizationId,
    (data ?? []).map((row) => row.user_id),
  );

  const rows: OrgMemberAccessRow[] = [];
  for (const row of data ?? []) {
    const typed = row as MemberAccessMembershipRow;
    const role = parseOrgRole(typed.role);
    const contact = typed.user_id ? contacts.get(typed.user_id) : undefined;
    if (!role || !contact || !typed.user_id || !Number.isFinite(typed.id)) continue;
    if (typed.status !== "active" && typed.status !== "suspended") continue;
    rows.push({
      membershipId: typed.id,
      userId: typed.user_id,
      status: typed.status,
      role,
      isParent: Boolean(typed.is_parent) || role === "parent",
      isStudent: Boolean(typed.is_student) || role === "student",
      orgProfileId: contact.id,
      name: contact.name,
      email: contact.email ?? "",
    });
  }

  return rows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}

export async function suspendOrgMember(membershipId: number): Promise<void> {
  if (!Number.isFinite(membershipId)) {
    throw new Error("That person couldn’t be updated. Refresh and try again.");
  }
  const db = requireSupabase();
  const { error } = await db.rpc("suspend_org_member", {
    p_membership_id: membershipId,
  });
  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
}

export async function reactivateOrgMember(membershipId: number): Promise<void> {
  if (!Number.isFinite(membershipId)) {
    throw new Error("That person couldn’t be updated. Refresh and try again.");
  }
  const db = requireSupabase();
  const { error } = await db.rpc("reactivate_org_member", {
    p_membership_id: membershipId,
  });
  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
}

export async function removeMemberFromOrg(membershipId: number): Promise<void> {
  if (!Number.isFinite(membershipId)) {
    throw new Error("That person couldn’t be removed. Refresh and try again.");
  }
  const db = requireSupabase();
  const { error } = await db.rpc("remove_member_from_org", {
    p_membership_id: membershipId,
  });
  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
}

export async function removeStaffMembership(membershipId: number): Promise<void> {
  if (!Number.isFinite(membershipId)) {
    throw new Error("That staff member couldn’t be removed. Refresh and try again.");
  }
  const db = requireSupabase();
  // Memberships have no deleted_at. status=suspended would block a later invite
  // (unique org + user). Do not cascade into enrollments, parent links, or
  // materials RLS — those stay enrollment-gated.
  const { data, error } = await db
    .from("memberships")
    .delete()
    .eq("id", membershipId)
    .eq("status", "active")
    .in("role", [...EDITABLE_STAFF_ROLES])
    .select("id")
    .maybeSingle();

  if (error) throw new Error(staffMembershipWriteErrorMessage(error));
  if (!data) {
    throw new Error("You don’t have permission to remove that person.");
  }
}
