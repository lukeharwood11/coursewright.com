import { Link } from "react-router-dom";
import { Badge } from "@/ui/Badge";
import {
  searchResultTypeLabel,
  type SearchResult,
} from "@/search/model/results";

type Props = {
  result: SearchResult;
  onSelect: () => void;
};

export function SearchResultCard({ result, onSelect }: Props) {
  return (
    <Link
      to={result.href}
      onClick={onSelect}
      className="block rounded-[8px] border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2.5 text-left transition-colors hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--green)]"
    >
      <div className="flex items-start gap-2">
        <Badge variant="slate">{searchResultTypeLabel(result.type)}</Badge>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[var(--ink)]">
          {result.title}
        </span>
      </div>
    </Link>
  );
}
