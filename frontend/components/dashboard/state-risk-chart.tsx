"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { AXIS_LINE, AXIS_STYLE, ChartEmpty, ChartTooltip, GRID_STROKE } from "@/components/charts/chart-theme";
import type { StateSummary } from "@/lib/types";
import { formatNumber, toTitleCase } from "@/lib/utils/format";

export function StateRiskChart({ states }: { states: StateSummary[] }) {
  const data = [...states]
    .sort((a, b) => b.high_risk_works - a.high_risk_works || b.total_works - a.total_works)
    .slice(0, 8)
    .map((s) => ({
      state: toTitleCase(s.state),
      "High risk works": s.high_risk_works,
      "Total works": s.total_works,
    }));

  return (
    <ChartCard
      question="Which states carry the most high-risk indicators?"
      title="State-wise high-risk works"
      description="Count of works flagged high or critical, for the states reported by the risk engine."
      footer="Ranked by high-risk count. Hover a bar to see total works for scale."
    >
      {data.length === 0 ? (
        <ChartEmpty message="No state-wise data available." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
              <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis type="category" dataKey="state" width={110} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--accent)" }}
                content={<ChartTooltip valueFormatter={(v) => formatNumber(v)} />}
              />
              <Bar dataKey="High risk works" fill="var(--risk-high)" radius={[0, 2, 2, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
