"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/shared/chart-card";
import { AXIS_LINE, AXIS_STYLE, ChartEmpty, ChartTooltip, GRID_STROKE } from "@/components/charts/chart-theme";
import type { CategorySummary } from "@/lib/types";
import { formatNumber } from "@/lib/utils/format";

export function CategoryRiskChart({ categories }: { categories: CategorySummary[] | undefined }) {
  const data = (categories ?? [])
    .slice()
    .sort((a, b) => b.high_risk_works - a.high_risk_works || b.total_works - a.total_works)
    .map((c) => ({
      category: c.work_category,
      "High risk works": c.high_risk_works,
      "Total works": c.total_works,
    }));

  return (
    <ChartCard
      question="Which work categories concentrate risk?"
      title="Category-wise high-risk works"
      description="Works carrying high or critical risk indicators per category. Hover to see the category's total works for scale."
    >
      {data.length === 0 ? (
        <ChartEmpty message="Category-wise data is not available from the service." />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
              <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis type="category" dataKey="category" width={130} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltip valueFormatter={(v) => formatNumber(v)} />} />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="High risk works" fill="var(--risk-high)" radius={[0, 2, 2, 0]} maxBarSize={18} />
              <Bar dataKey="Total works" fill="var(--chart-2)" radius={[0, 2, 2, 0]} maxBarSize={18} hide />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
