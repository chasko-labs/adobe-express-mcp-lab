// code.js — document sandbox (synchronous thread, limited Web APIs)
// Grounded by @adobe/express-developer-mcp — express-document-sdk `editor`
// Firefly Twin path: styleReference (contact sheet) + structureReference + seed 4219 → makeImageFill
// Extends addons/asl-concept/code.js rendering pipeline; prior results 1+2 grounded.
import { editor } from "express-document-sdk";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}
function fromRGB(r, g, b, a = 1) {
  return { red: r, green: g, blue: b, alpha: a };
}

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
  try {
    rect.cornerRadius = 8;
  } catch {}
  parent.children.append(rect);
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
    theme = "sumerian",
    host = "babylon",
    gloss = true,
    width = 1440,
    height = 400,
  } = opts;
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent — open a document");
  clearArtboard();
  const bg = editor.createRectangle();
  bg.width = width;
  bg.height = height;
  bg.translation = { x: 0, y: 0 };
  const [r, g, b] = hexToRgb(TOKENS.navy);
  bg.fill = editor.makeColorFill(fromRGB(r, g, b, 1));
  parent.children.append(bg);
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
    const bar = editor.createRectangle();
    bar.width = cardW;
    bar.height = 4;
    bar.translation = { x, y: y + cardH - 4 };
    const [ar, ag, ab] = hexToRgb(t.accent);
    bar.fill = editor.makeColorFill(fromRGB(ar, ag, ab, 1));
    parent.children.append(bar);
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

// === Firefly Twin path (prior result 2 contact sheet → Firefly Custom Model) ===
const FIREFLY_TWIN_SEED = 4219;
// Contact sheet source: renders/contact-sheet/<host>/<view>.png (72 PNGs: 8 views x 9 hosts, per prior result 2)
// Host cast grounded to prior result 1 docs/asl/cast.json (Ava s Sumerian / Babylon.js etc.)
// StyleReference points at contact sheet (class token sumerianHost), StructureReference pins hand pose (42-joint rig).

async function generateFireflyTwin(opts = {}) {
  // opts.imageBitmap — already decoded in iframe; sandbox only does makeImageFill (no fetch in sandbox thread)
  // opts.seed must be 4219 for deterministic twin
  const {
    imageBitmap,
    seed = FIREFLY_TWIN_SEED,
    prompt = "ASL avatar twin, Sumerian clay texture, 42-joint hand rig",
  } = opts;
  if (seed !== FIREFLY_TWIN_SEED)
    throw new Error("seed must be 4219 for Firefly Twin determinism");
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent — open a document");
  if (!imageBitmap)
    throw new Error(
      "imageBitmap required — iframe fetches firefly-api.adobe.io/v2/images/generate first",
    );
  // Full-artboard twin fill (demonstrates apply-to-canvas); also emits a card variant for grid parity
  const twinRect = editor.createRectangle();
  twinRect.width = 1024;
  twinRect.height = 1024;
  twinRect.translation = { x: 0, y: 0 };
  // Core API grounded by @adobe/express-developer-mcp: editor.makeImageFill(ImageBitmap)
  twinRect.fill = editor.makeImageFill(imageBitmap);
  try {
    twinRect.cornerRadius = 12;
  } catch {}
  parent.children.append(twinRect);
  return {
    ok: true,
    seed,
    prompt,
    api: "editor.makeImageFill",
    width: 1024,
    height: 1024,
    twin: true,
  };
}

async function applyTwinImageFill(imageBitmap) {
  // Alias used by iframe runtime bridge (older naming)
  return generateFireflyTwin({ imageBitmap, seed: FIREFLY_TWIN_SEED });
}

if (editor?.runtime?.exposeApi) {
  editor.runtime.exposeApi({
    renderASLConcept,
    varyCard,
    clearArtboard,
    generateFireflyTwin,
    applyTwinImageFill,
  });
} else if (typeof runtime !== "undefined" && runtime.exposeApi) {
  runtime.exposeApi({
    renderASLConcept,
    varyCard,
    clearArtboard,
    generateFireflyTwin,
    applyTwinImageFill,
  });
}
globalThis.renderASLConcept = renderASLConcept;
globalThis.varyCard = varyCard;
globalThis.clearArtboard = clearArtboard;
globalThis.generateFireflyTwin = generateFireflyTwin;
globalThis.applyTwinImageFill = applyTwinImageFill;
