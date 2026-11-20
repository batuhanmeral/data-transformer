"use client";

import { useEffect, useRef, useState } from "react";
import { formatHexRow } from "@/lib/hex";

const rowHeight = 22;
const rowWidth = 16;
const overscan = 6;

export function HexView({ bytes, label = "Hex data" }: { bytes: Uint8Array; label?: string }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [scroll, setScroll] = useState(0);
  const rows = Math.ceil(bytes.length / rowWidth);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const observe = new ResizeObserver(() => setHeight(element.clientHeight));
    observe.observe(element);
    return () => observe.disconnect();
  }, []);

  const start = Math.max(0, Math.min(rows - 1, Math.floor(scroll / rowHeight)) - overscan);
  const end = Math.min(rows, start + Math.ceil(height / rowHeight) + overscan * 2);

  return (
    <div
      ref={scroller}
      aria-label={label}
      role="region"
      tabIndex={0}
      onScroll={(event) => setScroll(event.currentTarget.scrollTop)}
      className="h-full overflow-auto font-mono text-xs focus-visible:outline focus-visible:outline-ring focus-visible:-outline-offset-1"
    >
      <div className="relative min-w-max" style={{ height: rows * rowHeight }}>
        <div className="absolute top-0 left-0 min-w-max px-3" style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {Array.from({ length: end - start }, (_, index) => {
            const offset = (start + index) * rowWidth;
            const row = formatHexRow(bytes.subarray(offset, offset + rowWidth), offset);
            return (
              <div key={row.offset} className="flex h-[22px] items-center gap-4 whitespace-pre">
                <span className="text-muted-foreground">{row.offset}</span>
                <span>{row.hex}</span>
                <span className="text-primary-text">{row.ascii}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
