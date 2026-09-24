# Contributing: (For Other South Pitt people):

- board/coaching info is in `data/contact.json` -> update this to have it reflected on all pages its referenced
- practice info is located in `data/practice.json`. Update this to have it reflected on all places its referenced

## Branching Strategy:

Cut a feature branch from master -> merge (squash) back to master

### Production Branch:

- master -> the main production branch - auto-deploys to southpittrugby.com


### Feature Branches:

- any-regular-branch -> any feature branch - to be merged into dev-main -> deployed to <branch_name>-south-pitt-ui.zrschu.workers.dev


# Deployment:

This repo is configured to deploy automatically using CloudFlare workers.

The domain is bought on porkbun but namespace servers are configured for cloudflare


# Accounts Involved:
- Cloudflare: Hosting / Deployments
    Username Zrschu (Zachary Schuler's) (hopefully this will get changed)
- Porkbun - Domain Registrar (where we get the domain)
    Username: SouthPitt




# Contributing:

## Local Set up:
- node version is v20.17.0

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npx wrangler login`      | Logins into Cloudflare locally                   |
| `npm run db:migrate:local`| Runs DB migrations to cloudflare D1 instance     |


##



# Repo Explanation
This is currently a mostly static Astro site. Public marketing pages are prerendered at build time. History Book APIs under `/api/history/*` (and later Discord) are on-demand Cloudflare Worker routes backed by D1.

It follows a standard astro directory structure of:
- assets: pictures
- components: reuseable components
- data: static data, used for ease of editing
- layouts: Contains layouts used to wrap main page contents
- pages: content pages, each page represent a url (e.g. culture.astro represents /culture/ on the website)
- server: History Book domain logic (services, repositories, storage adapters)

## History Book (D1)

Metadata lives in Cloudflare D1 (`south-pitt-history-metadata`, binding `DB`). Photos are stored privately in Google Drive and served only through `/api/history/photos/:id`. Keep all secrets in Cloudflare secrets / `.dev.vars` (never commit them).

The remote database is already created and wired in `wrangler.jsonc`.

Apply migrations:

| Command | Action |
| :------ | :----- |
| `npm run db:migrate:local` | Apply SQL migrations to local D1 |
| `npm run db:migrate:remote` | Apply SQL migrations to remote D1 |

Migration files live in `migrations/`.

### Local secrets

```sh
cp .dev.vars.example .dev.vars
# edit .dev.vars with real values
```

Wrangler / Astro Cloudflare platform proxy load `.dev.vars` automatically for local runs.

### Google Drive setup (manual)

Do this once on a club-owned Google account (not a personal-only account if you can avoid it):

1. Create a Drive folder (e.g. `Hooligans History Book`). Optional year subfolders are fine for humans; the app uploads into the configured root folder id.
2. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project.
3. Enable **Google Drive API**.
4. Configure OAuth consent (Internal if Workspace; External + test users otherwise).
5. Create OAuth client credentials type **Web application** (or Desktop for one-time refresh-token generation).
6. Generate a **refresh token** with Drive file scope (`https://www.googleapis.com/auth/drive.file` is enough for app-created files; use `drive` only if you need broader club-folder access).
7. Copy the Drive folder id from the folder URL (`…/folders/<FOLDER_ID>`).
8. Put values in `.dev.vars` locally, and in Cloudflare Worker secrets for deployed environments:

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put GOOGLE_DRIVE_ROOT_FOLDER_ID
```

Text-only memories work without Google secrets. Photo upload/serve require all four `GOOGLE_*` values.

### Photo upload failure strategy

1. Upload photo bytes to Google Drive first.
2. Insert the memory row and `memory_photos` rows in D1.
3. If D1 fails after uploads, the service best-effort deletes the uploaded Drive files to avoid orphans.

Original images are preserved (no resize/compress in MVP).

### Useful local URLs

| Path | Purpose |
| :---- | :------ |
| `/history/` | Browse memories |
| `/history/submit/` | Submit memory + photos |
| `POST /api/history/memories` | JSON or multipart create |
| `GET /api/history/photos/:id` | Private photo proxy |

Auth (shared team password) is not implemented yet — treat these routes as open until Steps 12–13.  