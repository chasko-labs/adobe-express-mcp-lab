# use case — cloud del norte aws builder center banner

> community builder needs a profile/hero banner for `builder.aws.com/community/@<alias>` that looks undeniably **cloud del norte** — not generic aws. built via the adobe express developer mcp so any builder can regenerate variants (light/dark, english/spanish) without hallucinating the design system.

![AWS Builder Center banner — Cloud Del Norte design system](https://raw.githubusercontent.com/chasko-labs/adobe-express-mcp-lab/main/docs/assets/aws-builder-center-banner.svg)

## context

- **what builder center is:** builder.aws.com — aws community home for builders. profile at `builder.aws.com/community/@alias` shows builder id, alias, bio, badges. banner/cover is the large hero behind the avatar (inferred responsive crop, no public spec; see spec for dimensions).
- **what cloud del norte is:** aws user group for the el paso borderplex (el paso / juárez / las cruces). dark nebula brand — navy `#00002a` sky, star-on-mountain mark (5-point hollow star with violet lattice), violet `#5a1f8a` / `#9060f0`, lavender `#d7c7ee`, aws orange `#ff9900`, gold `#c9a23f`, fonts Cinzel (display) + JetBrains Mono (mono). tokens in `cloud-del-norte-website/src/styles/tokens.css`.
- **why an add-on:** the banner is a design — add-ons are the express-native way to ship branded designs. mcp grounds the generation so the brand palette + fonts are correct first try.

## who benefits

| persona           | job to be done                                      |
| ----------------- | --------------------------------------------------- |
| community builder | one-click branded banner for builder center profile |
| organizer         | batch 10 variants (en/es, light/dark, event dates)  |
| designer          | safe-center export without manual figma resize      |

## what exists today (before this lab)

- cdn star logo asset: `art/images/cloud-del-norte-star-logo/src/cdn-star-logo-clean.svg` (353 paths, 5-role fill-remap, 1024x1024 transparent) + `renders/cdn-star-logo-clean-1024.png`.
- website wallpaper themes: `el-paso-nights` (dark navy) + `gypsum-sands` (light cream `#ede5d4`), atmospheric surfaces, design tokens `src/styles/design-tokens.css` and `src/styles/tokens.css`.
- no builder-center-specific banner asset — meetup banner is the only prior banner reference ("Colors extracted from the Cloud del Norte Meetup banner — dark nebula sky with star-on-mountain logo").

## what good looks like

- **at a glance:** you know it is cdn in 2 seconds (navy→deep-purple nebula gradient, white star mark, Cinzel wordmark).
- **in builder center:** banner crops safely on mobile/desktop — headline stays inside central 1200x400 safe area, no text near edges.
- **as a builder:** you fork `addons/aws-builder-banner/`, change `headline` string, re-zip, re-upload — no figma, no designer.

## constraints

- dimensions inferred: `1440x400 desktop`, safe center `1200x400`, mobile crop `800x400` centered. max <5MB, JPG/PNG/SVG acceptable (og image is 1200x630, home banner is SVG).
- palette must be token-faithful: navy/dark-purple/violet/lavender/white + optional gold/aws-orange CTA.
- typography: Cinzel for wordmark, JetBrains Mono for subhead/mono details.
- accessibility: white on navy passes AAA, violet on navy passes AA for large text, no thin lavender on white.
- license: MIT for this lab's banner; cdn mark usage stays within community group branding (non-commercial community).

## references

- tokens: `~/code/chasko-labs/cloud-del-norte-website/src/styles/tokens.css` — `--cdn-navy #00002a`, `--cdn-purple #5a1f8a`, `--cdn-violet #9060f0`, `--cdn-lavender #d7c7ee`, `--cdn-gold #c9a23f`, `--cdn-aws-orange #ff9900`.
- logo: `art/images/cloud-del-norte-star-logo/README.md` + `src/cdn-star-logo-clean.svg`.
- wallpaper/design system: `docs/design-system/README.md`, `wallpaper/themes.md`, `wallpaper/tokens.md`.
- builder center: `builder.aws.com/start` (og image `og-hiXAX-on.png`), `src/locales/en-US.json` `builderCenterHeader: "AWS Builder Center"`.

## how this lab solves it

1. **spec** atomizes banner requirements → `spec/use-cases/aws-builder-center-banner-spec.md`.
2. **plan** maps steps to mcp grounding → `spec/use-cases/aws-builder-center-banner-plan.md`.
3. **add-on** `addons/aws-builder-banner/` uses `editor.createRectangle` + `makeColorFill` to draw 1440x400 composition via express document api — verifiable, re-exportable.
4. **asset** `docs/assets/aws-builder-center-banner.svg` (master) + PNG export is the shippable banner, embedded at top of README and this doc.

see spec/plan for atomized detail.
