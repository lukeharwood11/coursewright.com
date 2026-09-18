import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "react-router-dom";
import { useAuthedUser } from "@/auth/hooks/useAuthedUser";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { printBackPath, parsePrintStudentIds, type PrintGrainKind } from "@/print/model/paths";
import {
  loadMaterialPrintPacket,
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
  if (pathname.includes("print-this-week")) return "thisWeek";
  if (Number.isFinite(materialId)) return "material";
  if (Number.isFinite(unitId)) return "unit";
  return "thisWeek";
}

export function usePrint() {
  const params = useParams();
  const location = useLocation();
  const { organization } = useOrgShell();
  const user = useAuthedUser();
  const courseId = params.courseId ? Number(params.courseId) : NaN;
  const unitId = params.unitId ? Number(params.unitId) : NaN;
  const materialId = params.materialId ? Number(params.materialId) : NaN;
  const grain = grainFromPath(location.pathname, materialId, unitId);
  const studentIds = parsePrintStudentIds(location.search);

  const query = useQuery({
    queryKey: ["print", organization.id, location.pathname, location.search],
    queryFn: async () => {
      const packet =
        grain === "thisWeek"
          ? await loadWeekPrintPacket({
              organizationId: organization.id,
              userId: user.id,
              studentIds,
            })
          : grain === "material"
            ? await loadMaterialPrintPacket(materialId)
            : await loadUnitPrintPacket(unitId);
      if (!packet) throw new Error("We couldn’t find that to print.");
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
    }),
    retry: () => {
      void query.refetch();
    },
  };
}
