# hello-world — Adobe Express Add-on (MCP grounded)

 Generated with `@adobe/express-developer-mcp@1.0.0` types — no hallucinated APIs.

 ## what it does
 - iframe `index.html` imports `https://express.adobe.com/static/add-on-sdk/sdk.js` and waits `addOnUISdk.ready`
 - button click calls `sandbox.createRectangle({width:200,height:150,x:100,y:20})`
 - `code.js` runs in document sandbox (synchronous thread): `import { editor } from "express-document-sdk"` then `editor.createRectangle()` + `editor.makeColorFill(fromRGB(...))` + `parent.children.append(rect)`
 - bridged via Communication APIs (`runtime.exposeApi` / `getApi`)

 ## run locally
 ```bash
 # from this folder — no build step for this minimal sample (pure static)
 # sideload in Express: https://developer.adobe.com/express/add-ons/docs/guides/getting-started/
 # 1. zip manifest.json + index.html + code.js
 # 2. upload via Developer Console -> Preview in Express
 ```
