# Sumerian Squares — Teardown

> Hugo `sumerian-squares` page → BabylonJS 9.3.4 scene → 9 draco `.glb` hosts + 6 animation layers → CloudFront `d161lxp8cb37vp` → 3×3 engine + 50-question bank. Source: `content/sumerian-squares/index.md` (layout: `sumerian-squares`), `assets/sumerian-squares/src` (19 modules), `content/sumerian-squares-how-this-works/index.md` (v0.038), `static/sumerian-squares/data/question-bank.json`, `tests/nova-act/test_ss_*.py` (6), `docs/design-system/DESIGN_SYSTEM_AND_CI_PLAN.md`, `constants.ts`/`types.ts`/`host-loader.ts`/`host-pool.ts`.

## 1. Hosts — 9 vendored CC-BY-SA-4.0

Fork `chasko-labs/sumerian-hosts` (clean-room reimplementation of `aws-samples/amazon-sumerian-hosts`, MIT-0 math extracted: curve coeffs, viseme mappings, state machine). Pure ESM, bun, BabylonJS 9.3.4 adapter.

| #   | HostId     | Type         | Archetype        | Shape    | Accent dark/light     | Hometown           | Mesh stats                           |
| --- | ---------- | ------------ | ---------------- | -------- | --------------------- | ------------------ | ------------------------------------ |
| 1   | `cristine` | adult_female | queen of heaven  | star     | `#e0a24a` / `#c9822b` | Uruk (Warka)       | 17 meshes, 134 joints, 9 mats, 5.2M  |
| 2   | `fiona`    | adult_female | warrior-queen    | shield   | `#2f8fb0` / `#2a7fa0` | Ur, Sumer          | 19 meshes, 134 joints, 12 mats, 28M  |
| 3   | `grace`    | adult_female | scribe-lawgiver  | hexagon  | `#3fae6f` / `#2f8f57` | —                  | 17 meshes, 134 joints, 8 mats, 8.5M  |
| 4   | `maya`     | adult_female | lament-singer    | diamond  | `#b060c0` / `#9a4aad` | marshes            | 16 meshes, 134 joints, 10 mats, 8.0M |
| 5   | `alien`    | alien        | primordial voice | triangle | `#2fc8c8` / `#1f9fa8` | cosmic (pre-Sumer) | 3 meshes, 93 joints, 3 mats, 1.9M    |
| 6   | `luke`     | adult_male   | warrior-king     | shield   | `#4a6ec0` / `#3f5ea8` | —                  | 15 meshes, 137 joints, 8 mats, 8.5M  |
| 7   | `jay`      | adult_male   | builder-king     | hexagon  | `#d4a020` / `#b8871a` | —                  | 13 meshes, 135 joints, 9 mats, 10M   |
| 8   | `preston`  | adult_male   | priest-king      | hexagon  | `#9a5ad0` / `#8248b8` | —                  | 18 meshes, 137 joints, 11 mats, 5.8M |
| 9   | `wes`      | adult_male   | scribe           | circle   | `#6fae40` / `#5c9433` | reed-marsh         | 13 meshes, 135 joints, 9 mats, 23M   |

`types.ts`: `HostId` 9-union, `HostType` `adult_female|adult_male|alien`, `HOST_TYPE_MAP` maps each id, `HostConfig {id, position 1-9, archetype, gltfUrl, hostType}`. All `gltfUrl` = `https://d161lxp8cb37vp.cloudfront.net/fixtures/hosts/<id>/<id>.glb` (`constants.ts:182-244`).

## 2. Full Feature Matrix — what Sumerian Hosts do

