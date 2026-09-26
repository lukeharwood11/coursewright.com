/** hCaptcha site key (browser-exposed). Same key on all deploy tiers. */

const raw = import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined;

export const hcaptchaSiteKey = raw?.trim() ?? "";

export const isHcaptchaConfigured = Boolean(hcaptchaSiteKey);
