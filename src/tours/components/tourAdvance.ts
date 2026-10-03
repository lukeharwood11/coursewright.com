import { createContext } from "react";

export const TourAdvanceContext = createContext<(index: number) => void>(() => {});
