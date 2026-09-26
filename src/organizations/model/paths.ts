export function userProfilePath(orgSlug: string, userId: string): string {
  return `/my/${orgSlug}/people/${userId}`;
}

export function orgPersonProfilePath(
  orgSlug: string,
  orgProfileId: number,
): string {
  return `/my/${orgSlug}/people/${orgProfileId}`;
}

/** Prefer the org profile id. UUID URLs still work and redirect to that row. */
export function orgVisibleProfilePath(
  orgSlug: string,
  person: { orgProfileId?: number | null; userId?: string | null },
): string | null {
  if (person.orgProfileId != null) {
    return orgPersonProfilePath(orgSlug, person.orgProfileId);
  }
  if (person.userId) return userProfilePath(orgSlug, person.userId);
  return null;
}

export function orgProfilePath(orgSlug: string): string {
  return `/my/${orgSlug}/profile`;
}
