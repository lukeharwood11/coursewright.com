export function userProfilePath(orgSlug: string, userId: string): string {
  return `/my/${orgSlug}/people/${userId}`;
}
