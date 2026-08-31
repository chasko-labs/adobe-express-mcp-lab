# ASL Gloss Prompt — muse-glimmer-30b (ctx 4096)

## Model

- endpoint: `http://127.0.0.1:8181/v1/chat/completions`
- model: `muse-glimmer-30b`
- ctx: 4096
- temperature: 0.2
- max_tokens: 2048

## GPU Telemetry — Valkey `gpu_lock`

- Before call: `SET gpu_lock "glimmer: muse-glimmer-30b ctx=4096 held_at=<iso> owner=asl-glimmer-prep"` (NX, EX 300)
- Verify held: `GET gpu_lock` → contains `glimmer` and `muse-glimmer-30b`; server returns 503 if contended: `gpu_lock held by 'glimmer: ...' — serialized, retry later`
- After call: `DEL gpu_lock` → idle teardown; `GET gpu_lock` → nil

## Contract — Prior Result 1 (`addons/asl-concept`)

Grounded via `@adobe/express-developer-mcp@1.0.0` (`npx -y @adobe/express-developer-mcp@latest --yes`):

- `manifest.json` panel `asl-concept`, `documentSandbox:code.js`, Express apiVersion 1
- `index.html` theme pills Sumerian/Firefly/Universal, host toggle Babylon.js/Express, gloss/play toggles, 6-frame grid, `exposeApi`/`getApi('sandbox')`, play 420ms
- `code.js` `editor.createRectangle`/`makeColorFill`/`makeImageFill` → 6 cards 180x220 + Vary pill 48x18

Gloss set must cover these 6 frames × 12 glosses = 72 glosses, matching storyboard in `docs/asl-concept-guide/README.md`.

## System Prompt (sent to glimmer)

You are muse-glimmer-30b ctx4096 preparing ASL gloss pipeline for Adobe Express ASL Concept addon.
Generate JSON: 72 glosses, each { id, gloss, theme, host, glossOn, frame, en, ipa, nonManuals }.
Constraints: id `G01`-`G72`, gloss uppercase ASL (e.g., HELLO, THANK-YOU, LEARN, BABYLON, EXPRESS, CREATE, VARY), theme in [Sumerian, Firefly, Universal], host in [Babylon.js, Express], distribution 24 per theme, 36 per host, glossOn 50% true.

## User Prompt

Generate 72 ASL glosses for Express addon demo covering Sumerian/Firefly/Universal themes, Babylon.js/Express hosts, gloss/play toggles. Return JSON list aligned to VTT sample timestamps. Include Vary glosses for design variation.

## Output Artifacts

- `docs/asl/fixtures/vtt-sample.json` — input VTT fixtures (6 cues, one per frame)
- `docs/asl/gloss.json` — 72 glosses
- `docs/asl/cast.json` — avatar cast mapping for Babylon → Express insertion

## Verification

1. `GET gpu_lock` before = idle or not glimmer
2. `SET gpu_lock ...` → curl glimmer → expect 200 when exclusive; 503 proves lock held (serialized)
3. `DEL gpu_lock` → `GET gpu_lock` → nil (idle)
