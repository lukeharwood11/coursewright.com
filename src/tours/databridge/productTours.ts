import { requireSupabase } from "@/organizations/databridge/client";
import type { TourKey, TourStatus } from "@/tours/model/keys";

export const productTourQueryKeys = {
  mine: (userId: string) => ["product-tours", "mine", userId] as const,
};

export type TourProgress = {
  tourKey: string;
  status: TourStatus;
  lastStepIndex: number | null;
  updatedAt: string;
};

function parseStatus(value: string): TourStatus | null {
  if (value === "finished" || value === "skipped") return value;
  return null;
}

export async function listMyTourProgress(): Promise<TourProgress[]> {
  const db = requireSupabase();
  const { data, error } = await db
    .from("product_tour_progress")
    .select("tour_key, status, last_step_index, updated_at");

  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row) => {
    const status = parseStatus(row.status);
    if (!status) return [];
    return [
      {
        tourKey: row.tour_key,
        status,
        lastStepIndex: row.last_step_index,
        updatedAt: row.updated_at,
      },
    ];
  });
}

/** Seen record. Call only for finish and skip, never for a step change. */
export async function upsertTourProgress(input: {
  tourKey: TourKey;
  status: TourStatus;
  lastStepIndex: number | null;
}): Promise<void> {
  const db = requireSupabase();
  const { data: userData, error: userError } = await db.auth.getUser();
  if (userError) throw new Error(userError.message);
  const userId = userData.user?.id;
  if (!userId) throw new Error("Sign in to save tour progress.");

  const { error } = await db.from("product_tour_progress").upsert(
    {
      user_id: userId,
      tour_key: input.tourKey,
      status: input.status,
      last_step_index: input.lastStepIndex,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tour_key" },
  );
  if (error) throw new Error(error.message);
}
