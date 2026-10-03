import { requireSupabase } from "./client";
import {
  parseResourceOpenProbe,
  type ResourceOpenProbe,
} from "@/resources/model/openState";

/** State only. Does not return a title or file. */
export async function fetchResourceOpenState(args: {
  organizationId: number;
  kind: "item" | "folder";
  id: number;
}): Promise<ResourceOpenProbe> {
  const db = requireSupabase();
  const { data, error } = await db.rpc("resource_open_state", {
    p_organization_id: args.organizationId,
    p_kind: args.kind,
    p_id: args.id,
  });
  if (error) throw new Error(error.message);
  return parseResourceOpenProbe(data);
}