| Feature                   | Status                 | Module                                              | Detail                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------- | ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------- | -------- | -------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hugo page**             | WORKING                | `content/sumerian-squares/index.md`                 | `layout: sumerian-squares`, frontmatter `skipConstellation: true`, 2D grid renders immediately (~50KB HTML/CSS + 27KB 9 webp posters)                                                                                                                                                                                                                                       |
| **BabylonJS CDN**         | WORKING                | `app.ts:loadBabylon()`                              | Lazy `https://cdn.babylonjs.com/babylon.js` (~1.5MB) + `babylonjs.loaders.min.js` (~120KB) on first cell click, single `Engine` per active cell                                                                                                                                                                                                                             |
| **Draco host mesh**       | WORKING                | `host-loader.ts:ASSET_BASE`                         | `d161lxp8cb37vp.cloudfront.net/fixtures/hosts/<id>/<id>.glb` 250–400KB draco, `configureDraco()`                                                                                                                                                                                                                                                                            |
| **6 animation GLBs**      | WORKING (7 layers)     | `host-loader.ts:loadHostAnimations()`               | `stand_idle` ~1MB (405 targets, 480 frames, NON-additive, weight 0.35 during gesture), `lipsync` 2.7–3.3MB 18 groups, `gesture` 7.1–7.4MB 14 gestures, `emote` 2.3–2.9MB 3 clips, `face_micro` ~0.5MB loop, `blink` ~0.3MB 3 variants                                                                                                                                       |
| **Camera / framing**      | WORKING                | `camera.ts`                                         | Measured-geometry framing via `getHierarchyBoundingVectors` (feet/crown → face/gesture target + radius), `animateCam()` `QuadraticEase`, per-type fallback `CAMERA_FRAMING` (alien custom `faceTargetY/faceRadius`), `zoomToFace` on speech, `zoomToGesture`                                                                                                                |
| **POI tracker / gaze**    | WORKING (fixed v0.037) | `poi-tracker.ts`                                    | `poi.glb` 27 groups, `MakeAnimationAdditive` all groups, name-based `targetConverter` via `nodeByName`, `look_center` half-speed idle, mouse `mousemove` → yaw ±25° / pitch ±12° lerp 0.12 @30Hz rAF, weights `look_left/right/up/down/center` lerp 0.18, suspended during `playGesture/playEmote`, flags `__ssMouseGaze` / `?nogaze=1`                                     |
| **SFX**                   | WORKING                | `sfx.ts`                                            | Web Audio oscillators: ambient chords, host reveal tones, thinking chimes (`playThinkingChime`), steal alerts, bluff reveals (`playBluffReveal`), your-turn prompts, `StereoPannerNode` -0.7/0/+0.7 by column                                                                                                                                                               |
| **Lipsync**               | WORKING                | `lipsync-driver.ts` + `host-loader.ts`              | `VISEME_MAP` phoneme→GLB group (`p,b,m→p`, `f,v→f`, `T,D,S→S` etc) 18 groups, `beginDirectAnimation` frozen at peak + per-`Animatable.weight` RAF loop (aws `SingleState._createAnimatables` pattern), lazy-init on first speech (v0.030), ~7236 animatables                                                                                                                |
| **Fanfare / Enlil voice** | WORKING                | `enlil-voice.ts`, `host-pool.ts`                    | Polly Brian `en-GB` neural `welcome.mp3`+`welcome.json` + `/audio/enlil/q*.mp3`, fallback `speechSynthesis` Google UK English Male → Daniel, `sh-orb--speaking`, text “Welcome to Sumerian Squares, challenger awaits”, flag `ss-welcome-played` / `?fanfare`, orb pulse 1.06 180ms                                                                                         |
| **Nameplate**             | WORKING                | `constants.ts:HOST_SCORECARD` + CSS                 | Shared `.sh-nameplate` 3-row grid: badge shape × accent tint + name + archetype + city, `sh-host-accent`, anisotropic 4, hemi 0.85 + rim 0.5 jazz, `shadowsEnabled` 1024 PCF, header sweep + stage wash, arena gap 16px                                                                                                                                                     |
| **Question bank**         | WORKING                | `static/sumerian-squares/data/question-bank.json`   | Array `{id, category, question, correct_answer, hosts:{hostId:{quip, answer, bluff}}}` — spec 100, file currently 50 (q001–q050: mythology/history/language/science/culture), `<link rel=preload>` ~15KB, `textToId` map for Polly lookup                                                                                                                                   |
| **3×3 engine**            | WORKING                | `game.ts` + `game-controller.ts` + `ai-opponent.ts` | `Board` 9-tuple `Player                                                                                                                                                                                                                                                                                                                                                     | null`, `GamePhase` `select | answering | deciding | stealing | result | gameover`, `selectCell`/`playerDecision`/`hostAnswered`/`stealDecision`/`awardSquare`/`checkWinner`/`getWinningLine`, best 2-of-3 `gamesWon`, steal on wrong answer, `question-presenter.ts` `fetchQuestionBank→pickQuestion→playQuipAudio`with keyword gesture mapping,`audio-manager.ts`deferred`AudioContext`(pointer-only unlock, Safari`resume()`), `PLAYBACK_RATE 1.0` |
| **CloudFront**            | WORKING                | `host-loader.ts:24`, `host-pool.ts:217`             | `d161lxp8cb37vp.cloudfront.net/fixtures/` — hosts, `animations/<hostType>/stand_idle.glb`, `gesture.glb/json`, `lipsync.glb`, `emote.glb`, `face_micro.glb`, `blink.glb`, `poi.glb`, `audio/enlil/` — 24h cache (fingerprinted JS), BG preload via `requestIdleCallback` (3000ms) / `setTimeout 800` → `<link rel=prefetch>` + `fetch force-cache` for Enlil + next 3 hosts |
| **Host pool / perf**      | WORKING v0.038         | `host-pool.ts`                                      | Persistent pool cap via `deviceMemory`/`hardwareConcurrency` (9 desktop ≥8GB/8c, 6 phone 6GB, 2 on 2GB, 4 default, `?cap=N`, flags `__ssBgPreload`/`__ssPersistHosts`), LRU eviction (`stopRenderLoop`→`scene/engine dispose`), target <300MB @9, idle FCP <1s, cached open <400ms vs 5s cold 5Mbps                                                                         |
| **Idle liveliness**       | WORKING                | `engine.ts`                                         | `stand_idle` + `face_micro` loop + `generic_a/b` 6–10s + hemi breathe ±0.06 @220ms + `look_center` half-speed                                                                                                                                                                                                                                                               |
| **Tap reactions**         | WORKING                | `poi-tracker.ts`                                    | `pointerdown` orb/canvas → `generic_a`/nod, debounced 300ms, non-disruptive                                                                                                                                                                                                                                                                                                 |
| **NOT wired**             | NOT IMPLEMENTED        | `how-this-works/index.md`                           | Ambient host reactions (head nods toward square), inter-host `emit-message/listen-message` (Jake Smeester pattern) — `poi.glb` exists but tracker simplified                                                                                                                                                                                                                |

