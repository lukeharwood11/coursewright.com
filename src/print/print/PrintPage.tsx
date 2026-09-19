import { useEffect } from "react";
import { PdfPreview } from "./components/PdfPreview";
import { PrintActionBar } from "./components/PrintActionBar";
import { PrintStatus } from "./components/PrintStatus";
import { usePrint } from "./hooks/usePrint";

function emptyCopy(grain: "material" | "unit" | "thisWeek" | null): {
  title: string;
  body: string;
} {
  if (grain === "unit") {
    return {
      title: "Nothing to print",
      body: "This unit doesn’t have any materials to print yet.",
    };
  }
  if (grain === "thisWeek") {
    return {
      title: "Nothing to print this week",
      body: "There’s no dated work, important-now items, or bulletins for this Sunday–Saturday week.",
    };
  }
  return {
    title: "Nothing to print",
    body: "There’s no content to put on paper yet.",
  };
}

export function PrintPage() {
  const print = usePrint();

  useEffect(() => {
    const title = print.packet?.title ?? "Print";
    document.title = `${title} · Print · Course Wright`;
  }, [print.packet?.title]);

  if (print.loading && !print.blob) {
    return (
      <div className="flex h-dvh flex-col">
        <PrintActionBar
          backTo={print.backTo}
          filename="print.pdf"
          blob={null}
          disabled
        />
        <p className="px-5 py-10 text-[14.5px] text-[var(--ink-soft)]">
          Making your PDF…
        </p>
      </div>
    );
  }

  if (print.notFound) {
    return (
      <PrintStatus
        title="We couldn’t find that"
        body="It may have been removed, or you may not have access."
        backTo={print.backTo}
      />
    );
  }

  if (print.empty) {
    const copy = emptyCopy(print.grain);
    return (
      <PrintStatus title={copy.title} body={copy.body} backTo={print.backTo} />
    );
  }

  if (print.error || !print.blob || !print.packet) {
    return (
      <PrintStatus
        title="We couldn’t make the PDF"
        body="Try again in a moment. If it keeps happening, go back and open print from the material again."
        backTo={print.backTo}
        retry={print.retry}
      />
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-[var(--paper)]">
      <PrintActionBar
        backTo={print.backTo}
        filename={print.filename}
        blob={print.blob}
      />
      <div className="min-h-0 flex-1">
        <PdfPreview blob={print.blob} />
      </div>
    </div>
  );
}
