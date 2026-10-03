import type { ReactNode } from "react";
import { InfoHint } from "@/ui/InfoHint";

export function WhoCanSeeHint({
  hintLabel,
  children,
}: {
  hintLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--ink-soft)]">
      <span>Who can see this</span>
      <InfoHint label={hintLabel}>{children}</InfoHint>
    </div>
  );
}
