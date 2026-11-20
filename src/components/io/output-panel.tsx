"use client";

import { ArrowDownToLine, Binary, Clipboard, Download, Pilcrow } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { WorkspacePanel } from "@/components/layout/workspace-panel";
import { MagicSuggestions } from "@/components/magic/magic-suggestions";
import { Button } from "@/components/ui/button";
import { decodeUtf8Lossy } from "@/core/convert";
import { useIoStore } from "@/stores/io";
import { CodeView } from "./code-view";
import { HexView } from "./hex-view";
import { HtmlFrame } from "./html-frame";

const previewLimit = 1_000_000;

export function OutputPanel() {
  const selected = useIoStore((state) => state.selectedStep);
  const output = useIoStore((state) => state.selectedStep === undefined ? state.output : state.selectedOutput);
  const view = useIoStore((state) => state.view);
  const text = useMemo(() => {
    if (!output || view !== "text") return "";
    return decodeUtf8Lossy(output.data.subarray(0, previewLimit));
  }, [output, view]);
  const truncated = view === "text" && (output?.data.byteLength ?? 0) > previewLimit;

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(decodeUtf8Lossy(output.data));
      toast.success("Output copied.");
    } catch {
      toast.error("Unable to copy output.");
    }
  }

  function download() {
    if (!output) return;
    const binary = output.type === "bytes";
    const url = URL.createObjectURL(new Blob([output.data.slice()], {
      type: binary ? "application/octet-stream" : "text/plain;charset=utf-8",
    }));
    const link = document.createElement("a");
    link.href = url;
    link.download = binary ? "output.bin" : "output.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <WorkspacePanel
      title="Output"
      icon={ArrowDownToLine}
      detail={output ? `${output.data.byteLength.toLocaleString()} B` : undefined}
      detailLabel="Output size"
      headerActions={selected === undefined && <MagicSuggestions />}
      tools={
        <>
          <Button size="icon-xs" variant={view === "text" ? "secondary" : "ghost"} aria-label="Text view" aria-pressed={view === "text"} title="Text view" onClick={() => useIoStore.setState({ view: "text" })}>
            <Pilcrow aria-hidden="true" />
          </Button>
          <Button size="icon-xs" variant={view === "hex" ? "secondary" : "ghost"} aria-label="Hex view" aria-pressed={view === "hex"} title="Hex view" onClick={() => useIoStore.setState({ view: "hex" })}>
            <Binary aria-hidden="true" />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label="Copy output" title="Copy output" disabled={!output} onClick={() => void copy()}>
            <Clipboard aria-hidden="true" />
          </Button>
          <Button size="icon-xs" variant="ghost" aria-label="Download output" title="Download output" disabled={!output} onClick={download}>
            <Download aria-hidden="true" />
          </Button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {selected !== undefined && (
          <p className="border-b border-border bg-primary/5 px-3 py-1.5 text-xs text-primary-text">Step {selected + 1} output</p>
        )}
        {truncated && (
          <p className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">Preview limited to 1 MB. Download for the full output.</p>
        )}
        <div className="min-h-0 flex-1">
          {output
            ? view === "hex"
              ? <HexView bytes={output.data} />
              : output.type === "html"
                ? <HtmlFrame html={text} />
                : <CodeView value={text} label="Output text" readOnly />
            : <p className="p-4 font-mono text-sm text-muted-foreground">{selected === undefined ? "Bake to see the result." : "No output for this step."}</p>}
        </div>
      </div>
    </WorkspacePanel>
  );
}
