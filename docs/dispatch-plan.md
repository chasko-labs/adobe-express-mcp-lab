+-[ adobe-express-mcp-lab / dispatch plan ]-------------+
| async roster, resources, deliverables, wiring |
+--------------------------------------------------------+

# dispatch plan — adobe express developer mcp lab

first adobe mcp use case for chasko-labs. this doc is the roster and spec for async execution — each agent runs independently and returns a bounded artifact that lands in this repo.

## goal

build a public lab repo around `adobe express developer mcp` that documents process, learnings, features, settings, versions, wiring per heraldstack-mcp standards, and key people/sites. serve as reproducible starter for any heraldstack agent to ground express add-on work without hallucination.

## non-goals

- not a fork of adobe docs
- not handling real-time cdp beta data plane yet — deferred to phase 3 behind sandbox review
- not touching community photoshop/animate/firefly mcps beyond landscape comparison

## async roster

five agents run in parallel with no mutual dependencies. each gets scoped read-only resources and returns one primary file.

### 1 — express-mcp-technical

- objective: establish package truth for `@adobe/express-developer-mcp`
- resources:
  - `npm view @adobe/express-developer-mcp --json` — version, dist, bin, engines, time, maintainers
  - `web_fetch https://developer.adobe.com/express/add-ons/docs/guides/getting-started/local-development/mcp-server`
  - tarball readme via `npm pack --dry-run` or `npm view ... readme`
- deliverable: `docs/mcp-technical.md`
- contents:
  - version `1.0.0` latest (created 2026-01-14T17:44:57Z, modified 2026-07-08T08:12:01Z, tarball `express-developer-mcp-1.0.0.tgz`, sha512 `kqEGiGSb3QjfsWAaSwHk0pRwcTg6LGEj6A02baOxQR81ipTOEgFETE+0aeyyVacUfIMJyceQVslESjgdbv/puQ==`, 14 files, 197kb unpacked)
  - predecessor ` @adobe/express-add-on-dev-mcp` deprecated beta — superseded, new package `@adobe/express-developer-mcp`
  - transport stdio via `npx -y @adobe/express-developer-mcp@latest --yes`
  - engines `node >=18`, `type: module`, `bin: adobe-express-developer-mcp-server -> bin/run.js`
  - config locations: cursor `~/.cursor/mcp.json`, claude desktop `claude_desktop_config.json`, vscode `~/.vscode/mcp.json`
  - capabilities: semantic documentation search, typescript definitions, structured access for grounded code generation
  - setup steps: add json to mcpServers, restart ide, verify no auth required
  - feedback: `Adobe Express Add-on Developers Discord https://discord.com/invite/nc3QDyFeb4`
  - sources listed per claim

### 2 — express-ecosystem

- objective: document add-on model and marketplace so lab has context
- resources:
  - `developer.adobe.com/express/add-ons/docs` — getting started, guides, sdk reference, samples
  - experience league overview, chrome web store / express marketplace listing
- deliverable: `docs/ecosystem.md`
- contents:
  - add-on model: manifest, document sandbox vs ui runtime, express document apis, oauth
  - distribution via express marketplace, review process, versioning
  - compare cep/uxp (photoshop/illustrator extensibility) vs express add-ons
  - pricing notes
  - sources

### 3 — adobe-mcp-landscape

- objective: comparison table for all adobe-related mcps
- resources:
  - `experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp` — rtcdp beta remote http + browser oauth, beta disclaimer as-is without warranty, customer-elected risk, sandbox recommendation
  - github: `matrayu/adobe-mcp` (fastmcp + websocket + uxp plugin), `vanhock/adobe-animate-mcp` (cep panel + filesystem queue `~/Documents/animate-mcp-bridge/` + jsfl), `alejandrotoviedo14/marketo-mcp` (fastmcp + marketo rest), `adobe/leonardo/issues/269` proposal, `evolv3ai/claude-code-adobe-firefly`, `ag2-mcp-servers/adobe-aem-api`, `davidbenge/adobe_extensibility_mcp` (adobe i/o runtime)
- deliverable: `docs/adobe-mcp-landscape.md`
- contents:
  - official: express developer mcp (production), rtcdp mcp (beta, remote http, browser oauth, requires adobe rep for beta access, supports claude/chatgpt/cursor/vscode)
  - community: 7 entries with transport/auth/tools/stars/activity
  - beta warning quoted, security guidance

### 4 — heraldstack-standards

- objective: define how express mcp wires into heraldstack-mcp
- resources:
  - `~/code/heraldstack/heraldstack-mcp/registry.yaml` — fields: name, description, launcher, runtime, image, baked, session_wired, env_required, status, transport, notes
  - `launchers/bridges/context7-bridge.sh` as pattern `exec npx -y @upstash/context7-mcp`
  - `launchers/utils/run.sh` dispatcher, `configs/haunting.mcp.json` / `configs/shannon.mcp.json`
  - `heraldstack-infra` compose conventions `localhost:81xx/mcp` + healthcheck
