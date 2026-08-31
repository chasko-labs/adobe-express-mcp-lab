# adobe-express-mcp-lab

> lab for the adobe express developer mcp — first adobe mcp use case for chasko-labs. documents process, learnings, features, settings, versions, wiring per heraldstack-mcp standards. reproducible starter so any heraldstack agent can ground express add-on work without hallucination.

![MCP stdio architecture — IDE to npx bridge to MCP server to LLM to docs+types](docs/assets/mcp-architecture.svg)

```mermaid
flowchart LR
  IDE["Cursor / Claude / VS Code\nmcp.json"] --> Bridge["npx bridge\nadobe-express-bridge.sh"]
  Bridge --> MCP["MCP 1.0.0\nstdio • 197kB"]
  MCP --> LLM["LLM grounded"]
  LLM --> Docs["Docs + Types"]
  Docs -.-> Addon["Add-on in Express\niframe + sandbox"]
```

## table of contents

1. [what this lab is](#what-this-lab-is)
2. [quick start — 30 seconds](#quick-start--30-seconds)
3. [guided tour — read in order](#guided-tour--read-in-order)
4. [visual map](#visual-map)
5. [version matrix](#version-matrix)
6. [settings matrix — where mcp.json lives](#settings-matrix--where-mcpjson-lives)
7. [hello-world — proof it works](#hello-world--proof-it-works)
8. [repo layout](#repo-layout)
9. [key people and sites](#key-people-and-sites)
10. [contributing and learnings](#contributing-and-learnings)

## what this lab is

- **not a fork of adobe docs** — curation + wiring + verification.
- **read-only, no auth, stdio** — package `@adobe/express-developer-mcp@1.0.0` exposes semantic search + typescript types so the llm stops inventing `adobe.addOn.createShape`.
- **heraldstack-aware** — bridge `mcp/adobe-express-bridge.sh` = `exec npx -y @adobe/express-developer-mcp@latest --yes`, registry entry `adobe-express-developer` (shannon + haunting, `status: active`, `env_required: []`).
- **deferred:** rtdcp cdp beta data plane (needs sandbox pii review), photoshop/animate/firefly mcps beyond landscape comparison. see [docs/dispatch-plan.md](docs/dispatch-plan.md).

## quick start — 30 seconds

```bash
# 1. verify node
node --version  # >=18

# 2. try the mcp directly (stdio, no install)
npx -y @adobe/express-developer-mcp@latest --yes
# → Adobe Express Developer MCP Server 1.0.0 started, using STDIO transport

# 3. or via heraldstack bridge
bash ./mcp/adobe-express-bridge.sh

# 4. wire into your ide — pick one
# cursor: ~/.cursor/mcp.json
# claude desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
# vscode: ~/.vscode/mcp.json
# heraldstack: configs/shannon.mcp.json / haunting.mcp.json
```

then restart ide → mcp panel shows `adobe-express-developer` connected → ask `using the adobe express mcp, show me manifestVersion 2 schema`.

feedback to adobe: discord https://discord.com/invite/nc3QDyFeb4

## guided tour — read in order

walk these six docs in order — each one assumes the prior. start here, not in a random doc.

### 1. dispatch plan — the roster and spec

**[docs/dispatch-plan.md](docs/dispatch-plan.md)** · alias [spec/plan.md](spec/plan.md) — canonical. 5 async agents, resources, deliverables, parallelization, success criteria. roster:

| #   | agent                   | delivers                                                                                      |
| --- | ----------------------- | --------------------------------------------------------------------------------------------- |
| 1   | express-mcp-technical   | [docs/mcp-technical.md](docs/mcp-technical.md)                                                |
| 2   | express-ecosystem       | [docs/ecosystem.md](docs/ecosystem.md)                                                        |
| 3   | adobe-mcp-landscape     | [docs/adobe-mcp-landscape.md](docs/adobe-mcp-landscape.md)                                    |
| 4   | heraldstack-standards   | [spec/wiring.md](spec/wiring.md) + bridge                                                     |
| 5   | repo-design + learnings | [docs/learnings.md](docs/learnings.md) + [docs/key-people-sites.md](docs/key-people-sites.md) |

read this first to understand _why_ the repo is shaped this way.

### 2. mcp-technical — package truth (no hallucination)

**[docs/mcp-technical.md](docs/mcp-technical.md)** — verified via `npm view --json` + adobe docs. answers:

- what version? `1.0.0` latest (created `2026-01-14T17:44:57Z`, modified `2026-07-08T08:12:01Z`, tarball `express-developer-mcp-1.0.0.tgz`, sha512 `kqEGiGSb...`, 14 files, 197kB, `bin: adobe-express-developer-mcp-server → bin/run.js`, `type: module`)
- what transport? `stdio` via `npx -y @adobe/express-developer-mcp@latest --yes` — no auth, no docker.
- what predecessor? `@adobe/express-add-on-dev-mcp` deprecated beta superseded.
- what capabilities? semantic search, typescript definitions (`@adobe/ccweb-add-on-sdk-types`), structured grounding.
- where does config live? cursor `~/.cursor/mcp.json`, claude `claude_desktop_config.json`, vscode `~/.vscode/mcp.json` — snippets in doc.

![mcp architecture](docs/assets/mcp-architecture.svg)

### 3. ecosystem — how express add-ons actually work

**[docs/ecosystem.md](docs/ecosystem.md)** — the mental model you need before writing code.

- **manifestVersion 2** — `manifest.json` at root, `requirements.apps: [{name: "Express", apiVersion: 1}]`, single `panel` entry point with `main: index.html` + `documentSandbox: code.js`, permissions `sandbox` + `oauth`.
- **two runtimes:** `iframe` (ui — `https://express.adobe.com/static/add-on-sdk/sdk.js`, `addOnUISdk.ready`, full browser apis, fetch, oauth popup) vs `document sandbox` (synchronous thread — `import { editor } from "express-document-sdk"`, `editor.createRectangle`, `makeColorFill`, `insertionParent.children.append`, limited web apis, slow engine, injected console only).
- **bridge:** communication apis `exposeApi` / `getApi` — iframe proxies, sandbox mutates.
- **distribution:** express marketplace `express.adobe.com/add-ons`, semver versioning, review.
- **cep/uxp vs express:** 9-row comparison — why express is iframe+sandbox (safe, fast review) vs cep's CEF+node and uxp's native plugins.

![iframe vs sandbox](docs/assets/sandbox-iframe-flow.svg)

### 4. landscape — official vs community (know what not to mix)

**[docs/adobe-mcp-landscape.md](docs/adobe-mcp-landscape.md)** — comparison table for all adobe-related mcps.

- **official:** express developer mcp (production, stdio, Dev Console oauth) vs rtdcp mcp (beta `2026-06-18`, remote http, browser oauth, gated by adobe rep, 5 quoted warnings: as-is without warranty, emerging standard, customer-elected risk, sandbox recommended).
- **community 7:** `matrayu/adobe-mcp` (FastMCP+WebSocket+UXP), `vanhock/adobe-animate-mcp` (CEP + `~/Documents/animate-mcp-bridge/` + JSFL), `marketo-mcp` (FastMCP+Marketo REST), `adobe/leonardo#269` (proposal), `firefly` (evolv3ai Docker), `aem-api` (404 unverified), `extensibility_mcp` (I/O Runtime). columns: transport/auth/tools/stars/activity.

crucial distinction: express mcp = _docs grounding_ (this lab) vs photoshop/animate mcps = _live canvas automation_ — different security models.

![landscape map](docs/assets/landscape-map.svg)

### 5. wiring — how it plugs into heraldstack-mcp

**[spec/wiring.md](spec/wiring.md)** — the standard. registry entry:

```yaml
- name: adobe-express-developer
  description: "adobe express add-on docs + typescript definitions mcp"
  launcher: launchers/bridges/adobe-express-bridge.sh
  runtime: npx
  image: "@adobe/express-developer-mcp"
  baked: null
  session_wired: [shannon, haunting]
  env_required: []
  status: active
  transport: stdio
  notes: "read-only docs/types, stdio via npx, no auth, opt-in for addon work"
```

launcher `mcp/adobe-express-bridge.sh` is one line: `exec npx -y @adobe/express-developer-mcp@latest --yes`. config sync `mcp/mcp.json` gives four variants (cursor/claude/vscode/heraldstack uses `bash -c ./mcp-launchers/run.sh adobe-express-bridge.sh`). discipline: bare-name stdio only, no `type:http`, secrets via env/ssm, gateway deferred.

![wiring flow](docs/assets/wiring-flow.svg)

### 6. people, sites, and learnings

- **[docs/key-people-sites.md](docs/key-people-sites.md)** — who to ask, where to look: adobe express team https://developer.adobe.com/express/add-ons/docs/, discord https://discord.com/invite/nc3QDyFeb4, npm maintainers `marbec tripod garthdb patrickfulton trieloff shazron krisnye +20` (author Adobe Inc.), experience league rtdcp beta, github adobe + community repos.
- **[docs/learnings.md](docs/learnings.md)** — what broke: `workflow_capacity slot retry changed immutable authority` on journal replay after hash change → mitigation null-guard + fresh launch vs resume, plus mcp version pinning and discord latency.

## visual map

all four svgs live in [docs/assets/](docs/assets/) and are embedded at the top of their doc plus a mermaid duplicate for github dark-mode:

| doc                    | svg                                                            | what it shows                                     |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| mcp-technical.md       | [mcp-architecture.svg](docs/assets/mcp-architecture.svg)       | stdio chain + what add-on runs inside express     |
| ecosystem.md           | [sandbox-iframe-flow.svg](docs/assets/sandbox-iframe-flow.svg) | iframe (fetch/oauth) vs sandbox (editor) + bridge |
| adobe-mcp-landscape.md | [landscape-map.svg](docs/assets/landscape-map.svg)             | official 2 vs community 7 map                     |
| spec/wiring.md         | [wiring-flow.svg](docs/assets/wiring-flow.svg)                 | registry → bridge → dispatcher → configs → IDE    |

raw urls for embeds: `https://raw.githubusercontent.com/chasko-labs/adobe-express-mcp-lab/main/docs/assets/<name>.svg`

## version matrix

| component                    | version      | notes                                                                      |
| ---------------------------- | ------------ | -------------------------------------------------------------------------- |
| @adobe/express-developer-mcp | 1.0.0 latest | supersedes @adobe/express-add-on-dev-mcp beta, sha512 kqEGi..., 2026-01-14 |
| node                         | >=18         | engines field, required for npx bridge                                     |
| express add-on manifest      | v2           | document sandbox + ui entrypoints                                          |
| rtdcp mcp                    | beta         | remote http, browser oauth, invite via adobe rep, as-is                    |

## settings matrix — where mcp.json lives

| ide            | file                         | snippet                                                                                                                          |
| -------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| cursor         | `~/.cursor/mcp.json`         | `{ "mcpServers": { "adobe-express-developer": { "command": "npx", "args": ["@adobe/express-developer-mcp@latest","--yes"] } } }` |
| claude desktop | `claude_desktop_config.json` | same as cursor                                                                                                                   |
| vscode         | `~/.vscode/mcp.json`         | `{ "servers": { "adobe-express-developer": { "command": "npx", "args": ["@adobe/express-developer-mcp@latest","--yes"] } } }`    |
| heraldstack    | `configs/*.mcp.json`         | `{ "adobe-express-developer": { "command": "bash", "args": ["-c","./mcp-launchers/run.sh adobe-express-bridge.sh"] } }`          |

## hello-world — proof it works

**[addons/hello-world/](addons/hello-world/)** — minimal add-on grounded by the mcp types (so the llm did not invent `adobe.addOn.*`).

- [manifest.json](addons/hello-world/manifest.json) — `manifestVersion: 2` panel
- [index.html](addons/hello-world/index.html) — imports `https://express.adobe.com/static/add-on-sdk/sdk.js`, waits `addOnUISdk.ready`, button calls `sandbox.createRectangle`
- [code.js](addons/hello-world/code.js) — `import { editor } from "express-document-sdk"` then `editor.createRectangle()` + `makeColorFill` + `append`

```bash
cd addons/hello-world && zip hello-world.zip manifest.json index.html code.js
# upload zip via https://developer.adobe.com/console → preview in express
```

click `draw 200×150 rectangle` → blue rectangle at `100,20` via `insertionParent.children.append`.

## repo layout

```
/README.md                      ← you are here — toc + guided tour
/docs/dispatch-plan.md          ← canonical roster (5 agents)
/docs/mcp-technical.md          ← package truth + svg + mermaid
/docs/ecosystem.md              ← iframe vs sandbox + svg + mermaid
/docs/adobe-mcp-landscape.md    ← official vs community + svg + mermaid
/docs/key-people-sites.md       ← who/where table
/docs/learnings.md              ← workflow_capacity + pinning notes
/docs/assets/*.svg              ← 4 architecture diagrams
/spec/plan.md                   ← alias to dispatch plan
/spec/wiring.md                 ← heraldstack registry + svg + mermaid
/mcp/adobe-express-bridge.sh    ← exec npx -y @adobe/express-developer-mcp@latest --yes
/mcp/mcp.json                   ← 4 ide variants
/addons/hello-world/            ← grounded sample (manifest + html + js)
```

## key people and sites

| who/what           | where                                                                                                    | role                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| adobe express team | https://developer.adobe.com/express/add-ons/docs/                                                        | docs, sdk, samples                       |
| discord            | https://discord.com/invite/nc3QDyFeb4                                                                    | feedback to adobe for mcp server         |
| npm maintainers    | https://www.npmjs.com/package/@adobe/express-developer-mcp                                               | marbec, tripod, garthdb +20 (Adobe Inc.) |
| experience league  | https://experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp                     | rtdcp beta docs                          |
| community          | matrayu/adobe-mcp, vanhock/adobe-animate-mcp, marketo-mcp, leonardo#269, firefly, aem, extensibility_mcp | reference impls for landscape            |

full table in [docs/key-people-sites.md](docs/key-people-sites.md).

## contributing and learnings

- [CONTRIBUTING.md](CONTRIBUTING.md) — branch protection (`main` protected, pr review, linear history), style guide (lowercase plain ascii), source citations required.
- [docs/learnings.md](docs/learnings.md) — workflow capacity failure `slot retry changed immutable authority` → null-guard + fresh launch, version pinning to `1.0.0` sha512, discord latency.
- license MIT — [LICENSE](LICENSE)
- `.gitignore` covers `node_modules/ dist/ .env .env.* .DS_Store *.log .ccx coverage/`

---

quick links: [adobe mcp docs](https://developer.adobe.com/express/add-ons/docs/guides/getting-started/local-development/mcp-server) · [npm](https://www.npmjs.com/package/@adobe/express-developer-mcp) · [rtdcp beta](https://experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp) · [express marketplace](https://express.adobe.com/add-ons)
