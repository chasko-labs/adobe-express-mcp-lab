// code.js — document sandbox (synchronous thread, limited Web APIs)
// Runs via entryPoints[0].documentSandbox per manifestVersion 2
// Grounded by @adobe/express-developer-mcp types: express-document-sdk `editor`
import { editor } from "express-document-sdk";

// minimal color util fallback — real SDK provides colorUtils; keep inline so this file is self-contained for review
function fromRGB(r, g, b, a = 1) { return { red: r, green: g, blue: b, alpha: a }; }

async function createRectangle(opts = {}) {
  const { width = 200, height = 150, x = 100, y = 20, fill = [0.32, 0.52, 0.92, 1] } = opts;
  const parent = editor.context.insertionParent;
  if (!parent) throw new Error('no insertionParent — open a document');
  const rect = editor.createRectangle();
  rect.width = width;
  rect.height = height;
  rect.translation = { x, y };
  // documented pattern: editor.makeColorFill(colorUtils.fromRGB(...))
  // use fromRGB helper above if colorUtils unavailable in this SDK snapshot
  const c = fromRGB(fill[0], fill[1], fill[2], fill[3]);
  rect.fill = editor.makeColorFill(c);
  parent.children.append(rect);
  return { ok: true, id: rect.id || null };
}

async function clearArtboard() {
  // best-effort: clear children of insertionParent — guarded per docs (api surface varies by host version)
  const parent = editor.context.insertionParent;
  if (!parent || !parent.children) throw new Error('no parent.children to clear');
  // removeAll is not guaranteed; fallback to iterative remove
  const toRemove = [...parent.children];
  for (const child of toRemove) parent.children.remove(child);
  return { ok: true, removed: toRemove.length };
}

// expose to iframe via Communication APIs — iframe calls sandboxProxy.createRectangle
// pattern per docs: runtime.exposeApi from sandbox side, iframe uses getApi('sandbox')
if (editor && editor.runtime && editor.runtime.exposeApi) {
  editor.runtime.exposeApi({ createRectangle, clearArtboard });
} else if (typeof runtime !== 'undefined' && runtime.exposeApi) {
  runtime.exposeApi({ createRectangle, clearArtboard });
}
// fallback: also attach to global for older runtimes
globalThis.createRectangle = createRectangle;
globalThis.clearArtboard = clearArtboard;
