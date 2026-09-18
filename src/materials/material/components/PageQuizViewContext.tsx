import { createContext, useContext } from "react";

const PageQuizViewContext = createContext(false);

export const PageQuizViewProvider = PageQuizViewContext.Provider;

export function useShowQuizAnswers(): boolean {
  return useContext(PageQuizViewContext);
}
