import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface WorkIdProps {
  id: string;
  link?: boolean;
  className?: string;
}

/** Long MPLADS work IDs: monospace, single line, truncated with a tooltip. */
export function WorkId({ id, link = true, className }: WorkIdProps) {
  const content = (
    <span className={cn("block max-w-[14rem] truncate font-mono text-xs", link ? "text-primary underline-offset-2 hover:underline" : "text-foreground", className)}>
      {id}
    </span>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {link ? (
          <Link href={`/projects/${encodeURIComponent(id)}`} className="rounded focus-visible:outline-2 focus-visible:outline-ring">
            {content}
          </Link>
        ) : (
          content
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs">
        {id}
      </TooltipContent>
    </Tooltip>
  );
}
