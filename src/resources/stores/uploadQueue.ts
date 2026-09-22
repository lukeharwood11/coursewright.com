import { create } from "zustand";

export type ResourceUploadStatus = "queued" | "uploading" | "done" | "failed";

export type ResourceUploadJob = {
  id: string;
  organizationId: number;
  folderId: number | null;
  createdBy: string;
  file: File;
  status: ResourceUploadStatus;
  progress: number;
  error: string | null;
  itemId: number | null;
};

type UploadStore = {
  jobs: ResourceUploadJob[];
  enqueue: (
    jobs: Array<{
      organizationId: number;
      folderId: number | null;
      createdBy: string;
      file: File;
    }>,
  ) => void;
  patch: (id: string, patch: Partial<ResourceUploadJob>) => void;
  retry: (id: string) => void;
  clearFinished: () => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useResourceUploadStore = create<UploadStore>((set) => ({
  jobs: [],
  enqueue: (incoming) => {
    const jobs: ResourceUploadJob[] = incoming.map((job) => ({
      ...job,
      id: newId(),
      status: "queued",
      progress: 0,
      error: null,
      itemId: null,
    }));
    set((state) => ({ jobs: [...state.jobs, ...jobs] }));
  },
  patch: (id, patch) => {
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)),
    }));
  },
  retry: (id) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id
          ? { ...job, status: "queued", progress: 0, error: null }
          : job,
      ),
    }));
  },
  clearFinished: () => {
    set((state) => ({
      jobs: state.jobs.filter(
        (job) => job.status === "queued" || job.status === "uploading",
      ),
    }));
  },
}));
