# Course Wright — File storage & media playback

> **Status:** Design workshop. Product requirements in [FEATURES.md](./FEATURES.md); entities in [database/SCHEMA.md](./database/SCHEMA.md); stack defaults in [STACK.md](./STACK.md).
>
> **Goal of this doc:** Decide how we store files and how parents/instructors **play audio and video** — without locking into a streaming platform before we need one.

---

## Product constraints (decided)

| Constraint | Source |
|------------|--------|
| **`File` is its own entity** — courses/templates/materials **reference** files; they do not own a private copy of the blob | **Decided** (this doc) |
| Template → course (**P1**) and **course → course** (**P0**) copies **copy the reference** (`file_id`), not the Storage object | **Decided** (this doc) |
| Files are used from the course builder — **not** a separate org-wide drive UI in P0 | FEATURES |
| Blobs in **Supabase Storage**; metadata in Postgres (`File` / `FileVersion`) | STACK / SCHEMA |
| **Replace = new blob**; prior blobs kept for **revert** | FEATURES |
| Soft deletes only for content | FEATURES |
| **Uploaded** audio/video are P0 with **in-app players** | FEATURES |
| YouTube (etc.) **URL embeds** are separate — Page blocks, not `File` rows | FEATURES / SCHEMA |
| Access follows org RBAC + parent enrollment / active course | FEATURES |
| Parents play on **phones** without a download dance | FEATURES usability |
| Instructors may **record a microphone clip** (under 5 minutes) as a file material | FEATURES |
| Advanced ABR / caption editor / transcoding tiers **not** required for P0 unless Storage forces it | FEATURES |

**P0 success:** instructor uploads a PDF, worksheet, audio clip, or video file; parent opens the material and **plays or opens it in place** — authenticated, on mobile, without Microsoft folders.

---

## Entity model (decided): File is referenced, not cloned

```text
Organization
 └── File  (org-scoped; bytes in Storage; FileVersion history)
       ▲
       │ file_id reference(s)
       │
Material / Page block / DiscussionMessageAttachment (P1) / …
```

| Rule | Detail |
|------|--------|
| **File** | First-class org row + Storage blob(s). Not nested under a single material as the sole owner. |
| **Placement** | Materials (and page blocks) hold **`file_id`** (or equivalent). **P1 discussions** attach `file_id` on a message. Same file can be referenced from more than one place. |
| **Course → course (P0)** / **Template → course (P1)** | New Material (and structure) rows are created; **`file_id` stays the same**. No new Storage object. |
| **Promote / sync** | Same idea — copy or sync the **reference**, not the bytes (unless we later add an explicit fork). |
| **P0 UI** | Still “files on materials,” not a full org file browser — entity shape ≠ product chrome. |

**Why this shape:** one upload, many offerings; Storage cost and “where is this PDF?” stay sane; matches “files are separate.”

### Consequence: replace is shared

Because course and template point at the **same** `File`:

- Replacing or reverting that file’s current version updates **every** material that references it.
- Soft-deleting a `File` affects every reference (UI must block or warn if still in use — TBD).

**Still open — fork on edit?**

| Option | Behavior |
|--------|----------|
| **Shared forever (until explicit fork)** | Replace always updates the one `File`. Simplest. Risk: editing “this term’s handout” changes the template and other courses. |
| **Fork on replace when shared** | First replace from a course creates a **new** `File`, updates only that material’s `file_id`; template keeps the old one. Closer to material override semantics. |
| **Always ask** | “Update everywhere” vs “only this course.” |

