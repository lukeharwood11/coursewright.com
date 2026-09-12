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
| **Why** | `spa_site` is a real S3 + CloudFront module; apply creates billable AWS resources. GHA plan/apply workflows exist but **must not be used for live apply** until this item and HN-005 (ISSUED ACM) are done. |
| **Where** | AWS IAM / CLI; GitHub Actions OIDC |
| **Placeholder** | `infra/terraform/providers.tf` (`HN-003`); `.github/workflows/terraform-plan.yml` / `terraform-apply.yml` |

**Steps:**

1. Ensure an AWS account exists for Course Wright.
2. CI assumes existing OIDC role `arn:aws:iam::891612573605:role/github-oidc` (trust for this repo is assumed). Confirm that role can read/write S3 + CloudFront + ACM (data lookup) + the shared Terraform state backend (`lukeharwood-dev-tfstate` / `lukeharwood-dev-tf-lock` in `us-east-2`), and Route53 only if `manage_dns` will be enabled.
3. For local Terraform, provide credentials (`AWS_PROFILE`, or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) — **not** committed to git. CI does not use long-lived access keys.
4. Confirm region `us-east-1` for the SPA stack (required for CloudFront ACM).
5. **Do not `terraform apply` and do not dispatch `terraform-apply.yml`** until ACM certs in HN-005 are **ISSUED** in `us-east-1`. `terraform plan` will fail the ACM data lookup until then. Plan/apply YAML is code-only until this + HN-005 land.

**Done when:** `aws sts get-caller-identity` works for the OIDC role (and any local profile), and a human has explicitly approved apply for a tier.

---

### HN-005 — DNS + ACM for `coursewright.com` / `justtesting.coursewright.com`

| | |
|--|--|
| **Why** | CloudFront custom aliases need an **ISSUED** ACM cert in `us-east-1`. Route53 aliases are optional until DNS host is decided (`manage_dns` defaults to `false`). |
| **Where** | ACM (`us-east-1`) + DNS host for `coursewright.com` (Route53 or external registrar) |
| **Placeholder** | `infra/terraform/modules/spa_site/cdn.tf` (ACM data source); `testing.tfvars` / `production.tfvars` (`manage_dns`) |

**Steps:**

1. Confirm where DNS is hosted (Route53 vs other).
2. In **ACM `us-east-1`**, request and **issue** certificates covering each tier hostname:
   - testing: `justtesting.coursewright.com`
   - production: `coursewright.com`
   - Alternatively one wildcard `*.coursewright.com` (and an apex cert for production). If the issued name differs from `domain_name`, set `acm_certificate_domain` in the matching tfvars so the data source can find it.
3. Complete ACM DNS validation (add the CNAMEs ACM provides at the DNS host). Wait until status is **Issued**. Terraform does **not** create the cert — it looks up an existing ISSUED cert (`data.aws_acm_certificate`).
4. Leave `manage_dns = false` (default) until Route53 is confirmed. `terraform validate` does not need DNS; apply of S3/CloudFront still needs the issued cert (step 2–3) plus HN-003.
5. If Route53 hosts `coursewright.com`: set `manage_dns = true` and keep `route53_zone_name = "coursewright.com"` (parent zone for both apex and the `justtesting` subdomain). Terraform will create A/AAAA aliases to CloudFront.
6. If DNS stays outside Route53: keep `manage_dns = false`. After CloudFront exists, point records manually using outputs `cloudfront_domain` / `cloudfront_distribution_id`:
   - `justtesting.coursewright.com` → testing distribution
   - `coursewright.com` (and optionally `www`) → production distribution

**Done when:** ISSUED ACM certs exist in `us-east-1` for each tier (or wildcard + `acm_certificate_domain` override), and either `manage_dns` is enabled against the Route53 zone or a human will create aliases from Terraform outputs.

---

### HN-010 — GitHub Environment gates for Terraform plan/apply

| | |
|--|--|
| **Why** | Production plan/apply jobs set `environment: production`. Without a GitHub Environment with required reviewers, prod apply is not actually gated. Production Vite `VITE_*` values also live on that Environment. |
| **Where** | GitHub repo **Settings → Environments** (`lukeharwood11/coursewright.com`) |
| **Placeholder** | `.github/workflows/terraform-plan.yml` / `terraform-apply.yml` (`environment: ${{ inputs.tier }}`) |

**Steps:**

1. Create Environment **`testing`** (optional protection; no required reviewers). First dispatch may auto-create it.
2. Create Environment **`production`** and add **required reviewers** (Luke / Dave) so production plan and apply wait for approval.
3. On **`production`**, set GitHub Environment **variables** (publishable only): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` (from HN-007 when the production Supabase project exists). Testing builds copy committed `.env.development`; do not put service-role keys in GitHub.
4. Still **do not dispatch apply** until HN-003 and HN-005 (ISSUED ACM) are done.

**Done when:** Dispatching `terraform-plan.yml` / `terraform-apply.yml` with `tier=production` pauses for Environment approval; testing does not.

---

### HN-007 — Supabase production project (optional until first prod deploy)

| | |
|--|--|
| **Why** | Separate production Auth/DB from the testing project |
| **Where** | [Supabase Dashboard](https://supabase.com/dashboard) |
| **Placeholder** | GitHub Environment `production` vars on `terraform-plan.yml` (HN-010) |

**Steps:**

1. Create a production project (name suggestion: `coursewright-production`).
2. Copy **Project URL** + **anon** key into the GitHub Environment `production` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) used by `terraform-plan.yml` (not git). See HN-010.
3. Enable Google provider with the same OAuth client (add production callback URL).
4. Add production Site URL + redirect URLs under Auth settings.

**Done when:** Production env has its own Supabase URL/anon key and Google provider enabled.

---

## Completed

### HN-004 — Terraform remote state backend

**Completed:** 2026-09-11 — reuse existing nosh/amia backend (`lukeharwood-dev-tfstate` / `lukeharwood-dev-tf-lock`, `us-east-2`). CourseWright keys only: `spa/testing/terraform.tfstate`, `spa/production/terraform.tfstate`. Init with `backend-testing.hcl` / `backend-production.hcl`. No new bucket or lock table.

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
