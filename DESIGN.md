# Mikadodeco redesign brief — inspired by BoConcept

Reference: https://www.boconcept.com/fr-be/

## What makes BoConcept feel modern

Going through the site, four things drive the "modern Scandinavian retail" feel:

1. **Visual restraint.** A near-monochrome palette (white background, near-black ink, one warm accent), with all the colour coming from product photography itself.
2. **Photography does the work.** Edge-to-edge lifestyle shots, not catalogue cutouts. Every hero is a room, every card is a context.
3. **Geometric grids, generous gutters.** 3–4 column product grids on desktop, tight uniform gaps, no card borders or shadows. Each card looks like it could be a poster.
4. **Sans-serif clarity, with one accent serif.** Helvetica Neue 99% of the time; a serif is used for a single deliberate moment (a tagline, a category headline).

The current Mikadodeco site does the opposite of all four: warm beige background, multi-font serif/sans mix, narrow tables, decorative custom cursor, and inline placeholder-y image styles.

## Design tokens extracted from BoConcept

### Typography

| Token | Value (BoConcept) | Notes |
|---|---|---|
| Body family | Helvetica Neue (custom hosted) | 1 family does 95% of the work |
| Body size | 16px | |
| Body weight | 400 | |
| Body line-height | normal (~1.25) | tight |
| H1 (hero) | 39px / weight 700 / lh 39px | very tight leading — almost flush |
| H2 (section) | 32px / weight 700 / lh 32px | same character |
| H2 (small) | 19px / weight 700 | used for "Que recherchez-vous ?" type prompts |
| Letter-spacing | 0.16px on UI, slight negative on big heads | nearly zero, barely felt |
| Accent serif | Baskerville | tiny role — overlay taglines |

**Translation for our stack:** swap our Cormorant Garamond / DM Sans pair for **Inter** as the workhorse (free, hosted on Google Fonts, ~Helvetica Neue feel) plus **a serif for accents only**. Keep Cormorant since you already paid the typography cost for it — but demote it from running body copy to: brand wordmark, hero overline, category page header. Everything else is Inter.

### Colour

| Token | BoConcept | Proposed Mikadodeco |
|---|---|---|
| Background | `#ffffff` pure white | `#ffffff` pure white (drop the warm beige `#faf8f4`) |
| Ink | `#1d1d1b` | `#1a1916` (keep current ink) |
| UI charcoal | `#222222` | `#222222` |
| Surface gray | `#f6f6f6` | `#f5f4f1` (keep slight warmth — we are Belgian, not Danish) |
| Border | `#888888` (rare) | `#e6e3dd` (lighter, used sparingly) |
| Accent | one dark forest green `#234923` | one warm accent — propose burnt sienna `#b85c3a` OR keep current `#c8a97e` |

The single biggest move: **white background everywhere, not warm beige.** It modernises the entire site in one stroke.

### Spacing & layout

- **Container width**: ~1200px max, with 24px side padding on desktop.
- **Section vertical rhythm**: ~80–120px between major sections.
- **Grid gutters**: tight — 8–16px between cards.
- **Card style**: zero border-radius, zero shadow, zero border. The image is the card.

### Components

- **Nav**: white, sticky, ~64px tall, logo centered, 2-tier (main categories on top, sub-nav slides in on hover).
- **Product card**: full-bleed image (3:4 ratio), then below: small grey "Brand" line, product name in 15–16px medium weight, price in same size but bold. **No buttons, no badges over images.** The whole card is the click target.
- **Buttons**: rectangular, 1px border, 3px radius, 15px padding, 15px font, slight letter-spacing. Two variants only: solid black-on-white outline, or filled black with white text.
- **Filter chips**: pill or square, 1px border, 15px padding, no fill until active.
- **Promotional banner inside grid**: a tile occupying 1 product slot with dark fill, white text, rounded corners — interrupts the grid for "Livraison gratuite" / "Sur rendez-vous" / similar.

## What the rewrite would change for Mikadodeco

| Page | Current state | Proposed |
|---|---|---|
| Homepage (`index.html`) | 1797 lines, warm beige, custom cursor, mixed fonts, lots of decorative motion | White background, Inter body + Cormorant accent only on logo & one tagline, 3 sections (hero / featured grid / about), no custom cursor, subtle scroll reveals only |
| Catalogue (`catalogue.html`) | Filter tabs + grid, decent baseline | 4-column grid on desktop / 2 mobile, BoConcept-style cards (no borders, image-as-card), promotional tile that interrupts grid, sticky filter bar |
| Brands (`marques.html`) | Letter-tile cards already in this direction | Keep current grid but unify type and remove warm background |
| Product detail panel | Side drawer, works but visually busy | Full-page modal or dedicated route, gallery on left, info on right, large add-to-selection CTA |

## Capabilities to preserve (non-negotiable)

- ✅ All `/api/products`, `/api/brands`, `/api/collections`, `/api/cart/create`, `/api/vitra` keep working unchanged.
- ✅ "Sélection" cart with localStorage + checkout via Shopify cart create.
- ✅ Category filter tabs.
- ✅ Brand filter dropdown.
- ✅ Intercom widget (still in code).
- ✅ Existing brand list, category mapping, badge tags.
- ✅ FR-first copy, contact info, address.

## Proposed phasing (3 PRs)

1. **PR 1 — Foundation.** Extract a single `public/styles.css` shared by all pages, set the new tokens (white bg, Inter + Cormorant accent, type scale, button styles). Don't change layouts yet — just the tokens. Risk: cosmetic only, easy to revert. **Outcome**: site already feels 50% more modern.
2. **PR 2 — Catalogue rebuild.** Replace the catalogue page entirely with the BoConcept-style grid, sticky filter bar, image-as-card layout, promotional tile interruptions. Wire the same `/api/products` data. Risk: medium — touches one page deeply.
3. **PR 3 — Homepage + brands.** Rebuild `index.html` with the new section rhythm (hero / featured / about / contact). Rebuild `marques.html` to match the new tokens. Risk: medium — homepage is most visible but no commerce logic on it.

After PR 3 we're at parity-or-better with the current site, just modernised, and Shopify still works.

## Open questions for you

1. **Accent colour**: keep your current warm gold `#c8a97e`, or pick one of: burnt sienna `#b85c3a`, terracotta `#c66a3d`, deep navy `#1f2a44`, forest `#234923` (BoConcept's)?
2. **Background colour**: ready to commit to pure white, or want to keep a subtle off-white like `#fbfaf7` for warmth?
3. **Typography**: OK with **Inter (sans) + Cormorant Garamond (accent only)**, or want a stronger serif (e.g. **GT Sectra**, **Reckless**) as the accent?
4. **Product card style**: full-bleed image like BoConcept (image IS the card), or keep current style with subtle border/whitespace around image?
5. **Phasing**: OK with the 3-PR plan above, or want it all in one go?

Answer those and I'll start with PR 1.
