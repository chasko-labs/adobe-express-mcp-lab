# plan — aws builder center banner (cloud del norte)

## goal

ship `docs/assets/aws-builder-center-banner.svg` (1440x400) + PNG via the mcp-grounded add-on `addons/aws-builder-banner/` so any builder can fork, recolor copy, and re-export.

## steps

### 1. research (done)

- pulled cdn tokens (`tokens.css`): navy/violet/lavender/gold/aws-orange, fonts Cinzel/JetBrains Mono, star mark 5-role remap.
- probed builder center: no public banner dimensions; inferred `1440x400` desktop, safe `1200x400`, via `og image 1200x630` + `Banner_Home_Light.svg` pattern and typical `1440x400` / `1200x230` builder covers.
- confirmed mcp `1.0.0` via `npm view --json` (stdio, 197kB).

### 2. spec

- atomized to `spec/use-cases/aws-builder-center-banner-spec.md` — dimensions, palette, typography, layout coordinates, copy, a11y, acceptance.

### 3. generate master asset (this plan)

- author `docs/assets/aws-builder-center-banner.svg` hand-coded to spec (gradient `#00002a→#30006a`, star mark, Cinzel + Mono, cta `#ff9900`).
- export `docs/assets/aws-builder-center-banner-1440x400.png` via `rsvg-convert -w 1440 -h 400 -o ...` (<5MB check).

### 4. add-on for regenerability (mcp-grounded)

- scaffold `addons/aws-builder-banner/`:
  - `manifest.json` — `manifestVersion: 2`, `panel` entry `documentSandbox: "code.js"`.
  - `index.html` — `https://express.adobe.com/static/add-on-sdk/sdk.js` + `addOnUISdk.ready`, controls for headline/subhead, button `Generate 1440×400`.
  - `code.js` — `import { editor } from "express-document-sdk"` → `editor.createRectangle` for background, star frame, cta pill + `editor.createText` for Cinzel/Mono copy (fallback to rectangles if text api limited), `makeColorFill` with token colors, `insertionParent.children.append`.
- verify without hallucination: all apis from `docs/mcp-technical.md` + `docs/ecosystem.md` (§4 `editor` pattern).

### 5. embed & display

- update `README.md` top: insert `![AWS Builder Center banner](docs/assets/aws-builder-center-banner.svg)` below title/mermaid, link to use-case doc.
- update `docs/use-cases/aws-builder-center-banner.md` — already embeds raw svg.

### 6. validate

- [ ] svg at 1440x400, headline inside 1200 safe, eyedrop palette.
- [ ] `rsvg-convert` png <5MB, no overflow at 800x400 center crop.
- [ ] `npx prettier --write` on all `md` — global hook passes.
- [ ] sideload `addons/aws-builder-banner` zip in express → preview → export 1440x400 → pixel-match svg.

### 7. push

```bash
git add docs/use-cases/aws-builder-center-banner.md spec/use-cases/aws-builder-center-banner-*.md docs/assets/aws-builder-center-banner.* addons/aws-builder-banner/ README.md
npx prettier --write <md files>
git commit -m "feat: cloud del norte aws builder center banner + use-case/spec/plan"
git push origin main  # https://github.com/chasko-labs/adobe-express-mcp-lab
```

### dependencies

- none blocked — add-on is static, no backend, no rtdcp pii.

### risks

- builder center banner spec inferred — mark as `inferred 1440x400` with safe 1200, document fallback.
- star mark 353-path embed too heavy for svg master — use simplified 5-point star + lattice lines at banner scale; link to full `cdn-star-logo-clean.svg` for print.
