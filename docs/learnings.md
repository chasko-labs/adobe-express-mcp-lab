# learnings — adobe express mcp lab

lab iteration notes for `adobe-express-mcp-lab` — what broke, what held, what to pin next run.

## workflow capacity failure — journal replay after hash change

- symptom: `workflow_capacity slot retry changed immutable authority` on journal replay after hash change
- trigger: workflow engine replays journal entries to reconstruct state, hash of workflow definition changed between launches, engine treats stored authority as immutable and rejects slot retry that mutates it
- observed in: heraldstack workflow runner, replay path that rehydrates prior run from journal on resume
- impact: resume fails deterministically, no forward progress, capacity slot marked unusable

### mitigation — null-guard plus fresh launch vs resume

- null-guard: check slot and authority presence before retry, early return when authority is null or missing, prevents retry from attempting to overwrite immutable field
- fresh launch vs resume: when hash changed or mitigation patched, do not resume from journal — launch fresh workflow run instead
  - resume preserves journal and replays old hash, reproduces failure
  - fresh launch starts clean journal with current hash, avoids replay mismatch
- code pattern:
  ```
  if (!slot || !slot.authority) return
  if (hashChanged(journal.hash, current.hash)) launchFresh()
  else resume()
  ```
- verification: fresh launch succeeds where resume loops, null-guard stops throw on missing slot

### follow-up

- pin workflow engine hash in spec or version file, bump explicitly on definition change
- add test that replays journal with altered hash and asserts null-guard does not throw
- document resume vs fresh decision in runbook so operator picks correct path

## mcp version pinning

- problem: `npx -y @adobe/express-developer-mcp@latest` floats, upstream 1.0.0 may move without notice
- mitigation: pin in lab to `1.0.0` (sha512 `kqEGiGSb3QjfsWAaSwHk0pRwcTg6LGEj6A02baOxQR81ipTOEgFETE+0aeyyVacUfIMJyceQVslESjgdbv/puQ==`, 14 files, 197kb unpacked, engines node >=18)
- note predecessor `@adobe/express-add-on-dev-mcp` deprecated beta — superseded by `@adobe/express-developer-mcp`
- config: keep `@latest` in user quick-start snippet for freshness, pin exact version in `mcp/mcp.json` and registry entry and lockfile for reproducibility
- check: `npm view @adobe/express-developer-mcp --json` before each lab iteration, update version matrix in dispatch plan when upstream moves

## discord feedback latency

- channel: Adobe Express Add-on Developers Discord https://discord.com/invite/nc3QDyFeb4 — official feedback path listed in mcp readme
- observation: async feedback, not real-time, expect hours to days for response on mcp server issues
- mitigation: file issue first, cross-link discord thread, keep lab unblocked by pinning last known good version and documenting workaround locally
- note: discord invite is public, no auth required for mcp itself, keep questions scoped to docs and typescript definitions

## lab iteration notes

- spec-driven: dispatch plan at `docs/dispatch-plan.md` is canonical, `spec/plan.md` aliases it — single source of truth for five parallel agents
- parallelization: five agents run with no mutual deps, budget ~400-750k tokens, runtime cap 16 — one batch saturates without queue
- heraldstack wiring: launcher `mcp/adobe-express-bridge.sh` as `exec npx -y @adobe/express-developer-mcp@latest --yes`, stdio only, no `type:http` in settings, secrets via env/ssm, gateway routing deferred (read-only, no cedar value)
- rtcdp deferred: beta remote http plus browser oauth at https://experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp — as-is without warranty, customer-elected risk, sandbox recommendation, requires adobe rep for beta access — stays out of phase 1
- style: follow `~/code/heraldstack/heraldstack-mcp/STYLE_GUIDE.md` — lowercase plain ascii, ascii headers only on readme, no banned words, numbered lists only when order matters
- template reference: `chasko-labs/braket-roles-guide` (MIT, https://github.com/chasko-labs/braket-roles-guide) — public lab pattern for readme structure, license, contributing flow
- next steps: wire adversarial verify sweep per dispatch plan, then synthesize survivors into hello-world addon grounded by mcp typescript definitions

## sources

- dispatch plan `docs/dispatch-plan.md` — version matrix, settings matrix, roster
- heraldstack-mcp style guide `~/code/heraldstack/heraldstack-mcp/STYLE_GUIDE.md`
- gh repo view `chasko-labs/braket-roles-guide --json` — MIT template reference
- npm ` @adobe/express-developer-mcp` 1.0.0 tarball metadata
- discord invite https://discord.com/invite/nc3QDyFeb4
