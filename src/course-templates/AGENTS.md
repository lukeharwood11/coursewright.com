# AGENTS — `src/course-templates/`

Reusable blueprints with view / edit / owner access.

**Phase: P1** — not in P0 product UI. Tables may exist; do not ship template screens or create-from-template flows until FEATURES marks this in progress for P1.

## Scope (P1)

- Template CRUD, structure (units/materials via those domains’ components or nested routes)
- Template access controls (creator = owner; org admins see all)
- Instructor with **view** can create a course from template (invoke Function)

## Rules

- Creating a course from a template is a **Function** job (copy + lineage) — not a giant client-side loop.
- Sync / deprecate / delete behavior per FEATURES — don’t invent write-back.
- Promote from course is owned with `courses/` + Function; this domain shows template side.

## Don’t

- Put roster or course dates on templates.
- Auto-write instance edits back to the template.
- Build P0 UI here — P0 reuse is **create course from another course** in `courses/`.
