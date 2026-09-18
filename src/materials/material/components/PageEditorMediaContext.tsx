import { createContext, useContext } from "react";

export type PageEditorMedia = {
  organizationId: number;
  userId: string;
};

const PageEditorMediaContext = createContext<PageEditorMedia | null>(null);

export const PageEditorMediaProvider = PageEditorMediaContext.Provider;

export function usePageEditorMedia(): PageEditorMedia | null {
  return useContext(PageEditorMediaContext);
}
