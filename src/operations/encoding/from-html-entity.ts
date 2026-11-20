import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectHtmlEntities } from "../../core/magic/detectors";

const named: Record<string, string> = {
  amp: "&", AMP: "&", lt: "<", LT: "<", gt: ">", GT: ">",
  quot: '"', QUOT: '"', apos: "'", nbsp: "\u00a0", copy: "©", reg: "®", euro: "€",
};

export default defineOperation({
  id: "from-html-entity",
  name: "From HTML Entity",
  category: "encoding",
  description: "Decode HTML markup entities and numeric character references.",
  input: "string",
  output: "string",
  args: z.object({}),
  run(input, _args, ctx) {
    let count = 0;
    return input.replace(/&(#(?:[xX])?[^&;\s]*|[a-z][a-z\d]*);/gi, (entity, token: string, offset: number) => {
      if (count++ % 65536 === 0) ctx.progress(offset / input.length);
      if (!token.startsWith("#")) return Object.hasOwn(named, token) ? named[token]! : entity;
      const hex = /^#x/i.test(token);
      const valid = hex ? /^#x[\da-f]+$/i : /^#\d+$/;
      const value = Number.parseInt(token.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!valid.test(token) || value === 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
        throw new Error("Invalid HTML numeric entity.");
      }
      return String.fromCodePoint(value);
    });
  },
  magic: { detect: detectHtmlEntities },
  cyberchef: {
    name: "From HTML Entity",
    mapArgs: () => ({}),
  },
});
