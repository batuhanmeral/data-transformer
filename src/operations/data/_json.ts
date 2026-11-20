export function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch (cause) {
    throw new Error("Invalid JSON.", { cause });
  }
}
