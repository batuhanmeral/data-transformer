import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { parseJson } from "./_json";
import { unsupportedChefOption } from "../_chef-args";

function sortObjectKeys(_key: string, value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(record).sort().map((key) => [key, record[key]]));
}

export default defineOperation({
  id: "json-beautify",
  name: "JSON Beautify",
  category: "data",
  description: "Format JSON with indentation.",
  input: "string",
  output: "string",
  args: z.object({
    indent: z.number().int().min(0).max(10).default(2).meta({ label: "Spaces per indent" }),
    sortKeys: z.boolean().default(false).meta({ label: "Sort object keys" }),
  }),
  run(input, { indent, sortKeys }) {
    const value = parseJson(input);
    return JSON.stringify(value, sortKeys ? sortObjectKeys : undefined, indent);
  },
  cyberchef: {
    name: "JSON Beautify",
    mapArgs([indent, sortKeys, formatted]) {
      if (indent !== undefined && (typeof indent !== "string" || !/^ *$/.test(indent))) {
        unsupportedChefOption("JSON indentation");
      }
      return {
        indent: formatted === false ? 0 : typeof indent === "string" ? Math.min(indent.length, 10) : 4,
        sortKeys: sortKeys === true,
      };
    },
  },
});
