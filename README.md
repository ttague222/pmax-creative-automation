# pmax-creative-automation

Generate **Google Performance Max-ready** image and video ad creative from a product
manifest — with very little manual creative work. Runs **fully in mock mode out of the
box** (no API keys), and switches to real **Photoroom** (image cleanup) + **Creatomate**
(video render) integrations when you add your own keys.

> Built by [Watchlight Interactive](https://watchlightinteractive.com) — custom software
> & AI automation for businesses.

## The problem

E-commerce stores need a lot of PMAX ad creative — multiple images and short videos per
SKU, in square and vertical. Producing it by hand is slow and expensive, so most catalogs
ship thin, underperforming asset sets.

## Who it's for

Shopify / e-commerce operators and the agencies/developers who serve them, who want a
repeatable pipeline from product data → ad-ready assets.

## What it does

```
data/products.json ─▶ validate ─▶ clean image ─▶ lifestyle scenes ─▶ video ─▶ review gallery
                                  (Photoroom)     (Bria · fal)       (Creatomate)
```

It ships with a **fictional sample catalog** (the "Northwind" brand) and bundled sample
images for each product — **source → background-removed → lifestyle scene** — so you can
see the whole flow before wiring anything real.

## 30-second quickstart (mock mode — no keys)

Requires Node 18+. No `npm install` needed (zero runtime dependencies).

```sh
npm run demo        # builds the gallery from the bundled sample images
```

Then open `src/demo/index.html` in a browser. You'll see, per product, a **source →
cleaned → lifestyle-scene** image set, trust badges, price, and a 3-scene video storyboard.

```sh
npm run validate    # check the product manifest
npm test            # run the unit tests
```

## Real mode (your keys)

1. Replace `data/products.json` with your catalog and drop **raster** product photos
   (PNG/JPG) into `assets/source/`, referenced by each product's `sourceImagePaths`.
2. Copy `.env.example` to `.env` and add your keys (or export them in your shell):
   - `PHOTOROOM_API_KEY` — https://www.photoroom.com/api
   - `CREATOMATE_API_KEY` — https://creatomate.com → Project settings → API
   - `FAL_KEY` — https://fal.ai → dashboard → API keys (lifestyle scenes)
3. Run the real pipeline:

```sh
npm run images      # Photoroom: clean backgrounds → assets/processed/images/<id>-clean.png
npm run scenes      # Bria (fal): faithful lifestyle scenes → assets/processed/scenes/<id>-lifestyle.png
npm run payloads    # build Creatomate render payloads
npm run render      # Creatomate: render square + vertical mp4s (needs a public imageUrl per product)
```

> Lifestyle scenes (`npm run scenes`) keep your product pixels **faithful** — only the
> background is regenerated — using a model trained on licensed data for commercial use.
> Needs a public `imageUrl` per product in `data/products.json`.

> Creatomate downloads image sources over HTTP, so real renders need a **public https
> image URL** per product (set `imageUrl` in `data/products.json`). Host your processed
> images, then point at them.

`npm run payloads` writes starter JSON to `assets/exports/` as a human-readable reference; `npm run render` builds its own payloads inline and does not read these files.

## Architecture

- `src/lib/` — pure, tested logic: `validate.mjs`, `payload.mjs`, `load.mjs`.
- `src/scripts/` — thin CLIs: `validate`, `demo` (mock),
  `payloads`, `images`, `scenes` + `render` (real, key-gated).
- `config/` — `brand.json`, `creative-rules.json`, `overlay-copy.json`.
- `src/demo/` — static gallery (`index.html` + generated `demo-data.json`).

The mock/real split lives entirely in which scripts you run. Pure logic is unit-tested
with the built-in `node --test` runner.

## Honesty & human-in-the-loop guardrails

Refurbished and value claims are easy to overstate. This repo bakes in restraint:

- **Approved overlays only** — overlay/badge text must exist in `config/overlay-copy.json`;
  `npm run validate` errors on anything else.
- **Creative rules travel with the work** — `config/creative-rules.json` (no retouching
  condition cues, no compositing un-included accessories, "Certified Refurbished" not
  "like new") is embedded in every generated render payload.
- Prices in the manifest are for mockups — verify live prices before any real campaign.

## License

MIT — see [LICENSE](LICENSE).
