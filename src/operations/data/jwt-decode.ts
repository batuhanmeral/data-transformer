import { z } from "@/lib/zod";
import { defineOperation } from "../../core/define-operation";
import { detectJwt } from "../../core/magic/detectors";

function decodeSegment(segment: string): Record<string, unknown> {
  try {
    const encoded = segment.replaceAll("-", "+").replaceAll("_", "/");
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const value: unknown = JSON.parse(text);
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected a JSON object.");
    return value as Record<string, unknown>;
  } catch (cause) {
    throw new Error("Invalid JWT header or payload.", { cause });
  }
}

export default defineOperation({
  id: "jwt-decode",
  name: "JWT Decode",
  category: "data",
  description: "Decode an unverified JWT header and payload.",
  input: "string",
  output: "json",
  args: z.object({}),
  run(input) {
    const parts = input.trim().split(".");
    if (parts.length !== 3 || !parts[0] || !parts[1] ||
        parts.some((part) => !/^[A-Za-z0-9_-]*$/.test(part) || part.length % 4 === 1)) {
      throw new Error("Invalid JWT compact serialization.");
    }
    return { header: decodeSegment(parts[0]), payload: decodeSegment(parts[1]) };
  },
  magic: { detect: detectJwt },
  cyberchef: {
    name: "JWT Decode",
    mapArgs: () => ({}),
  },
});
