import { Inbox, RefreshCw, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-6 py-10 text-center", className)}>
      <span className="text-muted-foreground [&>svg]:size-6" aria-hidden="true">{icon ?? <Inbox />}</span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-md text-xs text-muted-foreground text-pretty">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** User-facing failure. Never surfaces raw errors, stack traces, or JSON. */
export function ErrorState({
  title = "Unable to load data.",
  description = "The risk intelligence service did not respond. Please try again.",
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-6 py-10 text-center", className)}>
      <ServerCrash className="size-6 text-destructive" aria-hidden="true" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-xs text-muted-foreground">{description}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying} className="mt-2">
          <RefreshCw className={cn("size-3.5", retrying && "animate-spin")} aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  );
}
