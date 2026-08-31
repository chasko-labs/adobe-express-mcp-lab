// MSW handlers — stub fetch to firefly-api.adobe.io/v2/images/generate
// Grounded to Firefly Twin path: styleReference (contact sheet) + structureReference + seed 4219 → sandbox makeImageFill
// Used by addons/asl-lab/test/firefly-twin.test.js
import { http, HttpResponse } from "msw";

// 1x1 PNG base64 (transparent) — deterministic stub for Firefly generate
const STUB_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";

export const handlers = [
  http.post(
    "https://firefly-api.adobe.io/v2/images/generate",
    async ({ request }) => {
      const body = await request.json();
      const seedOk =
        body.seed === 4219 ||
        (Array.isArray(body.seeds) && body.seeds.includes(4219));
      if (!seedOk) {
        return HttpResponse.json(
          { error: "seed must be 4219" },
          { status: 400 },
        );
      }
      const styleRef =
        body.styleReference?.source?.url ||
        body.style_reference?.source?.url ||
        body.contactSheet ||
        "";
      if (!styleRef.includes("contact-sheet")) {
        return HttpResponse.json(
          { error: "styleReference contact sheet required" },
          { status: 400 },
        );
      }
      const structRef =
        body.structureReference?.source?.url ||
        body.structure_reference?.source?.url ||
        "";
      if (!structRef) {
        return HttpResponse.json(
          { error: "structureReference required" },
          { status: 400 },
        );
      }
      return HttpResponse.json({
        outputs: [
          {
            image: {
              base64: STUB_PNG_BASE64,
              url: "https://firefly-api.adobe.io/v2/images/generate/stub.png",
              seed: 4219,
            },
            seed: 4219,
          },
        ],
        size: body.size || { width: 1024, height: 1024 },
      });
    },
  ),
  http.get(
    "https://firefly-api.adobe.io/v2/images/generate/stub.png",
    async () => {
      const bin = Uint8Array.from(atob(STUB_PNG_BASE64), (c) =>
        c.charCodeAt(0),
      );
      return new HttpResponse(bin, {
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(bin.length),
        },
      });
    },
  ),
];
