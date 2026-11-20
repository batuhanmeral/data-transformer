import { z } from "@/lib/zod";
import type { Operation } from "../define-operation";
import { getOperation, listOperations } from "../registry";
import type { Recipe } from "../types";

export interface ImportIssue {
  op: string;
  message: string;
}

const chefStep = z.object({
  op: z.string().min(1),
  args: z.array(z.unknown()),
  disabled: z.boolean().optional(),
  breakpoint: z.boolean().optional(),
});

const chefRecipe = z.array(z.unknown());
const chefOperationName = chefStep.pick({ op: true });
const chefOperations = new Map<string, Operation>();
for (const { id } of listOperations()) {
  const operation = getOperation(id);
  if (!operation?.cyberchef) continue;
  const { name } = operation.cyberchef;
  // Prefer Split over its Join alias when both map to CyberChef's Split.
  if (operation.name === name || !chefOperations.has(name)) {
    chefOperations.set(name, operation);
  }
}

function decodeComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCompact(source: string, decodeFields: boolean): z.infer<typeof chefStep>[] {
  let offset = 0;
  const whitespace = /\s*/y;
  const namePattern = /[^(),{}'\r\n]+/y;
  const stringPattern = /'((?:\\[\s\S]|[^'\\])*)'/y;
  const literalPattern = /(?:true|false|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)/iy;

  function skipWhitespace() {
    whitespace.lastIndex = offset;
    whitespace.exec(source);
    offset = whitespace.lastIndex;
  }

  function read(pattern: RegExp): RegExpExecArray | null {
    skipWhitespace();
    pattern.lastIndex = offset;
    const match = pattern.exec(source);
    if (match) offset = pattern.lastIndex;
    return match;
  }

  function consume(token: string): boolean {
    skipWhitespace();
    if (!source.startsWith(token, offset)) return false;
    offset += token.length;
    return true;
  }

  function fail(): never {
    throw new Error(`Unexpected compact recipe syntax at character ${offset + 1}.`);
  }

  function requireToken(token: string) {
    if (!consume(token)) fail();
  }

  function readList<T>(end: string, item: () => T): T[] {
    if (consume(end)) return [];
    const items = [item()];
    while (consume(",")) items.push(item());
    requireToken(end);
    return items;
  }

  function readString(): string {
    const value = read(stringPattern)?.[1];
    if (value === undefined) return fail();
    const unescaped = value.replace(/\\(['\\])/g, "$1");
    return decodeFields ? decodeComponent(unescaped) : unescaped;
  }

  function readArg(): unknown {
    if (consume("{")) {
      const entries = readList("}", () => {
        const key = readString();
        requireToken(":");
        return [key, readString()] as const;
      });
      return Object.fromEntries(entries);
    }
    if (source[offset] === "'") return readString();
    const token = read(literalPattern)?.[0];
    if (token === "true" || token === "false") return token === "true";
    if (token === undefined || !Number.isFinite(Number(token))) return fail();
    return Number(token);
  }

  const steps: z.infer<typeof chefStep>[] = [];
  while (offset < source.length) {
    const name = read(namePattern)?.[0].trim();
    if (!name) return fail();
    const op = (decodeFields ? decodeComponent(name) : name).replaceAll("_", " ");
    requireToken("(");
    steps.push({ op, args: readList(")", readArg) });
  }
  return steps;
}

function readRecipe(text: string): unknown[] {
  const source = text.trim();
  if (!source) throw new Error("Empty recipe.");
  if (source.startsWith("[")) return chefRecipe.parse(JSON.parse(source) as unknown);

  // CyberChef links escape field values. A recipe may also be escaped as a whole.
  try {
    return parseCompact(source, true);
  } catch (cause) {
    const decoded = decodeComponent(source);
    if (source === decoded) throw cause;
    return parseCompact(decoded.trim(), false);
  }
}

export function importCyberChef(text: string): { recipe: Recipe; issues: ImportIssue[] } {
  const recipe: Recipe = [];
  const issues: ImportIssue[] = [];
  let steps: unknown[];
  try {
    steps = readRecipe(text);
  } catch {
    return { recipe, issues: [{ op: "Recipe", message: "Invalid CyberChef recipe." }] };
  }

  for (const [index, step] of steps.entries()) {
    const parsed = chefStep.safeParse(step);
    if (!parsed.success) {
      const name = chefOperationName.safeParse(step);
      issues.push({ op: name.success ? name.data.op : `Step ${index + 1}`, message: "Invalid recipe step." });
      continue;
    }

    const { op, args, disabled, breakpoint } = parsed.data;
    const operation = chefOperations.get(op);
    if (!operation?.cyberchef) {
      issues.push({ op, message: "Unknown operation." });
      continue;
    }

    try {
      const mapped = operation.args.safeParse(operation.cyberchef.mapArgs(args));
      if (!mapped.success) {
        issues.push({ op, message: "Invalid operation arguments." });
        continue;
      }
      recipe.push({
        key: crypto.randomUUID(),
        opId: operation.id,
        args: mapped.data,
        enabled: disabled !== true,
        breakpoint: breakpoint === true,
      });
    } catch (cause) {
      issues.push({ op, message: cause instanceof Error ? cause.message : "Unable to map operation arguments." });
    }
  }

  return { recipe, issues };
}
