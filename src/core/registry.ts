import type { z } from "zod";
import { operations } from "../operations/index.generated";
import type { Operation } from "./define-operation";
import type { Category, DataType } from "./types";

export interface OperationMeta {
  id: string;
  name: string;
  category: Category;
  description: string;
  input: DataType;
  output: DataType;
  argsSchema: z.ZodObject;
}

const byId = new Map<string, Operation>(operations.map((op) => [op.id, op]));

export function getOperation(id: string): Operation | undefined {
  return byId.get(id);
}

export function listOperations(): OperationMeta[] {
  return [...byId.values()]
    .map(({ id, name, category, description, input, output, args }) => ({
      id, name, category, description, input, output, argsSchema: args,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function defaultArgs(id: string): Record<string, unknown> {
  const operation = getOperation(id);
  if (!operation) throw new Error(`Unknown operation: ${id}`);
  return operation.args.parse({});
}
