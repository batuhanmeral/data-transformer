"use client";

import { useId, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { z } from "@/lib/zod";

function unwrap(schema: z.ZodType): z.ZodType {
  while (
    schema instanceof z.ZodDefault || schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable || schema instanceof z.ZodPrefault
  ) {
    const inner = schema.unwrap();
    if (!(inner instanceof z.ZodType)) break;
    schema = inner;
  }
  return schema;
}

const textField = "min-w-0 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-ring";

export function ArgForm({ schema, value, onChange }: {
  schema: z.ZodObject;
  value: Record<string, unknown>;
  onChange(value: Record<string, unknown>): void;
}) {
  const formId = useId();

  return (
    <div className="grid gap-2.5">
      {Object.entries(schema.shape).map(([key, field]: [string, z.ZodType]) => {
        const base = unwrap(field);
        const meta = { ...base.meta(), ...field.meta() };
        const label = typeof meta.label === "string" ? meta.label : key;
        const id = `${formId}-${key}`;
        const arg = value[key];
        const change = (candidate: unknown) => {
          const result = field.safeParse(candidate);
          if (result.success) onChange({ ...value, [key]: result.data });
        };

        let control: ReactNode;
        if (base instanceof z.ZodString) {
          const text = typeof arg === "string" ? arg : "";
          control = meta.multiline === true
            ? <textarea id={id} rows={2} className={textField} value={text} onChange={(event) => change(event.target.value)} />
            : <Input id={id} className="h-8 bg-background" value={text} onChange={(event) => change(event.target.value)} />;
        } else if (base instanceof z.ZodNumber) {
          control = (
            <Input
              id={id}
              type="number"
              step="any"
              className="h-8 bg-background"
              value={typeof arg === "number" ? arg : ""}
              onChange={(event) => change(event.target.value === "" ? undefined : event.target.valueAsNumber)}
            />
          );
        } else if (base instanceof z.ZodBoolean) {
          control = <Switch id={id} checked={arg === true} onCheckedChange={change} />;
        } else if (base instanceof z.ZodEnum) {
          control = (
            <select id={id} className={textField} value={typeof arg === "string" ? arg : ""} onChange={(event) => change(event.target.value)}>
              {base.options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          );
        } else {
          return <p key={key} className="text-xs text-muted-foreground">{label}: unsupported argument type</p>;
        }

        return (
          <div key={key} className="grid gap-1.5">
            <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
            {control}
          </div>
        );
      })}
    </div>
  );
}
