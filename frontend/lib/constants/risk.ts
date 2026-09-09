import type { RiskLevel, WorkRecord } from "@/lib/types";

export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

/** Tailwind class bundles per level; consumed by RiskBadge/RiskScore only. */
export const RISK_LEVEL_STYLES: Record<
  RiskLevel,
  { badge: string; text: string; dot: string; bar: string; cssVar: string }
> = {
  LOW: {
    badge: "bg-risk-low-muted text-risk-low border-risk-low/30",
    text: "text-risk-low",
    dot: "bg-risk-low",
    bar: "bg-risk-low",
    cssVar: "var(--risk-low)",
  },
  MEDIUM: {
    badge: "bg-risk-medium-muted text-risk-medium border-risk-medium/30",
    text: "text-risk-medium",
    dot: "bg-risk-medium",
    bar: "bg-risk-medium",
    cssVar: "var(--risk-medium)",
  },
  HIGH: {
    badge: "bg-risk-high-muted text-risk-high border-risk-high/30",
    text: "text-risk-high",
    dot: "bg-risk-high",
    bar: "bg-risk-high",
    cssVar: "var(--risk-high)",
  },
  CRITICAL: {
    badge: "bg-risk-critical-muted text-risk-critical border-risk-critical/30",
    text: "text-risk-critical",
    dot: "bg-risk-critical",
    bar: "bg-risk-critical",
    cssVar: "var(--risk-critical)",
  },
};

export function normalizeRiskLevel(value: string | null | undefined): RiskLevel | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return (RISK_LEVELS as string[]).includes(upper) ? (upper as RiskLevel) : null;
}

export interface RiskComponent {
  key: "financial" | "duplicate" | "compliance";
  label: string;
  score: number;
  level: RiskLevel | null;
  explanation: string;
}

/**
 * Splits a work record into its four scored components. The duplicate
 * component has no level in the API; it is only a similarity-derived score.
 */
export function getRiskComponents(work: WorkRecord): RiskComponent[] {
  return [
    {
      key: "financial",
      label: "Financial Risk",
      score: work.financial_risk_score,
      level: normalizeRiskLevel(work.financial_risk_level),
      explanation: work.financial_explanation,
    },
    {
      key: "duplicate",
      label: "Duplicate Risk",
      score: work.duplicate_risk_score ?? 0,
      level: null,
      explanation:
        (work.duplicate_risk_score ?? 0) >= 70
          ? "This work description is very similar to another work. Check whether they are the same work."
          : "No very similar work description was found.",
    },
    {
      key: "compliance",
      label: "Compliance Risk",
      score: work.compliance_risk_score,
      level: normalizeRiskLevel(work.compliance_risk_level),
      explanation: work.compliance_explanation,
    },
  ];
}

/** The component contributing the highest score — used as the "Primary Risk Factor". */
export function getPrimaryRiskFactor(work: WorkRecord): RiskComponent {
  return getRiskComponents(work).reduce((max, c) => (c.score > max.score ? c : max));
}
