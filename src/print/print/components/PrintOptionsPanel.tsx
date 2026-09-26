import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Tab, TabList } from "@/ui/Tabs";
import type { QuizKeyPrintMode } from "@/print/model/quizKeyPrintMode";
import type { ThisWeekPrintCatalogItem } from "@/print/model/thisWeekPrintCatalog";
import type { ThisWeekPrintStudentGroups } from "../hooks/useThisWeekPrintOptions";
import { QuizKeyModeTabs } from "./QuizKeyModeTabs";

function categoryBadges(item: ThisWeekPrintCatalogItem): string {
  const labels: string[] = [];
  if (item.itemKind === "quiz") labels.push("Quiz");
  if (item.categories.includes("important_now")) labels.push("Important now");
  if (item.categories.includes("assigned")) labels.push("Assigned");
  if (item.categories.includes("due")) labels.push("Due");
  return labels.join(" · ");
}

function PrintOptionRow({
  item,
  included,
  pageBreak,
  onIncludedChange,
  onPageBreakChange,
  showPageBreakOption,
  quizKeyMode,
  onQuizKeyModeChange,
  showQuizKeyOptions,
}: {
  item: ThisWeekPrintCatalogItem;
  included: boolean;
  pageBreak: boolean;
  onIncludedChange: (included: boolean) => void;
  onPageBreakChange: (enabled: boolean) => void;
  showPageBreakOption: boolean;
  quizKeyMode?: QuizKeyPrintMode;
  onQuizKeyModeChange?: (mode: QuizKeyPrintMode) => void;
  showQuizKeyOptions?: boolean;
}) {
  const badges = categoryBadges(item);
  return (
    <li className="flex flex-col gap-2 border-b border-[var(--line-soft)] px-3 py-2.5 last:border-b-0">
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--green)]"
          checked={included}
          onChange={(event) => onIncludedChange(event.target.checked)}
        />
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-[var(--ink)]">{item.title}</span>
          <span className="mt-0.5 block text-[12px] text-[var(--ink-soft)]">
            {item.courseTitle}
            {badges ? ` · ${badges}` : ""}
          </span>
        </span>
      </label>
      {included && showPageBreakOption ? (
        <label className="flex cursor-pointer items-center gap-2 pl-6 text-[12px] text-[var(--ink-soft)]">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-[var(--green)]"
            checked={pageBreak}
            onChange={(event) => onPageBreakChange(event.target.checked)}
          />
          Start on new page
        </label>
      ) : null}
      {included && showQuizKeyOptions && quizKeyMode && onQuizKeyModeChange ? (
        <div className="pl-6">
          <QuizKeyModeTabs value={quizKeyMode} onChange={onQuizKeyModeChange} />
        </div>
      ) : null}
    </li>
  );
}

function keysForGroup(items: ThisWeekPrintCatalogItem[]): string[] {
  return items.map((item) => item.printKey);
}

function GroupHeader({
  label,
  keys,
  included,
  onSetKeys,
}: {
  label: string;
  keys: string[];
  included: (key: string) => boolean;
  onSetKeys: (keys: string[], included: boolean) => void;
}) {
  if (keys.length === 0) return null;
  const checked = keys.every((key) => included(key));
  const partial = !checked && keys.some((key) => included(key));
  return (
    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] font-bold text-[var(--ink-soft)]">
      <input
        type="checkbox"
        className="h-4 w-4 accent-[var(--green)]"
        checked={checked}
        ref={(input) => {
          if (input) input.indeterminate = partial;
        }}
        onChange={(event) => onSetKeys(keys, event.target.checked)}
      />
      {label}
    </label>
  );
}

function quizRowExtras(
  item: ThisWeekPrintCatalogItem,
  quizKeyModeForItem?: (item: ThisWeekPrintCatalogItem) => QuizKeyPrintMode,
  setQuizKeyMode?: (quizId: number, mode: QuizKeyPrintMode) => void,
  itemCanShowQuizKey?: (item: ThisWeekPrintCatalogItem) => boolean,
) {
  if (item.itemKind !== "quiz" || !quizKeyModeForItem || !setQuizKeyMode) {
    return {};
  }
  const showQuizKeyOptions = itemCanShowQuizKey?.(item) ?? false;
  return {
    showQuizKeyOptions,
    quizKeyMode: quizKeyModeForItem(item),
    onQuizKeyModeChange: (mode: QuizKeyPrintMode) => setQuizKeyMode(item.id, mode),
  };
}

