"use client";

import { ArrowUpFromLine, FolderOpen } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { WorkspacePanel } from "@/components/layout/workspace-panel";
import { Button } from "@/components/ui/button";
import { decodeUtf8Lossy } from "@/core/convert";
import { cn } from "@/lib/utils";
import { useIoStore } from "@/stores/io";
import { CodeView } from "./code-view";
import { FileCard } from "./file-card";

function showAsFile(input: Uint8Array, name: string | undefined): boolean {
  if (!name) return false;
  if (input.byteLength >= 2_000_000) return true;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(input);
    return false;
  } catch {
    return true;
  }
}

export function InputPanel() {
  const input = useIoStore((state) => state.input);
  const inputName = useIoStore((state) => state.inputName);
  const setInputText = useIoStore((state) => state.setInputText);
  const fileInput = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const file = useMemo(() => showAsFile(input, inputName), [input, inputName]);
  const text = useMemo(() => file ? "" : decodeUtf8Lossy(input), [file, input]);

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const id = ++requestId.current;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (id === requestId.current) useIoStore.getState().setInputBytes(bytes, file.name);
    } catch {
      if (id === requestId.current) toast.error("Unable to read the input file.");
    }
  }

  function updateText(value: string) {
    requestId.current++;
    setInputText(value);
  }

  return (
    <WorkspacePanel
      title="Input"
      icon={ArrowUpFromLine}
      detail={`${input.byteLength.toLocaleString()} B`}
      tools={
        <>
          <input
            type="file" aria-label="Input file" tabIndex={-1} ref={fileInput} className="sr-only"
            onChange={(event) => {
              void loadFile(event.currentTarget.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
          <Button size="icon-xs" variant="ghost" type="button" aria-label="Open input file" title="Open input file" onClick={() => fileInput.current?.click()}>
            <FolderOpen aria-hidden="true" />
          </Button>
        </>
      }
    >
      <div
        className={cn("relative h-full min-h-0", dragging && "ring-1 ring-inset ring-primary")}
        onDragEnter={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("Files")) event.preventDefault();
        }}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDragging(false);
        }}
        onDrop={(event) => {
          if (!event.dataTransfer.files.length) return;
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          void loadFile(event.dataTransfer.files[0]);
        }}
      >
        {file && inputName
          ? <FileCard name={inputName} bytes={input} onClear={() => updateText("")} />
          : <CodeView value={text} label="Input text" emptyLabel="Type or paste text…" onChange={updateText} />}
        {dragging && (
          <div className="pointer-events-none absolute inset-1 grid place-items-center rounded-md border border-dashed border-primary bg-background/85 text-sm font-medium text-primary-text">
            Drop a file to load it
          </div>
        )}
      </div>
    </WorkspacePanel>
  );
}
