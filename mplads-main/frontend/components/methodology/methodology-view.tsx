import { ArrowDown, Calculator, Copy, FileCheck2, Landmark, Scale, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/risk/risk-badge";
import { SectionHeading } from "@/components/shared/section-heading";

const PIPELINE = [
  { label: "MPLADS data", detail: "Work records, sanctions, expenditure, vendors, dates" },
  { label: "Data cleaning & validation", detail: "Type coercion, de-duplication of source rows, null handling" },
  { label: "Feature engineering", detail: "Peer medians, percentile ranks, vendor shares, date deltas" },
  { label: "AI + analytics", detail: "Isolation Forest, TF-IDF + cosine similarity, statistical tests" },
  { label: "Risk engine", detail: "Component scores combined into a composite 0–100 score" },
  { label: "Explainable risk indicators", detail: "Human-readable reason per component" },
  { label: "Prioritized audit queue", detail: "Works ranked for review by composite score" },
  { label: "Human verification", detail: "Authorized officers verify against official records" },
];

const METHODS = [
  {
    icon: Landmark,
    title: "Financial anomaly detection",
    technique: "Isolation Forest + peer-group statistics",
    body: "Sanction amounts are compared within peer groups defined by work category and state. Peer ratio (sanction ÷ peer median), percentile rank, and an IQR upper fence (Q3 + 1.5 × IQR) describe how far a work sits from comparable works. An Isolation Forest model scores multivariate unusualness across these features.",
    output: "Financial risk score and level; explanation stating the peer ratio and baseline.",
  },
  {
    icon: Copy,
    title: "Potential duplicate detection",
    technique: "TF-IDF + cosine similarity",
    body: "Work descriptions are tokenised into unigrams and bigrams and vectorised with term-frequency / inverse-document-frequency weighting. Cosine similarity is computed between descriptions within the same constituency. Pairs above the similarity threshold are surfaced as potential duplicate candidates.",
    output: "Duplicate risk score (similarity-derived) and candidate pairs with the matching descriptions.",
  },
  {
    icon: Users,
    title: "Vendor & payment analysis",
    technique: "Statistical pattern analysis",
    body: "The share of constituency sanctions held by a work's leading vendor is computed alongside work counts and expenditure concentration. Expenditure-to-sanction relationships are evaluated for disbursal progression. High concentration is an indicator for procurement review, not a finding.",
    output: "Vendor risk score and level; explanation referencing the observed share.",
  },
  {
    icon: FileCheck2,
    title: "Compliance monitoring",
    technique: "Rule-based consistency checks",
    body: "Deterministic rules test the internal consistency of each record: presence of an evidence image where completion is recorded, date ordering (recommendation → sanction → completion), and expenditure within sanction. Each triggered rule contributes to the compliance score with a plain-language warning.",
    output: "Compliance risk score and level; the triggered warning text.",
  },
];

export function MethodologyView() {
  return (
    <>
      <PageHeader
        title="Methodology"
        description="How NIRIKSHAN AI turns MPLADS records into explainable risk indicators and a prioritized review queue. Every score shown in the application traces back to the steps described here."
      />

      <Card className="gap-0 rounded-md border-risk-medium/40 bg-risk-medium-muted p-0 shadow-none">
        <CardContent className="flex items-start gap-3 p-4">
          <Scale className="mt-0.5 size-4 shrink-0 text-risk-medium" aria-hidden="true" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">An anomaly is not proof of fraud.</p>
            <p className="text-pretty">
              The platform identifies statistically unusual patterns and prioritizes works for human verification.
              AI identifies unusual patterns. Risk intelligence prioritizes attention. Authorized officers perform verification.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="pipeline-heading">
        <SectionHeading title="Processing pipeline" description="From raw records to a verified outcome. Steps 1–7 run in the FastAPI analytics service; step 8 is performed by people." />
        <Card className="gap-0 rounded-md p-0 shadow-none">
          <ol className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((step, i) => (
              <li key={step.label} className="relative flex flex-col gap-1 bg-card p-4">
                <span className="text-[11px] font-medium text-muted-foreground tabular">Step {i + 1}</span>
                <span className={i === PIPELINE.length - 1 ? "text-sm font-semibold text-primary" : "text-sm font-semibold"}>{step.label}</span>
                <span className="text-xs text-muted-foreground text-pretty">{step.detail}</span>
                {i < PIPELINE.length - 1 && (
                  <ArrowDown className="absolute right-3 top-3 size-3.5 text-muted-foreground/60" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="methods-heading">
        <SectionHeading title="Analytical methods" description="Each risk component is produced by a distinct, documented technique." />
        <div className="grid gap-3 md:grid-cols-2">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.title} className="gap-3 rounded-md shadow-none">
                <CardHeader className="gap-1">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" aria-hidden="true" />
                    <CardTitle className="text-sm font-semibold">{m.title}</CardTitle>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">{m.technique}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm leading-relaxed">
                  <p className="text-pretty">{m.body}</p>
                  <p className="border-t pt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">Output: </span>{m.output}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="engine-heading">
        <SectionHeading title="Risk engine" description="Multiple risk signals are combined into a single composite score used to rank the audit queue." />
        <Card className="gap-4 rounded-md shadow-none">
          <CardHeader className="gap-1">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-primary" aria-hidden="true" />
              <CardTitle className="text-sm font-semibold">Composite risk score</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="overflow-x-auto rounded-md border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
              Composite = 0.35 × Financial + 0.25 × Vendor + 0.25 × Duplicate + 0.15 × Compliance
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Financial", "35%"],
                ["Vendor", "25%"],
                ["Duplicate", "25%"],
                ["Compliance", "15%"],
              ].map(([name, weight]) => (
                <div key={name} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{name}</p>
                  <p className="font-mono text-lg font-semibold tabular">{weight}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Risk levels</p>
              <div className="grid gap-2 sm:grid-cols-4">
                {[
                  ["LOW", "Below 35", "Routine monitoring"],
                  ["MEDIUM", "35 – 64", "Review recommended"],
                  ["HIGH", "65 – 84", "Review recommended, elevated priority"],
                  ["CRITICAL", "85 and above", "Investigation priority"],
                ].map(([level, range, meaning]) => (
                  <div key={level} className="flex flex-col gap-1 rounded-md border p-3">
                    <RiskBadge level={level} />
                    <p className="font-mono text-xs tabular">{range}</p>
                    <p className="text-xs text-muted-foreground">{meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="scope-heading">
        <SectionHeading title="Scope and limitations" />
        <Card className="gap-0 rounded-md p-0 shadow-none">
          <ul className="divide-y text-sm leading-relaxed">
            <li className="p-4 text-pretty">Scores describe statistical unusualness relative to the dataset. They do not establish intent, wrongdoing, or the accuracy of source records.</li>
            <li className="p-4 text-pretty">Evidence images are displayed only when the analytics service supplies a retrievable record. The platform does not generate or infer evidence.</li>
            <li className="p-4 text-pretty">Payment analysis is limited to the expenditure and sanction fields available per work; individual transaction records are not currently exposed by the service.</li>
            <li className="p-4 text-pretty">A conversational assistant is not included in this release because the analytics service does not yet expose a query endpoint. It will be added when responses can be grounded in service data rather than generated text.</li>
          </ul>
        </Card>
      </section>
    </>
  );
}
