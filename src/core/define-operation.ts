import type { z } from "zod";
import type { Category, DataType, DataValueMap } from "./types";

export interface OperationContext {
  progress(fraction: number): void;
}

export interface Operation<
  I extends DataType = DataType,
  O extends DataType = DataType,
  A extends z.ZodObject = z.ZodObject,
> {
  id: string;
  name: string;
  category: Category;
  description: string;
  input: I;
  output: O;
  args: A;
  cacheable?: boolean;
  run(input: DataValueMap[I], args: z.infer<A>, ctx: OperationContext): DataValueMap[O] | Promise<DataValueMap[O]>;
  cyberchef?: { name: string; mapArgs(args: unknown[]): z.input<A> };
  magic?: { detect(sample: Uint8Array): number };
}

export function defineOperation<I extends DataType, O extends DataType, A extends z.ZodObject>(
  op: Operation<I, O, A>,
): Operation<I, O, A> {
  return op;
}
