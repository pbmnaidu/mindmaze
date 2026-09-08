import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
}

export function SectionHeading({ title, description, actions, as: Tag = "h2", className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-0.5">
        <Tag className="text-base font-semibold tracking-tight text-foreground">{title}</Tag>
        {description && <p className="text-xs text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
