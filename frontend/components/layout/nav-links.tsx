"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, getNavItemForPath } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import { useRoleScope } from "@/components/providers/role-scope-provider";

export function NavLinks({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { role } = useRoleScope();
  const active = getNavItemForPath(pathname);

  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.filter((item) => role || item.href === "/").map((item) => {
          const isActive = active?.href === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                  isActive
                    ? "border-primary bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "border-transparent text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {!compact && <span className="flex flex-col">
                  <span>{item.label}</span>
                  {!compact && (
                    <span className="text-[11px] font-normal text-muted-foreground">{item.description}</span>
                  )}
                </span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