- deliverable: `spec/wiring.md` + `mcp/adobe-express-bridge.sh`
- contents:
  - registry entry:
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
      notes: "read-only docs/types, stdio via npx, no auth, opt-in for addon work"
    ```
  - launcher `mcp/adobe-express-bridge.sh`: `#!/usr/bin/env bash` `exec npx -y @adobe/express-developer-mcp@latest --yes`
  - config sync: `mcp/mcp.json` variants per ide + `heraldstack-mcp` entry via `bash -c ./mcp-launchers/run.sh adobe-express-bridge.sh`
  - discipline: bare-name stdio entries only, no `type:http` in settings, secrets via env/ssm, gateway routing deferred (read-only, no cedar value)

### 5 — repo-design + learnings scaffold

- objective: finish repo hygiene and capture learnings loop
- resources:
  - `gh repo view chasko-labs/braket-roles-guide --json` as public template reference
  - heraldstack style guide `~/code/heraldstack/heraldstack-mcp/STYLE_GUIDE.md`
- deliverable: `docs/learnings.md`, `docs/key-people-sites.md`, `CONTRIBUTING.md`, `.gitignore`, `LICENSE`
- contents:
  - learnings: workflow capacity failure `workflow_capacity slot retry changed immutable authority` on journal replay after hash change — mitigation null-guard + fresh launch vs resume, mcp version pinning, discord feedback latency
  - key people/sites table (see below), license MIT, gitignore for node/express, branch protection note

## parallelization

```
phase 0 — dispatch: agents 1-5 in parallel (no deps)
phase 1 — verify: adversarial skeptic per sweep (verdict stands/refuted)
phase 2 — synthesize: merge survivors into this doc
phase 3 — execute: agents fill their target files, push to repo
```

budget: 5 parallel agents, 30-150k tokens each, ~400-750k total. runtime cap 16, so single batch saturates without queue.

## version matrix to document

| component                    | version      | notes                                                                              |
| ---------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| @adobe/express-developer-mcp | 1.0.0 latest | supersedes @adobe/express-add-on-dev-mcp beta, tarball sha512 kqEGi..., 2026-01-14 |
| node                         | >=18         | engines field, required for npx bridge                                             |
| express add-on manifest      | v2           | document sandbox + ui entrypoints                                                  |
| rtcdp mcp                    | beta         | remote http, browser oauth, invite via adobe rep, as-is                            |

## settings matrix

| ide            | file                       | snippet                                                                                                                          |
| -------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| cursor         | ~/.cursor/mcp.json         | `{ "mcpServers": { "adobe-express-developer": { "command": "npx", "args": ["@adobe/express-developer-mcp@latest","--yes"] } } }` |
| claude desktop | claude_desktop_config.json | same                                                                                                                             |
| vscode         | ~/.vscode/mcp.json         | `{ "servers": { "adobe-express-developer": { "command": "npx", "args": ["@adobe/express-developer-mcp@latest","--yes"] } } }`    |
| heraldstack    | configs/\*.mcp.json        | `{ "adobe-express-developer": { "command": "bash", "args": ["-c","./mcp-launchers/run.sh adobe-express-bridge.sh"] } }`          |

## key people / sites

| who/what           | where                                                                                                                                                                               | role                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| adobe express team | https://developer.adobe.com/express/add-ons/docs/                                                                                                                                   | docs, sdk, samples                                                                          |
| discord            | https://discord.com/invite/nc3QDyFeb4                                                                                                                                               | feedback to adobe for mcp server                                                            |
| npm maintainers    | https://www.npmjs.com/package/@adobe/express-developer-mcp                                                                                                                          | marbec, tripod, garthdb, patrickfulton, trieloff, shazron, krisnye + 20 (author Adobe Inc.) |
| experience league  | https://experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp                                                                                                | rtcdp beta docs                                                                             |
| github adobe       | https://github.com/adobe, https://github.com/adobe/leonardo/issues/269                                                                                                              | leonardo mcp proposal, extensibility_mcp                                                    |
| community          | matrayu/adobe-mcp, vanhock/adobe-animate-mcp, alejandrotoviedo14/marketo-mcp, ag2-mcp-servers/adobe-aem-api, davidbenge/adobe_extensibility_mcp, evolv3ai/claude-code-adobe-firefly | reference impls for landscape                                                               |

## repo layout

```
/README.md
/docs/dispatch-plan.md   <- this file (canonical)
/docs/mcp-technical.md
/docs/ecosystem.md
/docs/adobe-mcp-landscape.md
/docs/key-people-sites.md
/docs/learnings.md
/spec/plan.md            <- symlink/alias to dispatch plan
/spec/wiring.md
/mcp/adobe-express-bridge.sh
/mcp/mcp.json            <- cursor + claude + vscode variants
/addons/hello-world/     <- sample addon generated via mcp grounding (phase 2)
```

## success criteria

- dispatch plan merges without conflict and lands at `https://github.com/chasko-labs/adobe-express-mcp-lab/blob/main/docs/dispatch-plan.md`
- each of 5 agents delivers its file with sources
- `adobe-express-developer` registry entry validates against `registry-schema.md`
- hello-world addon loads in express via `npm run build` grounded by mcp ts definitions

## open decisions

- repo name locked to `chasko-labs/adobe-express-mcp-lab` — public, MIT
- rtcdp wiring deferred — needs adobe beta enrollment + sandbox pii review before any `status: active`
- heraldstack-mcp stays private — this lab is the public surface that references it
