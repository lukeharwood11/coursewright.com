import { Link } from "react-router-dom";
import { Wordmark } from "@/ui/Wordmark";
import { footerColumns } from "../model/footerNav";

const footerLink = "text-[13px] font-bold text-[var(--ink-soft)] hover:text-[var(--green)]";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--line-soft)] bg-[var(--surface)]">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Wordmark to="/" size="login" />
          <p className="mt-1 text-[12.5px] text-[var(--ink-faint)]">
            The course hub for homeschool co-ops and micro-schools.
          </p>
        </div>
        {footerColumns.map((column) => (
          <nav key={column.heading} className="flex flex-col gap-2" aria-label={column.heading}>
            <p className="text-[12.5px] font-bold text-[var(--ink-faint)]">{column.heading}</p>
            {column.links.map((item) => (
              <Link key={item.to} to={item.to} className={footerLink}>
                {item.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="border-t border-[var(--line-soft)]">
        <p className="mx-auto max-w-5xl px-5 py-4 text-[12.5px] text-[var(--ink-faint)]">
          © {year} Course Wright. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
