import type { Json } from "@/infrastructure/supabase/database.types";
import { requireSupabase } from "./client";
import type { PageBlockDraft } from "@/materials/model/pageContent";
import { saveResourceDocument } from "./blocks";

export type ResourcePagePlacement = {
  title: string;
  description: string;
  url: string | null;
};

type RpcError = { code?: string; message: string; details?: string };

const REST_FLAG = "cw.saveResourcePageViaRest";

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

export async function saveResourcePage(args: {
  itemId: number;
  placement?: ResourcePagePlacement;
  blocks?: PageBlockDraft[];
}): Promise<number> {
  if (!args.placement && args.blocks === undefined) {
    throw new Error("Nothing to save.");
  }
  if (restFallbackEnabled()) {
    await saveResourceDocument({
      itemId: args.itemId,
      title: args.placement?.title,
      description: args.placement?.description,
      url: args.placement?.url,
      blocks: args.blocks,
    });
    return 0;
  }

  const db = requireSupabase();
  try {
    const { data, error } = await withTimeout(
      db
        .rpc("save_resource_page", {
          p_item_id: args.itemId,
          p_placement: args.placement
            ? {
                title: args.placement.title,
                description: args.placement.description,
                url: args.placement.url,
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
  await saveResourceDocument({
    itemId: args.itemId,
    title: args.placement?.title,
    description: args.placement?.description,
    url: args.placement?.url,
    blocks: args.blocks,
  });
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
      reject(new Error("save_resource_page timed out"));
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
