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

### HN-018 — VAPID keys and Activity push webhook secret

| | |
|--|--|
| **Why** | Installed PWAs subscribe with a VAPID public key and `send-activity-push` signs each Web Push. The database trigger calls that function with a shared secret. Without the secrets, Activity still saves and the prompt stays hidden. |
| **Where** | Supabase Edge Function secrets + Vault, on testing (`yplmaauelutcosqqvnya`) and production. **Not** git, `.env.testing`, or any `VITE_*` variable. |
| **Placeholder** | `supabase/functions/_shared/vapid.ts` and `private.enqueue_activity_push` in `supabase/migrations/20260930000004_activity_push.sql` (`HN-018`) |

**Steps (repeat per tier):**

1. Generate a key pair (the function accepts this base64url pair):
   `npx --yes web-push generate-vapid-keys`
   Copy the public key and the private key with no labels or quotes.
2. Generate a webhook secret: `openssl rand -base64 32`
3. Set function secrets:
   `supabase secrets set VAPID_PUBLIC_KEY='<public>' VAPID_PRIVATE_KEY='<private>' ACTIVITY_PUSH_WEBHOOK_SECRET='<webhook>' --project-ref <ref>`
   Testing ref: `yplmaauelutcosqqvnya`. Production ref: the production project (today `hlecttkgrfhtzvwnxtyb`, or HN-007’s project when that exists).
4. Store the same webhook secret and the function URL in Vault (SQL editor or `supabase db query --linked`):
   ```sql
   select vault.create_secret('<webhook>', 'activity_push_webhook_secret', 'send-activity-push');
   select vault.create_secret(
     'https://<ref>.supabase.co/functions/v1/send-activity-push',
     'activity_push_function_url',
     'send-activity-push URL'
   );
   ```
   The webhook value must match `ACTIVITY_PUSH_WEBHOOK_SECRET` exactly.
5. Deploy so the migration and functions are on that project: `./scripts/deploy-supabase.sh testing` (and production when that tier should send).
6. On the matching site, install Course Wright (home screen or installed window), open it, choose **Turn on notifications**, then cause an Activity row (a discussion post or **Send notification** on an announcement). The device should show the same headline as Activity.

**Done when:** an installed app that turned notifications on receives a device notification for a new unread Activity row, and the private key is only in Supabase secrets.

### HN-015 — Set Resend API key for organization invite emails

| | |
|--|--|
| **Why** | Staff and parent invites call Edge Function `send-organization-invite`, which posts Resend event `organization-invite`. Announcement **Send notification** calls `send-announcement-notification` (`announcement-notification`). Without `RESEND_API_KEY` on the Supabase project the Function runs on, invite/announcement rows are still created, but nobody gets an email. Product feedback is DB-only (no Resend). |
| **Where** | Resend dashboard (API key) + **Supabase Edge Function secrets** (testing branch and production). **Not** `.env.testing` and **not** a `VITE_*` variable — those are browser-exposed. |
| **Placeholder** | `supabase/functions/send-organization-invite/index.ts` (`HN-015`) |

**Where to put the key**

| Environment | Put `RESEND_API_KEY` here |
|-------------|---------------------------|
| **Testing (beta)** | Supabase project **`yplmaauelutcosqqvnya`** (persistent testing branch) → **Project Settings → Edge Functions → Secrets**, name `RESEND_API_KEY`. CLI: `supabase secrets set RESEND_API_KEY=re_… --project-ref yplmaauelutcosqqvnya` |
| **Production** | Same secret name on the production Supabase project (today: parent/main `hlecttkgrfhtzvwnxtyb`, or HN-007’s dedicated prod project when that exists). CLI: `supabase secrets set RESEND_API_KEY=re_… --project-ref <prod-ref>` |
| **Local `supabase functions serve`** | `supabase secrets set --local RESEND_API_KEY=re_…` (or `supabase/functions/.env`, gitignored) |
| **Do not** | Git, `.env.testing`, GitHub Actions `VITE_*`, or the SPA |

Optional companion secret **`SITE_URL`** (used when the browser `Origin` header is missing):

- Testing: `https://beta.coursewright.com`
- Production: `https://coursewright.com`
- Local: `http://localhost:5173`

**Steps:**

