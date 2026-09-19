import { ArrowLeftIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { ButtonLink } from "@/ui/Button";
import { IconWell } from "../components/IconWell";
import { contactDirectory, mailto } from "../model/contactEmails";

export function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-[13px] font-bold text-[var(--ink-faint)]">Contact</p>
      <h1
        className="mt-1 text-[28px] font-semibold leading-snug text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Get in touch
      </h1>
      <p className="mt-4 text-[15.5px] leading-relaxed text-[var(--ink-soft)]">
        Email is the best way to reach us. Pick the address that matches what you
        need — we read every message.
      </p>

      <ul className="mt-10 flex flex-col gap-3">
        {contactDirectory.map((item) => (
          <li
            key={item.address}
            className="flex items-start gap-3 rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-4"
          >
            <IconWell>
              <EnvelopeIcon className="h-5 w-5" aria-hidden />
            </IconWell>
            <div>
              <h2 className="text-[15px] font-extrabold text-[var(--ink)]">{item.label}</h2>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                {item.purpose}
              </p>
              <a
                href={mailto(item.address)}
                className="mt-2 inline-block text-[14px] font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
              >
                {item.address}
              </a>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink to="/" variant="secondary">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden />
          Back to home
        </ButtonLink>
      </div>
    </main>
  );
}
