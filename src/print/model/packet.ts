import type { BlockKind } from "@/materials/model/blocks";
import type { MaterialKind } from "@/materials/model/kind";

export type PrintBlock = {
  kind: BlockKind;
  body: unknown;
};

export type PrintFile = {
  filename: string;
  mimeType: string;
  bytes: Uint8Array | null;
};

export type PrintMaterial = {
  id: number;
  title: string;
  description: string;
  kind: MaterialKind;
  url: string | null;
  scheduledDate: string | null;
  contextLines?: string[];
  blocks: PrintBlock[];
  file: PrintFile | null;
};

export type PrintPacket = {
  title: string;
  subtitle: string | null;
  includeAnswerKey?: boolean;
  materials: PrintMaterial[];
};
