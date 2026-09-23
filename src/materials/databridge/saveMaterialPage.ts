import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import {
  createBlock,
  listBlocks,
  softDeleteBlock,
  updateBlock,
} from "./blocks";
import { updateMaterial } from "./materials";
import type { PageBlockDraft } from "@/materials/model/pageContent";

export type MaterialPagePlacement = {
  title: string;
  description: string;
  url: string | null;
  scheduledDate: string | null;
  dueDate: string | null;
  dueAt: string | null;
  dueTimezone: string | null;
  acceptSubmissions: boolean;
  allowSubmissionsPastDue: boolean;
  submissionLimit: number;
  submissionFileTypes: string[];
};

type RpcError = { code?: string; message: string; details?: string };

const REST_FLAG = "cw.savePageViaRest";

function restFallbackEnabled(): boolean {
  try {
    return sessionStorage.getItem(REST_FLAG) === "1";
  } catch {
    return false;
  }
}

function rememberRestFallback(): void {
  try {
    sessionStorage.setItem(REST_FLAG, "1");
  } catch {
    /* private mode */
  }
}

export async function saveMaterialPage(args: {
  materialId: number;
  placement?: MaterialPagePlacement;
  blocks?: PageBlockDraft[];
}): Promise<number> {
  if (!args.placement && args.blocks === undefined) {
    throw new Error("Nothing to save.");
  }
  if (restFallbackEnabled()) {
    await saveMaterialPageFallback(args);
    return 0;
  }

  const db = requireSupabase();
  try {
    const { data, error } = await withTimeout(
      db
        .rpc("save_material_page", {
          p_material_id: args.materialId,
          p_placement: args.placement
            ? {
                title: args.placement.title,
                description: args.placement.description,
                url: args.placement.url,
                scheduled_date: args.placement.scheduledDate,
                due_date: args.placement.dueDate,
                due_at: args.placement.dueAt,
                due_timezone: args.placement.dueTimezone,
                accept_submissions: args.placement.acceptSubmissions,
                allow_submissions_past_due: args.placement.allowSubmissionsPastDue,
                submission_limit: args.placement.submissionLimit,
                submission_file_types: args.placement.submissionFileTypes,
              }
            : null,
          p_blocks:
            args.blocks === undefined
              ? null
              : (args.blocks.map((block) => ({
                  kind: block.kind,
                  body: block.body as Json,
                  position: block.position,
                  file_id: block.fileId,
                })) as Json),
        })
        .abortSignal(AbortSignal.timeout(1200)),
      1500,
    );
    if (!error) {
      return typeof data === "number" ? data : 0;
    }
    if (!isMissingSaveRpc(error)) {
      throw new Error(error.message || "Couldn’t save.");
    }
  } catch (caught) {
    if (!isMissingSaveRpc(asRpcError(caught))) {
      throw caught instanceof Error ? caught : new Error("Couldn’t save.");
    }
  }

  rememberRestFallback();
  await saveMaterialPageFallback(args);
  return 0;
}

function asRpcError(caught: unknown): RpcError {
  if (caught && typeof caught === "object") {
    const record = caught as { code?: unknown; message?: unknown; details?: unknown };
    return {
      code: typeof record.code === "string" ? record.code : "",
      message: typeof record.message === "string" ? record.message : String(caught),
      details: typeof record.details === "string" ? record.details : undefined,
    };
  }
  return { message: String(caught) };
}

function isMissingSaveRpc(error: RpcError): boolean {
  const code = error.code ?? "";
  const text = `${code} ${error.message} ${error.details ?? ""}`.toLowerCase();
  return (
    code === "PGRST202" ||
    code === "42883" ||
    text.includes("could not find the function") ||
    text.includes("timed out") ||
    text.includes("timeout") ||
    text.includes("failed to fetch") ||
    text.includes("network") ||
    text.includes("abort") ||
    /\b404\b/.test(text) ||
    text.includes("not found")
  );
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("save_material_page timed out"));
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (reason: unknown) => {
        clearTimeout(timer);
        reject(reason);
      },
    );
  });
}

async function saveMaterialPageFallback(args: {
  materialId: number;
  placement?: MaterialPagePlacement;
  blocks?: PageBlockDraft[];
}): Promise<void> {
  if (args.placement) {
    await updateMaterial(args.materialId, {
      title: args.placement.title,
      description: args.placement.description,
      url: args.placement.url,
      scheduledDate: args.placement.scheduledDate,
      dueDate: args.placement.dueDate,
      dueAt: args.placement.dueAt,
      dueTimezone: args.placement.dueTimezone,
      acceptSubmissions: args.placement.acceptSubmissions,
      allowSubmissionsPastDue: args.placement.allowSubmissionsPastDue,
      submissionLimit: args.placement.submissionLimit,
      submissionFileTypes: args.placement.submissionFileTypes,
    });
  }
  if (args.blocks === undefined) return;

  const existing = await listBlocks(args.materialId);
  const keep = Math.min(existing.length, args.blocks.length);
  for (let index = 0; index < keep; index += 1) {
    const draft = args.blocks[index];
    const current = existing[index];
    if (current.kind === draft.kind) {
      await updateBlock(current.id, {
        body: draft.body as Json,
        position: draft.position,
      });
      continue;
    }
    await softDeleteBlock(current.id);
    const created = await createBlock({
      materialId: args.materialId,
      kind: draft.kind,
      body: draft.body as Json,
    });
    await updateBlock(created.id, { position: draft.position });
  }
  for (let index = keep; index < args.blocks.length; index += 1) {
    const draft = args.blocks[index];
    const created = await createBlock({
      materialId: args.materialId,
      kind: draft.kind,
      body: draft.body as Json,
    });
    await updateBlock(created.id, { position: draft.position });
  }
  for (let index = keep; index < existing.length; index += 1) {
    await softDeleteBlock(existing[index].id);
  }
}
