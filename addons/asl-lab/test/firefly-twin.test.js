// MSW test — stubs fetch to firefly-api.adobe.io/v2/images/generate
// Validates: Generate Firefly Twin button → fetch with styleReference/contact sheet + structureReference + seed 4219 → sandbox makeImageFill
// Refs: prior result 1 (asl-concept 6-frame/makeImageFill) + prior result 2 (contact sheet 72 PNGs → datasets/<host>.zip)
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../src/mocks/handlers.js";
import fs from "fs";
import path from "path";

const FIREFLY_ENDPOINT = "https://firefly-api.adobe.io/v2/images/generate";
const TWIN_SEED = 4219;

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ASL Lab — Firefly Twin (addons/asl-lab/index.html)", () => {
  it("index.html has Generate Firefly Twin button", () => {
    const html = fs.readFileSync(
      path.resolve("addons/asl-lab/index.html"),
      "utf-8",
    );
    expect(html).toContain("Generate Firefly Twin");
    expect(html).toContain('id="generateFireflyTwin"');
  });

  it("index.html fetches firefly-api.adobe.io/v2/images/generate with styleReference + contact sheet + structureReference + seed 4219", () => {
    const html = fs.readFileSync(
      path.resolve("addons/asl-lab/index.html"),
      "utf-8",
    );
    expect(html).toContain("firefly-api.adobe.io/v2/images/generate");
    expect(html).toContain("4219");
    expect(html).toContain("styleReference");
    expect(html).toContain("structureReference");
    expect(html).toContain("contact-sheet");
    expect(html).toContain("renders/contact-sheet");
    expect(html).toContain("style_reference");
    expect(html).toContain("structure_reference");
  });

  it("code.js sandbox uses editor.makeImageFill for Firefly Twin", () => {
    const code = fs.readFileSync(
      path.resolve("addons/asl-lab/code.js"),
      "utf-8",
    );
    expect(code).toContain("makeImageFill");
    expect(code).toContain("generateFireflyTwin");
    expect(code).toContain("4219");
    expect(code).toContain('import { editor } from "express-document-sdk"');
  });

  it("MSW stubs Firefly generate — validates seed 4219 + styleReference contact sheet + structureReference → returns image base64 → makeImageFill path", async () => {
    const body = {
      prompt: "ASL avatar twin, Sumerian clay texture, 42-joint hand rig",
      seed: TWIN_SEED,
      seeds: [TWIN_SEED],
      styleReference: {
        source: { url: "renders/contact-sheet/Sumerian/front.png" },
        strength: 0.9,
      },
      structureReference: {
        source: { url: "renders/contact-sheet/Sumerian/front.png" },
        strength: 0.85,
      },
      numVariations: 1,
      size: { width: 1024, height: 1024 },
    };
    const res = await fetch(FIREFLY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.outputs[0].image.base64).toBeTruthy();
    expect(data.outputs[0].seed).toBe(TWIN_SEED);
    const b64 = data.outputs[0].image.base64;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x89);
    expect(bytes[1]).toBe(0x50);
  });

  it("MSW rejects wrong seed (not 4219)", async () => {
    const res = await fetch(FIREFLY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "bad seed",
        seed: 1234,
        styleReference: {
          source: { url: "renders/contact-sheet/Sumerian/front.png" },
        },
        structureReference: {
          source: { url: "renders/contact-sheet/Sumerian/front.png" },
        },
      }),
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });

  it("MSW rejects missing structureReference", async () => {
    const res = await fetch(FIREFLY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: "missing structure",
        seed: TWIN_SEED,
        styleReference: {
          source: { url: "renders/contact-sheet/Sumerian/front.png" },
        },
      }),
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
  });
});
