export type ClassInput = {
  title: string;
};

export type ValidatedClass = {
  title: string;
};

export function validateClass(
  input: ClassInput,
): { ok: true; value: ValidatedClass } | { ok: false; error: string } {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Name is required." };
  }
  return { ok: true, value: { title } };
}
