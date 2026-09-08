"use client";

import { cn } from "@/lib/utils";

export const AXIS_STYLE = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
} as const;

export const AXIS_LINE = { stroke: "var(--border)" } as const;
export const GRID_STROKE = "var(--border)";

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: string | number;
  labelFormatter?: (label: string | number) => string;
  valueFormatter?: (value: number, name: string) => string;
  className?: string;
}

/** Restrained tooltip used by every Recharts chart in the app. */
export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter, className }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className={cn("rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm", className)}>
      {label !== undefined && label !== null && (
        <p className="mb-1 font-medium">{labelFormatter ? labelFormatter(label) : String(label)}</p>
      )}
      <ul className="flex flex-col gap-0.5">
        {payload.map((entry, i) => (
          <li key={`${String(entry.name)}-${i}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ background: entry.color }} aria-hidden="true" />
              {String(entry.name ?? "")}
            </span>
            <span className="font-mono tabular">
              {valueFormatter ? valueFormatter(Number(entry.value), String(entry.name ?? "")) : String(entry.value ?? "")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
      {message}
    </div>
  );
}
