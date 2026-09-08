import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk/risk-badge";
import { RiskScore } from "@/components/risk/risk-score";
import { SectionHeading } from "@/components/shared/section-heading";
import { getRiskComponents } from "@/lib/constants/risk";
import type { WorkRecord } from "@/lib/types";
import { textOrDash } from "@/lib/utils/format";

export function RiskFactorList({ work }: { work: WorkRecord }) {
  const components = getRiskComponents(work).sort((a, b) => b.score - a.score);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="why-heading">
      <SectionHeading
        title="Why this work was prioritized"
        description="Contributing factors in order of contribution. These are indicators identified by the risk engine and require verification by an authorized officer."
      />
      <Card className="gap-0 rounded-md p-0 shadow-none">
        <ol className="divide-y">
          {components.map((c) => (
            <li key={c.key} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex shrink-0 items-center gap-3 sm:w-52 sm:flex-col sm:items-start sm:gap-1.5">
                <span className="text-sm font-semibold">{c.label}</span>
                <div className="flex items-center gap-2">
                  <RiskScore score={c.score} level={c.level} />
                  {c.level && <RiskBadge level={c.level} />}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-foreground text-pretty">{textOrDash(c.explanation)}</p>
            </li>
          ))}
        </ol>
        {(work.explainable_audit_summary || work.recommended_reviewer_action) && (
          <div className="grid gap-4 border-t bg-muted/40 p-4 sm:grid-cols-2">
            {work.explainable_audit_summary && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Engine summary</p>
                <p className="mt-1 text-sm leading-relaxed text-pretty">{work.explainable_audit_summary}</p>
              </div>
            )}
            {work.recommended_reviewer_action && (
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <ClipboardCheck className="size-3.5" aria-hidden="true" />
                  Recommended review
                </p>
                <p className="mt-1 text-sm leading-relaxed text-pretty">{work.recommended_reviewer_action}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}
