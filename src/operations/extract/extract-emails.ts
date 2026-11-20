import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { formatMatches, mapChefListArgs, uniqueArg } from "./_matches";

const atom = "[a-z\\d!#$%&'*+/=?^_\x60{|}~-]";
const label = "[a-z\\d](?:[a-z\\d-]{0,61}[a-z\\d])?";
const emailPattern = new RegExp(
  "(?<![.@]|" + atom + ")" + atom + "+(?:\\." + atom + "+)*@" +
  label + "(?:\\." + label + ")+(?![\\w@-]|\\.[\\w.-])",
  "gi",
);

export default defineOperation({
  id: "extract-emails",
  name: "Extract Emails",
  category: "extract",
  description: "Find email addresses in text.",
  input: "string",
  output: "string",
  args: z.object({ unique: uniqueArg }),
  run(input, { unique }) {
    return formatMatches(input.match(emailPattern) ?? [], unique);
  },
  cyberchef: {
    name: "Extract email addresses",
    mapArgs: mapChefListArgs,
  },
});
