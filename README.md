# Data Workbench

Data Workbench is a browser-based data transformer. Build a recipe of
operations, drop in text or a file, and see each step's output. All processing
runs locally in your browser; nothing is uploaded.

View the live application [here](https://data-workbench-batuhanmeral.vercel.app/).

## Features

- 62 operations: encoding, text, hash, crypto, compression, data (JSON, JWT,
  timestamps, UUID, entropy) and extract (regex, URLs, emails, IPs, hashes).
- Auto-bake as you edit, or bake manually with Ctrl+Enter (⌘Enter on Mac).
- Inspect any step's output as text or hex and download the result.
- Command palette (Ctrl+K or ⌘K) for operations, saved recipes and settings.
- Share a recipe, and optionally its input, as a link. The data stays in the
  URL fragment, which the browser never sends to a server.
- Import CyberChef recipes.
- Magic suggests decoding chains, such as From Base64 then Gunzip.
- Large inputs (10 MB and up) run in a Web Worker without freezing the page.

## Development

Requires Node.js 24 (see `.nvmrc`) and the pnpm version pinned in
`package.json`.

```sh
pnpm i
pnpm dev        # start the dev server
pnpm lint       # lint
pnpm typecheck  # type check
pnpm test       # unit tests
pnpm build      # static export to out/
pnpm e2e        # end-to-end tests (after a build)
```

Run `pnpm exec playwright install chromium` once before the first `pnpm e2e`.

`pnpm build` also regenerates the Content Security Policy in `vercel.json`.
Commit it when it changes; CI fails if it is out of date.

To add an operation, see [CONTRIBUTING.md](CONTRIBUTING.md). To report a
vulnerability, see [SECURITY.md](SECURITY.md).

## Screenshots

<!-- Add screenshots here, for example:
![Workspace](.github/screenshots/workspace.png)
-->

## License

[Apache 2.0](LICENSE)
