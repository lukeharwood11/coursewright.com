import { useQuery } from "@tanstack/react-query";
import { useOrgShell } from "@/app/layouts/OrgShellContext";
import { fillCycleQueryKeys, loadFillWorkspace } from "@/grading/databridge/fillCycles";
import { useToastOnError } from "@/ui/useToastOnError";

export function useFillWorkspace() {
  const shell = useOrgShell();
  const query = useQuery({
    queryKey: fillCycleQueryKeys.workspace(shell.organization.id),
    queryFn: () => loadFillWorkspace(shell.organization.id),
  });
  useToastOnError(query.error instanceof Error ? query.error.message : null);
  return {
    organization: shell.organization,
    role: shell.role,
    workspace: query.data ?? null,
    loading: query.isLoading,
  };
}
