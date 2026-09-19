import { create } from "zustand";
import {
  parseStaffViewMode,
  type StaffViewMode,
} from "../model/viewMode";

const STORAGE_PREFIX = "cw-staff-view:";

function storageKey(orgSlug: string): string {
  return `${STORAGE_PREFIX}${orgSlug}`;
}

function readStored(orgSlug: string): StaffViewMode {
  if (!orgSlug || typeof window === "undefined") return "teacher";
  try {
    return parseStaffViewMode(window.localStorage.getItem(storageKey(orgSlug)));
  } catch {
    return "teacher";
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

export function useStaffViewMode(orgSlug: string | undefined): {
  staffViewMode: StaffViewMode;
  setStaffViewMode: (mode: StaffViewMode) => void;
} {
  const remembered = useStaffViewStore((state) =>
    orgSlug ? state.remembered[orgSlug] : undefined,
  );
  const setMode = useStaffViewStore((state) => state.setMode);
  const staffViewMode = orgSlug
    ? (remembered ?? readStored(orgSlug))
    : "teacher";

  return {
    staffViewMode,
    setStaffViewMode: (mode) => {
      if (orgSlug) setMode(orgSlug, mode);
    },
  };
}
