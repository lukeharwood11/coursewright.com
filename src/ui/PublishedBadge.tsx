import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Badge } from "./Badge";

/** Compact published status next to a title — replaces the old “families can see this” banner. */
export function PublishedBadge() {
  return (
    <Badge variant="green">
      <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
      Published
    </Badge>
  );
}
