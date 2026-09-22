import { useEffect } from "react";
import { PageLoading } from "@/ui/PageLoading";
import { FeedbackForm } from "./components/FeedbackForm";
import { useFeedback } from "./hooks/useFeedback";

export function FeedbackPage() {
  const form = useFeedback();

  useEffect(() => {
    document.title = "Send feedback · Course Wright";
  }, []);

  if (form.loading) {
    return <PageLoading label="Loading feedback…" />;
  }

  return (
    <div className="w-full min-w-0 max-w-lg px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Send feedback
      </h1>
      <p className="mt-1 text-[14px] leading-relaxed text-[var(--ink-soft)]">
        Tell us what would make Course Wright easier. Your name, email, and
        organization are filled in from your account.
      </p>
      <FeedbackForm
        name={form.name}
        email={form.email}
        orgName={form.orgName}
        orgSlug={form.orgSlug}
        roleLabel={form.roleLabel}
        message={form.message}
        formError={form.formError}
        submitting={form.submitting}
        onMessageChange={form.setMessage}
        onSubmit={form.onSubmit}
      />
    </div>
  );
}
