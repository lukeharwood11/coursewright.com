import {
  ArrowLeftIcon,
  BookOpenIcon,
  InformationCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import { IconWell } from "../components/IconWell";

export function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Pricing</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        We bill the organization, not parents
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        Course Wright charges the co-op or micro-school so they can serve families.
        Collecting tuition from parents through Course Wright is later — not how this
        product is sold today.
      </p>

      <section className="mt-10 flex items-start gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <IconWell tone="slate">
          <InformationCircleIcon className="h-5 w-5" aria-hidden />
        </IconWell>
        <div>
          <h2 className="text-[15px] font-extrabold text-[var(--ink)]">
            Dollar amounts aren’t set yet
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            We’re still deciding how to package this — per teacher or per course. We
            won’t put fake prices on this page. In-app billing comes later; you can
            still create an account and look around.
          </p>
        </div>
      </section>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        <li className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
          <IconWell>
            <UserIcon className="h-5 w-5" aria-hidden />
          </IconWell>
          <p className="mt-3 text-[12px] font-bold text-[var(--ink-faint)]">One option</p>
          <h2 className="mt-1 text-[15px] font-extrabold text-[var(--ink)]">Per teacher</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Charge based on how many instructors the organization runs.
          </p>
        </li>
        <li className="rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4">
          <IconWell>
            <BookOpenIcon className="h-5 w-5" aria-hidden />
          </IconWell>
          <p className="mt-3 text-[12px] font-bold text-[var(--ink-faint)]">One option</p>
          <h2 className="mt-1 text-[15px] font-extrabold text-[var(--ink)]">Per course</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
            Charge based on how many courses the organization offers.
          </p>
        </li>
      </ul>

      <p className="mt-8 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        Questions about fit for your co-op? Start with{" "}
        <Link to="/about" className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]">
          about
        </Link>
        , or create an account and we’ll have billing ready when the product is.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/signup">Sign up</ButtonLink>
        <ButtonLink to="/" variant="secondary">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
