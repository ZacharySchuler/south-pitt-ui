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


# Meta Ads / Analytics (UTM + ROI)

Landing page for paid Meta traffic: `https://southpittrugby.com/join/`

## Ad URL (UTMs)

Use destination URLs like:

```text
https://southpittrugby.com/join/?utm_source=meta&utm_medium=paid_social&utm_campaign=fall_recruit_2026&utm_content=video_a&utm_term=lookalike_local
```

| Param | Meaning | Example |
| --- | --- | --- |
| `utm_source` | Platform | `meta` |
| `utm_medium` | Channel | `paid_social` |
| `utm_campaign` | Campaign | `fall_recruit_2026` |
| `utm_content` | Creative | `video_a` |
| `utm_term` | Audience | `lookalike_local` |

GA4 picks these up automatically on landing. Keep naming consistent across ads.

## Site tracking setup

1. **GA4** is already wired with Measurement ID `G-4FT2F15889` (public client ID; override via `PUBLIC_GA_MEASUREMENT_ID` if needed).
2. Create a **Meta Pixel** in Events Manager and copy the Pixel ID.
3. Set `PUBLIC_META_PIXEL_ID` in Cloudflare build/environment settings (and optionally local `.env`).
4. Rebuild / redeploy after setting the Meta Pixel var.

Conversion events fire **only on `/join/` CTAs** (the Meta ads landing page). Discord links on the homepage, culture page, contact page, etc. do **not** fire Lead — that keeps organic traffic from inflating ad conversion counts.

| CTA | GA4 event | Meta Pixel event | Label |
| --- | --- | --- | --- |
| Join Discord | `join_discord_click` | `Lead` | `join_page_discord` |
| Email the team | `join_email_click` | `Lead` | `join_page_email` |

In Meta Ads Manager, optimize on Pixel `Lead`. Distinguish channel via `content_name` (`join_page_discord` vs `join_page_email`). In GA4, mark `join_discord_click` and `join_email_click` as key events, and filter by `utm_source=meta` when judging paid ROI.


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
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |



# Repo Explanation
This is currently a standard static astro site - meaning that the website is built before being deployed with no dynamic data being fetched.

It follows a standard astro directory structure of:
- assets: pictures
- components: reuseable components
- data: static data, used for ease of editing
- layouts: Contains layouts used to wrap main page contents
- pages: content pages, each page represent a url (e.g. culture.astro represents /culture/ on the website)
  