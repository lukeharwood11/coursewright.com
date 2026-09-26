import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRef, type RefObject } from "react";
import { hcaptchaSiteKey, isHcaptchaConfigured } from "@/infrastructure/hcaptcha/config";

export type AuthHcaptchaHandle = {
  /** Fresh token for each Supabase Auth call (tokens are single-use). */
  getToken: () => Promise<string | undefined>;
  reset: () => void;
};

export function useAuthHcaptcha(): {
  configured: boolean;
  widgetRef: RefObject<HCaptcha | null>;
  handle: AuthHcaptchaHandle;
} {
  const widgetRef = useRef<HCaptcha | null>(null);

  const handle: AuthHcaptchaHandle = {
    async getToken() {
      if (!isHcaptchaConfigured) return undefined;
      const widget = widgetRef.current;
      if (!widget) return undefined;
      const result = await widget.execute({ async: true });
      return result.response ?? undefined;
    },
    reset() {
      widgetRef.current?.resetCaptcha();
    },
  };

  return { configured: isHcaptchaConfigured, widgetRef, handle };
}

export function AuthHcaptchaWidget({ widgetRef }: { widgetRef: RefObject<HCaptcha | null> }) {
  if (!isHcaptchaConfigured) return null;

  return (
    <HCaptcha ref={widgetRef} sitekey={hcaptchaSiteKey} size="invisible" />
  );
}
