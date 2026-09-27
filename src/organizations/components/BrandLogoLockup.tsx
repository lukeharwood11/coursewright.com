import type { CSSProperties } from "react";
import {
  chromeAccentFromHex,
  DEFAULT_CHROME,
  type ChromeAccent,
} from "@/organizations/model/brand";

export function brandAccentPlate(
  accentColor: string | null | undefined,
): ChromeAccent {
  if (accentColor) {
    const chrome = chromeAccentFromHex(accentColor);
    if (chrome) return chrome;
  }
  return DEFAULT_CHROME;
}

export function BrandLogoLockup({
  logoUrl,
  orgName,
  accentBackground,
  accentColor,
  imgClassName = "max-h-14 max-w-full object-contain object-left print:max-h-20",
  plateClassName = "inline-flex max-w-full rounded-[6px] px-3 py-2",
}: {
  logoUrl: string;
  orgName?: string | null;
  accentBackground: boolean;
  accentColor: string | null | undefined;
  imgClassName?: string;
  plateClassName?: string;
}) {
  const alt = orgName?.trim() ? `${orgName.trim()} logo` : "Organization logo";
  const img = <img src={logoUrl} alt={alt} className={imgClassName} />;

  if (!accentBackground) return img;

  const plate = brandAccentPlate(accentColor);
  const style = {
    "--green": plate.accent,
    backgroundColor: plate.accent,
  } as CSSProperties;

  return (
    <div className={plateClassName} style={style}>
      {img}
    </div>
  );
}
