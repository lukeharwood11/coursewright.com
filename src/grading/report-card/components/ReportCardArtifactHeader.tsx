import { BetaPill } from "@/ui/BetaPill";
import { BrandLogoLockup } from "@/organizations/components/BrandLogoLockup";
import { brandAssetPublicUrl } from "@/organizations/model/brand";
import type { ReportCardSnapshot } from "@/grading/databridge/reportCards";

export function reportCardLogoUrl(snapshot: ReportCardSnapshot): string | null {
  if (!snapshot.orgLogoPath || !snapshot.orgLogoUpdatedAt) return null;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!supabaseUrl) return null;
  return brandAssetPublicUrl(supabaseUrl, snapshot.orgLogoPath, snapshot.orgLogoUpdatedAt);
}

export function ReportCardArtifactHeader({ snapshot }: { snapshot: ReportCardSnapshot }) {
  const logoUrl = reportCardLogoUrl(snapshot);
  const orgName = snapshot.orgName?.trim();

  if (!logoUrl && !orgName) return null;

  return (
    <header className="border-b border-[var(--line-soft)] pb-4 print:border-[var(--line)]">
      {logoUrl ? (
        <BrandLogoLockup
          logoUrl={logoUrl}
          orgName={orgName}
          accentBackground={snapshot.orgLogoAccentBackground}
          accentColor={snapshot.orgAccentColor}
        />
      ) : orgName ? (
        <p
          className="text-[20px] font-semibold text-[var(--ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {orgName}
        </p>
      ) : null}
      <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
        Report card
        <BetaPill className="print:hidden" />
      </p>
    </header>
  );
}