function StudentSection({
  group,
  included,
  hasPageBreak,
  setIncluded,
  setKeysIncluded,
  setPageBreak,
  showPageBreakOption,
  quizKeyModeForItem,
  setQuizKeyMode,
  itemCanShowQuizKey,
}: {
  group: ThisWeekPrintStudentGroups;
  included: (key: string) => boolean;
  hasPageBreak: (key: string) => boolean;
  setIncluded: (key: string, value: boolean) => void;
  setKeysIncluded: (keys: string[], value: boolean) => void;
  setPageBreak: (key: string, value: boolean) => void;
  showPageBreakOption: boolean;
  quizKeyModeForItem?: (item: ThisWeekPrintCatalogItem) => QuizKeyPrintMode;
  setQuizKeyMode?: (quizId: number, mode: QuizKeyPrintMode) => void;
  itemCanShowQuizKey?: (item: ThisWeekPrintCatalogItem) => boolean;
}) {
  const allKeys = [
    ...group.lessonPlans.flatMap((plan) => [
      ...(plan.notes ? [plan.notes.printKey] : []),
      ...keysForGroup(plan.materials),
    ]),
    ...keysForGroup(group.importantNow),
    ...keysForGroup(group.assigned),
    ...keysForGroup(group.due),
  ];

  return (
    <section className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
      <GroupHeader
        label={group.studentName}
        keys={allKeys}
        included={included}
        onSetKeys={setKeysIncluded}
      />
      <div className="border-t border-[var(--line-soft)]">
        {group.lessonPlans.map((plan) => {
          const planKeys = [
            ...(plan.notes ? [plan.notes.printKey] : []),
            ...keysForGroup(plan.materials),
          ];
          if (planKeys.length === 0) return null;
          return (
            <div key={plan.planId} className="border-b border-[var(--line-soft)] last:border-b-0">
              <GroupHeader
                label={`Lesson plan · ${plan.title}`}
                keys={planKeys}
                included={included}
                onSetKeys={setKeysIncluded}
              />
              <ul>
                {plan.notes ? (
                  <PrintOptionRow
                    item={plan.notes}
                    included={included(plan.notes.printKey)}
                    pageBreak={hasPageBreak(plan.notes.printKey)}
                    onIncludedChange={(value) => setIncluded(plan.notes!.printKey, value)}
                    onPageBreakChange={(value) => setPageBreak(plan.notes!.printKey, value)}
                    showPageBreakOption={showPageBreakOption}
                  />
                ) : null}
                {plan.materials.map((item) => (
                  <PrintOptionRow
                    key={item.printKey}
                    item={item}
                    included={included(item.printKey)}
                    pageBreak={hasPageBreak(item.printKey)}
                    onIncludedChange={(value) => setIncluded(item.printKey, value)}
                    onPageBreakChange={(value) => setPageBreak(item.printKey, value)}
                    showPageBreakOption={showPageBreakOption}
                    {...quizRowExtras(
                      item,
                      quizKeyModeForItem,
                      setQuizKeyMode,
                      itemCanShowQuizKey,
                    )}
                  />
                ))}
              </ul>
            </div>
          );
        })}
        {group.importantNow.length > 0 ? (
          <div className="border-b border-[var(--line-soft)]">
            <GroupHeader
              label="Important now"
              keys={keysForGroup(group.importantNow)}
              included={included}
              onSetKeys={setKeysIncluded}
            />
            <ul>
              {group.importantNow.map((item) => (
                <PrintOptionRow
                  key={item.printKey}
                  item={item}
                  included={included(item.printKey)}
                  pageBreak={hasPageBreak(item.printKey)}
                  onIncludedChange={(value) => setIncluded(item.printKey, value)}
                  onPageBreakChange={(value) => setPageBreak(item.printKey, value)}
                  showPageBreakOption={showPageBreakOption}
                  {...quizRowExtras(
                    item,
                    quizKeyModeForItem,
                    setQuizKeyMode,
                    itemCanShowQuizKey,
                  )}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {group.assigned.length > 0 ? (
          <div className="border-b border-[var(--line-soft)]">
            <GroupHeader
              label="Assigned this week"
              keys={keysForGroup(group.assigned)}
              included={included}
              onSetKeys={setKeysIncluded}
            />
            <ul>
              {group.assigned.map((item) => (
                <PrintOptionRow
                  key={item.printKey}
                  item={item}
                  included={included(item.printKey)}
                  pageBreak={hasPageBreak(item.printKey)}
                  onIncludedChange={(value) => setIncluded(item.printKey, value)}
                  onPageBreakChange={(value) => setPageBreak(item.printKey, value)}
                  showPageBreakOption={showPageBreakOption}
                  {...quizRowExtras(
                    item,
                    quizKeyModeForItem,
                    setQuizKeyMode,
                    itemCanShowQuizKey,
                  )}
                />
              ))}
            </ul>
          </div>
        ) : null}
        {group.due.length > 0 ? (
          <div>
            <GroupHeader
              label="Due this week"
              keys={keysForGroup(group.due)}
              included={included}
              onSetKeys={setKeysIncluded}
            />
            <ul>
              {group.due.map((item) => (
                <PrintOptionRow
                  key={item.printKey}
                  item={item}
                  included={included(item.printKey)}
                  pageBreak={hasPageBreak(item.printKey)}
                  onIncludedChange={(value) => setIncluded(item.printKey, value)}
                  onPageBreakChange={(value) => setPageBreak(item.printKey, value)}
                  showPageBreakOption={showPageBreakOption}
                  {...quizRowExtras(
                    item,
                    quizKeyModeForItem,
                    setQuizKeyMode,
                    itemCanShowQuizKey,
                  )}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LayoutSwitch({
  label,
  checked,
  onChange,
  ariaLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[14px] text-[var(--ink)]">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={[
          "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-[var(--green)] bg-[var(--green)]"
            : "border-[var(--line)] bg-[var(--paper)]",
        ].join(" ")}
      >
        <span
          aria-hidden
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-[var(--surface)] shadow-sm transition-transform",
            checked ? "left-[1.35rem]" : "left-0.5",
          ].join(" ")}
        />
      </button>
    </label>
  );
}

function LayoutSection({
  pack,
  studentBreaks,
  setPack,
  setStudentBreaks,
  showStudentBreakSwitch,
}: {
  pack: boolean;
  studentBreaks: boolean;
  setPack: (value: boolean) => void;
  setStudentBreaks: (value: boolean) => void;
  showStudentBreakSwitch: boolean;
}) {
  return (
    <section className="mb-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-3">
      <h3 className="text-[13px] font-bold text-[var(--ink-soft)]">Layout</h3>
      <div className="mt-3">
        <TabList label="Print layout" className="w-full [&>button]:flex-1">
          <Tab selected={pack} onSelect={() => setPack(true)}>Compact</Tab>
          <Tab selected={!pack} onSelect={() => setPack(false)}>Spaced</Tab>
        </TabList>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-soft)]">
          {pack
            ? "Short assignments can share a page when they fit."
            : "Each assignment starts on its own page."}
        </p>
      </div>
      {showStudentBreakSwitch ? (
        <div className="mt-3 border-t border-[var(--line-soft)] pt-3">
          <LayoutSwitch
            label="Page break between students"
            checked={studentBreaks}
            onChange={setStudentBreaks}
            ariaLabel="Page break between students"
          />
        </div>
      ) : null}
    </section>
  );
}

export type PrintOptionsPanelProps = {
  studentGroups: ThisWeekPrintStudentGroups[];
  pack: boolean;
  studentBreaks: boolean;
  included: (key: string) => boolean;
  hasPageBreak: (key: string) => boolean;
  setIncluded: (key: string, value: boolean) => void;
  setKeysIncluded: (keys: string[], value: boolean) => void;
  setPageBreak: (key: string, value: boolean) => void;
  setPack: (value: boolean) => void;
  setStudentBreaks: (value: boolean) => void;
  quizKeyModeForItem?: (item: ThisWeekPrintCatalogItem) => QuizKeyPrintMode;
  setQuizKeyMode?: (quizId: number, mode: QuizKeyPrintMode) => void;
  itemCanShowQuizKey?: (item: ThisWeekPrintCatalogItem) => boolean;
  presentation?: "sidebar" | "modal";
};

export function PrintOptionsPanelContent(props: PrintOptionsPanelProps) {
  const {
    studentGroups,
    pack,
    studentBreaks,
    included,
    hasPageBreak,
    setIncluded,
    setKeysIncluded,
    setPageBreak,
    setPack,
    setStudentBreaks,
    quizKeyModeForItem,
    setQuizKeyMode,
    itemCanShowQuizKey,
    presentation = "sidebar",
  } = props;
  const isMobileModal = presentation === "modal";
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const showPageBreakOption = !isMobileModal || advancedOpen;
  const allPrintKeys = studentGroups.flatMap((group) => [
    ...group.lessonPlans.flatMap((plan) => [
      ...(plan.notes ? [plan.notes.printKey] : []),
      ...plan.materials.map((item) => item.printKey),
    ]),
    ...group.importantNow.map((item) => item.printKey),
    ...group.assigned.map((item) => item.printKey),
    ...group.due.map((item) => item.printKey),
  ]);
  const includedCount = allPrintKeys.filter((key) => included(key)).length;

  const studentSections = (
    <div className="flex flex-col gap-3">
      {studentGroups.map((group) => (
        <StudentSection
          key={group.studentId}
          group={group}
          included={included}
          hasPageBreak={hasPageBreak}
          setIncluded={setIncluded}
          setKeysIncluded={setKeysIncluded}
          setPageBreak={setPageBreak}
          showPageBreakOption={showPageBreakOption}
          quizKeyModeForItem={quizKeyModeForItem}
          setQuizKeyMode={setQuizKeyMode}
          itemCanShowQuizKey={itemCanShowQuizKey}
        />
      ))}
    </div>
  );

  return (
    <>
      <LayoutSection
        pack={pack}
        studentBreaks={studentBreaks}
        setPack={setPack}
        setStudentBreaks={setStudentBreaks}
        showStudentBreakSwitch={!isMobileModal}
      />
      {isMobileModal ? (
        <section className="mb-4 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)]">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-[var(--ink)]">
                Advanced options
              </span>
              <span className="mt-0.5 block text-[12px] text-[var(--ink-soft)]">
                {advancedOpen
                  ? "Choose pages, page breaks, and what each student includes."
                  : `${includedCount} page${includedCount === 1 ? "" : "s"} included — tap to change`}
              </span>
            </span>
            <ChevronDownIcon
              className={[
                "h-5 w-5 shrink-0 text-[var(--ink-soft)] transition-transform",
                advancedOpen ? "rotate-180" : "",
              ].join(" ")}
              aria-hidden
            />
          </button>
          {advancedOpen ? (
            <div className="space-y-3 border-t border-[var(--line-soft)] px-3 py-3">
              <div>
                <h4 className="text-[13px] font-bold text-[var(--ink-soft)]">
                  Pages included
                </h4>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-soft)]">
                  Turn off anything you do not want in the PDF.
                </p>
              </div>
              {studentSections}
              <div className="border-t border-[var(--line-soft)] pt-3">
                <LayoutSwitch
                  label="Page break between students"
                  checked={studentBreaks}
                  onChange={setStudentBreaks}
                  ariaLabel="Page break between students"
                />
                <p className="mt-3 text-[12px] leading-relaxed text-[var(--ink-soft)]">
                  Use “Start on new page” under an item when that assignment should
                  begin on a fresh page.
                </p>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        studentSections
      )}
    </>
  );
}

export function PrintOptionsPanel(props: PrintOptionsPanelProps) {
  return (
    <aside
      className="hidden h-full min-h-0 w-full shrink-0 flex-col border-r border-[var(--line)] bg-[var(--paper)] md:flex md:w-[min(100%,22rem)] lg:w-80"
      aria-label="Print options"
    >
      <div className="border-b border-[var(--line-soft)] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[var(--ink)]">What to print</h2>
        <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
          Choose what to include, then download or print.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <PrintOptionsPanelContent {...props} presentation="sidebar" />
      </div>
    </aside>
  );
}
