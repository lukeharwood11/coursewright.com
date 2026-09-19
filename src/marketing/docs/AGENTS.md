# AGENTS — `src/marketing/docs/`

Public help documentation under `/docs`.

## Scope

- Docs shell with left nav (`DocsLayout`)
- Topic screens driven by `model/helpDocs.ts`
- Linked from marketing header / footer as **Help**

## Rules

- Static copy only — align roles and flows with [FEATURES.md](../../../docs/FEATURES.md).
- Match [pages/DOCS.md](../../../docs/pages/DOCS.md) and [URLS.md](../../../docs/URLS.md).
- Add or edit topics in `helpDocs.ts`; keep sidebar order in `helpDocNav`.
- Do not invent P1/P2 behavior (billing UI, templates, student accounts) as current product.

## Don’t

- Fetch org/course data here.
- Put signed-in `/my` chrome in this folder.
