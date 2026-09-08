"use client";

import { usePathname } from "next/navigation";
import { getNavItemForPath } from "@/lib/constants/navigation";

export function CurrentSection() {
  const pathname = usePathname();
  const item = getNavItemForPath(pathname);
  if (!item) return null;
  return (
    <span className="text-sm text-muted-foreground" aria-live="polite">
      <span className="hidden sm:inline">Section: </span>
      <span className="font-medium text-foreground">{item.label}</span>
    </span>
  );
}
