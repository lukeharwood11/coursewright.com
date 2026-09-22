import type { ReactNode } from "react";
import { useState } from "react";

export function ResourceDropzone({
  disabled,
  onFiles,
  children,
  className,
}: {
  disabled: boolean;
  onFiles: (files: FileList) => void;
  children: ReactNode;
  className?: string;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={[
        "rounded-[10px] border border-dashed p-1 transition-colors",
        over && !disabled
          ? "border-[var(--green)] bg-[var(--green-tint)]"
          : "border-transparent",
        className ?? "",
      ].join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOver(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (disabled) return;
        if (event.dataTransfer.files.length > 0) onFiles(event.dataTransfer.files);
      }}
    >
      {children}
    </div>
  );
}
