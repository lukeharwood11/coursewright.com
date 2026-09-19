import { getCourse } from "@/courses/databridge/courses";
import { downloadFileBytes, getFile } from "@/materials/databridge/files";
import { listBlocks } from "@/materials/databridge/blocks";
import {
  getMaterial,
  listMaterialsForUnit,
} from "@/materials/databridge/materials";
import { getUnit } from "@/units/databridge/units";
import { loadParentDashboard } from "@/parent/databridge/dashboard";
import { thisWeekPrintRefs, printMaterialFromBulletin } from "@/print/model/thisWeekPacket";
import type { PrintMaterial, PrintPacket } from "@/print/model/packet";

async function toPrintMaterial(
  material: Awaited<ReturnType<typeof getMaterial>>,
): Promise<PrintMaterial | null> {
  if (!material || material.deletedAt) return null;
  const blocks =
    material.kind === "page"
      ? (await listBlocks(material.id)).map((block) => ({
          kind: block.kind,
          body: block.body,
        }))
      : [];
  const file = material.fileId ? await getFile(material.fileId) : null;
  let bytes: Uint8Array | null = null;
  if (file) {
    try {
      bytes = await downloadFileBytes(file.storageRef);
    } catch {
      bytes = null;
    }
  }
  return {
    id: material.id,
    title: material.title,
    description: material.description,
    kind: material.kind,
    url: material.url,
    scheduledDate: material.scheduledDate,
    blocks,
    file: file
      ? {
          filename: file.filename,
          mimeType: file.mimeType,
          bytes,
        }
      : null,
  };
}

export async function loadMaterialPrintPacket(
  materialId: number,
): Promise<PrintPacket | null> {
  const material = await getMaterial(materialId);
  if (!material) return null;
  const course = await getCourse(material.courseId);
  const printed = await toPrintMaterial(material);
  if (!printed) return null;
  return {
    title: printed.title,
    subtitle: course?.title ?? null,
    materials: [printed],
  };
}

export async function loadUnitPrintPacket(unitId: number): Promise<PrintPacket | null> {
  const unit = await getUnit(unitId);
  if (!unit) return null;
  const course = await getCourse(unit.courseId);
  const materials = await listMaterialsForUnit(unitId);
  const printed: PrintMaterial[] = [];
  for (const material of materials) {
    const item = await toPrintMaterial(material);
    if (item) printed.push(item);
  }
  return {
    title: unit.title,
    subtitle: course?.title ?? null,
    materials: printed,
  };
}

export async function loadWeekPrintPacket(args: {
  organizationId: number;
  userId: string;
  studentIds?: number[] | null;
}): Promise<PrintPacket> {
  const dashboard = await loadParentDashboard(args.organizationId, args.userId);
  const refs = thisWeekPrintRefs(dashboard, args.studentIds);
  const printed: PrintMaterial[] = [];
  for (const ref of refs) {
    if (ref.source === "bulletin") {
      printed.push(printMaterialFromBulletin(ref));
      continue;
    }
    const material = await getMaterial(ref.id);
    const item = await toPrintMaterial(material);
    if (item) {
      printed.push({
        ...item,
        contextLines: ref.contextLines,
        sectionKey: ref.sectionKey,
        sectionTitle: ref.sectionTitle,
      });
    }
  }
  return {
    title: "This week",
    subtitle: dashboard.week.label,
    materials: printed,
  };
}
