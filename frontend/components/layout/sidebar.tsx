import { NavLinks } from "./nav-links";
import { OversightNote } from "./oversight-note";
import { RoleSelector } from "./role-selector";
import { cn } from "@/lib/utils";

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside className={cn("sticky top-14 hidden h-[calc(100svh-3.5rem)] shrink-0 flex-col justify-between overflow-hidden border-r bg-sidebar py-5 transition-[width,padding] duration-200 md:flex", collapsed ? "w-16 px-2" : "w-60 px-3 lg:w-64")}>
      <div className="flex flex-col gap-4">
        <NavLinks compact={collapsed} />
        {!collapsed && <RoleSelector compact />}
      </div>
      {!collapsed && <OversightNote />}
    </aside>
  );
}
