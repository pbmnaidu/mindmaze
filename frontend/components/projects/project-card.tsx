import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk/risk-badge";
import { RiskScore } from "@/components/risk/risk-score";
import { getPrimaryRiskFactor } from "@/lib/constants/risk";
import type { WorkRecord } from "@/lib/types";
import { formatInr, textOrDash, toTitleCase } from "@/lib/utils/format";

export function ProjectCard({ work }: { work: WorkRecord }) {
  const primary = getPrimaryRiskFactor(work);
  const href = `/projects/${encodeURIComponent(work.work_id)}`;

  return (
    <Card className="group relative gap-3 rounded-md p-4 shadow-none transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="block truncate font-mono text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring" title={work.work_id}>
            {work.work_id}
            <span className="sr-only">, view details</span>
          </Link>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{work.main_sector || work.work_domain || work.effective_work_category}</p>
        </div>
        <RiskBadge level={work.overall_risk_level} />
      </div>

      <p className="line-clamp-2 text-sm leading-snug text-foreground text-pretty" title={work.description}>
        {textOrDash(work.description)}
      </p>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">State</dt>
          <dd className="truncate font-medium">{toTitleCase(work.State ?? work.state)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Constituency</dt>
          <dd className="truncate font-medium">{toTitleCase(work.Constituency ?? work.constituency)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sanction</dt>
          <dd className="font-mono font-medium tabular">{formatInr(work.sanction_amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expenditure</dt>
          <dd className="font-mono font-medium tabular">{formatInr(work.effective_expenditure)}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-3">
          <RiskScore score={work.composite_risk_score} level={work.overall_risk_level} withBar />
          <span className="text-[11px] text-muted-foreground">Primary: {primary.label}</span>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
      </div>
    </Card>
  );
}
