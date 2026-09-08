"use client";

import { RISK_LEVEL_LABEL, RISK_LEVEL_STYLES, RISK_LEVELS } from "@/lib/constants/risk";
import type { RiskLevel } from "@/lib/types";
import { BucketBarChart } from "./bucket-bar-chart";

/** Bar chart of counts per risk level, using the fixed risk colour scale. */
export function LevelBarChart({ counts, height }: { counts: Record<RiskLevel, number>; height?: number }) {
  return (
    <BucketBarChart
      data={RISK_LEVELS.map((level) => ({ label: RISK_LEVEL_LABEL[level], count: counts[level] }))}
      colors={RISK_LEVELS.map((level) => RISK_LEVEL_STYLES[level].cssVar)}
      height={height}
    />
  );
}
