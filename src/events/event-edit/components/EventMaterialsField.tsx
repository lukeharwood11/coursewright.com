export function EventMaterialsField({
  options,
  selectedIds,
  disabled,
  onToggle,
}: {
  options: Array<{ id: number; title: string; courseTitle: string }>;
  selectedIds: number[];
  disabled: boolean;
  onToggle: (id: number) => void;
}) {
  const selected = new Set(selectedIds);
  return (
    <fieldset className="mt-6">
      <legend className="text-[13px] font-bold text-[var(--ink-soft)]">
        Linked materials
      </legend>
      <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
        Optional. Families open these from the event when they can already see the material.
      </p>
      {options.length === 0 ? (
        <p className="mt-2 text-[12.5px] text-[var(--ink-faint)]">
          Choose a course first, or there aren’t any materials to link yet.
        </p>
      ) : (
        <ul className="mt-2 max-h-64 divide-y divide-[var(--line-soft)] overflow-y-auto rounded-[6px] border border-[var(--line)]">
          {options.map((option) => (
            <li key={option.id}>
              <label className="flex cursor-pointer items-start gap-2 px-3 py-2.5">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
                  checked={selected.has(option.id)}
                  disabled={disabled}
                  onChange={() => onToggle(option.id)}
                />
                <span>
                  <span className="block text-[14px] font-semibold text-[var(--ink)]">
                    {option.title}
                  </span>
                  <span className="block text-[12.5px] text-[var(--ink-faint)]">
                    {option.courseTitle}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
