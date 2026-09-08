import type { CandidateDuplicatePair, WorkRecord } from "@/lib/types";
import { normalizeRiskLevel, RISK_LEVELS } from "@/lib/constants/risk";
import type { RiskLevel } from "@/lib/types";

export interface Bucket {
  label: string;
  count: number;
}

export function countByLevel(works: WorkRecord[], pick: (w: WorkRecord) => string | undefined): Record<RiskLevel, number> {
  const counts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  for (const w of works) {
    const level = normalizeRiskLevel(pick(w));
    if (level) counts[level] += 1;
  }
  return counts;
}

export function levelBuckets(counts: Record<RiskLevel, number>) {
  return RISK_LEVELS.map((level) => ({ level, count: counts[level] }));
}

/** Peer-ratio buckets: how far sanction amounts sit from their category median. */
export function peerRatioBuckets(works: WorkRecord[]): Bucket[] {
  const withRatio = works.filter((w) => typeof w.amount_to_peer_ratio === "number");
  const b = { normal: 0, elevated: 0, high: 0, extreme: 0 };
  for (const w of withRatio) {
    const r = w.amount_to_peer_ratio!;
    if (r <= 1.5) b.normal += 1;
    else if (r <= 2) b.elevated += 1;
    else if (r <= 3) b.high += 1;
    else b.extreme += 1;
  }
  return [
    { label: "≤ 1.5× median", count: b.normal },
    { label: "1.5–2× median", count: b.elevated },
    { label: "2–3× median", count: b.high },
    { label: "> 3× median", count: b.extreme },
  ];
}

export interface VendorAggregate {
  vendor: string;
  works: number;
  sanctioned: number;
  maxShare: number;
  highRiskWorks: number;
}

export function aggregateVendors(works: WorkRecord[], limit = 8): VendorAggregate[] {
  const map = new Map<string, VendorAggregate>();
  for (const w of works) {
    if (!w.top_vendor) continue;
    const entry = map.get(w.top_vendor) ?? { vendor: w.top_vendor, works: 0, sanctioned: 0, maxShare: 0, highRiskWorks: 0 };
    entry.works += 1;
    entry.sanctioned += w.sanction_amount ?? 0;
    entry.maxShare = Math.max(entry.maxShare, w.top_vendor_share ?? 0);
    const level = normalizeRiskLevel(w.vendor_risk_level);
    if (level === "HIGH" || level === "CRITICAL") entry.highRiskWorks += 1;
    map.set(w.top_vendor, entry);
  }
  return [...map.values()].sort((a, b) => b.sanctioned - a.sanctioned).slice(0, limit);
}

/** Vendor share buckets — how concentrated top-vendor shares are across works. */
export function vendorShareBuckets(works: WorkRecord[]): Bucket[] {
  const withShare = works.filter((w) => typeof w.top_vendor_share === "number");
  const b = { low: 0, moderate: 0, high: 0, single: 0 };
  for (const w of withShare) {
    const s = w.top_vendor_share!;
    if (s < 0.25) b.low += 1;
    else if (s < 0.5) b.moderate += 1;
    else if (s < 1) b.high += 1;
    else b.single += 1;
  }
  return [
    { label: "< 25%", count: b.low },
    { label: "25–50%", count: b.moderate },
    { label: "50–99%", count: b.high },
    { label: "100% single vendor", count: b.single },
  ];
}

/** Expenditure-to-sanction ratio buckets — a proxy for disbursal progression. */
export function disbursalBuckets(works: WorkRecord[]): Bucket[] {
  const b = { none: 0, partial: 0, most: 0, full: 0, over: 0 };
  for (const w of works) {
    if (!w.sanction_amount) continue;
    const r = (w.effective_expenditure ?? 0) / w.sanction_amount;
    if (r <= 0) b.none += 1;
    else if (r < 0.5) b.partial += 1;
    else if (r < 0.9) b.most += 1;
    else if (r <= 1) b.full += 1;
    else b.over += 1;
  }
  return [
    { label: "No expenditure", count: b.none },
    { label: "< 50% disbursed", count: b.partial },
    { label: "50–90% disbursed", count: b.most },
    { label: "90–100% disbursed", count: b.full },
    { label: "Above sanction", count: b.over },
  ];
}

export function similarityBuckets(pairs: CandidateDuplicatePair[]): Bucket[] {
  const b = { a: 0, b: 0, c: 0, d: 0 };
  for (const p of pairs) {
    const s = p.similarity_score;
    if (s < 80) b.a += 1;
    else if (s < 90) b.b += 1;
    else if (s < 95) b.c += 1;
    else b.d += 1;
  }
  return [
    { label: "70–79", count: b.a },
    { label: "80–89", count: b.b },
    { label: "90–94", count: b.c },
    { label: "95–100", count: b.d },
  ];
}

export interface ComplianceIndicators {
  total: number;
  missingEvidence: number;
  withEvidence: number;
  evidenceUnknown: number;
  completedWithoutEvidence: number;
  completedBeforeSanction: number;
  expenditureAboveSanction: number;
}

/** Rule-based consistency checks that can be evaluated from the record fields. */
export function complianceIndicators(works: WorkRecord[]): ComplianceIndicators {
  const out: ComplianceIndicators = {
    total: works.length,
    missingEvidence: 0,
    withEvidence: 0,
    evidenceUnknown: 0,
    completedWithoutEvidence: 0,
    completedBeforeSanction: 0,
    expenditureAboveSanction: 0,
  };
  for (const w of works) {
    if (w.has_evidence_image === true) out.withEvidence += 1;
    else if (w.has_evidence_image === false) out.missingEvidence += 1;
    else out.evidenceUnknown += 1;

    if (w.completion_date && w.has_evidence_image === false) out.completedWithoutEvidence += 1;
    if (w.completion_date && w.sanction_date && new Date(w.completion_date) < new Date(w.sanction_date)) out.completedBeforeSanction += 1;
    if (w.sanction_amount && (w.effective_expenditure ?? 0) > w.sanction_amount) out.expenditureAboveSanction += 1;
  }
  return out;
}
