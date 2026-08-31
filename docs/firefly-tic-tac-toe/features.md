# Firefly Tic-Tac-Toe — Feature Inventory

> Generated for: Sumerian Squares / Firefly Tic-Tac-Toe add-on design. Maps Firefly Services + Firefly in Express to the 9-host board. Style notes derived from existing `docs/assets/*.svg` in this repo.

| Capability                                | Where it lives                                                                | What it does for 9 hosts                                                                               | Source                                                                                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Text-to-Image Image Model 4 (Image 4)** | Firefly API `POST /v2/images/generate` — Image Model 4 / Image 5 (native 4MP) | Base generator for host portraits — prompt + size + seed per cell                                      | [Firefly Services overview](https://developer.adobe.com/firefly-services/docs/) · [Firefly API](https://developer.adobe.com/firefly-services/docs/firefly-api/)                                  |
| **Structure Reference**                   | Firefly API — `structureReference` / `styleReference` controls                | Keep pose/composition identical across 9 cells while varying god/pose (one wireframe → 9 outputs)      | [Firefly API — Custom Models & controls](https://developer.adobe.com/firefly-services/docs/firefly-api/)                                                                                         |
| **Style Reference**                       | Firefly API — `styleReference` asset + strength                               | Lock Sumerian seal / clay-tablet / nebula palette across all hosts (brand consistency)                 | [Firefly API — Custom Models & style](https://developer.adobe.com/firefly-services/docs/firefly-api/)                                                                                            |
| **Generative Fill**                       | Photoshop API + Firefly (inpaint)                                             | Fix cropped wings/hands on a single host without regenerating all 9                                    | [Firefly Services — Photoshop API](https://developer.adobe.com/firefly-services/docs/)                                                                                                           |
| **Generative Expand (Outpaint)**          | Photoshop API — generative expand                                             | Extend 1:1 host square to 16:9 banner or safe-area 1200×400 without stretch                            | [Firefly Services — Photoshop API](https://developer.adobe.com/firefly-services/docs/)                                                                                                           |
| **Text-to-Vector**                        | Firefly API / Illustrator API — text-to-vector                                | Generate clean X/O glyphs as editable SVG vectors (not raster) for board marks                         | [Firefly Services — Illustrator API](https://developer.adobe.com/firefly-services/docs/)                                                                                                         |
| **Text Effects (styles)**                 | Firefly API — text effects / styles                                           | Stylize X/O as cuneiform-carved, gold-foil, or neon — per-player theme                                 | [Firefly API](https://developer.adobe.com/firefly-services/docs/firefly-api/)                                                                                                                    |
| **Image-to-Video (Generate Video)**       | Firefly Video / Audio-Video API                                               | Optional 2-sec loop per host (breathing statue) — overkill for static board; reserve for win animation | [Firefly Services — Audio/Video API](https://developer.adobe.com/firefly-services/docs/)                                                                                                         |
| **Firefly in Express (embedded)**         | Express add-on iframe — `fetch` to Firefly, no sandbox needed                 | User picks prompt in panel → iframe calls Firefly → returns URL → sandbox paints it                    | [Firefly Services overview](https://developer.adobe.com/firefly-services/docs/) + iframe/sandbox split below                                                                                     |
| **Express add-on runtime**                | Add-on SDK — iframe (UI) + Document Sandbox (`code.js`)                       | Iframe does network/auth/storage; sandbox alone may call `express-document-sdk`                        | [hello-world manifest `manifestVersion:2`](file:///tmp/adobe-express-mcp-lab/addons/hello-world/manifest.json) · docs/assets `sandbox-iframe-flow.svg`                                           |
| **MCP grounding**                         | `@adobe/express-developer-mcp@1.0.0` stdio                                    | Prevents hallucinated `createRectangle` — LLM returns verified types via `npx` stdio bridge            | [MCP Server docs](https://developer.adobe.com/express/add-ons/docs/guides/getting-started/local-development/mcp-server) · `npm view @adobe/express-developer-mcp --json` v1.0.0 · `mcp/mcp.json` |

## 1. Firefly Services deep inventory

### 1.1 Image generation (core for Tic-Tac-Toe)

- **Endpoint:** `https://firefly-api.adobe.io/v2/images/generate` — authenticated via IMS OAuth (JWT/ OAuth 2.0), header `X-Api-Key` + `Authorization: Bearer`.
- **Model choices:** `image4_standard`, `image4_creative`, `image3`, `image5` (latest, 4MP native). Use `image4_creative` for mythic hosts; `image5` if you need Instruct Edit in one call. [Firefly API](https://developer.adobe.com/firefly-services/docs/firefly-api/)
- **Key params:** `prompt` (required), `size` (`{width,height}` 512–2048), `n` (1–4), `seeds` (per-image determinism), `style { presets: [...] }`, `structure { image: {source:{url}}, strength: 0–100 }`, `styleReference { image:{source:{url}}, strength }`, `customModelId` (brand host fine-tune).
- **Why it matters for 9 hosts:** Generate 9 images in 3 calls (`n=4,4,1`) with same `seeds`+`styleReference`+`structureReference` → consistent pantheon. Without structure ref, each god drifts.

### 1.2 Structure Reference vs Style Reference

- **Structure:** Grayscale wireframe / line art uploaded as `source.url` (presigned S3). `strength` ~80 keeps pose, lets texture vary. Use one Sumerian grid wireframe for all 9.
- **Style:** Color/texture asset (clay, lapis, nebula). `strength` ~60–85. Separating the two lets you say "same pose, different god's palette" without retraining.

### 1.3 Generative Fill & Expand (Photoshop API)

- `POST /v2/images/fill` (mask + prompt) and `POST /v2/images/expand` — same auth, same storage pattern. Useful post-generation cleanup per cell; not needed at first paint, but include for "regenerate hand" flow.

### 1.4 Text-to-Vector & Text Effects

- **Text-to-Vector:** Prompt → editable SVG outlines (Illustrator API). For X/O, prompt `cuneiform X, single stroke, transparent bg` → import as vector, recolor via `fill`.
- **Text Effects:** `POST /v2/images/text-effects` — prompt + font + style preset → raster text with Firefly style. Raster is heavier; prefer vector for board marks, text-effects only for title card.

### 1.5 Image-to-Video

- `POST /v2/videos/generate` (Audio/Video API) with `image.source.url` + `prompt: "subtle breathing, dust motes"`. Returns `video.url` (MP4). Cost/latency ~10× image. Recommendation: **do not** use for 9 hosts at idle; reserve for win-line animation (one video on win).

## 2. Firefly in Express (iframe fetch pattern)

Express add-ons run **two contexts** — verified in this lab:

- `index.html` (iframe, full DOM/fetch/OAuth) — where you call Firefly.
- `code.js` (Document Sandbox, `express-document-sdk` only sync thread, no `fetch`, no `popup`) — where you paint.

Bridge: `runtime.exposeApi` / `runtime.getApi` (see `docs/assets/sandbox-iframe-flow.svg`, `mcp-architecture.svg`). Style of those SVGs (the source of truth for this doc's diagrams): `rx:10–12`, `fill:#fafafa` canvas, `stroke:#5258eb` 1.4–1.5px, `system-ui` sans-serif 8–13px, marker arrows, `fill:#fff` boxes with `stroke:#ddd` — minimal flat, no gradients except banner nebula. Reuse that palette (`#5258eb`, `#1a8a1a`, `#1a1a1a`, `#fafafa`) for `features.svg` if you add one.

Flow: Panel button → `fetchFirefly(prompt)` in iframe → receive `https://.../generated.png` → `sandbox.makeImageFill(url)` → `editor.createRectangle()` → `insertionParent.children.append`.

## 3. What maps to 9 hosts — decision matrix

| Need                | Option A: Image per pose (recommended)                                                                        | Option B: Video loop                                                                                                                                           | Option C: Text effect for X/O                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Per-host visual** | 9 images, one per god, `structureReference` locked, `seed` per host deterministic. Fast (<5s), cheap, caches. | 9 videos (one per host idle loop). 10× cost, needs `<video>` fill (not supported in sandbox `makeImageFill` — would need `<video>` element hack). Distracting. | Not applicable — text effects are for marks, not hosts.                                                                     |
| **X / O marks**     | N/A — use vector overlay on top of host image (overlay rectangle + `makeImageFill` from text-to-vector SVG).  | N/A                                                                                                                                                            | **Winner for marks:** Text-to-vector SVG → `createPath` or image fill with transparent bg. Crisp at any scale, recolorable. |
| **Win animation**   | Flash overlay rectangle (sandbox `colorFill` pulse)                                                           | **Winner for win:** Single image-to-video on the 3-in-a-row, 2s loop, play once. One video, not nine.                                                          | Could do gold text-effect for "WIN" banner.                                                                                 |
| **Latency**         | 2–4s for 9 images (batched)                                                                                   | 15–30s for 9 videos                                                                                                                                            | <1s local SVG                                                                                                               |
| **Verdict**         | **Primary** — ship this first. `style+structure+seed` snippet below.                                          | Deferred / win-only.                                                                                                                                           | **Ship for X/O** — vector X/O, not Firefly video.                                                                           |

Derived rule: **image-per-pose for hosts + vector X/O + optional single win video**.

## 4. Code snippets (copy-paste)

### 4.1 Iframe — `fetch` to `firefly-api.adobe.io/v2/images/generate` (style + structure + seed)

> Runs in `index.html` (iframe) — never in `code.js`. Requires IMS token forwarded from OAuth flow.

```js
// index.html — iframe (has fetch, has token)
const FF_URL = "https://firefly-api.adobe.io/v2/images/generate";
const STYLE_REF_URL = await uploadToPresignedS3(stylePngBlob); // your S3 presigned PUT
const STRUCT_REF_URL = await uploadToPresignedS3(wireframePngBlob); // grayscale grid

async function fireflyHost(prompt, seed) {
  const res = await fetch(FF_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${imsAccessToken}`,
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify({
      prompt, // e.g. "Sumerian god Enlil, clay seal, nebula dust, centered bust"
      n: 1,
      size: { width: 1024, height: 1024 },
      seeds: [seed], // deterministic per host 1..9
      style: { presets: ["clay", "mythic"] },
      structure: { image: { source: { url: STRUCT_REF_URL } }, strength: 80 },
      styleReference: {
        image: { source: { url: STYLE_REF_URL } },
        strength: 75,
      },
      // customModelId: "urn:adobe:custom-model:..." // if you trained a Sumerian style model
    }),
  });
  if (!res.ok) throw new Error(`Firefly ${res.status}: ${await res.text()}`);
  const { outputs } = await res.json(); // { outputs: [{ image: { url: "https://..." } }] }
  return outputs[0].image.url; // pass this URL to sandbox via bridge
}

// batch 9 hosts with structure+style locked, seed per cell
const hostSeeds = [101, 102, 103, 104, 105, 106, 107, 108, 109];
const urls = await Promise.all(
  hostSeeds.map((seed, i) =>
    fireflyHost(
      `Sumerian deity host ${i + 1}, ${["Enlil", "Enki", "Inanna", "Utu", "Nanna", "Ishtar", "Marduk", "Nabu", "Ereshkigal"][i]}`,
      seed,
    ),
  ),
);
for (const url of urls) await sandboxProxy.addHostImage(url); // → snippet 4.2
```

Source: [Firefly Services docs](https://developer.adobe.com/firefly-services/docs/) · [Firefly API](https://developer.adobe.com/firefly-services/docs/firefly-api/) — endpoint, structure/styleReference, seeds.

### 4.2 Sandbox — `editor.createRectangle` + `makeImageFill`

> Runs in `code.js` (Document Sandbox) — synchronous, no fetch. Receives URL from iframe via `runtime.exposeApi`.

```js
// code.js — Document Sandbox (express-document-sdk only)
import { editor } from "express-document-sdk";

const CELL = 300; // 3×3 board, 900×900 — matches existing hello-world 200×150 pattern scaled

export function addHostImage(url, row, col) {
  const rect = editor.createRectangle();
  rect.width = CELL;
  rect.height = CELL;
  rect.translation = { x: col * CELL, y: row * CELL };
  rect.fill = editor.makeImageFill(url); // url from iframe fetch above
  rect.stroke = editor.makeStroke({
    color: editor.makeColorFill(editor.createColor(0.33, 0.33, 0.92)),
    width: 2,
  });
  editor.context.insertionParent.children.append(rect);
  return rect;
}

export function addVectorXO(svgUrl, row, col, player /* "X"|"O" */) {
  // X/O as text-to-vector SVG — also via makeImageFill with transparent bg
  const mark = editor.createRectangle();
  mark.width = CELL * 0.6;
  mark.height = CELL * 0.6;
  mark.translation = { x: col * CELL + CELL * 0.2, y: row * CELL + CELL * 0.2 };
  mark.fill = editor.makeImageFill(svgUrl); // svgUrl from Firefly text-to-vector or local asset
  editor.context.insertionParent.children.append(mark);
}

// bridge exposure — iframe calls these
import { runtime } from "express-document-sdk"; // actual import is via addOnSandboxSdk
runtime.exposeApi({ addHostImage, addVectorXO });
```

Source: Lab `addons/hello-world/code.js` pattern + `docs/assets/sandbox-iframe-flow.svg` + `mcp-architecture.svg` — `editor.createRectangle`, `makeImageFill`, `insertionParent.children.append` are the verified sandbox APIs (hallucinated alternatives fail).

### 4.3 `mcp.json` — stdio (1.0.0)

> Shipped as `mcp/mcp.json` in this lab. Verified `1.0.0` is latest.

```json
{
  "mcpServers": {
    "adobe-express-developer": {
      "command": "npx",
      "args": ["@adobe/express-developer-mcp@latest", "--yes"]
    }
  }
}
```

Claude Desktop / Cursor / VS Code / HeraldStack variants in `mcp/mcp.json` are identical — `command: npx`, `args: ["@adobe/express-developer-mcp@latest","--yes"]`, `transport: stdio`, no `env`, no auth.

Verified: `npm view @adobe/express-developer-mcp --json` → `version: 1.0.0`, `bin: adobe-express-developer-mcp-server: bin/run.js`, `engines.node >=18`, `dependencies: @modelcontextprotocol/sdk 1.12.0`, `dist.unpackedSize 197185`. Bridge launcher is `mcp/adobe-express-bridge.sh` → `exec npx -y @adobe/express-developer-mcp@latest --yes`.

Sources: [MCP Server docs](https://developer.adobe.com/express/add-ons/docs/guides/getting-started/local-development/mcp-server) · `npm view @adobe/express-developer-mcp --json` (1.0.0, 2026-01-14) · `/tmp/adobe-express-mcp-lab/mcp/mcp.json` · `docs/assets/mcp-architecture.svg`.

## 5. Style notes (so future `features.svg` matches the repo)

Existing SVGs in `/tmp/adobe-express-mcp-lab/docs/assets/*.svg` inspected directly:

- Canvas: `fill #fafafa`, `rx 12`, `width 900` standard, `viewBox 0 0 900 320–420`.
- Boxes: `fill #fff` / `fill #eef0ff` (blue) / `fill #e6f5e6` (green), `stroke #5258eb` 1.4–1.5px (blue) or `#1a8a1a` (green), `rx 10`.
- Typography: `system-ui, sans-serif` 8–13px (labels 11–13 bold), `ui-monospace` 6–8px for code.
- Arrows: `marker-end url(#arrow)` filled `#5258eb`, `stroke-width 1.6–1.8`.
- Banner (`aws-builder-center-banner.svg` 1440×400): nebula gradient `#00002a→#12023a→#30006a`, glow filter `feGaussianBlur 6`, star-on-mountain mark 160×160 at (180,200), wordmark `Cinzel` 54pt, `JetBrains Mono` 10–16pt, safe area `1200×400` dashed `rgba(255,255,255,0.04)`.

Reuse for Firefly Tic-Tac-Toe board diagram: 900×900 board = 3× `CELL 300`, same `rx`, same `stroke`.

## 6. Recommendation — ordered build

1. **Ship image-per-pose** (snippet 4.1+4.2) with one `STRUCT_REF_URL` + one `STYLE_REF_URL` + 9 seeds. Cache URLs in `localStorage` (iframe) keyed by `prompt|seed`.
2. **Ship vector X/O** via local SVG or Firefly text-to-vector; overlay via `addVectorXO`.
3. **Defer video** — add win-only `image-to-video` after board is stable.
4. Ground all LLM generations via MCP stdio (snippet 4.3) — do not accept `app.document.addRectangle` hallucinations; enforce `editor.createRectangle` + `editor.makeColorFill` / `makeImageFill` from `@adobe/ccweb-add-on-sdk-types`.

---

_Sources per claim inline above. Lab paths: `/tmp/adobe-express-mcp-lab/docs/assets/_.svg`, `/tmp/adobe-express-mcp-lab/mcp/mcp.json`, `/tmp/adobe-express-mcp-lab/addons/hello-world/manifest.json`+`code.js`.\*