→ Needs an explicit product call (see [open decisions](#open-decisions-discussion-checklist)).

---

## Jobs to design for

1. **Upload** — create a `File`, then reference it from a material (or file-kind material).
2. **Version** — replace file → new Storage object + `FileVersion`; revert points metadata at an older blob (**shared** across references).
3. **Authorize** — user can read a file if they can view **at least one** referencing material they’re allowed to see (exact RLS rule TBD).
4. **Download / open** — PDFs, images, Office docs, etc.
5. **Play audio** — in-app player (play/pause, scrub, maybe speed).
6. **Play video** — in-app player (play/pause, scrub, fullscreen as the browser allows).
7. **Copy with courses / templates** — **reference only**; blobs unchanged. (**P0:** course-from-course; **P1:** template→course.)
8. **Print** — media prints as title + type + URL/QR; playback stays on-screen.

---

## Recommended P0 shape (hypothesis)

Start simple; escalate when metrics or support tickets force it.

```text
Browser (SPA)
  │
  ├─ upload ──► Supabase Storage  (private bucket, org-prefixed paths)
  │                ▲
  │                │ storage_ref
  ├─ metadata ──► Postgres File + FileVersion  (RLS)
  │
  └─ play/open ──► short-lived signed URL (or Storage download with session)
                      │
                      └─ <audio> / <video> / browser open for docs
```

| Layer | P0 choice (hypothesis) | Why |
|-------|------------------------|-----|
| **Object store** | Supabase Storage (backed by S3 under the hood) | Already decided; one vendor with Auth/RLS |
| **Bucket** | Private (not public) | Parent access is gated; no world-readable lesson media |
| **Path layout** | `{organization_id}/{file_id}/{version_id}/{safe_filename}` | Stable ids; versioning; easy lifecycle |
| **Metadata** | `File` + `FileVersion` in Postgres | Search, RLS, revert, mime, size |
| **Read path** | Signed URL (TTL minutes) after Postgres authz check | Works for `<video src>` / `<audio src>` range requests; avoids public buckets |
| **Playback** | Native HTML5 `<audio>` / `<video>` | No player SDK tax; phone OS controls; good enough for co-op lesson clips |
| **Transcoding** | **None in P0** | Accept browser-playable uploads; guide formats |
| **CDN for media** | Rely on Supabase/Storage egress first | SPA already on CloudFront; media can stay on Storage until cost/latency hurts |

**Escalate later (not P0 unless we prove need):**

- Server-side transcode → HLS/DASH (Mux, Cloudflare Stream, AWS MediaConvert, …)
- Separate media CDN / custom domain for Storage
- Adaptive bitrate, caption pipelines, thumbnails/posters at scale

---

## Upload flow (draft)

```text
1. Client creates/reserves File row (or draft) via PostgREST — RLS: instructor on course/template
2. Client uploads bytes to Storage path derived from org + file + version
3. On success, write FileVersion + update File.current_* (mime, size, storage_ref)
4. On failure, leave no “current” pointer at a missing blob (or mark upload failed)
```

**Open:** single request vs resumable upload for large video (Tus / multipart). Co-op videos can be large; phone uploads are flaky — **resumable upload is worth deciding early** even if P0 caps size.

### Size & type policy (proposal to debate)

| Class | Examples | P0 proposal |
|-------|----------|-------------|
| **Documents** | PDF, images, common Office | Allow; generous |
| **Audio** | `audio/mpeg`, `audio/mp4` (m4a), `audio/wav`, `audio/webm` | Allow; prefer mp3/m4a in UI copy |
| **Video** | `video/mp4` (H.264 + AAC), `video/webm` | Allow; **strongly prefer MP4 H.264** for Safari/iOS |
| **Other** | zip, etc. | Allow download-only |

| Limit | Proposal | Notes |
|-------|----------|-------|
| Soft warn | e.g. > 100 MB video | “This may take a while on phone data” |
| Hard cap P0 | e.g. 500 MB / file <!-- TBD --> | Avoid Storage bill shock + failed mobile uploads |
| Duration | optional metadata later | Not required to play |

Reject or warn on containers that **won't play on iPhone Safari** (e.g. some AVI/MKV) — download still ok.

---

## Access control

Two gates must agree:

1. **Postgres RLS** — can this user see the `File` via a parent `Material` **or** (P1) a discussion message attachment?
2. **Storage** — can they read the object?

| Approach | Pros | Cons |
|----------|------|------|
| **A. Storage RLS mirroring Postgres** | Direct `download` / `createSignedUrl` from client | Policies get complex (parent enrollment, active course, template ACLs) |
| **B. Function mints signed URL** after service-role authz | One place for tricky parent rules; short TTL | Extra hop; must not leak long-lived URLs |
| **C. Public bucket + unguessable paths** | Simple playback | **Reject** — URL leak = content leak; bad for schools/families |

**Hypothesis:** **B for media playback** (and maybe all downloads), **A optional for instructor upload** if Storage policies can stay simple (`organization_id` + membership). Revisit once parent access queries are real.

Signed URL TTL: **short** (e.g. 60–300s) for start-of-play; player may need refresh on long videos — design for re-sign or slightly longer TTL for video.

---

## Playback design

### Audio

- UI: shared custom player on the material / in-page file (play/pause, scrub, time, **1× / 1.5×**).
- Source: signed URL → hidden HTML5 `<audio>` driven by custom controls (not bare browser chrome).
- Offline / download: secondary **Download** action outside the player; **play in place is the P0 bar**.
- Same component for **file** materials and Lexical in-page file nodes so parents can listen while reading a page.

### Video

- UI: inline player; fullscreen via browser API; poster image **TBD** (upload optional or first-frame later).
- Source: signed URL → `<video controls playsInline>` (critical for iOS).
- Scrubbing needs **HTTP range requests** — Supabase Storage / S3 generally support this; verify in testing before locking UX copy (“instant scrub”).

### “Streaming” — what we mean

| Meaning | P0? |
|---------|-----|
| **Progressive download / byte-range** over HTTPS (browser plays while fetching) | **Yes — this is P0 “streaming”** |
| **Adaptive streaming (HLS/DASH)** with multiple renditions | **No** unless we add a media platform |
| **Realtime** (WebRTC live class) | **Out of scope** |

So: market it as **in-app play**; implement as **authenticated progressive media**, not Netflix-style ABR.

---

## Versioning & references (decided)

| Operation | Strategy |
|-----------|----------|
| **Replace** | Always new object key (never overwrite in place); new `FileVersion`; `File` current pointer updates |
| **Revert** | Point `File` current at a prior version’s blob; do not delete old objects in P0 |
| **Course → course (P0) / Template → course (P1)** | **Copy `file_id` reference only** — no new Storage object, no duplicate `File` row |
| **Promote / sync** | Carry or keep the same `file_id` unless a fork was created |
| **Soft-delete File** | Soft-delete the entity; retain blobs for undelete. **Block or warn** if references still exist (TBD) |
| **Detach reference** | Material drops `file_id` / removes block — File may remain for other references |

**Not decided:** fork-on-replace when a file has multiple referrers (see above).

---

## Metadata worth storing early

Beyond SCHEMA’s current fields, useful for players and search:

| Field | Why | Phase |
|-------|-----|-------|
| `mime_type` | Choose audio vs video vs download | P0 |
| `size_bytes` | Warnings, quotas | P0 |
| `duration_seconds` | Player UI, “3 min listen” | P0 nice / extract client-side |
| `width` / `height` | Video layout | Optional |
| `poster_storage_ref` | Video thumbnail | Later unless easy |
| `checksum` | Integrity / dedupe | Optional |
| `media_kind` | `audio` · `video` · `document` · `other` (derived from mime) | P0 for search facets |

---

## Failure modes to design for

| Risk | Mitigation |
|------|------------|
| iOS won't play codec | Prefer MP4 H.264+AAC; show “Download” fallback + clear format hint on upload |
| Signed URL expires mid-watch | Re-fetch URL; or TTL ≥ typical lesson length |
| Parent on slow LTE | Progressive play + size warnings; don't require full download to start |
| Instructor replaces file while parent has old tab open | Versions are fine; UI shows current; optional “updated” toast later |
| Replace on a **shared** File surprises other courses/templates | Fork-on-edit or confirm “update everywhere” — **open** |
| Soft-delete File still referenced | Warn / block delete; or cascade detach — **open** |
| Storage policy ≠ RLS | Prefer signed-URL Function so authz is one code path |
| Huge orphan blobs after failed uploads | GC job / upload session status |
| Orphan Files with zero references | Soft-delete GC later; not P0-critical |

---

## Options matrix (decide together)

### 1. Where do media bytes live long-term?

| Option | Fit |
|--------|-----|
| **Supabase Storage only** | Default; matches STACK |
| Supabase Storage + **CloudFront in front of a public-ish origin** | Extra AWS; usually need signing anyway |
| **Mux / Cloudflare Stream / similar** for video only; Storage for docs | Best playback UX; cost + dual pipeline; overkill until video is central |
| App files on **our S3** (Terraform) separate from Supabase | Splits auth; avoid unless Supabase limits bite |

**Lean:** Storage-only until video engagement or file size forces a media product.

### 2. How does the player get bytes?

| Option | Fit |
|--------|-----|
| Signed URL → native `<video>`/`<audio>` | P0 favorite |
| Stream through Edge Function proxy | Controllable; expensive/latency; only if signing/range breaks |
| Embed third-party player SDK | Only with a media platform |

### 3. Transcode?

| Option | Fit |
|--------|-----|
| **No transcode** — educate + accept | P0 |
| Async transcode to MP4 on upload | Better compatibility; needs queue + cost |
| Full HLS ladder | P1/P2 media platform territory |

### 4. Upload UX for large video?

| Option | Fit |
|--------|-----|
| Simple PUT via Supabase client | OK for small/medium |
| **Resumable** (Tus / multipart) | Better for real classroom video |
| Cap size so simple PUT is enough | Honest P0 scope control |

---

## Open decisions (discussion checklist)

1. **Hard size caps** per file / per org — numbers?
2. **Allowed MIME allowlist** vs deny-list — how strict for video?
3. **Signed URL** via Function for all reads, or Storage RLS for instructors + Function for parents only?
4. **TTL** for playback URLs vs long downloads (PDF)?
5. **Resumable uploads** in P0 or size-cap instead?
6. ~~Template copy: duplicate vs reference~~ → **Decided: reference (`file_id`)**
7. **Fork on replace** when multiple materials reference the same File — shared update vs fork vs ask?
8. **Delete File** while referenced — block, warn, or cascade detach?
9. **Client-extracted** `duration_seconds` on upload — required?
10. **Poster/thumbnail** for video in P0?
11. When do we revisit **Mux/Stream/HLS** — usage threshold? support tickets? bill?
12. Quotas / Storage billing pass-through to orgs — P1 with Stripe?

---

## Proposed P0 acceptance criteria

- [ ] Upload PDF + MP3 + MP4; material stores **`file_id`** (File is org-scoped).
- [ ] Create course from another course (**P0**) → materials point at the **same** `file_id` (no duplicate blob).
- [ ] Create course from template (**P1**) → same reference behavior.
- [ ] Parent with access plays MP3/MP4 **inline on iPhone Safari** without installing an app.
- [ ] Scrub works (range requests verified).
- [ ] Replace file → new version; revert restores prior bytes (all referrers see current unless forked).
- [ ] Non-playable type still **downloads** cleanly.
- [ ] No public bucket listing; URL alone should not grant forever access.
- [ ] Print view for media: title + type + link/QR (no broken ink-heavy frames).

---

## Doc map

| Doc | Owns |
|-----|------|
| **This file** | Storage layout, signed playback, **File-as-reference** model, media escalation |
| [FEATURES.md](./FEATURES.md) | Whether audio/video/players are in scope |
| [database/SCHEMA.md](./database/SCHEMA.md) | `File` / `FileVersion` fields |
| [STACK.md](./STACK.md) | Supabase Storage as the store |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Where code lives (`materials/`, Functions) |
| [HUMAN_NEEDED.md](./HUMAN_NEEDED.md) | Supabase project / Storage config if human-only |

---

## Working recommendation (current)

1. **`File` is org-scoped**; materials/blocks **reference** it. Course→course and template→course copies share the **reference**.
2. **Private** Supabase Storage bucket; paths `org/file/version/filename`.
3. **Postgres** owns truth; **signed URLs** (Function) for play/download — still leaning this way.
4. **HTML5** audio/video engine; **custom** audio controls (1×/1.5×); prefer **MP4 H.264 + AAC** and **MP3/M4A**.
5. **No transcoder** in P0; **progressive** playback counts as streaming.
6. **Fork-on-replace** still open — biggest product footgun left in this model.
7. Revisit HLS/media SaaS only after real size/compatibility pain.

Next call to lock: **what happens when you replace a file that multiple courses/templates reference?**
