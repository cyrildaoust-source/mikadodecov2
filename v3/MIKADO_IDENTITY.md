# Mikadodeco · visual identity

The source of truth for the Mikadodeco storefront: palette, type, detailing, voice.

## Palette (CSS vars in `styles.css`)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#f8f5ef` | warm base background |
| `--paper-2` | `#efe9df` | warm bands (USP, room, alt sections) |
| `--tile` | `#efeae1` | product / image backdrops |
| `--ink` / `--ink-deep` | `#1a1916` | warm brown-black, all primary text |
| `--muted` | `#7c756c` | secondary text |
| `--subtle` | `#a39c91` | meta / captions |
| `--line` | `#e0d9cf` | warm beige hairline |
| **`--accent`** | **`#28408F`** | **signature royal blue** · links/text, rules, underlines, btn--blue + announce bg |
| **`--accent-ink`** | **`#1C2F6B`** | deep royal · legible blue for text/tags/links on cream + btn hover bg |
| **`--accent-soft`** | **`#ECEFF7`** | pale-blue tint · the single "blue moment" panel |
| **`--promo`** | **`#C9A24A`** | luminous gold · promo (badges use a brushed-brass gradient, ink text) |
| **`--promo-deep`** | **`#A07F2E`** | deep gold · hover / gold text on cream |
| `--on-dark` | `#f8f5ef` | text over imagery (hero, category labels) |

Warm cream + brown-black, with a measured royal-blue signature + gold promo accent.

## Type

Loaded via the Adobe Fonts kit `gqc3ska` (`https://use.typekit.net/gqc3ska.css`) + Cormorant from Google. Three roles:

- **Display / headings** (`--serif`): **Cormorant Garamond** (matches the logo wordmark), weight **600**. Hero, feature, section, USP, footer, room, category-label headings.
- **Body / UI** (`--sans`): **gopher** (Adobe kit). Nav, paragraphs, buttons, descriptions, footer, USP body.
- **Product-name tier** (`--sans-product`): **neue-haas-grotesk-display** (Adobe kit), weight 600. Applied to `.pcard__name`, `.pcard__brand`, `.pcard__price`, `.tag` · the crisp grotesque label tier.
- **Available fallback**: `neue-haas-grotesk-text` is in the kit for longer copy if ever needed.

## Signature moves

1. **Baby-blue detailing thread** · sparse, consistent:
   - Nav link underline draws in `--accent` on hover.
   - Section header (`.shead`) has a 2px `--accent` rule + blue link underline.
   - Product `.tag` and `.pcard__price` use `--accent-ink`.
   - Room category chips: blue border, fill blue on hover.
   - Focus rings: `--accent-ink`.
   - **One** soft-blue panel per page max: `.feature--accent` + its `.btn--blue` CTA.
2. **Boutique lockups** · store voice + brand furniture:
   - Rotating announcement (boutique hours, selection, delivery, Mikado Studio).
   - Footer lockbar: "Mikadodeco · Boutique de design · Uccle, Bruxelles" + a slowly-rotating typographic seal (SVG `textPath`).

## Voice

French-first, warm, store-as-curator in Uccle (Bruxelles). Short, calm, concrete. No hype. Mikadodeco is a **boutique you can visit** (open Tue–Sat) that also sells online; **Mikado Studio** is the design-advice service by appointment.

## Confirmed
- **Brand name**: **Mikadodeco** (often shortened to **Mikado**, e.g. the logo wordmark).
- **City / address**: **75 Rue du Doyenné, 1180 Uccle (Bruxelles)**. Map coordinates: `50.8030627, 4.3403107` (OSM building geocode).
- **Hours**: Mardi–Samedi 10h30–18h30, fermé dimanche et lundi.
- **Email**: shop@mikadodeco.be (single contact address; the earlier info@/contact@ variants were placeholders).
- **Founding year**: **2011** (used in the footer seal aria-label).
- **Format**: walk-in boutique Tue–Sat; **Mikado Studio** handles design projects by appointment.
- **Location block** (`rendez-vous.html` → `.locate`): bespoke brand-styled map (Leaflet + CARTO `light_all` tiles, warm-tinted via CSS) with a royal-blue pin + overlapping storefront print. This carries the page's single "blue moment".

## To confirm before launch
- Fonts: Cormorant is free (Google). `gopher` + `neue-haas-grotesk-*` come from the Adobe Fonts kit `gqc3ska` · confirm the plan covers production web use on the live domain.
- Photography: the `v3/images/ref-*` files are placeholders and must be replaced with owned or licensed photography before launch (including the storefront print in the `.locate` block).
- **Map tiles**: the location map uses CARTO basemaps (free tier, attribution shown). For a commercial site, confirm CARTO's terms or swap in a Mapbox/Google styled-map token for a fully custom palette. Attribution must stay visible.
- **VAT / n° d'entreprise**: not yet shown anywhere. A Belgian shop is legally required to display its `BE0...` number in the footer. Add once provided.