### Tests (nova-act, `tests/nova-act/test_ss_*.py` — 6)

`test_ss_dogfood.py` (3-turn 3D validation, black-screen race fix), `test_ss_edge_cases.py` (double-click, occupied-cell, rapid-input guards), `test_ss_game_flow.py`, `test_ss_host_matrix.py` (9-host), `test_ss_keyboard_nav.py`, `test_ss_visual_interaction.py` — all `@workflow(nova-act-latest, "sumerian-squares-3d-validation")` against `https://bryanchasko.com/sumerian-squares/`, Playwright `canvas.sh-cell__canvas--visible` / `.sh-cell__poster--hidden` assertions.

### Design system + logo

`docs/design-system/DESIGN_SYSTEM_AND_CI_PLAN.md` — nebula tokens (`core/theme-vars.css`, `nebula.css` 146 tokens, `data/theme.yaml` ledger), DTCG + Style Dictionary target, biome-only lint, `ghost-liora` CSS owner. No `art/images/cloud-del-norte-star-logo` file on disk (path requested but absent; `art/` not found — logo treated as brand mark, not runtime asset). `/tmp/adobe-express-mcp-lab` not present on host (empty `ls`).

## 3. Storyboard — current flow (frames 1–6)

```
Frame 1 — Hugo page (2D)
  ┌─────────────────────────────────┐
  │  bryanchasko.com/sumerian-squares/  layout: sumerian-squares │
  │  3×3 grid, 9 posters (webp ~27KB), Enlil orb, score 0-0   │
  │  bundle ~40KB deferred, question-bank preload ~15KB      │
  └─────────────────────────────────┘
              │ first cell click
              ▼
Frame 2 — Babylon scene (load chain ~18-20MB sequential)
  HTML hidden → loadBabylon() → babylon.js 1.5MB → loaders 120KB
  → draco host GLB 250-400KB → stand_idle ~1MB → lipsync 2.7MB (deferred merge)
  → gesture 7.1MB → gesture.json 4.6KB → emote 2.3MB → face_micro 0.5MB
  → blink 0.3MB → poi 2.7MB  [black screen until +300ms settle]
  Engine+Scene+Canvas created, shadows PCF 1024, accent tint applied
              │ 300ms settle, poster→canvas
              ▼
Frame 3 — Host idle (lively)
  stand_idle loop (405 targets, 480f) + face_micro additive
  + blink scheduler 3-6s + POI look_center half-speed
  + hemi breathe jitter + generic_a/b 6-10s + mouse gaze follow
  canvas.sh-cell__canvas--visible, .sh-nameplate (badge+name+archetype+city)
              │ Enlil reads question aloud
              ▼
Frame 4 — Question (Enlil + host speech)
  enlil-voice: Polly Brian welcome/q*.mp3 || Web Speech UK Male
  → question text rendered, quip audio lazy-loaded (~50-100KB)
  → zoomToFace (QuadraticEase), lipsync merge (MakeAnimationAdditive 18 groups,
    7236 animatables weight-driven), entrance gesture (14) + keyword gesture,
    StereoPanner -0.7/0/+0.7, SFX thinking chime
  Player → [AGREE] [DISAGREE] (pointer unlocks AudioContext)
              │ decision → host answer reveal
              ▼
Frame 5 — Move (3×3 engine)
  playerDecision(isBluff check) → if wrong → stealing phase
  → stealDecision(stealCorrect = agrees?!isBluff) → awardSquare
  → updateBoard → checkWinner/getWinningLine → gameover? → score +1
  → mark X/O placed, CPU turn: ai-opponent shows "agrees..." + bluff reveal
  → SFX steal/bluff, Enlil reads on both turns, auto-advance 3s on wrong,
  → button-mash skip (v0.031) stops audio/lipsync → next select
              │ best 2-of-3 match complete
              ▼
Frame 6 — Fanfare (match win)
  Winning line highlighted, victory emote (applause/cheer/bored)
  → SFX fanfare chord via oscillators, orb pulse sh-orb--speaking
  → welcome fanfare once ("Welcome to Sumerian Squares, challenger awaits")
  → nameplate rizz (anisotropic, hemi+rim, stage glow 12s)
  → HostPool LRU keeps ≤cap hosts alive, BG preload next 3
  → "Play again" → startNextGame resets board
```

**Known bug fixed v0.037:** horse-face (jaw at `(0,0,0)` bind pose) — 24 non-additive POI groups + broken `targetConverter` returning disposed source node; fix: name-based retarget via `nodeByName`, all 27 additive, non-active stopped. Diagnostic: `jawNode.position` expected `(0,0.8337,1.4404)`.

## 4. Firefly tic-tac-toe — what to keep / what to replace

Keep: 9-host roster + archetype/shape/accent, question-bank shape `{quip,answer,bluff}`, 3×3 phases + steal + best-of-3, Babylon CDN lazy-load pattern, 6-GLB layering (stand_idle→face_micro→blink→poi→gesture→emote→lipsync), camera measured framing, SFX panning, CloudFront fixture layout, HostPool cap/LRU + BG preload.
Replace: draco `.glb` hosts → Firefly `<model>` / `<scene>` (Adobe Express MCP), POI mouse gaze → Firefly camera, Polly/WSS → Firefly TTS, `d161lxp8cb37vp` → Express asset CDN.

---

_Teams checklist models seen on site: https://bryanchasko.com/teams/_
