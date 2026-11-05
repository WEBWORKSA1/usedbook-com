# UsedBook.com — phase-wise build prompts

The full concept, revenue model and research summary live in the owner's project notes. These prompts stay with the code. (Form destination: the owner inbox, stored encoded in `assets/js/app.js` — never written in plain text.)

**Global rules (paste at the top of every phase):** GitHub Pages free plan, `main` branch, Jekyll with whitelisted plugins only, domain usedbook.com via CNAME. AdSense code in `<head>` of every content page (client ca-pub-6620975821265271). Mandatory top bar on every page: "Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership" linked to https://web.works/contact. All forms via FormSubmit AJAX with the encoded inbox; mailto links assembled on click. No trademark claim on "usedbook"; include a trademark & copyright disclosure. No fake reviews, statistics or prizes.

1. **Strategy** — Confirm concept (used-book price, value & selling intelligence hub + collection lead engine), personas, monetisation per page, KPIs.
2. **Foundation** — `_config.yml`, CNAME, ads.txt, robots.txt, manifest, SVG brand assets, default + guide layouts with SEO meta, JSON-LD, top bar, sticky header, footer, cookie notice, sticky CTA, exit-intent modal, 404.
3. **Design system** — single CSS file, light/dark tokens, Fraunces + Inter, cards, tabs, multi-step forms, tools, prose; responsive and accessible.
4. **Core engine** — `books.js`: ISBN utilities, Open Library search/works/editions/covers/trending/subjects, search page, book page, compare and sell tools with marketplace deep links and optional affiliate tags.
5. **Tools** — `tools.js`: value estimator, condition grader, first-edition checker, ISBN converter, reseller profit calculator, collection estimator.
6. **Lead engine** — `/get-offers/` with four tabbed forms and FAQ schema; site-wide feeders.
7. **Content** — 21 original guides with FAQs, glossary, guides hub, RSS, HTML sitemap.
8. **Media & local** — verified YouTube library (click-to-load), bookstore and book-sale finder with listing form.
9. **Community & money** — support (tiers, use of funds, pledge form, config-driven payment buttons), contest (rules, config-driven prize), careers, advertise.
10. **Trust & legal** — about, contact, privacy (AdSense disclosures), terms, cookies, disclaimer, trademark, editorial policy.
11. **Automation & QA** — weekly auto-update and build-check workflows (see `automation/`); enable Pages, DNS, HTTPS, FormSubmit activation, AdSense consent message, Search Console.
