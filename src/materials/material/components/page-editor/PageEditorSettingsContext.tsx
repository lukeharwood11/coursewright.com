import { createContext, useContext, type ReactNode } from "react";
import {
  EMPTY_PAGE_EDITOR_SETTINGS,
  type PageEditorSettings,
} from "@/materials/model/pageEditorSettings";

type PageEditorSettingsContextValue = {
  settings: PageEditorSettings;
  patchSettings: (patch: Partial<PageEditorSettings>) => void;
};

const PageEditorSettingsContext = createContext<PageEditorSettingsContextValue>({
  settings: EMPTY_PAGE_EDITOR_SETTINGS,
  patchSettings: () => {},
});

export function PageEditorSettingsProvider({
  settings,
  onSettingsChange,
  children,
}: {
  settings: PageEditorSettings;
  onSettingsChange?: (settings: PageEditorSettings) => void;
  children: ReactNode;
}) {
  function patchSettings(patch: Partial<PageEditorSettings>) {
    if (!onSettingsChange) return;
    onSettingsChange({ ...settings, ...patch });
  }

  return (
    <PageEditorSettingsContext.Provider value={{ settings, patchSettings }}>
      {children}
    </PageEditorSettingsContext.Provider>
  );
}

export function usePageEditorSettings() {
  return useContext(PageEditorSettingsContext);
}
