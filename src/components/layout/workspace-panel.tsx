import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function WorkspacePanel({ title, label = title, icon: Icon, detail, detailLabel, tools, headerActions, children }: {
  title: string;
  /** Accessible name of the region when it should differ from the visible title. */
  label?: string;
  icon: LucideIcon;
  detail?: string;
  detailLabel?: string;
  tools?: ReactNode;
  headerActions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-border bg-card/60">
        <div className="flex min-h-[39px] flex-wrap items-center gap-x-2 gap-y-1 px-3.5 py-1">
          <div className="flex items-center gap-2">
            <Icon aria-hidden="true" className="size-3.5 text-muted-foreground" />
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            {detail && <span aria-label={detailLabel} className="font-mono text-xs whitespace-nowrap text-muted-foreground">{detail}</span>}
            {tools}
          </div>
        </div>
        {headerActions}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
