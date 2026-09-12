import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/ui/Button";
import { Input } from "@/ui/Input";
import { FamiliesList } from "./components/FamiliesList";
import { useFamilies } from "./hooks/useFamilies";

export function FamiliesPage() {
  const directory = useFamilies();

  useEffect(() => {
    document.title = `Families · ${directory.organization.name} · Course Wright`;
  }, [directory.organization.name]);

  return (
    <div className="px-5 py-8 md:px-8">
      <h1
        className="text-[24px] font-semibold text-[var(--ink)] md:text-[26px]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Families
      </h1>
      <p className="mt-1 max-w-2xl text-[14px] text-[var(--ink-soft)]">
        Parent directory for this organization. A family groups students and
        parents in the roster — it does not grant course access.
      </p>
      <p className="mt-2 text-[13px]">
        <Link
          to={`/my/${directory.organization.slug}/roster`}
          className="font-bold text-[var(--green)] hover:text-[var(--green-deep)]"
        >
          Roster
        </Link>
      </p>

      <section className="mt-6 max-w-xl rounded-[10px] border border-[var(--line-soft)] bg-[var(--surface)] p-5">
        <h2 className="text-[13px] font-bold text-[var(--ink-soft)]">
          Create a family
        </h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
          Name is optional. If you leave it blank, we’ll use the members’ names.
        </p>
        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={directory.onCreate}
        >
          <Input
            className="min-w-0 flex-1"
            value={directory.displayName}
            onChange={(event) => directory.setDisplayName(event.target.value)}
            placeholder="The Rivera household"
            disabled={directory.creating}
          />
          <Button type="submit" disabled={directory.creating}>
            <PlusIcon className="h-5 w-5" aria-hidden />
            {directory.creating ? "Creating…" : "Create family"}
          </Button>
        </form>
        {directory.createError ? (
          <p className="mt-2 text-[13px] text-[var(--amber-deep)]" role="alert">
            {directory.createError}
          </p>
        ) : null}
      </section>

      {directory.loading ? (
        <p className="mt-6 text-[14px] text-[var(--ink-soft)]">Loading families…</p>
      ) : null}

      {directory.error ? (
        <p className="mt-6 text-[13.5px] text-[var(--amber-deep)]" role="alert">
          {directory.error}
        </p>
      ) : null}

      {!directory.loading ? (
        <FamiliesList
          orgSlug={directory.organization.slug}
          families={directory.families}
        />
      ) : null}
    </div>
  );
}
