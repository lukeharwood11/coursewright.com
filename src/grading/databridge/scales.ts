import type { Json } from "@/infrastructure/supabase/database.types";
import {
  EMPTY_GRADING_SCALE,
  parseGradingMode,
  type GradingMode,
  type GradingScale,
  type LetterBand,
} from "@/grading/model/scale";
import { requireSupabase } from "./client";

export const gradingScaleQueryKeys = {
  org: (organizationId: number) => ["grading-scale", organizationId] as const,
};

type ScaleRow = {
  organization_id: number;
  mode: string;
  pass_threshold: number | null;
  bands: Json;
  updated_at: string;
};

function asBands(value: Json): LetterBand[] {
  if (!Array.isArray(value)) return [];
  const bands: LetterBand[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const label = item.label;
    const min = item.min_percent;
    if (typeof label !== "string" || typeof min !== "number") continue;
    bands.push({ label, minPercent: min });
  }
  return bands;
}

export function toGradingScale(row: ScaleRow | null): GradingScale {
  if (!row) return EMPTY_GRADING_SCALE;
  return {
    mode: parseGradingMode(row.mode),
    passThreshold: row.pass_threshold,
    bands: asBands(row.bands),
    updatedAt: row.updated_at,
  };
}

export async function getGradingScale(organizationId: number): Promise<GradingScale> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("organization_grading_scales")
    .select("organization_id, mode, pass_threshold, bands, updated_at")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return toGradingScale(data);
}

export async function saveGradingScale(args: {
  organizationId: number;
  mode: GradingMode;
  passThreshold: number | null;
  bands: LetterBand[];
}): Promise<void> {
  const db = requireSupabase();
  const bands = args.bands.map((band) => ({
    label: band.label,
    min_percent: band.minPercent,
  }));
  const { error } = await db.from("organization_grading_scales").upsert({
    organization_id: args.organizationId,
    mode: args.mode,
    pass_threshold: args.passThreshold,
    bands,
  });
  if (error) throw new Error(error.message);
}
