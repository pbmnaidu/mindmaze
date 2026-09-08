import { AlertOctagon, AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";
import { RISK_LEVEL_LABEL, RISK_LEVEL_STYLES, normalizeRiskLevel } from "@/lib/constants/risk";
import type { RiskLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<RiskLevel, typeof AlertOctagon> = {
  LOW: CheckCircle2,
  MEDIUM: CircleAlert,
  HIGH: AlertTriangle,
  CRITICAL: AlertOctagon,
};

interface RiskBadgeProps {
  level: string | null | undefined;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

/** Risk level is always communicated with text + icon, never colour alone. */
export function RiskBadge({ level, size = "sm", showIcon = true, className }: RiskBadgeProps) {
  const normalized = normalizeRiskLevel(level);
  if (!normalized) {
    return (
      <span className={cn("inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground", className)}>
        Not rated
      </span>
    );
  }
  const Icon = ICONS[normalized];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded border font-semibold uppercase tracking-wide whitespace-nowrap",
        size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-1 text-xs",
        RISK_LEVEL_STYLES[normalized].badge,
        className,
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />}
      {RISK_LEVEL_LABEL[normalized]}
    </span>
  );
}
