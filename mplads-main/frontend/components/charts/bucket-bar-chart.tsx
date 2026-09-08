"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_LINE, AXIS_STYLE, ChartEmpty, ChartTooltip, GRID_STROKE } from "./chart-theme";
import type { Bucket } from "@/lib/utils/analytics";
import { formatNumber } from "@/lib/utils/format";

interface BucketBarChartProps {
  data: Bucket[];
  /** Optional per-bucket fill; defaults to a single series colour. */
  colors?: string[];
  seriesName?: string;
  height?: number;
  emptyMessage?: string;
  layout?: "horizontal" | "vertical";
}

export function BucketBarChart({
  data,
  colors,
  seriesName = "Works",
  height = 220,
  emptyMessage = "No data available for this selection.",
  layout = "horizontal",
}: BucketBarChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <ChartEmpty message={emptyMessage} />;

  const rows = data.map((d) => ({ label: d.label, [seriesName]: d.count }));
  const vertical = layout === "vertical";

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout={vertical ? "vertical" : "horizontal"} margin={{ top: 4, right: 8, bottom: 4, left: 4 }} barCategoryGap={vertical ? 6 : 18}>
          <CartesianGrid vertical={vertical} horizontal={!vertical} stroke={GRID_STROKE} />
          {vertical ? (
            <>
              <XAxis type="number" allowDecimals={false} tick={AXIS_STYLE} axisLine={AXIS_LINE} tickLine={false} />
              <YAxis type="category" dataKey="label" width={120} tick={AXIS_STYLE} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={AXIS_LINE} tickLine={false} interval={0} />
              <YAxis allowDecimals={false} tick={AXIS_STYLE} axisLine={false} tickLine={false} width={36} />
            </>
          )}
          <Tooltip cursor={{ fill: "var(--accent)" }} content={<ChartTooltip valueFormatter={(v) => formatNumber(v)} />} />
          <Bar dataKey={seriesName} fill="var(--chart-1)" radius={vertical ? [0, 2, 2, 0] : [2, 2, 0, 0]} maxBarSize={vertical ? 18 : 48}>
            {colors && rows.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
