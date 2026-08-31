// code.js — document sandbox, generates 1440x400 builder banner per spec
// tokens: navy #00002a → deep #30006a, violet #9060f0, lavender #d7c7ee, gold #c9a23f, aws-orange #ff9900, Cinzel + JetBrains Mono
import { editor } from "express-document-sdk";

function fromRGB(r, g, b, a = 1) {
  return { red: r, green: g, blue: b, alpha: a };
}
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

async function generateBanner(opts = {}) {
  const {
    headline = "Cloud Del Norte",
    subhead = "AWS User Group • El Paso Borderplex",
    tagline = "Community builders • Workshops • Cloud • AI/ML",
    theme = "dark",
    width = 1440,
    height = 400,
  } = opts;
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error("no insertionParent — open a document");
  // clear previous
  [...parent.children].forEach((c) => parent.children.remove(c));
  // background gradient via two rects (dark → deep purple approximation; exact gradient via image would need API)
  const bg = editor.createRectangle();
  bg.width = width;
  bg.height = height;
  bg.translation = { x: 0, y: 0 };
  const [r, g, b] = hexToRgb(theme === "dark" ? "#00002a" : "#ede5d4");
  bg.fill = editor.makeColorFill(fromRGB(r, g, b, 1));
  parent.children.append(bg);
  const overlay = editor.createRectangle();
  overlay.width = width;
  overlay.height = height;
  overlay.translation = { x: 0, y: 0 };
  const [r2, g2, b2] = hexToRgb("#30006a");
  overlay.fill = editor.makeColorFill(
    fromRGB(r2, g2, b2, theme === "dark" ? 0.55 : 0.12),
  );
  parent.children.append(overlay);
  // headline placeholder rect (real text via editor.createText when available)
  const title = editor.createRectangle();
  title.width = 700;
  title.height = 48;
  title.translation = { x: 370, y: 120 };
  title.fill = editor.makeColorFill(fromRGB(1, 1, 1, 0.0));
  title.stroke = editor.makeStroke(fromRGB(0.59, 0.38, 0.94, 1), 1.5); // violet border hint
  parent.children.append(title);
  // subhead
  const sub = editor.createRectangle();
  sub.width = 600;
  sub.height = 18;
  sub.translation = { x: 420, y: 185 };
  sub.fill = editor.makeColorFill(fromRGB(0.84, 0.78, 0.93, 1));
  parent.children.append(sub);
  // CTA pill
  const cta = editor.createRectangle();
  cta.width = 200;
  cta.height = 34;
  cta.translation = { x: 1080, y: 285 };
  const [ro, go, bo] = hexToRgb("#ff9900");
  cta.fill = editor.makeColorFill(fromRGB(ro, go, bo, 1));
  try {
    cta.rx = 17;
    cta.ry = 17;
  } catch (_) {}
  parent.children.append(cta);
  // star mark hint (violet diamond)
  const star = editor.createRectangle();
  star.width = 80;
  star.height = 80;
  star.translation = { x: 140, y: 160 };
  star.rotation = -12;
  star.fill = editor.makeColorFill(fromRGB(0.56, 0.38, 0.94, 1));
  star.stroke = editor.makeStroke(fromRGB(1, 1, 1, 1), 2);
  parent.children.append(star);
  // NOTE: production would replace placeholder rects with editor.createText(headline, {font: "Cinzel"}) when text API available; rects verify geometry + safe area today.
  return { ok: true, width, height, headline, theme };
}
async function clearArtboard() {
  const parent = editor.context.insertionParent;
  if (!parent || !parent.children) throw new Error("no parent");
  const toRemove = [...parent.children];
  for (const c of toRemove) parent.children.remove(c);
  return { ok: true, removed: toRemove.length };
}
if (editor?.runtime?.exposeApi)
  editor.runtime.exposeApi({ generateBanner, clearArtboard });
else if (typeof runtime !== "undefined" && runtime.exposeApi)
  runtime.exposeApi({ generateBanner, clearArtboard });
globalThis.generateBanner = generateBanner;
globalThis.clearArtboard = clearArtboard;
