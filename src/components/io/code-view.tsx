"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { Annotation, EditorState, Transaction } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { useEffect, useRef } from "react";

const externalEdit = Annotation.define<boolean>();
const theme = EditorView.theme({
  "&": { height: "100%", fontSize: "1rem", backgroundColor: "var(--background)" },
  "&.cm-focused": { outline: "1px solid var(--ring)", outlineOffset: "-1px" },
  ".cm-scroller": { overflow: "auto", fontFamily: "var(--font-code)" },
  ".cm-content": { padding: "0.75rem 0.875rem", caretColor: "var(--foreground)" },
  ".cm-line": { padding: "0", lineHeight: "1.55" },
  ".cm-placeholder": { color: "var(--muted-foreground)" },
});

export function CodeView({ value, label, readOnly = false, emptyLabel, onChange }: {
  value: string;
  label: string;
  readOnly?: boolean;
  emptyLabel?: string;
  onChange?(value: string): void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView | null>(null);
  const current = useRef(value);
  const changeHandler = useRef(onChange);

  useEffect(() => {
    changeHandler.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const parent = root.current;
    if (!parent) return;
    const view = new EditorView({
      parent,
      doc: current.current,
      extensions: [
        theme,
        EditorState.readOnly.of(readOnly),
        EditorView.editable.of(!readOnly),
        EditorView.contentAttributes.of({ "aria-label": label, ...(readOnly ? { tabindex: "0" } : {}) }),
        ...(emptyLabel ? [placeholder(emptyLabel)] : []),
        ...(readOnly ? [] : [history(), bracketMatching(), keymap.of([...defaultKeymap, ...historyKeymap])]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged || update.transactions.some((tr) => tr.annotation(externalEdit))) return;
          const next = update.state.doc.toString();
          current.current = next;
          changeHandler.current?.(next);
        }),
      ],
    });
    editor.current = view;
    return () => {
      editor.current = null;
      view.destroy();
    };
  }, [emptyLabel, label, readOnly]);

  useEffect(() => {
    if (current.current === value) return;
    current.current = value;
    const view = editor.current;
    if (!view) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
      annotations: [externalEdit.of(true), Transaction.addToHistory.of(false)],
    });
  }, [value]);

  return <div ref={root} className="h-full min-h-0" />;
}
