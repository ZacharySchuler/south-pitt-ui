# History Book — Cloudflare Setup (Worker / D1 / R2)

Manual setup guide for the objects and config values the History Book feature expects.

Source of truth for bindings and resource names: [`wrangler.jsonc`](../wrangler.jsonc).  
Env typings: [`src/env.d.ts`](../src/env.d.ts).  
Local env template: [`.dev.vars.example`](../.dev.vars.example).

---

## 1. Expected Cloudflare objects

These resources must exist (or be created) in the club Cloudflare account for History Book to work end-to-end:

| Object | Required today? | Purpose |
| --- | --- | --- |
| **Worker** | Yes | Serves the static site + History Book pages/APIs (`/history`, `/api/history/*`) |
| **D1 database** | Yes | Stores memory metadata (`memories`, `memory_photos`) |
| **R2 bucket** | Yes (for photos) | Stores uploaded photo objects |
| **R2 public access / custom domain** | Yes (for photos) | Lets browsers load photos via public HTTPS URLs |
| **Worker environment variable** `R2_PUBLIC_BASE_URL` | Yes (for photos) | Base URL used to build `photos[].url` in API/`/history` |

**Notes**

- Text-only memory create/list works with Worker + D1 alone.
- Photo upload/display also needs the R2 bucket, public access, and `R2_PUBLIC_BASE_URL`.
- Shared-password auth and Discord secrets are **not required yet** (Steps 12+).
- `@astrojs/cloudflare` may warn about a `SESSION` KV binding for Astro sessions. That is unrelated to History Book Steps 1–11 and is not required for current History APIs.

---

## 2. Exact names (config / code)

Names below must match Cloudflare **and** the repo unless you intentionally change both.

### Worker

| Field | Exact value | Where referenced |
| --- | --- | --- |
| Worker name | `south-pitt-ui` | [`wrangler.jsonc`](../wrangler.jsonc) → `name` |

Preview/branch deploys typically appear as:

```text
<branch-name>-south-pitt-ui.zrschu.workers.dev
```

### D1

| Field | Exact value | Where referenced |
| --- | --- | --- |
| Database name | `south-pitt-history-metadata` | `wrangler.jsonc` → `d1_databases[].database_name` |
| Binding name | `DB` | `wrangler.jsonc` → `binding`; code uses `env.DB` |
| Database ID | `3a327522-3b0b-4d55-abd1-50225345009d` | `wrangler.jsonc` → `database_id` |
| Migrations directory | `migrations/` | `wrangler.jsonc` → `migrations_dir` |

Tables created by migration [`migrations/0001_init_history.sql`](../migrations/0001_init_history.sql):

- `memories`
- `memory_photos`

Photo rows use:

```text
storage_provider = "r2"
storage_id = "<R2 object key>"
```

### R2

| Field | Exact value | Where referenced |
| --- | --- | --- |
| Bucket name | `south-pitt-rfc-photos` | `wrangler.jsonc` → `r2_buckets[].bucket_name` |
| Binding name | `HISTORY_PHOTOS` | `wrangler.jsonc` → `binding`; code uses `env.HISTORY_PHOTOS` |

Object key pattern used by uploads:

```text
memories/<memory-id>/<uuid>-<safe-filename>
```

Public photo URL pattern:

```text
{R2_PUBLIC_BASE_URL}/{storage_id}
```

Example:

```text
https://history-photos.southpittrugby.com/memories/42/a1b2c3d4-team-photo.jpg
```

### Built-in assets binding

| Field | Exact value | Notes |
| --- | --- | --- |
| Binding | `ASSETS` | Points at `./dist`; created/used by the Astro Cloudflare deploy pipeline |

### Environment variables / secrets

| Name | Required today? | Used for |
| --- | --- | --- |
| `R2_PUBLIC_BASE_URL` | Yes for photo URLs/uploads | Public HTTPS base for R2 objects (no trailing slash) |
| `HISTORY_PASSWORD` | No (future Step 12) | Shared team password |
| `HISTORY_SESSION_SECRET` | No (future Step 12) | Signed session cookies |
| `DISCORD_APPLICATION_ID` | No (future Discord) | Discord app |
| `DISCORD_PUBLIC_KEY` | No (future Discord) | Interaction signature verify |
| `DISCORD_GUILD_ID` | No (future Discord) | Restrict to club server |

