import { create } from "zustand";
import {
  parseStaffViewMode,
  resolveStaffViewMode,
  type StaffViewMode,
} from "../model/viewMode";

const STORAGE_PREFIX = "cw-staff-view:";

function storageKey(orgSlug: string): string {
  return `${STORAGE_PREFIX}${orgSlug}`;
}

function readStoredRaw(orgSlug: string): string | null {
  if (!orgSlug || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(storageKey(orgSlug));
  } catch {
    return null;
  }
}

function writeStored(orgSlug: string, mode: StaffViewMode) {
  try {
    window.localStorage.setItem(storageKey(orgSlug), mode);
  } catch {
    /* ignore quota / private mode */
  }
}

type ViewModeStore = {
  remembered: Record<string, StaffViewMode>;
  setMode: (orgSlug: string, mode: StaffViewMode) => void;
};

export const useStaffViewStore = create<ViewModeStore>((set) => ({
  remembered: {},
  setMode: (orgSlug, mode) => {
    if (!orgSlug) return;
    writeStored(orgSlug, mode);
    set((state) => ({
      remembered: { ...state.remembered, [orgSlug]: mode },
    }));
  },
}));

export function useStaffViewMode(
  orgSlug: string | undefined,
  flags: { isParent: boolean; isStudent: boolean } = {
    isParent: false,
    isStudent: false,
  },
): {
  staffViewMode: StaffViewMode;
  setStaffViewMode: (mode: StaffViewMode) => void;
} {
  const remembered = useStaffViewStore((state) =>
    orgSlug ? state.remembered[orgSlug] : undefined,
  );
  const setMode = useStaffViewStore((state) => state.setMode);
  const raw = orgSlug
    ? (remembered ?? readStoredRaw(orgSlug) ?? "teacher")
    : "teacher";
  const staffViewMode = resolveStaffViewMode(
    typeof raw === "string" ? raw : parseStaffViewMode(raw),
    flags,
  );

  return {
    staffViewMode,
    setStaffViewMode: (mode) => {
      if (orgSlug) setMode(orgSlug, mode);
    },
  };
}
