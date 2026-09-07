import { Button, ButtonLink } from "@/ui/Button";

export function PrintStatus({
  title,
  body,
  backTo,
  retry,
}: {
  title: string;
  body: string;
  backTo: string;
  retry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">{body}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {retry ? (
          <Button onClick={retry}>Try again</Button>
        ) : null}
        <ButtonLink variant="secondary" to={backTo}>
          Back
        </ButtonLink>
      </div>
    </div>
  );
}
