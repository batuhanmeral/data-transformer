import type { DataType, DataValueMap } from "./types";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });

export class ConversionError extends Error {
  override name = "ConversionError";
}

export function decodeUtf8Lossy(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}

function asText(value: unknown, type: DataType): string {
  switch (type) {
    case "bytes":
      if (value instanceof Uint8Array) return decodeUtf8Lossy(value);
      break;
    case "html":
    case "string":
      if (typeof value === "string") return value;
      break;
    case "number":
      if (typeof value === "number") return String(value);
      break;
    case "json": {
      try {
        const text = JSON.stringify(value, null, 2);
        if (text !== undefined) return text;
      } catch (cause) {
        throw new ConversionError("Value cannot be serialized as JSON.", { cause });
      }
      break;
    }
  }
  throw new ConversionError(`Invalid ${type} value.`);
}

export function convert<F extends DataType, T extends DataType>(
  value: DataValueMap[F],
  from: F,
  to: T,
): DataValueMap[T];
export function convert(value: unknown, from: DataType, to: DataType): unknown {
  if (from === to) return value;

  const text = asText(value, from);
  switch (to) {
    case "html":
    case "string":
      return text;
    case "bytes":
      return encoder.encode(text);
    case "number": {
      const number = Number(text);
      if (Number.isNaN(number)) throw new ConversionError("Text cannot be converted to a number.");
      return number;
    }
    case "json":
      try {
        return JSON.parse(text) as unknown;
      } catch (cause) {
        throw new ConversionError("Text is not valid JSON.", { cause });
      }
  }
}

export function toBytes(value: unknown, type: DataType): Uint8Array {
  if (type === "bytes") {
    if (!(value instanceof Uint8Array)) throw new ConversionError("Invalid bytes value.");
    return value;
  }
  return convert(value, type, "bytes");
}

export function fromBytes(bytes: Uint8Array, type: DataType): unknown {
  return convert(bytes, "bytes", type);
}
