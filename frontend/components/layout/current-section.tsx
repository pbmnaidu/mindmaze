"use client";

import { usePathname } from "next/navigation";
import { getNavItemForPath } from "@/lib/constants/navigation";
import { useRoleScope } from "@/components/providers/role-scope-provider";

export function CurrentSection() {
  const pathname = usePathname();
  const { role, label } = useRoleScope();
  const item = getNavItemForPath(pathname);
  if (!item) return null;
  return (
    <span className="text-right text-xs text-muted-foreground" aria-live="polite">
      <span className="hidden sm:inline">{role ? `${role} MASTER · ${label}` : "Select Monitoring Role"}</span>
      <span className="sm:hidden font-medium text-foreground">{item.label}</span>
    </span>
  );
}
