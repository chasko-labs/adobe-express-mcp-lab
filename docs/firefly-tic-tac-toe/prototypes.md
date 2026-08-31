# Firefly Tic-Tac-Toe — Prototypes

> Three prototypes share one universal engine; only the art pipeline differs. P1 ships today (Babylon + `.glb`), P2 is the Firefly-native successor (2D image/video fills), P-universal is the shared core both plug into. All are grounded via the Adobe Express Developer MCP.

## Overview

| Prototype   | Codename            | Art pipeline                                                | 3D?                                  | Status                |
| ----------- | ------------------- | ----------------------------------------------------------- | ------------------------------------ | --------------------- |
| P1          | Sumerian Squares    | Host-loaded `.glb` (Babylon.js)                             | Yes — Babylon scene + Sumerian board | **Current / shipped** |
| P2          | Firefly Tic-Tac-Toe | Firefly `generateImage` / `generateVideo` → `makeImageFill` | No — 2D canvas, generative tiles     | Next                  |
| P-universal | Shared engine       | Agnostic — consumes either pipeline                         | Either                               | Shared                |

---

## P1 — Sumerian Squares (Babylon .glb, current)

The shipped game. A Babylon.js scene loads a Sumerian-themed `.glb` board (cuneiform tiles, clay texture) from the host. Question bank drives X/O placement; correct answers claim a square, win = 3-in-a-row. Sound FX on move/win. The document-sandbox owns rendering; the panel UI (`addOnUISdk`) owns game state and MCP-triggered regeneration. MCP hookup is `mcp.json` stdio (`npx @adobe/express-developer-mcp@latest`) → `addOnUISdk.ready` in the panel iframe → `runtime.exposeApi` in `code.js` for host-ops (load `.glb`, clear board).

```js
// P1 — host-loader .glb (document sandbox: code.js)
// Babylon path: fetch .glb URL, import into Express document via image/3d fill
import { editor } from "express-document-sdk";
import { loadGlb } from "./babylon-loader.js"; // thin wrapper around BABYLON.SceneLoader

export async function loadSumerianBoard({ glbUrl, boardSize = 3 }) {
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent — open a document");
  [...parent.children].forEach((c) => parent.children.remove(c));
  // Babylon: append .glb mesh as scene asset, then snapshot to Express rect
  const mesh = await loadGlb(glbUrl, { scale: 1.2 });
  const holder = editor.createRectangle();
  holder.width = 900;
  holder.height = 560;
  // in production: editor.makeImageFill(await mesh.renderThumbnail())
  holder.fill = editor.makeColorFill({
    red: 0.18,
    green: 0.12,
    blue: 0.08,
    alpha: 1,
  }); // clay fallback
  parent.children.append(holder);
  return { ok: true, mesh: mesh.name, boardSize };
}
if (editor?.runtime?.exposeApi) editor.runtime.exposeApi({ loadSumerianBoard });
else if (typeof runtime !== "undefined")
  runtime.exposeApi({ loadSumerianBoard });
```

**MCP hookup:** `mcp/mcp.json` stdio entry `adobe-express-developer` (`command: npx`, `args: ["@adobe/express-developer-mcp@latest","--yes"]`) bridges Cursor/Claude/VS Code → Express. Panel calls `addOnUISdk.ready` then `runtime.getApi("documentSandbox")` to invoke `loadSumerianBoard`.

---

## P2 — Firefly Tic-Tac-Toe (Firefly image/video 2D, no Babylon)

Same rules, no 3D runtime. Each tile, background, and win-line is a Firefly generation: `fetch` Firefly `generateImage` (or `generateVideo` for animated wins) → blob → `editor.makeImageFill`. Prompt is templated from the question category (e.g., "Sumerian clay tablet, cuneiform X, muted ochre, 1:1 tile"). Removes Babylon bundle (~600 KB), works on Express mobile, and lets players re-skin the board per game ("generate a neon Sumerian board"). Panel streams Firefly progress; sandbox only composites fills.

