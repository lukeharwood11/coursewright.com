export const FEEDBACK_MESSAGE_MAX = 8000;

export function validateFeedbackMessage(message: string):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: false, error: "Write a note so we know how to make it better." };
  }
  if (trimmed.length > FEEDBACK_MESSAGE_MAX) {
    return {
      ok: false,
      error: `Keep it under ${FEEDBACK_MESSAGE_MAX.toLocaleString()} characters.`,
    };
  }
  return { ok: true, value: trimmed };
}
