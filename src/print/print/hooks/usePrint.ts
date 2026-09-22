import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { printBackPath, parsePrintStudentIds, type PrintGrainKind } from "@/print/model/paths";
import {
  loadMaterialPrintPacket,
  loadResourcePrintPacket,
  loadUnitPrintPacket,
  loadWeekPrintPacket,
} from "@/print/databridge/packets";
import { pdfBytesToBlob } from "@/print/model/mergePdfs";
import { renderPrintPdf } from "./renderPrintPdf";

function grainFromPath(
  pathname: string,
  materialId: number,
  unitId: number,
): PrintGrainKind {
  if (pathname.includes("/resources/items/")) return "resource";
  if (pathname.includes("print-this-week")) return "thisWeek";
  if (Number.isFinite(materialId)) return "material";
  if (Number.isFinite(unitId)) return "unit";
  return "thisWeek";
}

export function usePrint() {
  const params = useParams();
  const location = useLocation();
  const { organization, parentPresentation } = useOrgShell();
  const user = useAuthedUser();
  const includeAnswerKey = !parentPresentation;
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : NaN;
  const materialId = params.materialId ? Number(params.materialId) : NaN;
  const itemId = params.itemId ? Number(params.itemId) : NaN;
  const grain = grainFromPath(location.pathname, materialId, unitId);
  const studentIds = parsePrintStudentIds(location.search);

  const query = useQuery({
    queryKey: [
      "print",
      organization.id,
      location.pathname,
      location.search,
      includeAnswerKey,
    ],
    queryFn: async () => {
      const loaded =
        grain === "thisWeek"
          ? await loadWeekPrintPacket({
              organizationId: organization.id,
              userId: user.id,
              studentIds,
            })
          : grain === "resource"
            ? await loadResourcePrintPacket(itemId)
          : grain === "material"
            ? await loadMaterialPrintPacket(materialId)
            : await loadUnitPrintPacket(unitId);
      if (!loaded) throw new Error("We couldn’t find that to print.");
      const packet = { ...loaded, includeAnswerKey };
      if (packet.materials.length === 0) {
        return { packet, blob: null as Blob | null, filename: "print.pdf" };
      }
      const pdf = await renderPrintPdf(packet);
      return {
        packet,
        blob: pdfBytesToBlob(pdf.bytes),
        filename: pdf.filename,
      };
    },
    retry: false,
  });

  return {
    grain,
    loading: query.isPending,
    error: query.error ? query.error.message : null,
    packet: query.data?.packet ?? null,
    blob: query.data?.blob ?? null,
    filename: query.data?.filename ?? "print.pdf",
    empty: Boolean(query.data && query.data.packet.materials.length === 0),
    notFound: Boolean(
      query.error && query.error.message.includes("couldn’t find"),
    ),
    backTo: printBackPath({
      grain,
      orgSlug: organization.slug,
      courseId: Number.isFinite(courseId) ? courseId : null,
      unitId: Number.isFinite(unitId) ? unitId : null,
      materialId: Number.isFinite(materialId) ? materialId : null,
      itemId: Number.isFinite(itemId) ? itemId : null,
    }),
    retry: () => {
      void query.refetch();
    },
  };
}
