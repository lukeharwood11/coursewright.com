/**
 * Storage helpers — stub until material upload paths + RLS are implemented.
 * See src/infrastructure/supabase/AGENTS.md and FEATURES file sharing.
 */

export async function uploadMaterialFile(_args: {
  organizationId: string;
  materialId: string;
  file: File;
}): Promise<{ path: string } | { error: string }> {
  return {
    error: "Supabase Storage upload not wired yet.",
  };
}
