export function friendlyCaptchaAuthError(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("captcha")) {
    return "We couldn’t verify the security check. Try again.";
  }
  return null;
}
