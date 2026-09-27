import type { CSSProperties } from "react";
import { BrandLogoLockup } from "@/organizations/components/BrandLogoLockup";
import { Mark } from "@/ui/Wordmark";
import type { ChromeAccent } from "@/organizations/model/brand";

export function BrandingPreview({
  orgName,
  iconUrl,
  chrome,
}: {
  orgName: string;
  iconUrl: string | null;
  chrome: ChromeAccent;
}) {
  const style = {
    "--green": chrome.accent,
    "--green-deep": chrome.deep,
    "--green-tint": chrome.tint,
    "--chrome-accent": chrome.accent,
    "--chrome-accent-deep": chrome.deep,
    "--chrome-accent-tint": chrome.tint,
  } as CSSProperties;

  return (
    <div
      className="overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]"
      style={style}
    >
      <div className="flex items-center gap-2.5 border-b border-[var(--line-soft)] px-3 py-3">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt=""
            className="h-7 w-7 shrink-0 rounded-[24%] object-cover"
          />
        ) : (
          <Mark px={28} backgroundColor="var(--chrome-accent)" />
        )}
        <span className="min-w-0 truncate text-[13px] font-bold text-[var(--ink)]">
          {orgName}
        </span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <div className="rounded-[6px] bg-[var(--chrome-accent-tint)] px-2.5 py-2 text-[13px] font-bold text-[var(--chrome-accent-deep)]">
          Home
        </div>
        <div className="inline-flex w-fit rounded-[6px] bg-[var(--green)] px-3 py-[11px] text-[13px] font-bold text-white">
          Continue
        </div>
      </div>
    </div>
  );
}

export function BrandingReportCardPreview({
  orgName,
  logoUrl,
  logoAccentBackground,
  accentColor,
}: {
  orgName: string;
  logoUrl: string | null;
  logoAccentBackground: boolean;
  accentColor: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--line-soft)] bg-[var(--paper)] p-3">
      {logoUrl ? (
        <BrandLogoLockup
          logoUrl={logoUrl}
          orgName={orgName}
          accentBackground={logoAccentBackground}
          accentColor={accentColor}
          imgClassName="max-h-12 max-w-full object-contain object-left"
          plateClassName="inline-flex max-w-full rounded-[6px] px-2.5 py-1.5"
        />
      ) : (
        <p
          className="text-[15px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {orgName}
        </p>
      )}
    </div>
  );
}
