import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { ButtonLink } from "@/ui/Button";
import {
  privacyIntro,
  privacyLastUpdated,
  privacySections,
} from "../model/privacyPolicy";

export function PrivacyPage() {
  const intro = privacyIntro();
  const sections = privacySections();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Legal</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Privacy policy
      </h1>
      <p className="mt-2 text-[13.5px] text-[var(--ink-faint)]">
        Last updated {privacyLastUpdated}
      </p>
      <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        {intro}
      </p>

      <nav aria-label="On this page" className="mt-8">
        <p className="text-[12.5px] font-bold text-[var(--ink-faint)]">On this page</p>
        <ul className="mt-2 flex flex-col gap-1">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-[13.5px] font-bold text-[var(--ink-soft)] hover:text-[var(--green)]"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-8">
            <h2
              className="text-[22px] font-semibold text-[var(--ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 text-[14.5px] leading-relaxed text-[var(--ink-soft)]"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <p className="mt-12 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        See also our{" "}
        <Link
          to="/terms"
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          terms of use
        </Link>{" "}
        and{" "}
        <Link
          to="/cookies"
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          cookie policy
        </Link>
        .
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/" variant="secondary">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
