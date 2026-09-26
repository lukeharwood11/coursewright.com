export type SignUpNameDraft = {
  firstName: string;
  lastName: string;
};

export type ValidatedSignUpName = {
  firstName: string;
  lastName: string;
  fullName: string;
};

export function formatSignUpFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`;
}

export function validateSignUpName(
  input: SignUpNameDraft,
): { ok: true; value: ValidatedSignUpName } | { ok: false; error: string } {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName) {
    return { ok: false, error: "First name is required." };
  }
  if (!lastName) {
    return { ok: false, error: "Last name is required." };
  }
  return {
    ok: true,
    value: { firstName, lastName, fullName: formatSignUpFullName(firstName, lastName) },
  };
}
