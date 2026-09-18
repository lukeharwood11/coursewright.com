export type ProfileDraft = {
  name: string;
};

export type ValidatedProfile = {
  name: string;
};

export function profileHaveChanges(draft: ProfileDraft, savedName: string): boolean {
  return draft.name.trim() !== savedName;
}

export function validateProfile(
  input: ProfileDraft,
): { ok: true; value: ValidatedProfile } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Name is required." };
  }
  return { ok: true, value: { name } };
}

export function profileWriteErrorMessage(error: { code?: string; message: string }): string {
  const message = error.message.toLowerCase();
  if (error.code === "42501" || message.includes("row-level security")) {
    return "You don’t have permission to change this account.";
  }
  if (message.includes("profiles.email is managed by auth")) {
    return "Email is managed with your sign-in. You can change your name here.";
  }
  return error.message;
}
