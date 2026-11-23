# Contributing to Data Workbench

See the [README](README.md) for setup and development commands. Use
Conventional Commits for commit messages.

## Add an operation

Create `src/operations/<category>/<operation-id>.ts` and a sibling
`<operation-id>.test.ts`. Use a unique kebab-case ID and an existing category.
Default-export a call to `defineOperation`. The registry is generated from these
files, so the development and test commands discover the operation automatically.
Prefix shared helper filenames with `_` so they stay out of the registry.

## Define the operation

Declare input and output types, then define argument defaults in a Zod object
imported from `@/lib/zod`. TypeScript infers the input, arguments, and return
value of `run(input, args, ctx)` from that definition. For example, this is the
definition of a byte-to-text encoder using the same API as `To Base64`:

```ts
import { defineOperation } from "@/core/define-operation";
import { z } from "@/lib/zod";
import { unsupportedChefOption } from "../_chef-args";

export default defineOperation({
  id: "to-base64",
  name: "To Base64",
  category: "encoding",
  description: "Encode bytes as standard or URL-safe Base64.",
  input: "bytes",
  output: "string",
  args: z.object({
    alphabet: z.enum(["standard", "urlsafe"]).default("standard").meta({ label: "Alphabet" }),
  }),
  run(input, { alphabet }) {
    const chunks: string[] = [];
    const chunkSize = 12_288;
    for (let offset = 0; offset < input.length; offset += chunkSize) {
      chunks.push(btoa(String.fromCharCode(...input.subarray(offset, offset + chunkSize))));
    }
    const encoded = chunks.join("");
    return alphabet === "urlsafe"
      ? encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
      : encoded;
  },
  cyberchef: {
    name: "To Base64",
    mapArgs([alphabet]) {
      if (alphabet === undefined || alphabet === "A-Za-z0-9+/=") return {};
      if (alphabet === "A-Za-z0-9-_") return { alphabet: "urlsafe" as const };
      return unsupportedChefOption("Base64 alphabet");
    },
  },
});
```

Keep the operation worker-compatible. Treat input as immutable and return a
fresh byte array when producing bytes. Use `ctx.progress(fraction)` to report
progress for long-running work.

## CyberChef and Magic metadata

Set `cyberchef.name` to the matching CyberChef operation name.
`cyberchef.mapArgs(args: unknown[])` accepts positional arguments and returns a
named object accepted by the operation's Zod schema. Use
`unsupportedChefOption` when a supplied option cannot be represented.

A decoding operation can provide `magic.detect(sample: Uint8Array): number`.
Return a confidence score from 0 to 1 based on the sample. For example, a
hexadecimal decoder could provide this field:

```ts
magic: {
  detect(sample) {
    const text = new TextDecoder().decode(sample).trim();
    return /^(?:[0-9a-f]{2}){4,}$/i.test(text) ? 0.6 : 0;
  },
},
```

## Load heavy dependencies lazily

Import heavy libraries such as `fflate` and `@noble/*` with
`await import(...)` inside an async `run` function. This keeps those libraries
out of code that only reads operation metadata.

## Test the operation

Every operation needs a sibling test file. The registry test checks that the
generated registry covers the operation files and that each one has a sibling
`.test.ts`. Cover a known test vector, empty input, and invalid input where
applicable. Run `pnpm test` to regenerate the registry and run the unit suite.
Run `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm e2e` before
submitting a change.
