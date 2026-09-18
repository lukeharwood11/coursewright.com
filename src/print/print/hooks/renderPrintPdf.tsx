import { pdf } from "@react-pdf/renderer";
import { isPdfMime } from "@/print/model/fileKind";
import {
  blobToPdfBytes,
  concatPdfs,
} from "@/print/model/mergePdfs";
import { printFilename } from "@/print/model/paths";
import type { PrintPacket } from "@/print/model/packet";
import { toPrintPacketView, type PrintMaterialView } from "@/print/model/previewAssets";
import { PacketDocument } from "../components/PacketDocument";

async function renderPacket(materials: PrintMaterialView[], packet: PrintPacket) {
  const blob = await pdf(
    <PacketDocument
      packet={{
        title: packet.title,
        subtitle: packet.subtitle,
        includeAnswerKey: packet.includeAnswerKey,
        materials,
      }}
    />,
  ).toBlob();
  return blobToPdfBytes(blob);
}

export async function renderPrintPdf(packet: PrintPacket): Promise<{
  bytes: Uint8Array;
  filename: string;
}> {
  const filename = printFilename(packet.title);
  const only = packet.materials[0];
  if (
    packet.materials.length === 1 &&
    only &&
    only.kind === "file" &&
    only.file &&
    isPdfMime(only.file.mimeType) &&
    only.file.bytes
  ) {
    return { bytes: only.file.bytes, filename };
  }

  const view = await toPrintPacketView(packet);
  const parts: Uint8Array[] = [];
  let batch: PrintMaterialView[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    parts.push(await renderPacket(batch, packet));
    batch = [];
  };

  for (const material of view.materials) {
    const attachedPdf =
      material.kind === "file" &&
      material.file &&
      isPdfMime(material.file.mimeType) &&
      material.file.bytes;
    if (attachedPdf && material.file?.bytes) {
      await flush();
      parts.push(await renderPacket([material], packet));
      parts.push(material.file.bytes);
    } else {
      batch.push(material);
    }
  }
  await flush();

  return { bytes: await concatPdfs(parts), filename };
}
