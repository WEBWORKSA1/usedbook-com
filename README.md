# UsedBook.com

The used-book price, value and selling intelligence hub — compare used-book prices across 13 marketplaces, estimate what a book is worth, grade condition, decode first editions, find used bookstores, and get offers for whole collections.

Static Jekyll site built for **GitHub Pages (free plan, `main` branch, root)**. No server code.

## Structure

| Path | Purpose |
|---|---|
| `_config.yml` | Site settings + monetisation switches (AdSense slots, affiliate tags, donation links, contest) |
| `_layouts/` | `default.html` (header, mandatory top bar, footer, modals) and `guide.html` |
| `_includes/` | Reusable blocks: schema, lead band, newsletter, video, CTAs |
| `_data/` | `marketplaces.yml`, `videos.yml`, `stores.yml`, `trending.json` (auto-updated) |
| `_guides/` | Long-form guides (Markdown) published at `/guides/<slug>/` |
| `tools/` | Book Value Estimator, Condition Grader, First-Edition Checker, ISBN Converter, Reseller Profit Calculator, Collection Estimator |
| `assets/` | CSS, JS (`app.js`, `books.js`, `tools.js`), SVG images |
| `.github/workflows/` | Weekly auto-update + build/link/privacy check |
| `scripts/` | Python used by the workflows |

## Monetisation switches (`_config.yml`)

- `adsense_slots` — optional manual ad units (Auto ads work without them).
- `affiliate.amazon_tag`, `affiliate.ebay_campid` — appended to outbound marketplace links when set.
- `donate_links` — PayPal / Stripe / Buy Me a Coffee buttons appear on `/support/` only when set.
- `contest` — round name, theme, prize, deadline, status.

## Forms

All forms post through FormSubmit (AJAX). The destination inbox is stored encoded in `assets/js/app.js` and assembled at runtime — it is never written in plain text anywhere in the site. The first live submission triggers a one-time FormSubmit activation e-mail to the owner.

## Local preview

```bash
gem install bundler jekyll jekyll-sitemap kramdown-parser-gfm webrick
jekyll serve
```

## Deploy

1. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
2. DNS: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` CNAME → `webworksa1.github.io`. Enforce HTTPS.
3. AdSense: add site, enable Auto ads and the Privacy & messaging (GDPR) message.

© UsedBook.com. "Used book" is a generic, descriptive term; no exclusive rights are claimed in it. See `/trademark/`.
