+-[ adobe-express-mcp-lab ]------------------------------+
| adobe express developer mcp — lab, wiring, learnings |
+--------------------------------------------------------+

lab for the adobe express developer mcp as first adobe mcp use case — documents process, learnings, features, settings, versions, wiring per heraldstack-mcp standards.

## what lives here

- `docs/dispatch-plan.md` — async agent roster, resources, deliverables, parallelization, repo layout, wiring spec
- `docs/mcp-technical.md` — package truth, transport, tools, setup
- `docs/ecosystem.md` — add-on model, marketplace, cdp vs cep/uxp
- `docs/adobe-mcp-landscape.md` — official vs community mcp comparison
- `spec/plan.md` — alias to dispatch plan for spec-driven workflow
- `mcp/` — launcher + mcp.json variants per heraldstack-mcp discipline

## quick links

- adobe express developer mcp: https://developer.adobe.com/express/add-ons/docs/guides/getting-started/local-development/mcp-server
- npm: https://www.npmjs.com/package/@adobe/express-developer-mcp
- rtcdp mcp beta: https://experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp
- heraldstack-mcp standards: https://github.com/chasko-labs/heraldstack-mcp (private — see docs/wiring)

## quick start

```bash
npx -y @adobe/express-developer-mcp@latest --yes
# or via heraldstack bridge: bash ./mcp/adobe-express-bridge.sh
```

see `docs/dispatch-plan.md` for full dispatch plan and version matrix.
