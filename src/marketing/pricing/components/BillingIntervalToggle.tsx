import type { BillingInterval } from "../../model/pricingPlans";

const options: { id: BillingInterval; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export function BillingIntervalToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval;
  onChange: (next: BillingInterval) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="inline-flex rounded-[8px] border border-[var(--line)] bg-[var(--paper)] p-1"
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        onChange(interval === "monthly" ? "yearly" : "monthly");
      }}
    >
      {options.map((option) => {
        const selected = option.id === interval;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={[
              "rounded-[6px] px-4 py-2 text-[13px] font-bold transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]",
              "motion-reduce:transition-none",
              selected
                ? "bg-[var(--green)] text-white"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
