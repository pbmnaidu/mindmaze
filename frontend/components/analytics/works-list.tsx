import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk/risk-badge";
import { WorkId } from "@/components/risk/work-id";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/states";
import type { WorkRecord } from "@/lib/types";
import { toTitleCase } from "@/lib/utils/format";

interface WorksListProps {
  title: string;
  description?: string;
  works: WorkRecord[];
  metric: (w: WorkRecord) => { label: string; value: string };
  level: (w: WorkRecord) => string | undefined;
  detail?: (w: WorkRecord) => string | undefined;
  emptyMessage: string;
}

export function WorksList({ title, description, works, metric, level, detail, emptyMessage }: WorksListProps) {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeading as="h3" title={title} description={description} />
      <Card className="gap-0 rounded-md p-0 shadow-none">
        {works.length === 0 ? (
          <EmptyState title={emptyMessage} className="border-0" />
        ) : (
          <ul className="divide-y">
            {works.map((w) => {
              const m = metric(w);
              const d = detail?.(w);
              return (
                <li key={w.work_id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkId id={w.work_id} className="max-w-full" />
                      <RiskBadge level={level(w)} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground" title={w.description}>
                      {toTitleCase(w.State ?? w.state)} · {toTitleCase(w.Constituency ?? w.constituency)} · {w.work_category}
                    </p>
                    {d && <p className="text-xs text-foreground text-pretty">{d}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                      <p className="font-mono text-sm font-semibold tabular">{m.value}</p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                      <Link href={`/projects/${encodeURIComponent(w.work_id)}`}>View</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </section>
  );
}
