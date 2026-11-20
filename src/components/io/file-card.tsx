import { Binary, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HexView } from "./hex-view";

export function FileCard({ name, bytes, onClear }: { name: string; bytes: Uint8Array; onClear(): void }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-card p-2.5">
        <Binary aria-hidden="true" className="size-4 text-primary-text" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="font-mono text-xs text-muted-foreground">{bytes.length.toLocaleString()} B</p>
        </div>
        <Button size="icon-xs" variant="ghost" type="button" aria-label="Clear input file" onClick={onClear}>
          <X aria-hidden="true" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Hex preview{bytes.length > 4096 ? " · first 4 KiB" : ""}</p>
      <div className="min-h-0 flex-1 rounded-md border border-border">
        <HexView bytes={bytes.subarray(0, 4096)} label="Input file hex preview" />
      </div>
    </div>
  );
}
