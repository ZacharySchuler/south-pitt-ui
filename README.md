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
  