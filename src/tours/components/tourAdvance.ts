import { createContext } from "react";

export const TourAdvanceContext = createContext<(index: number) => void>(() => {});

/** Hide the current tour for this browser session. Does not skip it. */
export const TourLaterContext = createContext<() => void>(() => {});
