import { useEffect, useMemo } from "react";

export function PdfPreview({ blob }: { blob: Blob }) {
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return (
    <iframe
      id="print-pdf-frame"
      title="Print preview"
      src={`${url}#toolbar=0`}
      className="h-full w-full border-0 bg-white"
    />
  );
}