---

## 3. Local config

### Where to put values

| File | Location | Committed? |
| --- | --- | --- |
| `.dev.vars` | **Repo root** (`/workspace/.dev.vars` locally) | **No** (gitignored) |
| `.dev.vars.example` | Repo root | Yes (template only) |

Wrangler / Astro Cloudflare platform proxy load `.dev.vars` automatically for local Worker runs.

### Setup steps

1. Install deps:

   ```bash
   npm install
   ```

2. Create local env file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

3. Edit `.dev.vars` and set at least:

   ```bash
   R2_PUBLIC_BASE_URL=https://history-photos.southpittrugby.com
   ```

   Rules:
   - Use your real public R2 host (custom domain preferred)
   - **No trailing slash**
   - Do not commit `.dev.vars`

4. Apply D1 migrations to the **local** D1 instance:

   ```bash
   npm run db:migrate:local
   ```

5. Run with Worker + bindings (recommended for History APIs):

   ```bash
   npm run build
   npx wrangler dev --local
   ```

### Local behavior checklist

| Capability | Needs |
| --- | --- |
| Open `/history/` and list text memories | Local D1 migrated |
| `POST /api/history/memories` JSON (text-only) | Local D1 migrated |
| Upload photos via `/history/submit/` | `HISTORY_PHOTOS` binding + `R2_PUBLIC_BASE_URL` |
| See photos in browser | Public R2 URL must actually resolve (local R2 simulation does not replace a real public domain) |

---

## 4. Production config

### Where to put values

| Setting | Where to set it |
| --- | --- |
| Worker name / deploy | Cloudflare Workers Git integration deploys `south-pitt-ui` from the connected branch |
| D1 database | Cloudflare Dashboard → **D1** → `south-pitt-history-metadata` (already created; keep `database_id` in `wrangler.jsonc`) |
| D1 migrations (remote) | From a machine authenticated to the club account: `npm run db:migrate:remote` |
| R2 bucket | Cloudflare Dashboard → **R2** → `south-pitt-rfc-photos` |
| R2 public access | R2 bucket settings → enable public access; prefer attaching a **custom domain** |
| Bindings `DB`, `HISTORY_PHOTOS`, `ASSETS` | Declared in `wrangler.jsonc`; applied on Worker deploy |
| `R2_PUBLIC_BASE_URL` | Cloudflare Dashboard → **Workers & Pages** → worker `south-pitt-ui` → **Settings** → **Variables and Secrets** (plaintext variable), for each environment you use (production and any preview Worker that should support photo submit) |

### Production checklist

1. Confirm D1 `south-pitt-history-metadata` exists and migrations are applied remotely.
2. Confirm R2 bucket `south-pitt-rfc-photos` exists.
3. Attach public access / custom domain to that bucket.
4. Set Worker var:

   ```text
   R2_PUBLIC_BASE_URL=https://<your-public-r2-host>
   ```

5. Deploy/redeploy Worker `south-pitt-ui` so Wrangler bindings match the dashboard.
6. Smoke test:
   - `/history/`
   - `/history/submit/` with a photo
   - Confirm the returned `photos[].url` loads in the browser from the public host

### Preview / branch Workers

Feature-branch preview Workers also need:

- the same D1 + R2 bindings from `wrangler.jsonc`
- `R2_PUBLIC_BASE_URL` set on that preview Worker if you test photo uploads there

---

## Quick reference

```text
Worker:   south-pitt-ui
D1:       south-pitt-history-metadata   binding DB
R2:       south-pitt-rfc-photos         binding HISTORY_PHOTOS
Local:    .dev.vars  (repo root, gitignored)
Prod var: R2_PUBLIC_BASE_URL on Worker settings
```
