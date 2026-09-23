import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import {
  getGradingScale,
  gradingScaleQueryKeys,
  saveGradingScale,
} from "@/grading/databridge/scales";
import { canEditGradingScale } from "@/grading/model/access";
import {
  STARTER_LETTER_BANDS,
  validateScaleDraft,
  type GradingMode,
  type LetterBand,
} from "@/grading/model/scale";
import { caughtErrorMessage } from "@/ui/toast";

export function useOrgGrading() {
  const { organization, role } = useOrgShell();
  const queryClient = useQueryClient();
  const canEdit = canEditGradingScale(role);
  const query = useQuery({
    queryKey: gradingScaleQueryKeys.org(organization.id),
    queryFn: () => getGradingScale(organization.id),
  });

  const [mode, setMode] = useState<GradingMode>("none");
  const [passThreshold, setPassThreshold] = useState("70");
  const [bands, setBands] = useState<LetterBand[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    setMode(query.data.mode);
    setPassThreshold(
      query.data.passThreshold == null ? "70" : String(query.data.passThreshold),
    );
    setBands(query.data.bands);
    setError(null);
  }, [query.data]);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = validateScaleDraft({ mode, passThreshold, bands });
      if (!parsed.ok) throw new Error(parsed.error);
      await saveGradingScale({
        organizationId: organization.id,
        mode: parsed.mode,
        passThreshold: parsed.passThreshold,
        bands: parsed.bands,
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: gradingScaleQueryKeys.org(organization.id),
      });
      toast("Grading saved.");
    },
    onError: (caught: Error) => setError(caughtErrorMessage(caught)),
  });

  function updateBand(index: number, patch: Partial<LetterBand>) {
    setBands((current) =>
      current.map((band, i) => (i === index ? { ...band, ...patch } : band)),
    );
  }

  return {
    loading: query.isLoading,
    canEdit,
    mode,
    setMode,
    passThreshold,
    setPassThreshold,
    bands,
    error,
    saving: save.isPending,
    setModeAndDefaults: (next: GradingMode) => {
      setMode(next);
      if (next === "letter" && bands.length === 0) setBands(STARTER_LETTER_BANDS);
    },
    addBand: () => setBands((current) => [...current, { label: "", minPercent: 0 }]),
    removeBand: (index: number) =>
      setBands((current) => current.filter((_, i) => i !== index)),
    updateBand,
    useStarterBands: () => setBands(STARTER_LETTER_BANDS),
    onSave: () => save.mutate(),
  };
}
