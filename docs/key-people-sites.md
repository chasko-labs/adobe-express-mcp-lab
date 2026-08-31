# key people and sites — adobe express mcp lab

reference table for the express developer mcp and surrounding adobe and community surface — mirrors dispatch plan.

| who / what | where | role |
| --- | --- | --- |
| adobe express team | https://developer.adobe.com/express/add-ons/docs/ | docs, sdk, samples, manifest and runtime guides |
| discord | https://discord.com/invite/nc3QDyFeb4 | feedback to adobe for mcp server — official support channel listed in mcp readme |
| npm package | https://www.npmjs.com/package/@adobe/express-developer-mcp | distribution for mcp server, version 1.0.0 latest |
| npm maintainers | https://www.npmjs.com/package/@adobe/express-developer-mcp | marbec, tripod, garthdb, patrickfulton, trieloff, shazron, krisnye + 20 others (author Adobe Inc.) |
| experience league — rtcdp mcp | https://experienceleague.adobe.com/en/docs/experience-platform/rtcdp/intro/rtcdp-mcp | rtcdp beta docs — remote http, browser oauth, as-is without warranty, sandbox recommendation |
| github adobe org | https://github.com/adobe | adobe open source org — express, leonardo, extensibility samples |
| github leonardo proposal | https://github.com/adobe/leonardo/issues/269 | leonardo mcp proposal — design discussion reference |
| community — matrayu/adobe-mcp | https://github.com/matrayu/adobe-mcp | fastmcp plus websocket plus uxp plugin — photoshop-adjacent community mcp |
| community — vanhock/adobe-animate-mcp | https://github.com/vanhock/adobe-animate-mcp | cep panel plus filesystem queue `~/Documents/animate-mcp-bridge/` plus jsfl |
| community — alejandrotoviedo14/marketo-mcp | https://github.com/alejandrotoviedo14/marketo-mcp | fastmcp plus marketo rest |
| community — ag2-mcp-servers/adobe-aem-api | https://github.com/ag2-mcp-servers/adobe-aem-api | aem api community mcp |
| community — davidbenge/adobe_extensibility_mcp | https://github.com/davidbenge/adobe_extensibility_mcp | adobe i/o runtime bridge |
| community — evolv3ai/claude-code-adobe-firefly | https://github.com/evolv3ai/claude-code-adobe-firefly | firefly community mcp |
| template reference | https://github.com/chasko-labs/braket-roles-guide | public lab template — MIT, friendly guide pattern for readme and contributing |

## notes

- express developer mcp is the first adobe mcp use case for chasko-labs — transport stdio via `npx -y @adobe/express-developer-mcp@latest --yes`, engines node >=18, no auth
- predecessor `@adobe/express-add-on-dev-mcp` deprecated beta — use `@adobe/express-developer-mcp`
- rtcdp mcp is beta, remote http, browser oauth, requires adobe rep for beta access, supports claude, chatgpt, cursor, vscode — not wired in phase 1 behind sandbox review
- heraldstack-mcp stays private — this lab is the public surface that references it per dispatch plan

## sources

- dispatch plan `docs/dispatch-plan.md` — key people / sites table and version matrix
- npm view `@adobe/express-developer-mcp` — maintainers list and author field
- experience league rtcdp mcp page
- github adobe org and leonardo issue 269
