export function userProfilePath(orgSlug: string, userId: string): string {
  return `/my/${orgSlug}/people/${userId}`;
}

export function orgProfilePath(orgSlug: string): string {
  return `/my/${orgSlug}/profile`;
}
