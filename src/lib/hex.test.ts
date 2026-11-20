import { expect, it } from "vitest";
import { formatHexRow } from "./hex";

it("formatHexRow pads last row and masks non-printables with '.'", () => {
  expect(formatHexRow(Uint8Array.of(0x41, 0, 0x20, 0x7e, 0xff), 32)).toEqual({
    offset: "00000020",
    hex: "41 00 20 7e ff".padEnd(47),
    ascii: "A. ~.",
  });
});
