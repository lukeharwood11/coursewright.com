import { Button } from "@/ui/Button";
import { useResourceUploadStore } from "@/resources/stores/uploadQueue";

export function ResourceUploadPanel() {
  const jobs = useResourceUploadStore((state) => state.jobs);
  const retry = useResourceUploadStore((state) => state.retry);
  const clearFinished = useResourceUploadStore((state) => state.clearFinished);
  if (jobs.length === 0) return null;

  const active = jobs.filter(
    (job) => job.status === "queued" || job.status === "uploading",
  );
  const done = jobs.filter((job) => job.status === "done").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const overall =
    jobs.reduce((sum, job) => {
      if (job.status === "done") return sum + 1;
      if (job.status === "uploading") return sum + job.progress;
      return sum;
    }, 0) / jobs.length;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-4">
      <div className="pointer-events-auto w-full max-w-md rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold text-[var(--ink)]">
              {active.length > 0
                ? `Uploading ${active.length} ${active.length === 1 ? "file" : "files"}`
                : failed > 0
                  ? "Some files didn’t upload"
                  : "Upload finished"}
            </p>
            <p className="mt-0.5 text-[12.5px] text-[var(--ink-soft)]">
              {done} done{failed > 0 ? ` · ${failed} failed` : ""}
            </p>
          </div>
          {active.length === 0 ? (
            <Button type="button" variant="secondary" onClick={clearFinished}>
              Close
            </Button>
          ) : null}
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line-soft)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(overall * 100)}
        >
          <div
            className="h-full bg-[var(--green)] transition-[width] motion-reduce:transition-none"
            style={{ width: `${Math.round(overall * 100)}%` }}
          />
        </div>
        <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
          {jobs.map((job) => (
            <li key={job.id} className="text-[12.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-bold text-[var(--ink)]">
                  {job.file.name}
                </span>
                {job.status === "failed" ? (
                  <Button type="button" variant="secondary" onClick={() => retry(job.id)}>
                    Retry
                  </Button>
                ) : (
                  <span className="shrink-0 text-[var(--ink-faint)]">
                    {job.status === "done"
                      ? "Done"
                      : job.status === "queued"
                        ? "Waiting"
                        : `${Math.round(job.progress * 100)}%`}
                  </span>
                )}
              </div>
              {job.error ? (
                <p className="mt-0.5 text-[var(--amber-deep)]">{job.error}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
