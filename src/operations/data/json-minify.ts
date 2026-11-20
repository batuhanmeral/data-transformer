import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { parseJson } from "./_json";

export default defineOperation({
  id: "json-minify",
  name: "JSON Minify",
  category: "data",
  description: "Remove insignificant whitespace from valid JSON.",
  input: "string",
  output: "string",
  args: z.object({}),
  run: (input) => JSON.stringify(parseJson(input)),
  cyberchef: {
    name: "JSON Minify",
    mapArgs: () => ({}),
  },
});
