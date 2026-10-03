import { Joyride } from "react-joyride";
import { useProductTour } from "@/tours/hooks/useProductTour";
import { ProductTourTooltip } from "./ProductTourTooltip";
import { TourAdvanceContext } from "./tourAdvance";

/** One controlled Joyride for every keyed tour. Step definitions stay in model/. */
export function ProductTourProvider() {
  const tour = useProductTour();
  if (tour.steps.length === 0) return null;

  return (
    <TourAdvanceContext.Provider value={tour.advance}>
      <Joyride
        continuous={false}
        run={tour.run}
        stepIndex={tour.stepIndex}
        steps={tour.steps}
        onEvent={tour.onEvent}
        tooltipComponent={ProductTourTooltip}
        scrollToFirstStep
        options={{
          buttons: ["close", "skip", "primary"],
          closeButtonAction: "skip",
          dismissKeyAction: false,
          overlayClickAction: false,
          primaryColor: "#33604d",
          skipBeacon: true,
          targetWaitTimeout: 400,
          textColor: "#1c1917",
          zIndex: 80,
        }}
      />
    </TourAdvanceContext.Provider>
  );
}
