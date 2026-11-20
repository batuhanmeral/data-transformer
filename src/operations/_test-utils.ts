import { expect } from "vitest";
import { convert } from "../core/convert";
import { getOperation } from "../core/registry";
import type { DataType } from "../core/types";

export async function runOp(id: string, input: unknown, args: Record<string, unknown> = {}): Promise<unknown> {
  const operation = getOperation(id);
  if (!operation) throw new Error(`Unknown operation: ${id}`);

  let type: DataType = "json";
  if (input instanceof Uint8Array) type = "bytes";
  else if (typeof input === "string") type = "string";
  else if (typeof input === "number") type = "number";

  const operationInput = convert(input, type, operation.input);
  const originalBytes = operationInput instanceof Uint8Array ? new Uint8Array(operationInput) : undefined;
  try {
    return await operation.run(operationInput, operation.args.parse(args), { progress() {} });
  } finally {
    if (originalBytes) {
      expect(operationInput, `Operation "${id}" mutated its byte input.`).toEqual(originalBytes);
    }
  }
}
