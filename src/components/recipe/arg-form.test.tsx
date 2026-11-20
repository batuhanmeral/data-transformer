// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { z } from "@/lib/zod";
import { ArgForm } from "./arg-form";

afterEach(cleanup);

const schema = z.object({
  text: z.string().default("").meta({ label: "Text", multiline: true }),
  count: z.number().default(2).meta({ label: "Count" }),
  enabled: z.boolean().default(false),
  alphabet: z.enum(["standard", "urlsafe"]).default("standard").meta({ label: "Alphabet" }),
  unsupported: z.array(z.string()).default([]),
});
const value = schema.parse({});

it("arg-form renders controls for string/number/boolean/enum", () => {
  render(<ArgForm schema={schema} value={value} onChange={vi.fn()} />);
  expect(screen.getByRole("textbox", { name: "Text" }).tagName).toBe("TEXTAREA");
  expect(screen.getByRole("spinbutton", { name: "Count" }).getAttribute("value")).toBe("2");
  expect(screen.getByRole("switch", { name: "enabled" }).getAttribute("aria-checked")).toBe("false");
  expect(screen.getByRole<HTMLSelectElement>("combobox", { name: "Alphabet" }).value).toBe("standard");
  expect(screen.getByText(/unsupported argument type/i)).toBeDefined();
});

it("arg-form emits parsed values", () => {
  const changed = vi.fn();
  render(<ArgForm schema={schema} value={value} onChange={changed} />);
  fireEvent.change(screen.getByRole("spinbutton", { name: "Count" }), { target: { value: "4" } });
  expect(changed).toHaveBeenLastCalledWith({ ...value, count: 4 });
  fireEvent.click(screen.getByRole("switch", { name: "enabled" }));
  expect(changed).toHaveBeenLastCalledWith({ ...value, enabled: true });
  fireEvent.change(screen.getByRole("combobox", { name: "Alphabet" }), { target: { value: "urlsafe" } });
  expect(changed).toHaveBeenLastCalledWith({ ...value, alphabet: "urlsafe" });
});
