# Automation workflows (one-time activation)

The connector used to build this repo cannot write to `.github/workflows/`, so the two GitHub Actions workflows are staged here. Activate them once:

1. On GitHub, open this folder and click a file, e.g. `auto-update.yml` → copy its contents.
2. Click **Add file → Create new file** at the repo root and name it `.github/workflows/auto-update.yml`; paste and commit.
3. Repeat for `build-check.yml`.

- **auto-update.yml** — every Monday, refreshes `_data/trending.json` from Open Library (via `scripts/update_data.py`), commits it and asks GitHub Pages to rebuild. The site also refreshes trending and a daily subject shelf live in the browser, so it stays current even before this is activated.
- **build-check.yml** — on every push, builds the site with the GitHub Pages gem set, checks JS syntax, runs `scripts/check_site.py` (AdSense code and contact bar on every page, broken internal links, exposed e-mail addresses, required root files) and commits the result to `.build/report.txt`.
