import { expect, it, vi } from "vitest";
import { z } from "@/lib/zod";
import { defineOperation } from "../core/define-operation";
import * as registry from "../core/registry";
import { runOp } from "./_test-utils";

it("runOp fails when operation mutates its input", async () => {
  const operation = defineOperation({
    id: "mutating-op",
    name: "Mutating operation",
    category: "encoding",
    description: "",
    input: "bytes",
    output: "bytes",
    args: z.object({}),
    async run(input) {
      await Promise.resolve();
      input[0] = 0;
      return input;
    },
  });
  const lookup = vi.spyOn(registry, "getOperation").mockReturnValue(operation);
  try {
    await expect(runOp(operation.id, Uint8Array.of(97, 98))).rejects.toThrow("mutated its byte input");
  } finally {
    lookup.mockRestore();
  }
});
