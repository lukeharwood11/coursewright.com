import { useEffect, useState } from "react";
import { PdfPreview } from "./components/PdfPreview";
import { PrintActionBar } from "./components/PrintActionBar";
import { PrintOptionsModal } from "./components/PrintOptionsModal";
import {
  PrintOptionsPanel,
  type PrintOptionsPanelProps,
} from "./components/PrintOptionsPanel";
import {
  SingleQuizPrintOptionsPanel,
  UnitQuizPrintOptionsPanel,
} from "./components/QuizPrintOptionsPanel";
import { QuizPrintOptionsModal } from "./components/QuizPrintOptionsModal";
import { PrintStatus } from "./components/PrintStatus";
import { PageLoading } from "@/ui/PageLoading";
import { usePrint } from "./hooks/usePrint";
import { useQuizPrintOptions } from "./hooks/useQuizPrintOptions";
import { useUnitPrintOptions } from "./hooks/useUnitPrintOptions";
import type { PrintGrainKind } from "@/print/model/paths";

function emptyCopy(grain: PrintGrainKind | null): {
  title: string;
  body: string;
} {
  if (grain === "unit") {
    return {
      title: "Nothing to print",
      body: "This unit doesn’t have any materials or quizzes to print yet.",
    };
  }
  if (grain === "resource") {
    return {
      title: "Nothing to print",
      body: "This resource doesn’t have anything to put on paper yet.",
    };
  }
  if (grain === "thisWeek") {
    return {
      title: "Nothing to print this week",
      body: "There’s no dated work, important-now items, or lesson plans for this Sunday–Saturday week.",
    };
  }
  return {
    title: "Nothing to print",
    body: "There’s no content to put on paper yet.",
  };
}

function thisWeekPanelProps(
  thisWeek: NonNullable<ReturnType<typeof usePrint>["thisWeek"]>,
): PrintOptionsPanelProps {
  return {
    studentGroups: thisWeek.studentGroups,
    pack: thisWeek.selection.pack,
    studentBreaks: thisWeek.selection.studentBreaks,
    included: thisWeek.isIncluded,
    hasPageBreak: thisWeek.hasPageBreak,
    setIncluded: thisWeek.setIncluded,
    setKeysIncluded: thisWeek.setKeysIncluded,
    setPageBreak: thisWeek.setPageBreak,
    setPack: thisWeek.setPack,
    setStudentBreaks: thisWeek.setStudentBreaks,
    quizKeyModeForItem: thisWeek.quizKeyModeForItem,
    setQuizKeyMode: thisWeek.setQuizKeyMode,
    itemCanShowQuizKey: thisWeek.itemCanShowQuizKey,
  };
}

export function PrintPage() {
  const print = usePrint();
  const quizOptions = useQuizPrintOptions(
    print.grain === "quiz" ? print.quizId : null,
  );
  const unitOptions = useUnitPrintOptions(
    print.grain === "unit" ? print.unitId : null,
  );
  const [optionsOpen, setOptionsOpen] = useState(false);
  const showThisWeekOptions = print.grain === "thisWeek" && print.thisWeek?.catalog;
  const showQuizOptions = print.grain === "quiz" && quizOptions.canShowKey;
  const showUnitOptions = print.grain === "unit" && unitOptions.hasKeyOptions;
  const panelProps = print.thisWeek ? thisWeekPanelProps(print.thisWeek) : null;
  const hasPrintOptions = showThisWeekOptions || showQuizOptions || showUnitOptions;

  useEffect(() => {
    const title = print.packet?.title ?? "Print";
    document.title = `${title} · Print · Course Wright`;
  }, [print.packet?.title]);

  const openOptions = hasPrintOptions ? () => setOptionsOpen(true) : undefined;

  const optionsSidebar = showThisWeekOptions && panelProps ? (
    <PrintOptionsPanel {...panelProps} />
  ) : showQuizOptions ? (
    <SingleQuizPrintOptionsPanel
      mode={quizOptions.mode}
      onModeChange={quizOptions.setMode}
    />
  ) : showUnitOptions ? (
    <UnitQuizPrintOptionsPanel
      quizzes={unitOptions.quizzes}
      onModeChange={unitOptions.setQuizMode}
    />
  ) : null;

  const optionsModal = showThisWeekOptions && panelProps ? (
    <PrintOptionsModal
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      {...panelProps}
    />
  ) : showQuizOptions ? (
    <QuizPrintOptionsModal
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      variant="quiz"
      mode={quizOptions.mode}
      onModeChange={quizOptions.setMode}
    />
  ) : showUnitOptions ? (
    <QuizPrintOptionsModal
      open={optionsOpen}
      onClose={() => setOptionsOpen(false)}
      variant="unit"
      unitQuizzes={unitOptions.quizzes}
      onUnitQuizModeChange={unitOptions.setQuizMode}
    />
  ) : null;

  if (print.loading && !print.blob) {
    return (
      <div className="flex h-dvh flex-col">
        <PrintActionBar
          backTo={print.backTo}
          filename="print.pdf"
          blob={null}
          disabled
          onOpenOptions={openOptions}
        />
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {optionsSidebar}
          <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
            <PageLoading embedded label="Making your PDF…" />
          </div>
        </div>
        {optionsModal}
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
    const copy =
      print.grain === "thisWeek" && print.thisWeek?.selectionEmpty
        ? {
            title: "Nothing selected",
            body: "Choose at least one item in the list to print.",
          }
        : emptyCopy(print.grain);
    return (
      <div className="flex h-dvh flex-col">
        {hasPrintOptions ? (
          <>
            <PrintActionBar
              backTo={print.backTo}
              filename="print.pdf"
              blob={null}
              disabled
              onOpenOptions={openOptions}
            />
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              {optionsSidebar}
              <div className="flex min-h-0 flex-1 items-center justify-center p-6">
                <p className="text-[15px] text-[var(--ink-soft)]">{copy.body}</p>
              </div>
            </div>
            {optionsModal}
          </>
        ) : (
          <PrintStatus title={copy.title} body={copy.body} backTo={print.backTo} />
        )}
      </div>
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
        onOpenOptions={openOptions}
      />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {optionsSidebar}
        <div className="relative min-h-0 min-w-0 flex-1">
          {print.updatingPreview ? (
            <p className="absolute left-4 top-3 z-10 rounded-[6px] bg-[var(--surface)] px-2 py-1 text-[12px] text-[var(--ink-soft)] shadow-sm">
              Updating PDF…
            </p>
          ) : null}
          <PdfPreview blob={print.blob} />
        </div>
      </div>
      {optionsModal}
    </div>
  );
}
