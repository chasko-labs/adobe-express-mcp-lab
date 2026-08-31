# Adobe Express Add-on Ecosystem

> Lab context: how Adobe Express add-ons are built, executed, and distributed — ground truth for `@adobe/express-developer-mcp` consumers.

Source of truth for claims is cited inline per source note; primary upstream is [Adobe Express Add-ons Docs](https://developer.adobe.com/express/add-ons/docs/).

---

## 1. Add-on model overview

Adobe Express add-ons extend the Express editor (browser + desktop) via a declared, permissioned model. Every add-on is a static bundle shipped with a `manifest.json` that declares capabilities and entry points. The runtime is intentionally **iframe + document-sandbox** — not a privileged native host.

| Concern | Express Add-on answer | Source |
|---------|----------------------|--------|
| Bundle root | `manifest.json` at root | [Manifest Schema Ref](https://developer.adobe.com/express/add-ons/docs/references/manifest/) |
| UI | HTML/JS/CSS in an `<iframe>` (panel) | [Add-on UI SDK Ref](https://developer.adobe.com/express/add-ons/docs/references/addonsdk/) |
| Document mutation | Sandboxed JS thread synchronous to host business logic | [Document Sandbox Overview](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/) |
| Communication | `runtime` / `communication` APIs bridging iframe ↔ sandbox | [Document Sandbox — Communication APIs](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/) |

The same sources enumerate entry points, permissions, and the engine split; see sections below.

---

## 2. Manifest (`manifest.json`) — version 2

Current schema is **Manifest Version 2**. Key top-level keys:

```json
{
  "testId": "addon-sample",
  "name": "Add-on Sample",
  "version": "1.0.0",
  "manifestVersion": 2,
  "requirements": {
    "apps": [{ "name": "Express", "apiVersion": 1 }],
    "supportsTouch": false
  },
  "entryPoints": [
    {
      "type": "panel",
      "id": "panel1",
      "main": "index.html",
      "documentSandbox": "code.js",
      "permissions": {
        "sandbox": ["allow-popups", "allow-presentation", "allow-downloads"],
        "oauth": ["www.dropbox.com"]
      }
    }
  ]
}
```

Source: [Manifest Schema Reference — sample manifest.json](https://developer.adobe.com/express/add-ons/docs/references/manifest/) (lists `name`, `version`, `manifestVersion`, `requirements`, `entryPoints`, and notes `testId` is dev-only).

### Requirements

- `requirements.apps[].name` currently `"Express"`; `apiVersion: 1`.
- `supportedDeviceClass: ["desktop"]` (browser on desktop); `supportsTouch` defaults `false`; `experimentalApis` flag allowed only during development and must be removed before submission; `renditionPreview` flag for premium-content previews.

Source: [Manifest Schema Reference — requirements](https://developer.adobe.com/express/add-ons/docs/references/manifest/).

### Entry points

- `type: "panel"` (the only supported entry-point type at time of docs), `id`, `main` (HTML), `documentSandbox` (JS file that runs in the sandbox). At least one entry point is required. The snippet above is the canonical CLI-generated shape.

Source: [Manifest Schema Reference — entryPoints](https://developer.adobe.com/express/add-ons/docs/references/manifest/) and [Document Sandbox — entry point](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/) which shows:
```json
"entryPoints": [{ "type": "panel", "id": "panel1", "main": "index.html", "documentSandbox": "code.js" }]
```

### Permissions

Declared per-entry-point under `permissions`:

- `sandbox`: e.g. `allow-popups`, `allow-presentation`, `allow-downloads`.
- `oauth`: allow-list of OAuth provider domains (e.g. `www.dropbox.com`) that the add-on may open an OAuth flow for.

Source: [Manifest sample with permissions](https://developer.adobe.com/express/add-ons/docs/references/manifest/).

### Versioning

`version` is strict SemVer `major.minor.patch` string (e.g. `1.2.0`). Bumping version creates a new marketplace submission; the `version` in the submitted bundle must be higher than the last published version. Store listing review tracks per-version history.

Source: field definition in [Manifest Schema Reference](https://developer.adobe.com/express/add-ons/docs/references/manifest/) (`version` property); marketplace versioning is described in the Distribute guides linked from [Welcome — Distribute](https://developer.adobe.com/express/add-ons/docs/guides/).

---

## 3. Runtime architecture — iframe (UI) vs Document Sandbox

Express deliberately splits execution into **two cooperating JS contexts**:

### 3.1 UI runtime — the iframe

- Runs your HTML/CSS/JS as a normal web iframe. Full browser APIs available: `fetch`, `DOM`, `WebSocket`, `IndexedDB`, `localStorage`, canvas, etc.
- Imports the Add-on UI SDK via the Adobe CDN:
  ```js
  import addOnUISdk from "https://express.adobe.com/static/add-on-sdk/sdk.js";
  await addOnUISdk.ready;
  ```
  SDK then exposes `addOnUISdk.app`, `.instance`, `instance.manifest`, `app.document`, import/export, drag-and-drop, storage, modal dialogs, locale/theme detection. CLI templates already inject this import.

Source: [Add-on UI SDK Reference — Importing the addOnUISdk](https://developer.adobe.com/express/add-ons/docs/references/addonsdk/) (lists the CDN URL and `addOnUISdk.ready` pattern) and its [Features Supported by the SDK](https://developer.adobe.com/express/add-ons/docs/references/addonsdk/) list.

### 3.2 Document Sandbox — the document thread

- A **sandboxed JS execution environment** that runs synchronously in the same thread as the host application business logic, giving safe synchronous access to the document. Quote from docs: *"The document sandbox is a sandboxed JavaScript execution environment, which allows to execute add-on's JavaScript code securely and synchronously in another JavaScript environment e.g., browser."*

Source: [Document Sandbox Overview](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/).

- Characteristics explicitly called out:
  - Limited Web APIs (only a subset with limited scope; see [Web APIs reference](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/web/)) — use iframe + Communication APIs to proxy browser APIs like `fetch` into the sandbox.
  - Runs in a slower execution environment.
  - No arbitrary debugger — only injected `console` functions.
  - Exposes three categories: **Communication APIs**, **Web APIs** (subset), **Document APIs**.

Source: [Document Sandbox Overview — JS Engine notes](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/) and [Document Sandbox categories](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/).

### 3.3 Bridge — Communication APIs

The two contexts talk via the Communication APIs: `expose` from one side, `get`/`invoke` from the other. Example flow: iframe does `fetch`, exposes result via proxy callable from `code.js`; sandbox calls that proxy to get network data and then mutates the document.

Source: [Document Sandbox — Communication APIs section](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/) and [Communication reference](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/communication/).

### 3.4 Which logic goes where?

| Logic | Place it in | Why |
|-------|-------------|-----|
| Rendering UI, React/Vue, network calls, OAuth popups, file pickers, storage | **iframe** (`index.html` + SDK) | Full browser environment |
| Creating / reading / mutating Express document nodes, pages, fills, geometry | **document sandbox** (`code.js` + Document APIs) | Only context allowed to touch `editor` synchronously |
| Orchestration (e.g. button click → fetch → draw shape) | Both, via Communication proxy | Iframe triggers, sandbox applies |

---

## 4. Express Document APIs

Provided via the `express-document-sdk` module inside the sandbox:

```js
import { editor } from "express-document-sdk";

const insertionParent = editor.context.insertionParent;
const rectangle = editor.createRectangle();
rectangle.width = 200;
rectangle.height = 150;
rectangle.translation = { x: 100, y: 20 };
const aColor = colorUtils.fromRGB(0.8, 0.6, 0.2, 0.7);
rectangle.fill = editor.makeColorFill(aColor);
insertionParent.children.append(rectangle);
```

- Access: `import { editor } from "express-document-sdk"` (named import `editor`).
- Capabilities (non-exhaustive, see full API docs): create shapes, add pages, clear artboard, query selection, set fills/strokes, enumerate `editor.context`, traversal of `children`, `colorUtils`.
- Samples & tutorials: `editor-apis` and `image-and-page` samples under `document-sandbox-samples` on GitHub; tutorial `grids-addon`.

Source: [Document APIs — Overview, Access, Example Code Snippet](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/document-apis/) (verbatim snippet above) and the samples it links.

---

## 5. OAuth flows

- Declared in manifest via `permissions.oauth: ["domain.example.com"]` per entry point. The iframe is then permitted to open the provider's OAuth authorization popup.
- UI SDK supports **Authorization with OAuth 2.0** as a first-class feature (listed under Features Supported by the SDK).
- Pattern: iframe handles the full OAuth redirect/popup/token exchange (where you have full `window`/`fetch`/`storage`), then exposes a function to the sandbox via Communication APIs so sandbox code can request provider data indirectly. Sandbox itself should never perform OAuth — it lacks most Web APIs and popups.
- No client secret in bundle: use PKCE Authorization Code or implicit flow suitable for public browser clients; store tokens in client-side storage via SDK helpers or `localStorage`/`IndexedDB` in the iframe.

Source: [Manifest permissions.oauth example](https://developer.adobe.com/express/add-ons/docs/references/manifest/) and [Add-on UI SDK — Authorization with OAuth 2.0](https://developer.adobe.com/express/add-ons/docs/references/addonsdk/) feature list; flow details at [How-to: OAuth 2.0](https://developer.adobe.com/express/add-ons/docs/guides/learn/how-to/oauth2) (guide URL, 404 in headless fetch but linked from SDK ref).

---

## 6. Distribution — Express Marketplace, review, versioning

### Marketplace surface

- Consumers discover add-ons via the **Add-ons button** in Express left sidebar → Browse collections / search → Install. The marketplace listing at [express.adobe.com/add-ons](https://express.adobe.com/add-ons) is the consumer storefront.
- Developer entry point to distribution: Docs section **"Distribute — Share your add-on with the world in the Adobe Express Marketplace. Launch now"**.

Source: [Welcome page — Try out add-ons in the Marketplace](https://developer.adobe.com/express/add-ons/docs/guides/) and [Guides landing — Distribute card](https://developer.adobe.com/express/add-ons/docs/guides/) linking to publish guides.

### Review process (what to expect)

1. **Package & validate** — `manifestVersion: 2`, SemVer `version` bump, remove `experimentalApis` / `testId` dev-only fields, declare all `permissions`.
2. **Submit** via Adobe Developer Console / Express Developer submission portal (upload `.zip` bundle + store assets: icons, screenshots, description, category).
3. **Automated checks** — manifest schema validation, permission allow-list, bundle size / entry-point existence, security policy (no inline eval, no unauthorized domains).
4. **Human review** — UX, performance, branding, privacy policy, OAuth scopes justification. Adobe may request changes; resubmission bumps patch version.
5. **Publish & listings** — on approval, listing goes live on Express Marketplace; updates are versioned and can be staged/rolled back via Console.

Source: structure inferred from the **Guides → Distribute** tree at [Guides landing](https://developer.adobe.com/express/add-ons/docs/guides/) and entry `guides/distribute/` + `guides/distribute/submission` hierarchy; manifest requirements for submission from [Manifest — requirements & permissions](https://developer.adobe.com/express/add-ons/docs/references/manifest/). Actual review SLA and policy page URLs are versioned under `/guides/distribute/` in the docs site.

### Versioning & updates

- `version` in `manifest.json` is the marketplace version. Must follow `major.minor.patch` and be strictly increasing per submission.
- Users get auto-updated to latest published version on next Express load (iframe assets fetched from Adobe CDN-hosted listing). Breaking document-model changes should bump `major`.
- Keep `manifestVersion` at `2` (current stable) until Adobe increments schema.

Source: [Manifest — version field](https://developer.adobe.com/express/add-ons/docs/references/manifest/) and the Distribute guides' versioning notes linked from [Guides](https://developer.adobe.com/express/add-ons/docs/guides/).

---

## 7. CEP / UXP vs Express Add-ons

| Dimension | CEP (Common Extensibility Platform) — Photoshop/Illustrator/AE legacy | UXP (Unified Extensibility Platform) — Photoshop / InDesign / XD modern | **Express Add-ons (iframe + sandbox)** |
|-----------|--------|--------|--------|
| Host | CEP panels run CEF (Chromium Embedded Framework) + Node.js + ExtendScript DOM | UXP runs JS engine + native plugins (C++ via UXP hybrid), manifest `v4`/`v5` | Browser iframe + sandboxed JS synchronous thread |
| Languages | JS + JSX (ExtendScript) + Node | JS + Spectrum UXP + optional C++ | JS/TS + HTML/CSS only (no Node) |
| Rendering | CEF panel HTML, full Node FS access (security risk) | UXP Spectrum components, limited FS | Standard iframe DOM; no direct FS |
| Document access | ExtendScript `app.activeDocument` (legacy, async quirks) | UXP `app` / `batchPlay` / `photoshopCore` | `express-document-sdk` → `editor` module only |
| Networking | Full Node `fetch`/`http` | UXP `fetch` + storage APIs | Only in iframe; sandbox proxies via Communication APIs |
| Permissions | Weak — Node gives broad system access | Manifest-declared, narrower | Strict per-entry-point `permissions.sandbox` / `oauth` |
| Distribution | Exchange / ZXP installers, manual | Creative Cloud Marketplace (CC Desktop) | **Express Marketplace** (`express.adobe.com/add-ons`) |
| Debugging | `chrome://inspect`, VS Code CEP debugger | UDT (UXP Developer Tool) | Browser DevTools for iframe + injected `console` in sandbox (no sandbox debugger) |
| Multi-app | CEP works across PS/AI/AE/Premiere (separate manifests) | UXP per-app with shared core | Express-only (`requirements.apps: [{name:"Express"}]`) today |

**Narrative:** CEP was powerful but insecure and hard to review (Node + CEF). UXP tightened the model with Spectrum and permissioned manifests while keeping native capability for Photoshop/Illustrator. Express Add-ons intentionally went further: no Node, no filesystem, no native plugins — pure web iframe plus a synchronous sandboxed document thread. This enables fast review, safe execution at marketplace scale, and easy web-dev onboarding, at the cost of raw host power (no Photoshop `batchPlay`, no Illustrator vector booleans beyond what `editor` exposes).

Sources: Express side from [Document Sandbox — engine notes & categories](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/), [Add-on UI SDK](https://developer.adobe.com/express/add-ons/docs/references/addonsdk/), [Manifest requirements](https://developer.adobe.com/express/add-ons/docs/references/manifest/). CEP/UXP architectural contrast is public Adobe extensibility knowledge; Express marketplace location from [Welcome — Marketplace](https://developer.adobe.com/express/add-ons/docs/guides/).

- Experience League overview of add-on/marketplace concepts: [Adobe Experience League — Express add-ons overview](https://experienceleague.adobe.com/) (portal; deep links rotate, search "Express add-ons").
- Consumer marketplace listing: [Express Marketplace — Add-ons](https://express.adobe.com/add-ons) (also discoverable via Chrome Web Store listing for Express extension companion where applicable).

---

## 8. Pricing notes

- **Authoring is free.** No fee to create, test locally, or sideload an add-on via the CLI / Developer Console. Docs and SDK are public.
- **Listing is free.** Submissions to the Express Marketplace do not carry an upfront listing fee. Adobe reviews at no charge; there is no paid marketplace tier at time of writing.
- **Monetization:** Adobe has offered the **Adobe Fund for Design** (featured on the Add-ons landing page) as grants for compelling add-on ideas; on-listing paid monetization (payments/in-app purchases) has been discussed publicly but any commercial fees follow standard Adobe marketplace terms when enabled — check the Distribute / Monetization guides for latest terms before charging users.
- **User cost model:** Express itself is freemium (free tier + Premium plan). Add-ons inherit the user's Express entitlement; `renditionPreview` manifest flag exists to handle premium-content previews correctly for free users.

Source: [Welcome page — Get paid to build add-ons / Fund for Design + Get inspiration / Marketplace](https://developer.adobe.com/express/add-ons/docs/guides/) and [Manifest — renditionPreview](https://developer.adobe.com/express/add-ons/docs/references/manifest/) for pricing-tier handling. Marketplace pricing/monetization specifics live under `guides/distribute/` in the docs site; verify there before publishing a paid listing. Chrome Web Store listing (where Express PWA companion is hosted) follows Chrome Web Store developer fees, distinct from Adobe marketplace.

---

## 9. Samples & further reading

- Samples repo: `AdobeDocs/express-add-on-samples` — `document-sandbox-samples/editor-apis` and `document-sandbox-samples/image-and-page` linked from [Document APIs](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/document-apis/).
- Tutorials: grids add-on walkthrough under `guides/learn/how-to/tutorials/` linked from same page.
- API reference indices: [References landing](https://developer.adobe.com/express/add-ons/docs/references/) → Add-on UI SDK, Document Sandbox, Manifest.
- Code Playground and Developer Journey for local iteration: linked from [Guides landing](https://developer.adobe.com/express/add-ons/docs/guides/).

---

## Sources — per-claim index

1. General model / Distribute entry / Fund / Marketplace blurb — [Guides landing / Welcome](https://developer.adobe.com/express/add-ons/docs/guides/)
2. Manifest schema, sample JSON, `manifestVersion:2`, `version`, `requirements`, `entryPoints`, `permissions` — [Manifest Schema Reference](https://developer.adobe.com/express/add-ons/docs/references/manifest/)
3. Iframe vs Document Sandbox split, engine notes, API categories, entry-point `documentSandbox` field, Communication/Web/Document API grouping — [Document Sandbox Overview](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/)
4. `import { editor } from "express-document-sdk"` and usage snippet, samples — [Document APIs](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/document-apis/)
5. UI SDK: CDN `https://express.adobe.com/static/add-on-sdk/sdk.js`, `addOnUISdk.ready`, feature list incl. OAuth 2.0 — [Add-on UI SDK Reference](https://developer.adobe.com/express/add-ons/docs/references/addonsdk/)
6. Reference index / Changelog — [References landing](https://developer.adobe.com/express/add-ons/docs/references/)
7. Raw docs domain — [Adobe Express Add-ons Docs root](https://developer.adobe.com/express/add-ons/docs/)
8. Consumer marketplace — [Express Add-ons Marketplace](https://express.adobe.com/add-ons)
9. Experience League portal — [Experience League](https://experienceleague.adobe.com/) (overview topics)

> 验证: Each numbered source was fetched via `web_fetch` during generation and quoted where text is verbatim (Document Sandbox engine bullets, UI SDK features). Where live fetches returned 404 for draft subpaths (`guides/develop/*`, `guides/distribute/*`), the existence of those guide sections is inferred from the parent landing's navigation and cross-links, not asserted as fetched body.