1. In [Resend](https://resend.com), create an API key that can send the **`organization-invite`** event you already configured.
2. Set `RESEND_API_KEY` (and optionally `SITE_URL`) as Edge Function secrets on the **testing** project ref above.
3. Repeat for production when that project should send mail. Use a separate Resend key if you want testing and production isolated.
4. Deploy the Function: `./scripts/deploy-supabase.sh testing` (or Terraform Apply for `testing` with `deploy_supabase` on). Repeat for production when applying that tier.
5. From org settings on the matching site, invite your own email and confirm the Resend `organization-invite` event arrives.

**Done when:** inviting a person to an organization (staff or parent) delivers the Resend email with a working `/invite/<token>` link, without putting the API key in the frontend env.

### HN-003 — AWS account access for Terraform + deploy

| | |
|--|--|
| **Why** | `spa_site` is a real S3 + CloudFront module; apply creates billable AWS resources. GHA plan/apply call shared scripts — confirm OIDC/IAM before live apply. |
| **Where** | AWS IAM / CLI; GitHub Actions OIDC |
| **Placeholder** | `infra/terraform/providers.tf` (`HN-003`); `.github/workflows/terraform-plan.yml` / `terraform-apply.yml` |

**Steps:**

1. Ensure an AWS account exists for Course Wright.
2. CI assumes existing OIDC role `arn:aws:iam::891612573605:role/github-oidc`. Confirm that role can read/write S3 + CloudFront + ACM (data lookup) + Route53 + the shared Terraform state backend (`lukeharwood-dev-tfstate` in `us-east-2`, including Get/Put/Delete on state `.tflock` objects).
3. **Trust policy:** a 2026-09-16 dispatch of Terraform Plan (testing) failed with `Not authorized to perform sts:AssumeRoleWithWebIdentity`. Add this repo (`lukeharwood11/coursewright.com`) to the role’s OIDC trust / federated subject (`repo:lukeharwood11/coursewright.com:*`).
4. For local Terraform, provide credentials (`AWS_PROFILE`, or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) — **not** committed to git. CI does not use long-lived access keys. Local `aws sts get-caller-identity` as IAM user `macbook` already works.
5. Confirm region `us-east-1` for the SPA stack (required for CloudFront ACM).
6. ACM (HN-005) is already **ISSUED** — OIDC trust for GitHub Actions is the remaining AWS gate before apply.

**Done when:** `aws sts get-caller-identity` works for the OIDC role (and any local profile), and a human has explicitly approved apply for a tier.

---

### HN-010 — GitHub Environment gates for Terraform plan/apply

| | |
|--|--|
| **Why** | Production plan/apply jobs set `environment: production`. Without a GitHub Environment with required reviewers, prod apply is not actually gated. Production Vite `VITE_*` values also live on that Environment. |
| **Where** | GitHub repo **Settings → Environments** (`lukeharwood11/coursewright.com`) |
| **Placeholder** | `.github/workflows/terraform-plan.yml` / `terraform-apply.yml` (`environment: ${{ inputs.tier }}`) |

**Steps:**

1. Environment **`testing`** exists (auto-created on first dispatch; no required reviewers). Leave it unprotected.
2. Create Environment **`production`** and add **required reviewers** (Luke / Dave) so production plan and apply wait for approval.
3. On **`production`**, set GitHub Environment **variables** (publishable only): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` (from HN-007 when a dedicated production Supabase project exists; until then `build-spa.sh` uses Terraform outputs for the existing main project). Testing deploys always rebuild from Terraform **branch** outputs. Local/dev keys live in committed `.env.testing`.
4. Confirm repo secret **`SUPABASE_ACCESS_TOKEN`** is set (done). Still confirm HN-003 before live apply.

**Done when:** Dispatching `terraform-plan.yml` / `terraform-apply.yml` with `tier=production` pauses for Environment approval; testing does not.

---

### HN-011 — Supabase Branching for testing

| | |
|--|--|
| **Why** | Testing Terraform creates a **persistent** DB branch (`git_branch = "testing"`) off project `hlecttkgrfhtzvwnxtyb`. Branching must be enabled on the org/plan. Production Terraform manages **settings + apikeys** on that existing project by ref (no project import). Committed `.env.testing` holds the branch URL + publishable key for `npm run dev`. Deploys still build from Terraform outputs (`scripts/build-spa.sh`). |
| **Where** | Supabase Dashboard (Branching); local/GHA Terraform |
| **Placeholder** | `infra/terraform/supabase.tf`; `.env.testing` |

**Steps:**

1. Confirm **Branching** is available for project `hlecttkgrfhtzvwnxtyb` (Pro/Team feature).
2. Ensure `SUPABASE_ACCESS_TOKEN` works locally (`supabase projects list` or `./scripts/tf-plan.sh testing`).
3. Keep committed `.env.testing` in sync with Terraform `supabase_url` + `supabase_anon_key` if the testing branch is recreated.
4. Update Google OAuth redirect URLs for `https://beta.coursewright.com` if not already covered.

**Done when:** Testing plan/apply creates/uses the persistent branch; testing SPA deploys (`build-spa.sh`) use the branch URL/keys.

---

### HN-007 — Supabase production project (optional until first prod deploy)

| | |
|--|--|
| **Why** | Separate production Auth/DB from the current project (until then production Terraform manages **main** on `hlecttkgrfhtzvwnxtyb`) |
| **Where** | [Supabase Dashboard](https://supabase.com/dashboard) |
| **Placeholder** | GitHub Environment `production` vars used by `build-spa.sh` on apply (HN-010) |

**Steps:**

1. Create a production project (name suggestion: `coursewright-production`).
2. Copy **Project URL** + **anon** key into the GitHub Environment `production` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) used by `build-spa.sh` / apply (not git). See HN-010.
3. Enable Google provider with the same OAuth client (add production callback URL).
4. Add production Site URL + redirect URLs under Auth settings.
5. Update `supabase_project_ref` in `infra/tfvars/production.tfvars` (and the parent ref in `testing.tfvars` if the testing branch should move) when cutting over.

**Done when:** Production env has its own Supabase URL/anon key and Google provider enabled.

---

## Completed

### HN-013 / HN-014 / HN-016 / HN-017 — Apply incremental migrations on testing

**Completed:** 2026-09-19 — experiment-mode squash replaced those ALTERs with `supabase/migrations/20260921000000_schema.sql` + `20260921000001_rls_and_storage.sql`. Testing (`yplmaauelutcosqqvnya`) was reset and reseeded (`seed-doxa`); production/main (`hlecttkgrfhtzvwnxtyb`) was reset empty. `student_email`, lesson plans, `anon` `get_invite`, and announcements are in the squashed schema on both.

### HN-012 — `SUPABASE_ACCESS_TOKEN` for Terraform + CLI

**Completed:** 2026-09-16 — token available in Luke’s local environment and as GitHub Actions secret `SUPABASE_ACCESS_TOKEN` (used by plan/apply workflows and `scripts/deploy-supabase.sh`).

### HN-005 — DNS + ACM for `coursewright.com` / `beta.coursewright.com`

**Completed:** 2026-09-16 — removed orphaned registrar DS (`REMOVE_DNSSEC`) that caused public SERVFAIL; ACM issued in `us-east-1` for `coursewright.com` + `*.coursewright.com` (`arn:aws:acm:us-east-1:891612573605:certificate/6b9b2b25-e8e9-459b-9d5b-fb0ffa53c423`). Prior cert `b3a79421-…` left as `VALIDATION_TIMED_OUT`. Route53 zone `Z0595556SLX8LOI3EGIB` ready for Terraform aliases. Testing host is **`beta.coursewright.com`** (wildcard covers it).

### HN-004 — Terraform remote state backend

**Completed:** 2026-09-11 — reuse existing nosh/amia backend (`lukeharwood-dev-tfstate`, `us-east-2`, S3 `use_lockfile`). CourseWright keys: `testing/coursewright.com/terraform.tfstate`, `prod/coursewright.com/terraform.tfstate`. Init with `backend-testing.hcl` / `backend-production.hcl`. No new bucket.

### HN-001 — Create Supabase projects (testing + production)

**Completed:** 2026-09-05 — project linked as `hlecttkgrfhtzvwnxtyb` (`coursewright.com`); CLI `supabase link` done. Testing now uses a **persistent DB branch** and committed `.env.testing` (HN-011). Dedicated production project deferred → **HN-007**.

### HN-002 — Google Cloud OAuth for Sign in with Google

**Completed:** 2026-09-05 — human enabled Google provider / OAuth for the testing Supabase project. Client uses `signInWithGoogle` against live Auth.

### HN-006 — PostHog project(s) for product analytics

**Completed:** 2026-09-05 — testing keys in committed `.env.testing`; SPA wires `src/infrastructure/posthog/client.ts`. Separate production PostHog project can wait until first prod deploy.

### HN-008 — Deploy `create-course-from-course` Edge Function

**Completed:** 2026-09-06 — deployed to testing project `hlecttkgrfhtzvwnxtyb`. Repeat for the testing branch / production (HN-011 / HN-007).

### HN-009 — Apply `materials.position` migration on the live database

**Completed:** 2026-09-06 — `supabase db push` applied `20260907000000_materials_position.sql` to testing project `hlecttkgrfhtzvwnxtyb`.
