# 🐝 Bee Weekly Planner

A phone-installable weekly meal planner for two — Kerala + world cuisine, built around **batch cooking** (cook once, eat 2–3 days), with a smart shopping list. Personalised for a Munich household: lactose-free, gluten-light, less-masala, gut-aware, high-protein, air-fryer/grill friendly.

## What's in here

| File | Purpose |
|---|---|
| `bee-planner.html` | The whole app (self-contained HTML/CSS/JS). **Source of truth.** |
| `build-site.sh` | Wraps `bee-planner.html` into a deployable static site in `site/`. |
| `manifest.webmanifest`, `sw.js`, `icon.svg` | PWA files (installable + offline). |
| `bee-bot.js`, `package.json` | Optional Telegram bot (parked). |
| `README-hosting.md` | Step-by-step free hosting guide. |

## Build the website

```bash
bash build-site.sh
```

Produces `site/` (deployable) and `bee-site.zip`. Deploy `site/` to any static host
(Netlify, Cloudflare Pages, GitHub Pages).

## Features

- **Batch-cook engine** — plans a week around a few cook sessions; nothing repeats next week.
- **Per-meal editor** — switch the cook day, pick the exact dish, or mark "eating out".
- **Recipes** — tap a dish for ingredients, steps, and a "Watch on YouTube" link.
- **Settings** — % goal sliders, health goal + body-weight protein target, dietary/avoid
  toggles, meals to plan, portion size, preferred shop (REWE).
- **Shopping list** — auto, split by shop, scaled to household & portions, honours skips.
- Data is stored per-device in the browser (no server yet).

## Roadmap

- [x] Installable web app + shopping list
- [x] Per-meal editing, recipes, health goals
- [ ] Host on the web (free — Netlify/Cloudflare Pages)
- [ ] Sunday **email digest**
- [ ] Small **accounts** → sync across devices + share with friends
- [ ] Location-based supermarket finder

## Security note

The app is 100% client-side — **no secrets in the code**. When a backend is added
(email/accounts), API keys live as host **environment variables**, never in Git.
