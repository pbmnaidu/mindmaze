import Link from "next/link";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk/risk-badge";
import type { CandidateDuplicatePair } from "@/lib/types";
import { formatDate, formatInr, formatScore, toTitleCase } from "@/lib/utils/format";
import { HighlightedText, sharedTokens } from "./highlighted-text";

interface SimilarityCardProps {
  pair: CandidateDuplicatePair;
  /** When set, this work is shown on the left as the candidate. */
  focusWorkId?: string;
}

function WorkColumn({
  heading,
  workId,
  description,
  amount,
  date,
  shared,
  linkable,
}: {
  heading: string;
  workId: string;
  description: string;
  amount: number;
  date?: string;
  shared: Set<string>;
  linkable: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{heading}</p>
      {linkable ? (
        <Link href={`/projects/${encodeURIComponent(workId)}`} className="break-all font-mono text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring">
          {workId}
        </Link>
      ) : (
        <span className="break-all font-mono text-xs text-foreground">{workId}</span>
      )}
      <p className="text-sm leading-relaxed text-pretty">
        <HighlightedText text={description} shared={shared} />
      </p>
      <dl className="mt-auto grid grid-cols-2 gap-2 border-t pt-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Sanction</dt>
          <dd className="font-mono font-medium tabular">{formatInr(amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Sanction date</dt>
          <dd className="font-medium">{formatDate(date)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function SimilarityCard({ pair, focusWorkId }: SimilarityCardProps) {
  const swap = focusWorkId !== undefined && pair.work_id_2 === focusWorkId;
  const left = swap
    ? { id: pair.work_id_2, desc: pair.description_2, amount: pair.sanction_amount_2, date: pair.sanction_date_2 }
    : { id: pair.work_id_1, desc: pair.description_1, amount: pair.sanction_amount_1, date: pair.sanction_date_1 };
  const right = swap
    ? { id: pair.work_id_1, desc: pair.description_1, amount: pair.sanction_amount_1, date: pair.sanction_date_1 }
    : { id: pair.work_id_2, desc: pair.description_2, amount: pair.sanction_amount_2, date: pair.sanction_date_2 };
  const shared = sharedTokens(left.desc, right.desc);

  return (
    <Card className="gap-0 overflow-hidden rounded-md p-0 shadow-none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-primary/30 bg-secondary px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary-foreground">
            Potential duplicate candidate
          </span>
          <RiskBadge level={pair.duplicate_risk_level} />
          <span className="text-xs text-muted-foreground">
            {toTitleCase(pair.state)} · {toTitleCase(pair.constituency)}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Similarity</span>
          <span className="font-mono text-lg font-semibold tabular">{formatScore(pair.similarity_score)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
        <WorkColumn heading="Candidate work" workId={left.id} description={left.desc} amount={left.amount} date={left.date} shared={shared} linkable={left.id !== focusWorkId} />
        <WorkColumn heading="Potentially similar work" workId={right.id} description={right.desc} amount={right.amount} date={right.date} shared={shared} linkable={right.id !== focusWorkId} />
      </div>

      <div className="flex flex-col gap-1 border-t bg-muted/30 px-4 py-3 text-xs">
        {pair.nlp_explanation && <p className="text-foreground text-pretty">{pair.nlp_explanation}</p>}
        <p className="text-muted-foreground">
          Potentially similar descriptions require human verification. Matching terms are highlighted.
        </p>
      </div>
    </Card>
  );
}
