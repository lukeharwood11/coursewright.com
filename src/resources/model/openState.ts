/** Same-org resource the viewer cannot open. Not a paragraph. */
export const RESOURCE_OPEN_PERMISSION_MESSAGE =
  "You do not have permission to view this resource.";

export type ResourceOpenProbe = "ok" | "forbidden" | "missing";

export function parseResourceOpenProbe(value: unknown): ResourceOpenProbe {
  if (value === "ok" || value === "forbidden" || value === "missing") return value;
  return "missing";
}

/**
 * The row select already succeeded, or RLS returned nothing and the probe
 * said why. `ok` without a row is still missing — the probe never carries
 * the file.
 */
export function resourceOpenView(args: {
  rowLoaded: boolean;
  probe: ResourceOpenProbe | null;
}): "content" | "loading" | "forbidden" | "missing" {
  if (args.rowLoaded) return "content";
  if (args.probe == null) return "loading";
  if (args.probe === "forbidden") return "forbidden";
  return "missing";
}
