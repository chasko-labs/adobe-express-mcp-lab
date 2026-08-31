// code.js — document sandbox (synchronous thread, limited Web APIs)
// Grounded by @adobe/express-developer-mcp — express-document-sdk `editor`
// Babylon.js + Firefly ASL avatar concept: draws Vary-badge cards that represent
// Firefly-generated avatar frames / Babylon.js avatar states.
import { editor } from "express-document-sdk";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}
function fromRGB(r, g, b, a = 1) {
  return { red: r, green: g, blue: b, alpha: a };
}

// Design tokens — ASL concept palette (navy, violet, gold, lavender)
const TOKENS = {
  navy: "#00002a",
  deep: "#30006a",
  violet: "#9060f0",
  lavender: "#d7c7ee",
  gold: "#c9a23f",
  awsOrange: "#ff9900",
  firefly: "#ff3366",
  sumerian: "#c9a23f",
  universal: "#5258eb",
};

function clearArtboard() {
  const parent = editor.context.insertionParent;
  if (!parent?.children)
    throw new Error("no insertionParent — open a document");
  const toRemove = [...parent.children];
  for (const c of toRemove) parent.children.remove(c);
  return { ok: true, removed: toRemove.length };
}

function badgeRect({ x, y, w, h, fillHex, label }) {
  const parent = editor.context.insertionParent;
  const rect = editor.createRectangle();
  rect.width = w;
  rect.height = h;
  rect.translation = { x, y };
  const [r, g, b] = hexToRgb(fillHex);
  rect.fill = editor.makeColorFill(fromRGB(r, g, b, 1));
  // corner radius if available
  try {
    rect.cornerRadius = 8;
  } catch {}
  parent.children.append(rect);
  // Vary badge — small gold pill in corner to indicate Firefly Vary-ready
  const badge = editor.createRectangle();
  badge.width = 48;
  badge.height = 18;
  badge.translation = { x: x + w - 54, y: y + 6 };
  const [br, bg, bb] = hexToRgb(TOKENS.gold);
  badge.fill = editor.makeColorFill(fromRGB(br, bg, bb, 1));
  try {
    badge.cornerRadius = 9;
  } catch {}
  parent.children.append(badge);
  return rect;
}

async function renderASLConcept(opts = {}) {
  const {
    theme = "sumerian", // sumerian | firefly | universal
    host = "babylon", // host toggle
    gloss = true,
    width = 1440,
    height = 400,
  } = opts;
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent — open a document");
  clearArtboard();

  // Background
  const bg = editor.createRectangle();
  bg.width = width;
  bg.height = height;
  bg.translation = { x: 0, y: 0 };
  const [r, g, b] = hexToRgb(TOKENS.navy);
  bg.fill = editor.makeColorFill(fromRGB(r, g, b, 1));
  parent.children.append(bg);

  // If Firefly bitmap supplied, demonstrate makeImageFill (grounded API)
  if (opts.imageBitmap) {
    const img = editor.createRectangle();
    img.width = width;
    img.height = height;
    img.translation = { x: 0, y: 0 };
    try {
      img.fill = editor.makeImageFill(opts.imageBitmap);
      parent.children.append(img);
    } catch (e) {}
  }

  // Card grid — 6 frames representing ASL gloss sequence
  const themes = {
    sumerian: { card: "#1a1040", accent: TOKENS.sumerian },
    firefly: { card: "#2a0a2a", accent: TOKENS.firefly },
    universal: { card: "#1a1a3a", accent: TOKENS.universal },
  };
  const t = themes[theme] || themes.sumerian;
  const glosses = ["HELLO", "WORLD", "FIREFLY", "AVATAR", "SIGN", "PLAY"];
  const cardW = 180,
    cardH = 220,
    gap = 24,
    startX = 48,
    startY = 80;
  for (let i = 0; i < 6; i++) {
    const col = i % 3,
      row = Math.floor(i / 3);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap + 22);
    badgeRect({ x, y, w: cardW, h: cardH, fillHex: t.card, label: glosses[i] });
    // gloss bar
    const bar = editor.createRectangle();
    bar.width = cardW;
    bar.height = 4;
    bar.translation = { x, y: y + cardH - 4 };
    const [ar, ag, ab] = hexToRgb(t.accent);
    bar.fill = editor.makeColorFill(fromRGB(ar, ag, ab, 1));
    parent.children.append(bar);
    // gloss highlight if enabled
    if (gloss) {
      const glossRect = editor.createRectangle();
      glossRect.width = cardW - 12;
      glossRect.height = 18;
      glossRect.translation = { x: x + 6, y: y + cardH + 8 };
      const [lr, lg, lb] = hexToRgb(TOKENS.lavender);
      glossRect.fill = editor.makeColorFill(fromRGB(lr, lg, lb, 0.18));
      parent.children.append(glossRect);
    }
  }
  // Host label bar
  const hostBar = editor.createRectangle();
  hostBar.width = width - 96;
  hostBar.height = 28;
  hostBar.translation = { x: 48, y: 12 };
  const [hr, hg, hb] = hexToRgb(
    host === "babylon" ? TOKENS.violet : TOKENS.deep,
  );
  hostBar.fill = editor.makeColorFill(fromRGB(hr, hg, hb, 1));
  try {
    hostBar.cornerRadius = 6;
  } catch {}
  parent.children.append(hostBar);

  return {
    ok: true,
    theme,
    host,
    gloss,
    width,
    height,
    cards: 6,
    api: "editor.createRectangle/makeImageFill",
  };
}

async function varyCard(opts = {}) {
  const { index = 0, prompt = "ASL avatar sign variation, cuneiform texture" } =
    opts;
  // Demonstrates makeImageFill Vary flow — panel fetches Firefly variation then proxies bitmap
  if (opts.imageBitmap) {
    const parent = editor.context.insertionParent;
    const rect = editor.createRectangle();
    rect.width = 180;
    rect.height = 220;
    rect.translation = {
      x: 48 + (index % 3) * 204,
      y: 80 + Math.floor(index / 3) * 264,
    };
    rect.fill = editor.makeImageFill(opts.imageBitmap);
    parent.children.append(rect);
  }
  return { ok: true, index, prompt, vary: true };
}

if (editor?.runtime?.exposeApi) {
  editor.runtime.exposeApi({ renderASLConcept, varyCard, clearArtboard });
} else if (typeof runtime !== "undefined" && runtime.exposeApi) {
  runtime.exposeApi({ renderASLConcept, varyCard, clearArtboard });
}
globalThis.renderASLConcept = renderASLConcept;
globalThis.varyCard = varyCard;
globalThis.clearArtboard = clearArtboard;
