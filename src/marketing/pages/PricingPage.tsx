import { ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import { IconWell } from "../components/IconWell";
import { contactEmails, mailto } from "../model/contactEmails";

export function PricingPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Pricing</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Free (for now)
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        Course Wright might change its pricing in the future, but right now we’re
        working with a handful of small organizations to polish the product.
        There are no plans or dollar amounts to publish yet.
      </p>

      <section className="mt-10 flex items-start gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <IconWell>
          <SparklesIcon className="h-5 w-5" aria-hidden />
        </IconWell>
        <div>
          <h2 className="text-[15px] font-extrabold text-[var(--ink)]">
            Interested in partnering?
          </h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
            If you’d like to work with us while we polish Course Wright, reach out
            — we’d love to hear from you.
          </p>
        </div>
      </section>

      <p className="mt-8 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        Email{" "}
        <a
          href={mailto(contactEmails.hi)}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          {contactEmails.hi}
        </a>
        . Curious whether it’s a fit? Start with{" "}
        <Link to="/about" className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]">
          about
        </Link>
        , or{" "}
        <Link to="/signup" className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]">
          create an account
        </Link>
        .
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
