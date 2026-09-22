import { uploadNewFile } from "@/materials/databridge/files";
import { createResourceItem } from "./items";
import { titleFromFilename } from "@/resources/model/kinds";

export async function uploadResourceFile(args: {
  organizationId: number;
  folderId: number | null;
  createdBy: string;
  file: File;
  onProgress?: (ratio: number) => void;
}): Promise<{ itemId: number }> {
  const uploaded = await uploadNewFile({
    organizationId: args.organizationId,
    uploadedBy: args.createdBy,
    file: args.file,
    onProgress: args.onProgress,
  });
  const item = await createResourceItem({
    organizationId: args.organizationId,
    folderId: args.folderId,
    type: "file",
    title: titleFromFilename(args.file.name),
    createdBy: args.createdBy,
    fileId: uploaded.id,
  });
  args.onProgress?.(1);
  return { itemId: item.id };
}
