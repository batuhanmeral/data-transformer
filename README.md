# Unravel

Unravel is a browser-based data transformer built with Next.js. Data processing
runs locally in the browser.

Add operations from the catalog or the command palette (Ctrl+K or ⌘K), then
enter text or drop a file into **Input**. In the **Recipe** header, use
**Auto-bake** to run as you edit or **Bake** to run manually. Ctrl+Enter (⌘Enter
on Mac) also runs the recipe. Select a step to inspect its output in text or
hex, and download the full result from **Output**. The workspace saves your
latest input and recipe in this browser.

## Features

- 62 operations in seven groups: encoding, text, hash, crypto, compression,
  data (JSON, JWT, timestamps, UUID, entropy) and extract (regex, URLs, emails,
  IPs, hashes).
- Recipes run in a Web Worker, so large inputs (10 MB and up) do not block the
  page.
- **Share** a recipe, and optionally its input, as a link. Everything is stored
  in the URL fragment, which the browser never sends to the server.
- **Import CyberChef recipe** from the command palette accepts CyberChef's JSON
  or compact recipe format and lists any steps it cannot map.
- **Magic** suggests decoding chains (for example From Base64 → Gunzip) above
  the output. Click a suggestion to add its steps to the recipe.
- Inter and JetBrains Mono are bundled with the static site. The workspace
  makes no external requests.

To add an operation, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Requires Node.js 24 (see `.nvmrc`) and the pnpm version pinned in `package.json`.

```sh
pnpm i
pnpm dev
```

Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` for local checks. Run
`pnpm build` to export the static site to `out/`, refresh its deployment
headers in `vercel.json`, and write the third-party license notices to
`out/THIRD-PARTY-NOTICES.txt`. Run `pnpm csp:check` to verify the generated
headers against the current export, and `pnpm csp:verify` to build twice and
confirm the headers are identical.
Commit any changes to `vercel.json` after a build. CI runs `pnpm csp:verify`
and fails if `vercel.json` or the generated operation index differs from the
commit.
Run `pnpm exec playwright install chromium` once, then use `pnpm e2e` after
a build to test the static export with its production headers. The 10 MB
performance check runs last, on its own, after the parallel suite; use
`pnpm e2e --project perf --no-deps` to run only that check.

## CI and security

Every pull request runs lint, type checks, unit tests, the build with its CSP
determinism check and the Playwright suite (`CI`), plus dependency review.
`Security` runs Semgrep, zizmor, gitleaks on the full history and Trivy on the
lockfile, on pull requests, on `main` and weekly; runs outside pull requests
also publish a CycloneDX SBOM. `Scorecard` rates the repository's supply-chain
practices. To report a vulnerability, see [SECURITY.md](SECURITY.md).

Detailed project documentation is in [`.docs/`](.docs/) and is written in Turkish.

Licensed under [Apache 2.0](LICENSE).
