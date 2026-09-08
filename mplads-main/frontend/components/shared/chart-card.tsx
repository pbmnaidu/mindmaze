import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  /** The administrative question this chart answers. */
  question?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, description, question, footer, children, className }: ChartCardProps) {
  return (
    <Card className={cn("gap-4 rounded-md shadow-none", className)}>
      <CardHeader className="gap-1">
        {question && <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{question}</p>}
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {children}
        {footer && <div className="text-xs text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  );
}

export function ChartCardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <Card className="gap-4 rounded-md shadow-none">
      <CardHeader className="gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton style={{ height }} className="w-full" />
      </CardContent>
    </Card>
  );
}
