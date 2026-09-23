import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadResourceFile } from "@/resources/databridge/upload";
import { resourceFolderQueryKeys } from "@/resources/databridge/folders";
import { resourceItemQueryKeys } from "@/resources/databridge/items";
import { useResourceUploadStore } from "@/resources/stores/uploadQueue";
import { caughtErrorMessage } from "@/ui/toast";

const CONCURRENCY = 3;

export function useResourceUploadProcessor() {
  const jobs = useResourceUploadStore((state) => state.jobs);
  const patch = useResourceUploadStore((state) => state.patch);
  const queryClient = useQueryClient();
  const inFlight = useRef(new Set<string>());

  useEffect(() => {
    const queued = jobs.filter(
      (job) => job.status === "queued" && !inFlight.current.has(job.id),
    );
    const uploading = jobs.filter((job) => job.status === "uploading").length;
    const available = Math.max(0, CONCURRENCY - uploading - inFlight.current.size);
    const next = queued.slice(0, available);

    for (const job of next) {
      inFlight.current.add(job.id);
      patch(job.id, { status: "uploading", progress: 0, error: null });
      void uploadResourceFile({
        organizationId: job.organizationId,
        folderId: job.folderId,
        createdBy: job.createdBy,
        file: job.file,
        onProgress: (ratio) => {
          patch(job.id, { progress: ratio });
        },
      })
        .then((result) => {
          patch(job.id, {
            status: "done",
            progress: 1,
            itemId: result.itemId,
          });
          void queryClient.invalidateQueries({
            queryKey: resourceItemQueryKeys.list(job.organizationId, job.folderId),
          });
          void queryClient.invalidateQueries({
            queryKey: resourceItemQueryKeys.visible(job.organizationId),
          });
          void queryClient.invalidateQueries({
            queryKey: resourceFolderQueryKeys.children(
              job.organizationId,
              job.folderId,
            ),
          });
        })
        .catch((caught: unknown) => {
          patch(job.id, {
            status: "failed",
            error: caughtErrorMessage(caught),
          });
        })
        .finally(() => {
          inFlight.current.delete(job.id);
        });
    }
  }, [jobs, patch, queryClient]);
}
