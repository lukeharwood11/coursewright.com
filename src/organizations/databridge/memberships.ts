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
  branding: (orgId: number) => ["organizations", "branding", orgId] as const,
  features: (orgId: number) => ["organizations", "features", orgId] as const,
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
    .select("user_id, role, profile:profiles(name, email)")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const role = parseOrgRole(row.role);
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    if (!role || !profile || !row.user_id) return [];
    return [
      {
        userId: row.user_id,
        name: profile.name || profile.email,
        email: profile.email,
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
