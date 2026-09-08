import { NavLinks } from "./nav-links";
import { OversightNote } from "./oversight-note";

export function Sidebar() {
  return (
    <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 flex-col justify-between border-r bg-sidebar px-3 py-5 md:flex lg:w-64">
      <NavLinks />
      <OversightNote />
    </aside>
  );
}
