# HUMAN_NEEDED

Agents: use this file whenever you need a **human / admin** to do something in an account or console you **do not have access to** (AWS, Supabase, Google Cloud, DNS registrar, Stripe, PostHog, etc.).

## Instructions for agents (keep at top)

1. **When you hit a blocker** that requires human credentials, console clicks, billing, or org ownership:
   - Add or update a **placeholder** in code/config (clear `HUMAN_NEEDED` / `TODO(human)` comment or stub).
   - Add a matching item **below** in the open checklist.
2. **Each checklist item must include:**
   - **ID** — stable, e.g. `HN-001`
   - **Why** — what is blocked
   - **Where** — file/path or system (AWS / Supabase / Google / DNS)
   - **Steps** — detailed, ordered steps a human can follow
   - **Done when** — how to know it’s finished (what to put in env / what agent can resume)
   - **Placeholder** — code/config location that references this ID
3. **Do not** invent secrets, create cloud resources that need login, or pretend the step is done.
4. **When a human completes an item**, they (or an agent after confirmation) move it to **Completed** and remove/update the placeholder.
5. Index: root [AGENTS.md](../AGENTS.md) links here. Keep IDs unique.

---

## Open

### HN-003 — AWS account access for Terraform + deploy

| | |
|--|--|
| **Why** | S3 / CloudFront / ACM / DNS for SPA hosting |
| **Where** | AWS IAM / CLI |
| **Placeholder** | `infra/terraform/providers.tf` (`HN-003`) |

**Steps:**

1. Ensure an AWS account exists for Course Wright.
2. Create an IAM user or role for Terraform/CI with permissions for S3, CloudFront, ACM, Route53 (if DNS is in Route53), and IAM as needed for the module.
3. Provide credentials to the local/CI environment (`AWS_PROFILE`, or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) — **not** committed to git.
4. Confirm default region preference (suggestion: `us-east-1` for CloudFront/ACM ease) and tell the agent.

**Done when:** `aws sts get-caller-identity` works in the environment that will run Terraform.

---

### HN-004 — Terraform remote state backend

| | |
|--|--|
| **Why** | Shared, safe state for testing vs production tiers |
| **Where** | AWS (bootstrap bucket) |
| **Placeholder** | `infra/terraform/backend.tf` (`HN-004`) |

**Steps:**

1. Create an S3 bucket for Terraform state (e.g. `coursewright-terraform-state`) with versioning on encryption.
2. Optionally create a DynamoDB table for state locking (e.g. `coursewright-terraform-locks`).
3. Decide state key scheme, e.g.:
   - `spa/testing/terraform.tfstate`
   - `spa/production/terraform.tfstate`
4. Give the agent bucket name, region, and lock table name (if any) to fill `backend.tf`.

**Done when:** Agent can uncomment/configure `backend "s3"` and `terraform init` succeeds for a tier.

---

### HN-005 — DNS for `coursewright.com` / `justtesting.coursewright.com`

| | |
|--|--|
| **Why** | CloudFront + TLS need DNS validation and aliases |
| **Where** | DNS host for `coursewright.com` (Route53 or external registrar) |
| **Placeholder** | `infra/terraform/testing.tfvars`, `production.tfvars` (`HN-005`) |

**Steps:**

1. Confirm where DNS is hosted (Route53 vs other).
2. If Route53: note hosted zone ID for `coursewright.com` and tell the agent (so Terraform can create records) **or** plan to create records manually from Terraform outputs.
3. After ACM certificate is requested (via Terraform later): add the validation CNAMEs ACM provides.
4. After CloudFront distributions exist: point:
   - `justtesting.coursewright.com` → testing distribution
   - `coursewright.com` (and optionally `www`) → production distribution

**Done when:** Agent knows DNS host + whether Terraform should manage records or only output values for manual DNS.

---

### HN-007 — Supabase production project (optional until first prod deploy)

| | |
|--|--|
| **Why** | Separate production Auth/DB from the testing project |
| **Where** | [Supabase Dashboard](https://supabase.com/dashboard) |
| **Placeholder** | CI / production env secrets (not wired yet) |

**Steps:**

1. Create a production project (name suggestion: `coursewright-production`).
2. Copy **Project URL** + **anon** key into production deploy secrets (not git).
3. Enable Google provider with the same OAuth client (add production callback URL).
4. Add production Site URL + redirect URLs under Auth settings.

**Done when:** Production env has its own Supabase URL/anon key and Google provider enabled.

---

## Completed

### HN-001 — Create Supabase projects (testing + production)

**Completed:** 2026-09-05 — testing project linked as `hlecttkgrfhtzvwnxtyb` (`coursewright.com`); URL + anon key in committed `.env.development`; CLI `supabase link` done. Production project deferred → **HN-007**.

### HN-002 — Google Cloud OAuth for Sign in with Google

**Completed:** 2026-09-05 — human enabled Google provider / OAuth for the testing Supabase project. Client uses `signInWithGoogle` against live Auth.

### HN-006 — PostHog project(s) for product analytics

**Completed:** 2026-09-05 — testing keys in committed `.env.development`; SPA wires `src/infrastructure/posthog/client.ts`. Separate production PostHog project can wait until first prod deploy.

### HN-008 — Deploy `create-course-from-course` Edge Function

**Completed:** 2026-09-06 — deployed to testing project `hlecttkgrfhtzvwnxtyb`. Repeat when production exists (HN-007).

### HN-009 — Apply `materials.position` migration on the live database

**Completed:** 2026-09-06 — `supabase db push` applied `20260907000000_materials_position.sql` to testing project `hlecttkgrfhtzvwnxtyb`.
