# AGENTS — `src/sharing/`

Extreme shareability: resource links and share-with-parents actions.

## Scope

- Create/copy **resource links** (deep link to a material; auth required in P0)
- Instructor “Share with parents” affordances
- Not the parent dashboard itself (`parent/`) and not print layouts (`print/`)
- Distinct from org **Resources** (`resources/`) — a **Resource link** is a deep link to a course material

## Rules

- Share controls stay **visible** — not buried in overflow menus.
- P0: account required after link; magic links later.
- Same access rules as enrollment + active course.

## Don’t

- Invent public unauthenticated material pages in P0.
- Name UI “Export” — prefer Share / Print vocabulary.
