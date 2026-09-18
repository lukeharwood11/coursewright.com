import QRCode from "qrcode";
import { videoUrlsFromBlocks } from "@/materials/model/pageContent";
import { isImageMime } from "@/print/model/fileKind";
import type { PrintMaterial, PrintPacket } from "@/print/model/packet";

export type PrintMaterialView = PrintMaterial & {
  qrDataUrl: string | null;
  imageSrc: string | null;
  videoQrs: Array<{ url: string; dataUrl: string | null }>;
};

export type PrintPacketView = Omit<PrintPacket, "materials"> & {
  materials: PrintMaterialView[];
};

async function qrDataUrl(url: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(url, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: "M",
    });
  } catch {
    return null;
  }
}

function bytesToDataUrl(bytes: Uint8Array, mimeType: string): string {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    const slice = bytes.subarray(index, index + chunk);
    for (let offset = 0; offset < slice.length; offset += 1) {
      binary += String.fromCharCode(slice[offset] ?? 0);
    }
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export async function toPrintMaterialView(
  material: PrintMaterial,
): Promise<PrintMaterialView> {
  const qrDataUrlValue = material.url ? await qrDataUrl(material.url) : null;
  const imageSrc =
    material.file && material.file.bytes && isImageMime(material.file.mimeType)
      ? bytesToDataUrl(material.file.bytes, material.file.mimeType)
      : null;
  const videoQrs: PrintMaterialView["videoQrs"] = [];
  for (const url of videoUrlsFromBlocks(material.blocks)) {
    videoQrs.push({
      url,
      dataUrl: url ? await qrDataUrl(url) : null,
    });
  }
  return { ...material, qrDataUrl: qrDataUrlValue, imageSrc, videoQrs };
}

export async function toPrintPacketView(
  packet: PrintPacket,
): Promise<PrintPacketView> {
  const materials: PrintMaterialView[] = [];
  for (const material of packet.materials) {
    materials.push(await toPrintMaterialView(material));
  }
  return { title: packet.title, subtitle: packet.subtitle, materials };
}
