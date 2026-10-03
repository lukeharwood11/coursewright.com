import { useContext } from "react";
import type { CSSProperties } from "react";
import type { TooltipRenderProps } from "react-joyride";
import { TourAdvanceContext, TourLaterContext } from "./tourAdvance";

const tooltipStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 10,
  boxShadow: "0 12px 40px rgba(28, 25, 23, 0.16)",
  color: "#1c1917",
  maxWidth: "calc(100vw - 32px)",
  padding: 16,
  width: 320,
};

const closeStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  color: "#78716c",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
  padding: 4,
};

const skipStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  color: "#78716c",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  padding: "8px 4px",
};

const nextStyle: CSSProperties = {
  background: "#33604d",
  border: 0,
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  padding: "8px 14px",
};

/** Renders the tooltip only. Next, skip, and close are handled by the tour hook. */
export function ProductTourTooltip(props: TooltipRenderProps) {
  const advance = useContext(TourAdvanceContext);
  const later = useContext(TourLaterContext);
  const { closeProps, index, isLastStep, primaryProps, skipProps, size, step, tooltipProps } =
    props;

  return (
    <div {...tooltipProps} style={tooltipStyle}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 8, justifyContent: "space-between" }}>
        {step.title ? (
          <h2 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>{step.title}</h2>
        ) : (
          <span />
        )}
        <button type="button" {...closeProps} style={closeStyle} aria-label="Close tour">
          ×
        </button>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 8 }}>{step.content}</div>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            style={skipStyle}
            onClick={(event) => {
              event.preventDefault();
              later();
            }}
          >
            Later
          </button>
          <button type="button" {...skipProps} style={skipStyle}>
            Skip
          </button>
        </div>
        <button
          type="button"
          {...primaryProps}
          style={nextStyle}
          onClick={(event) => {
            event.preventDefault();
            advance(index);
          }}
        >
          {isLastStep ? "Done" : "Next"}
        </button>
      </div>
      <p style={{ color: "#78716c", fontSize: 12, margin: "8px 0 0" }}>
        {index + 1} of {size}
      </p>
    </div>
  );
}
