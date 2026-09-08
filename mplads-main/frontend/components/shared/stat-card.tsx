import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  accent?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, icon, accent, className }: StatCardProps) {
  return (
    <Card className={cn("gap-2 rounded-md py-4 shadow-none", className)}>
      <div className="flex items-start justify-between gap-3 px-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon && <span className="text-muted-foreground [&>svg]:size-4" aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4">
        <p className="font-mono text-2xl font-semibold tabular text-foreground">{value}</p>
        {accent}
      </div>
      {hint && <p className="px-4 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="gap-3 rounded-md py-4 shadow-none">
      <div className="px-4"><Skeleton className="h-3 w-24" /></div>
      <div className="px-4"><Skeleton className="h-7 w-28" /></div>
      <div className="px-4"><Skeleton className="h-3 w-36" /></div>
    </Card>
  );
}
