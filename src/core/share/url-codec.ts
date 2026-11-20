import { z } from "@/lib/zod";
import { getOperation } from "../registry";
import type { Recipe } from "../types";

export const MAX_SHARED_INPUT = 64 * 1024;
export const MAX_SHARED_RECIPE_COMPRESSED = 64 * 1024;
export const MAX_SHARED_RECIPE_BYTES = 1024 * 1024;
export const MAX_SHARED_INPUT_BYTES = 16 * 1024 * 1024;

const sizeErrorMessage = "Share link is too large.";

const sharedRecipeSchema = z.array(z.object({
  opId: z.string(),
  args: z.record(z.string(), z.unknown()),
  enabled: z.boolean(),
  breakpoint: z.boolean(),
}));

export class ShareError extends Error {
  override name = "ShareError";
}

function toBase64Url(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
  }
  return btoa(chunks.join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64Url(value: string, maxBytes: number): Uint8Array {
  if (value.length > Math.ceil(maxBytes * 4 / 3)) throw new ShareError(sizeErrorMessage);
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new ShareError("Invalid share link.");
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (byte) => byte.charCodeAt(0));
}

function inflateWithinLimit(
  Inflate: typeof import("fflate").Inflate,
  compressed: Uint8Array,
  maxBytes: number,
): Uint8Array {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const stream = new Inflate((chunk) => {
    size += chunk.length;
    if (size > maxBytes) throw new ShareError(sizeErrorMessage);
    if (chunk.length > 0) chunks.push(chunk);
  });

  // Inflate allocates output before calling ondata. Small pushes bound that scratch
  // space and let the callback stop decoding before the rest of the stream expands.
  const chunkSize = 256;
  for (let offset = 0; offset < compressed.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, compressed.length);
    stream.push(compressed.subarray(offset, end), end === compressed.length);
  }

  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

export async function encodeShare({ recipe, input }: { recipe: Recipe; input?: Uint8Array }):
Promise<{ fragment: string; inputIncluded: boolean }> {
  const { deflateSync } = await import("fflate");
  const steps = recipe.map(({ opId, args, enabled, breakpoint }) => ({ opId, args, enabled, breakpoint }));
  const recipeBytes = new TextEncoder().encode(JSON.stringify(steps));
  if (recipeBytes.length > MAX_SHARED_RECIPE_BYTES) throw new ShareError(sizeErrorMessage);
  const packedRecipe = deflateSync(recipeBytes);
  if (packedRecipe.length > MAX_SHARED_RECIPE_COMPRESSED) throw new ShareError(sizeErrorMessage);
  const packedInput = input && input.length <= MAX_SHARED_INPUT_BYTES ? deflateSync(input) : undefined;
  const fragment = `v=1&r=${toBase64Url(packedRecipe)}`;
  if (packedInput === undefined || packedInput.length > MAX_SHARED_INPUT) {
    return { fragment, inputIncluded: false };
  }
  return { fragment: `${fragment}&i=${toBase64Url(packedInput)}`, inputIncluded: true };
}

export async function decodeShare(fragment: string): Promise<{ recipe: Recipe; input?: Uint8Array }> {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  const version = params.get("v");
  const packedRecipe = params.get("r");
  const packedInput = params.get("i");
  if (!version || packedRecipe === null || params.size !== (packedInput === null ? 2 : 3)) {
    throw new ShareError("Invalid share link.");
  }
  if (version !== "1") throw new ShareError("Unsupported share link version.");

  try {
    const { Inflate } = await import("fflate");
    const recipeBytes = inflateWithinLimit(Inflate, fromBase64Url(packedRecipe, MAX_SHARED_RECIPE_COMPRESSED), MAX_SHARED_RECIPE_BYTES);
    const json = new TextDecoder("utf-8", { fatal: true }).decode(recipeBytes);
    const steps = sharedRecipeSchema.parse(JSON.parse(json) as unknown);
    const missing = [...new Set(steps.filter(({ opId }) => !getOperation(opId)).map(({ opId }) => opId))];
    if (missing.length > 0) throw new ShareError(`Unknown operations in share link: ${missing.join(", ")}.`);
    const recipe = steps.map((step) => ({ ...step, key: crypto.randomUUID() }));
    if (packedInput === null) return { recipe };
    const compressed = fromBase64Url(packedInput, MAX_SHARED_INPUT);
    return { recipe, input: inflateWithinLimit(Inflate, compressed, MAX_SHARED_INPUT_BYTES) };
  } catch (cause) {
    if (cause instanceof ShareError) throw cause;
    throw new ShareError("Invalid share link.", { cause });
  }
}
