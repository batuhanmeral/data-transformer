const delimiters: Record<string, string> = {
  Space: " ",
  Comma: ",",
  "Semi-colon": ";",
  Colon: ":",
  "Line feed": "\n",
  CRLF: "\r\n",
  None: "",
  "Nothing (separate chars)": "",
  "Nothing (join chars)": "",
};

export function chefDelimiter(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (Object.hasOwn(delimiters, value)) return delimiters[value];
  return value.replaceAll("\\r", "\r").replaceAll("\\n", "\n").replaceAll("\\t", "\t");
}

export function unsupportedChefOption(option: string): never {
  throw new Error(`Unsupported CyberChef ${option}.`);
}

export function chefToggle(value: unknown, defaultOption: string): { option: string; string: string } {
  if (value === undefined) return { option: defaultOption, string: "" };
  if (typeof value === "string") return { option: defaultOption, string: value };
  if (typeof value === "object" && value !== null &&
      "option" in value && typeof value.option === "string" &&
      "string" in value && typeof value.string === "string") {
    return { option: value.option, string: value.string };
  }
  return unsupportedChefOption("argument format");
}
