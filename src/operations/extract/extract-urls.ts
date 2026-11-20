import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { formatMatches, mapChefListArgs, uniqueArg } from "./_matches";

const urlCandidate = /(?<![\w+.-])[a-z][a-z\d+.-]*:\/\/[^\s<>"'{}\\/][^\s<>"'{}\\]*/gi;
const prosePunctuation = /[.,!?;:]$/;

function stripTrailingPunctuation(candidate: string): string {
  let parentheses = 0;
  let brackets = 0;
  for (const character of candidate) {
    if (character === "(") parentheses++;
    if (character === ")") parentheses--;
    if (character === "[") brackets++;
    if (character === "]") brackets--;
  }

  let end = candidate.length;
  while (end > 0) {
    const character = candidate.charAt(end - 1);
    if (character === ")" && parentheses < 0) parentheses++;
    else if (character === "]" && brackets < 0) brackets++;
    else if (!prosePunctuation.test(character)) break;
    end--;
  }
  return candidate.slice(0, end);
}

export default defineOperation({
  id: "extract-urls",
  name: "Extract URLs",
  category: "extract",
  description: "Find URLs with a scheme and host in text.",
  input: "string",
  output: "string",
  args: z.object({ unique: uniqueArg }),
  run(input, { unique }) {
    const matches: string[] = [];
    for (const [candidate] of input.matchAll(urlCandidate)) {
      const url = stripTrailingPunctuation(candidate);
      try {
        if (new URL(url).hostname) matches.push(url);
      } catch {
        // Ignore malformed URL candidates.
      }
    }
    return formatMatches(matches, unique);
  },
  cyberchef: {
    name: "Extract URLs",
    mapArgs: mapChefListArgs,
  },
});
