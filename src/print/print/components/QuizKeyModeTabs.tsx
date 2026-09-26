import { Tab, TabList } from "@/ui/Tabs";
import type { QuizKeyPrintMode } from "@/print/model/quizKeyPrintMode";

const MODES: Array<{ id: QuizKeyPrintMode; label: string }> = [
  { id: "worksheet", label: "Worksheet" },
  { id: "key", label: "Answers" },
  { id: "both", label: "Both" },
];

export function QuizKeyModeTabs({
  value,
  onChange,
  className,
}: {
  value: QuizKeyPrintMode;
  onChange: (mode: QuizKeyPrintMode) => void;
  className?: string;
}) {
  return (
    <TabList
      label="Quiz print"
      className={
        className ?? "w-full [&>button]:flex-1 [&>button]:whitespace-nowrap [&>button]:text-[13px]"
      }
    >
      {MODES.map((mode) => (
        <Tab
          key={mode.id}
          selected={value === mode.id}
          onSelect={() => onChange(mode.id)}
        >
          {mode.label}
        </Tab>
      ))}
    </TabList>
  );
}
