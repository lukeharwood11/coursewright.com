# AGENTS — `scripts/seed-doxa/`

Idempotent **testing-tier** seed for **Doxa Christian Academy** (pilot / demo org).

## Run

```bash
# From repo root (requires SUPABASE_ACCESS_TOKEN, or URL + service role)
./scripts/seed-doxa-org.sh              # upsert into existing org
./scripts/seed-doxa-org.sh --reset      # wipe org children + reseed (keeps Luke + Lana auth users)
```

## Owns

- Org slug `doxa-christian-academy`
- Fake teachers (`doxa.seed+*@coursewright.com`), Lana Harwood, Luke as owner
- Classes, students (incl. Ava / Landon Harwood), courses
- **This week’s course lesson plans** (Sunday–Saturday window containing “today”; DOXA packet copy as per-day notes — not page materials)
- Shared **Weekly Bulletin** course (org-wide notes as a published lesson plan until org callouts ship)

## Local login notes

Demo email/password pairs (when set) live in **`credentials.local.md`** (gitignored). Do not commit that file.

## Don’t

- Point this at production / parent project ref
- Commit service-role keys or `credentials.local.md`
- Invent product behavior here — content mirrors the DOXA PDF packets for demo only
