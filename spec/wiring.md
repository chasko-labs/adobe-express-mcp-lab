# wiring — adobe express developer mcp / heraldstack-mcp

heraldstack-mcp wiring for `@adobe/express-developer-mcp` — read-only docs/types over stdio via npx.

## registry entry

source of truth `~/code/heraldstack/heraldstack-mcp/registry.yaml` — fields: name, description, launcher, runtime, image, baked, session_wired, env_required, status, transport, notes

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

notes on fields:

- `runtime: npx` — no docker image, no baked artifact, matches `context7-bridge.sh` pattern `exec npx -y @upstash/context7-mcp`
- `baked: null` — n/a for npx (not true/false registry pull)
- `session_wired: [shannon, haunting]` — opt-in for add-on work, not gander/ux-testing by default
- `env_required: []` — no auth, no secrets, public npm package
- `transport: stdio` — bare stdio, no `localhost:81xx/mcp` http endpoint and no healthcheck (contrast heraldstack-infra compose convention `http://localhost:81xx/mcp` + `http://localhost:81xx/healthz` for persistent docker/http servers like context7:8130, goose-docs:8131, qdrant:8100-8106, valkey:8110, jaeger:8120)
- `status: active` — production `1.0.0`, supersedes `@adobe/express-add-on-dev-mcp` beta

gateway routing: deferred — read-only docs/types has no cedar policy value, no `gateway_routing` block (unlike `github` entry with `agentcore-gateway-bridge.sh` + `HERALD_PERSONA` tier map). revisit if write or user-data scopes added.

## launcher detail

`launchers/bridges/adobe-express-bridge.sh` (repo-local copy at `mcp/adobe-express-bridge.sh`):

```bash
#!/usr/bin/env bash
exec npx -y @adobe/express-developer-mcp@latest --yes
```

pattern from `launchers/bridges/context7-bridge.sh`:

```bash
#!/usr/bin/env bash
# Context7 MCP — direct npx (no container needed, context7.com is the backend)
exec npx -y @upstash/context7-mcp 2>/dev/null
```

discipline: single `exec` line, no env injection, no docker wrapper, stdio pass-through. executable `chmod +x`. dispatcher resolves via `launchers/utils/run.sh` which `find -L "$LAUNCHERS_ROOT" -name "$SCRIPT_NAME"` and execs locally on `rocm-aibox` or via `ssh bryanchasko@rocm-aibox.local`.

## config sync — mcp/mcp.json variants

`mcp/mcp.json` provides per-ide snippets plus heraldstack entry. bare-name stdio entries only.

```json
{
  "_comment": "adobe express developer mcp — variants for cursor / claude desktop / vscode + heraldstack bridge",
  "cursor": {
    "mcpServers": {
      "adobe-express-developer": {
        "command": "npx",
        "args": ["@adobe/express-developer-mcp@latest", "--yes"]
      }
    }
  },
  "claude_desktop": {
    "mcpServers": {
      "adobe-express-developer": {
        "command": "npx",
        "args": ["@adobe/express-developer-mcp@latest", "--yes"]
      }
    }
  },
  "vscode": {
    "servers": {
      "adobe-express-developer": {
        "command": "npx",
        "args": ["@adobe/express-developer-mcp@latest", "--yes"]
      }
    }
  },
  "heraldstack": {
    "mcpServers": {
      "adobe-express-developer": {
        "command": "bash",
        "args": ["-c", "./mcp-launchers/run.sh adobe-express-bridge.sh"]
      }
    }
  }
}
```

mapping to ide files:

- cursor: `~/.cursor/mcp.json` -> `mcpServers.adobe-express-developer`
- claude desktop: `claude_desktop_config.json` -> `mcpServers.adobe-express-developer`
- vscode: `~/.vscode/mcp.json` -> `servers.adobe-express-developer` (vscode uses `servers` key, not `mcpServers`)
- heraldstack: `configs/shannon.mcp.json` / `configs/haunting.mcp.json` -> `mcpServers.adobe-express-developer` via `bash -c ./mcp-launchers/run.sh adobe-express-bridge.sh` (dispatcher handles local vs remote execution)

verify: `cat mcp/mcp.json | python3 -m json.tool` and `bash -n mcp/adobe-express-bridge.sh`.

## discipline

- bare-name stdio entries only — no `type: http` in settings, no `localhost:81xx` http transport for this server (npx stdio is the transport)
- no `type:http` in `configs/*.mcp.json` entries — matches `context7-bridge.sh` stdio bridge pattern for command-only lanes; http entries are reserved for heraldstack-infra persistent containers with `healthcheck`
- secrets via env/ssm — `env_required: []` for this server; if auth added later, source from `~/mcp-launchers/.env` or host env / aws ssm, never hardcoded in `mcp.json` or bridge
- gateway routing deferred — read-only, no cedar value; do not add `gateway_routing` / `bridge: launchers/bridges/agentcore-gateway-bridge.sh` until write scopes exist
- version pinning — launcher uses `@latest --yes`; pin to `@1.0.0` if reproducible builds required (`npx -y @adobe/express-developer-mcp@1.0.0 --yes`)
- opt-in — `session_wired` limited to shannon/haunting; enable per-session by adding to `configs/*.mcp.json`, not global auto-load

## verification checklist

- [x] `registry.yaml` entry matches yaml block above
- [x] `mcp/adobe-express-bridge.sh` is `#!/usr/bin/env bash` + `exec npx -y @adobe/express-developer-mcp@latest --yes`, executable
- [x] `mcp/mcp.json` has four variants (cursor, claude_desktop, vscode, heraldstack) with bare-name `adobe-express-developer`
- [x] heraldstack variant uses `bash -c ./mcp-launchers/run.sh adobe-express-bridge.sh` (dispatcher, not direct npx)
- [x] no `type:http`, no `env` secrets in json, no gateway routing

## references

- registry: `~/code/heraldstack/heraldstack-mcp/registry.yaml`
- bridge pattern: `~/code/heraldstack/heraldstack-mcp/launchers/bridges/context7-bridge.sh`
- dispatcher: `~/code/heraldstack/heraldstack-mcp/launchers/utils/run.sh`
- configs: `~/code/heraldstack/heraldstack-mcp/configs/haunting.mcp.json`, `configs/shannon.mcp.json`
- infra compose: `~/code/heraldstack/heraldstack-infra/docker-compose.yml` (`localhost:81xx/mcp` + `/healthz`)
- package: `npm view @adobe/express-developer-mcp --json` v1.0.0

