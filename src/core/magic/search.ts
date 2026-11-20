import { decodeUtf8Lossy } from "../convert";
import { runPipeline } from "../pipeline";
import { defaultArgs, getOperation, listOperations } from "../registry";
import { hasGzipHeader, hasZlibHeader } from "./detectors";
import { readability } from "./score";
import type { MagicSuggestion } from "./types";

interface MagicOptions {
  depth?: number;
  budgetMs?: number;
  maxResults?: number;
  signal?: AbortSignal;
}

interface SearchNode {
  bytes: Uint8Array;
  steps: MagicSuggestion["steps"];
  score: number;
}

// Bounding candidate input limits the work done inside synchronous operations.
export const magicInputLimit = 8 * 1024;
const previewByteLimit = 256;
const decoders = listOperations().flatMap(({ id }) => {
  const detector = getOperation(id)?.magic;
  return detector ? [{ id, detect: detector.detect }] : [];
});

function remember(seen: Map<number, Uint8Array[]>, bytes: Uint8Array): boolean {
  let hash = 2166136261;
  for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
  const matches = seen.get(hash);
  if (matches) {
    if (matches.some((match) => match.length === bytes.length && match.every((byte, index) => byte === bytes[index]))) {
      return false;
    }
    matches.push(bytes);
  } else {
    seen.set(hash, [bytes]);
  }
  return true;
}

function bestFirst(a: SearchNode, b: SearchNode): number {
  return b.score - a.score || a.steps.length - b.steps.length;
}

export async function magic(
  input: Uint8Array, { depth = 3, budgetMs = 500, maxResults = 5, signal }: MagicOptions = {},
): Promise<MagicSuggestion[]> {
  if (!input.length || depth < 1 || budgetMs <= 0 || maxResults < 1 || signal?.aborted) return [];
  const sample = input.subarray(0, magicInputLimit);

  const deadline = performance.now() + budgetMs;
  const { promise: stopped, resolve } = Promise.withResolvers<undefined>();
  const stop = () => resolve(undefined);
  const shouldStop = () => signal?.aborted || performance.now() >= deadline;
  const timeout = setTimeout(stop, budgetMs);
  let yieldTimer: ReturnType<typeof setTimeout> | undefined;
  signal?.addEventListener("abort", stop, { once: true });

  try {
    const initialScore = readability(sample);
    const seen = new Map<number, Uint8Array[]>();
    remember(seen, sample);
    const frontier: SearchNode[] = [{ bytes: sample, steps: [], score: initialScore }];
    const results: SearchNode[] = [];

    search: while (frontier.length && !shouldStop()) {
      frontier.sort(bestFirst);
      const node = frontier.shift()!;
      const candidates = decoders
        .map(({ id, detect }) => ({ id, confidence: detect(node.bytes) }))
        .filter(({ confidence }) => confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence);

      for (const { id } of candidates) {
        // Give the worker a turn to receive a newer bake, even for synchronous decoders.
        const yielded = new Promise<true>((resume) => {
          yieldTimer = setTimeout(resume, 0, true);
        });
        if (!await Promise.race([yielded, stopped]) || shouldStop()) break search;
        const steps = [...node.steps, { opId: id, args: defaultArgs(id) }];
        const recipe = steps.map((step, index) => ({
          ...step, key: String(index), enabled: true, breakpoint: false,
        }));
        const result = await Promise.race([runPipeline(sample, 0, recipe), stopped]);
        if (!result || shouldStop()) break search;
        const bytes = result.output;
        if (result.errorIndex !== undefined || !bytes.length || bytes.length > magicInputLimit || !remember(seen, bytes)) continue;

        const score = readability(bytes);
        const next = { bytes, steps, score };
        if (steps.length < depth) frontier.push(next);
        if (score > initialScore && !hasGzipHeader(bytes) && !hasZlibHeader(bytes)) results.push(next);
      }
    }

    return results.sort(bestFirst).slice(0, maxResults).map(({ bytes, steps, score }) => ({
      steps, score, preview: decodeUtf8Lossy(bytes.subarray(0, previewByteLimit)),
    }));
  } finally {
    clearTimeout(timeout);
    clearTimeout(yieldTimer);
    signal?.removeEventListener("abort", stop);
  }
}
