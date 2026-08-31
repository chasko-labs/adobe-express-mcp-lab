# contributing — adobe-express-mcp-lab

## branch protection

- `main` is protected — no direct pushes
- open a feature branch from `main`, push branch, open pull request
- require at least one review before merge, status checks must pass
- keep history linear — squash or rebase before merge, no merge commits from stale branches
- protect via github settings: branch protection rule for `main` with require pull request and require status checks

## pull request process

- fork or branch: `git checkout -b feat/short-slug`
- keep changes scoped — one deliverable per pr where possible (docs, mcp wiring, sample addon)
- follow `~/code/heraldstack/heraldstack-mcp/STYLE_GUIDE.md` — lowercase plain ascii, no banned words, ascii header only on readme, numbered lists only when order matters
- include sources for any version or capability claim (npm view, web_fetch, tarball metadata)
- run local checks before opening pr:
  ```
  npm run build  # when addon sample present
  npm test       # when tests present
  ```
- pr description: what changed, why, sources, wiring impact if any
- link related issue when applicable, request review from maintainer
- ci validates readme lint and wiring schema when present

## license

- this repo is MIT — see `LICENSE` (Copyright (c) 2026 chasko-labs)
- by contributing you agree your contributions are licensed under the same MIT terms
- template reference for public lab pattern: `chasko-labs/braket-roles-guide` (MIT, https://github.com/chasko-labs/braket-roles-guide)

## questions

- use discord https://discord.com/invite/nc3QDyFeb4 for mcp server feedback to adobe
- use github issues for lab bugs and doc fixes
