---
title: "ASL Demo — Firefly Tic-Tac-Toe"
layout: asl-demo
type: page
description: "ASL avatar demo — 6-frame gloss pipeline (Sumerian/Firefly/Universal × Babylon/Express) for Firefly Tic-Tac-Toe"
url: /firefly-tic-tac-toe/asl-demo/
skipConstellation: true
---

This file renders via `layouts/page/asl-demo.html` (Hugo sibling, no `s3-prefix-registry.json` entry — see `spec/asl/spec.md` ASL-ROUTE-01/03/04). Demo previews the 6-frame gloss pipeline (72 glosses G01–G72, 420ms each, 12 per frame) without bundling Babylon on Hugo.

Refs: prior result 1 `addons/asl-concept` (manifestVersion 2 panel `asl-concept` `addOnUISdk.ready` + `editor.createRectangle`/`makeImageFill`), prior result 2 `docs/asl/gloss.json` 72 G01–G72 + `docs/asl/cast.json` 6 avatars + `gpu_lock` `muse-glimmer-30b`, prior result 3 `latrodectus-bishopi-hand.blend` 42 joints 74–115 HOST_SCORECARD + `asl-actions.blend` 72 NLA, prior result 4 `renders/contact-sheet` 72 PNGs + `datasets/<host>.zip` class `sumerianHost <id>`, prior result 5 `animation-mixer.ts` `ASL_HANDS_RANGE [74,115]`, prior result 6 `addons/asl-lab` 4 controls seed 4219, prior result 7 Firefly Twin `styleReference`/`structureReference`/`firefly-api.adobe.io`.

See also the ever-improving living guide at [/firefly-tic-tac-toe/asl-guide/](/firefly-tic-tac-toe/asl-guide/) (`docs/asl-concept-guide/README.md`).
