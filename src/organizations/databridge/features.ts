import type { OrgFeatures } from "@/organizations/model/features";
import { DEFAULT_ORG_FEATURES, parseOrgFeatures } from "@/organizations/model/features";
import { requireSupabase } from "./client";

export type OrganizationFeaturesRow = {
  discussions_enabled: boolean;
  announcements_enabled: boolean;
  resources_enabled: boolean;
  lesson_plans_enabled: boolean;
  events_enabled: boolean;
  calendar_enabled: boolean;
  updated_at?: string;
};

export async function getOrganizationFeatures(
  organizationId: number,
): Promise<OrgFeatures> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organization_features")
    .select(
      "discussions_enabled, announcements_enabled, resources_enabled, lesson_plans_enabled, events_enabled, calendar_enabled, updated_at",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    // Table may not exist yet before the migration is applied.
    const message = error.message.toLowerCase();
    if (
      message.includes("organization_features") ||
      message.includes("schema cache") ||
      message.includes("does not exist")
    ) {
      return { ...DEFAULT_ORG_FEATURES };
    }
    throw new Error(error.message);
  }
  if (!data) return { ...DEFAULT_ORG_FEATURES };
  return parseOrgFeatures(data);
}

export async function saveOrganizationFeatures(input: {
  organizationId: number;
  features: OrgFeatures;
}): Promise<void> {
  const db = requireSupabase();
  const { error } = await db.from("organization_features").upsert(
    {
      organization_id: input.organizationId,
      discussions_enabled: input.features.discussions,
      announcements_enabled: input.features.announcements,
      resources_enabled: input.features.resources,
      lesson_plans_enabled: input.features.lessonPlans,
      events_enabled: input.features.events,
      calendar_enabled: input.features.calendar,
    },
    { onConflict: "organization_id" },
  );
  if (error) throw new Error(error.message);
}
