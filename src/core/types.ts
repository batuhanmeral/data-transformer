export type DataType = "bytes" | "string" | "number" | "json" | "html";

export interface DataValueMap {
  bytes: Uint8Array;
  string: string;
  number: number;
  json: unknown;
  html: string;
}

export type Category = "encoding" | "text" | "hash" | "crypto" | "compression" | "data" | "extract";

export interface RecipeStep {
  key: string;
  opId: string;
  args: Record<string, unknown>;
  enabled: boolean;
  breakpoint: boolean;
}

export type Recipe = RecipeStep[];
