import { create } from "zustand";

const STORAGE_KEY = "cw-org-sidebar-collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore quota / private mode */
  }
}

type SidebarStore = {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  collapsed: readCollapsed(),
  mobileOpen: false,
  toggleCollapsed: () =>
    set((state) => {
      const collapsed = !state.collapsed;
      writeCollapsed(collapsed);
      return { collapsed };
    }),
  setMobileOpen: (mobileOpen) => set({ mobileOpen }),
}));
