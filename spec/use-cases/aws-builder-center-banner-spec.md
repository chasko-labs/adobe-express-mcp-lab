# spec — aws builder center banner (cloud del norte design system)

## objective

produce a shippable `1440x400` banner for `builder.aws.com/community/@alias` that is visually grounded in the cloud del norte design system and is regenerable via the adobe express developer mcp add-on.

## requirements

### dimensions & export

| req    | value                                                                                                           |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| master | `1440x400` SVG (`docs/assets/aws-builder-center-banner.svg`)                                                    |
| raster | `1440x400` PNG-24 sRGB (`docs/assets/aws-builder-center-banner-1440x400.png`) via `rsvg-convert -w 1440 -h 400` |
| safe   | central `1200x400` safe area — no headline/subhead outside it                                                   |
| mobile | center-crop to `800x400` must remain legible (headline inside safe)                                             |
| size   | <5MB PNG, <500KB SVG                                                                                            |
| format | SVG master + PNG for upload (builder center accepts JPG/PNG; SVG via express export)                            |

### palette (token-faithful)

extracted from `cloud-del-norte-website/src/styles/tokens.css`:

```
--cdn-navy:        #00002a  (page bg, banner base)
--cdn-purple-deep: #30006a  (gradient end, nebula)
--cdn-purple:      #5a1f8a  (lattice, accents)
--cdn-violet:      #9060f0  (violet bulbs, glow)
--cdn-lavender:    #d7c7ee  (transitions, secondary text on dark)
--cdn-white:       #f0f0f0  (star outline, primary text)
--cdn-gold:        #c9a23f  (optional CTA border)
--cdn-aws-orange:  #ff9900  (CTA pill, aws nod)
```

gradient: `#00002a → #30006a` (left navy to right deep purple, 120deg) with subtle white-sands dust `rgba(215,199,238,0.06)` overlay.

### typography

| role     | font                      | size | weight | color              |
| -------- | ------------------------- | ---- | ------ | ------------------ |
| wordmark | Cinzel, Georgia, serif    | 44px | 700    | #f0f0f0            |
| subhead  | JetBrains Mono, monospace | 14px | 500    | #d7c7ee            |
| cta      | JetBrains Mono            | 12px | 700    | #1a1a1a on #ff9900 |

fallbacks required for svg text: `font-family: "Cinzel", Georgia, serif`.

### layout (within 1440x400)

- **left (0–360):** star mark — 160x160, centered at (180,200), white outline, violet lattice, 5 tip diamonds. use `cdn-star-logo-clean.svg` scaled; fallback: 5-point star polygon with inner lattice lines.
- **center (360–1080 = 720 safe):** headline `Cloud Del Norte` (Cinzel 44) at (720,165) centered, subhead `AWS User Group • El Paso Borderplex` (mono 14) at (720,195), divider `—` lavender 60px at (720,215).
- **right (1080–1440):** cta pill `builder.aws.com/community` — `Amazon Ember` style rounded rect `#ff9900`, 180x32 at (1260,280) centered, text `View Builders →` mono 11.

### copy

- headline: `Cloud Del Norte`
- subhead: `AWS User Group • El Paso Borderplex`
- cta: `View Builders →` (links to `https://builder.aws.com/community`)
- alt: `Cloud Del Norte star-on-mountain logo on dark nebula gradient — AWS Builder Center banner, 1440x400`

### accessibility

- contrast: `#f0f0f0` on `#00002a` → 18:1 AAA, `#9060f0` on `#00002a` → 6.2:1 AA large, `#d7c7ee` on `#00002a` → 10:1.
- text never <12px, no thin weight <500 on dark.
- safe area ensures crop never clips headline.

## acceptance

- [ ] svg renders at `1440x400` without overflow, text inside `1200x400` safe guides (validate by overlay).
- [ ] palette eyedrop matches tokens (#00002a, #30006a, #9060f0, #d7c7ee, #ff9900 within 1 hex).
- [ ] star mark recognizable at 160px (compare to `cdn-star-logo-clean-1024.png` at 128px thumbnail).
- [ ] fonts load: Cinzel + JetBrains Mono with fallbacks; no tofu.
- [ ] png export via `rsvg-convert -w 1440 -h 400` <5MB.
- [ ] add-on `addons/aws-builder-banner/code.js` draws equivalent 1440x400 composition via `editor.createRectangle` + `makeColorFill` (verifies mcp grounding — see plan).

## references

- tokens: `~/code/chasko-labs/cloud-del-norte-website/src/styles/tokens.css`
- logo: `art/images/cloud-del-norte-star-logo/src/cdn-star-logo-clean.svg` + `README.md` (5-role brightness remap)
- wallpaper/themes: `docs/design-system/wallpaper/themes.md` (el-paso-nights dark)
- builder center: `builder.aws.com/start` (og 1200x630), `builder.aws.com/assets/Banner_Home_Light.svg`
- mcp: `docs/mcp-technical.md` (`1.0.0`, `stdio`, `npx -y @adobe/express-developer-mcp@latest --yes`)

## out of scope

- animated wallpaper/babylon audio-reactive — static banner only.
- builder center profile data (avatar, bio) — banner is cover only.
- marketplace publish — banner is for builder center, not express marketplace listing.
