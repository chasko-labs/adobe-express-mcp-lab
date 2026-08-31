// code.js — document sandbox, Firefly variant of aws-builder-banner pattern
// Tokens: navy #00002a, deep #30006a, violet #9060f0, lavender #d7c7ee, gold #c9a23f, aws-orange #ff9900
import { editor } from "express-document-sdk";

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
function fromRGB(r, g, b, a = 1) {
  return { red: r, green: g, blue: b, alpha: a };
}

async function generateHost(opts = {}) {
  const {
    prompt = "Sumerian tic-tac-toe board, clay texture, 3x3 grid, top-down, warm light",
    width = 1440,
    height = 400,
  } = opts;
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent — open a document");
  [...parent.children].forEach((c) => parent.children.remove(c));
  // Firefly path: makeImageFill from fetched bitmap (panel passes bitmap or URL)
  // Fallback: token-faithful placeholder rect until Firefly token wired
  const bg = editor.createRectangle();
  bg.width = width;
  bg.height = height;
  const [r, g, b] = hexToRgb("#00002a");
  bg.fill = editor.makeColorFill(fromRGB(r, g, b, 1));
  parent.children.append(bg);
  if (opts.imageBitmap) {
    const img = editor.createRectangle();
    img.width = width;
    img.height = height;
    img.fill = editor.makeImageFill(opts.imageBitmap);
    parent.children.append(img);
  }
  // If opts.imageUrl provided,panel fetched blob → createImageBitmap → imageBitmap above
  return { ok: true, prompt, width, height };
}
async function clearArtboard() {
  const parent = editor.context.insertionParent;
  if (!parent?.children) throw new Error("no parent");
  const toRemove = [...parent.children];
  for (const c of toRemove) parent.children.remove(c);
  return { ok: true, removed: toRemove.length };
}
if (editor?.runtime?.exposeApi)
  editor.runtime.exposeApi({ generateHost, clearArtboard });
else if (typeof runtime !== "undefined" && runtime.exposeApi)
  runtime.exposeApi({ generateHost, clearArtboard });
globalThis.generateHost = generateHost;
globalThis.clearArtboard = clearArtboard;