```js
// P2 — Firefly fetch + makeImageFill (document sandbox: code.js)
import { editor } from "express-document-sdk";

async function fireflyImageFill(prompt) {
  // via Adobe Firefly API (host-proxied or panel-fetched, then passed to sandbox)
  const res = await fetch("https://firefly-api.adobe.io/v3/images/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + FIREFLY_TOKEN,
    },
    body: JSON.stringify({ prompt, n: 1, size: { width: 512, height: 512 } }),
  });
  const { outputs } = await res.json();
  const blob = await (await fetch(outputs[0].image.url)).blob();
  const bitmap = await createImageBitmap(blob);
  return editor.makeImageFill(bitmap);
}

export async function generateHost({
  prompt = "Sumerian tic-tac-toe board, clay texture, 3x3 grid, top-down, warm light",
} = {}) {
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent");
  [...parent.children].forEach((c) => parent.children.remove(c));
  const bg = editor.createRectangle();
  bg.width = 1440;
  bg.height = 400; // hero mode, or 900x560 board mode
  bg.fill = await fireflyImageFill(prompt);
  parent.children.append(bg);
  return { ok: true, prompt };
}
// P2 also exposes generateTile / generateWinVideo similarly
if (editor?.runtime?.exposeApi)
  editor.runtime.exposeApi({ generateHost, fireflyImageFill });
```

**MCP hookup:** Same `mcp.json` stdio. Panel uses `addOnUISdk.ready` and `runtime.exposeApi`/`getApi` parity with P1 — swap `loadSumerianBoard` for `generateHost`; no Babylon dependency. Firefly calls can be panel-side (fetch) then `getApi().generateHost({imageBitmap})` into sandbox.

---

## P-universal — Shared engine (question-bank + SFX + rules)

The game engine both prototypes import. Pure JS, no rendering: `engine/` holds `checkWin(board)`, `applyMove`, `reset`; `question-bank.json` holds 60 Q&A (Sumerian history / cuneiform / Firefly prompts) with difficulty tags; `sfx/` holds move/correct/wrong/win clips. Either art pipeline calls `engine.onCorrect(tile) → claim → checkWin`. This is what makes the 6-frame storyboard "universal" — frames 1–6 are identical rules; only the art tag per row differs.

```js
// P-universal — shared engine (panel + sandbox agnostic, no Express import)
export const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
export function checkWin(board) {
  for (const [a, b, c] of WIN_LINES)
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return { winner: board[a], line: [a, b, c] };
  return board.every(Boolean) ? { winner: "draw" } : null;
}
export function createGame({ questions, onMove, sfx }) {
  let board = Array(9).fill(null),
    turn = "X",
    qi = 0;
  return {
    ask() {
      return questions[qi % questions.length];
    },
    play(answer) {
      const q = this.ask();
      const ok = answer === q.a;
      sfx?.[ok ? "correct" : "wrong"]?.play();
      if (ok) {
        board[qi % 9] = turn;
        onMove?.(board, turn);
        const w = checkWin(board);
        if (w) sfx?.win?.play();
        turn = turn === "X" ? "O" : "X";
      }
      qi++;
      return { ok, board: [...board], win: checkWin(board) };
    },
    reset() {
      board = Array(9).fill(null);
      qi = 0;
    },
  };
}
// question-bank.json: [{ q:"What script covers Sumerian tablets?", a:"Cuneiform", d:1 }, ...]
// sfx: { correct: new Audio("sfx/correct.mp3"), wrong: ..., win: ... }
```

**MCP hookup:** Engine itself has no MCP surface; it is bundled into both add-ons. The add-ons' `mcp.json` stdio + `addOnUISdk.ready` + `runtime.exposeApi`/`getApi` wiring (identical to `aws-builder-banner`) is what exposes `createGame` actions to the Express host. See `addons/firefly-tic-tac-toe/manifest.json` (V2 panel, reuses `aws-builder-banner` pattern) and `mcp/mcp.json`.

---

## MCP wiring summary

- **mcp.json (stdio):** `adobe-express-developer` server at `npx @adobe/express-developer-mcp@latest --yes` (variants for cursor / claude_desktop / vscode / heraldstack bridge). No HTTP.
- **Panel (iframe):** `import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js"; await addOnUISdk.ready; const sb = await runtime.getApi("documentSandbox"); sb.generateHost(...)`.
- **Sandbox (code.js):** `import { editor } from "express-document-sdk"; editor.runtime.exposeApi({ generateHost, clearArtboard, ... })`.
