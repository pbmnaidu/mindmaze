"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants/navigation";
import { NavLinks } from "./nav-links";
import { OversightNote } from "./oversight-note";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-4 p-4">
        <SheetHeader className="p-0 text-left">
          <SheetTitle className="text-sm font-semibold tracking-wide">{APP_NAME}</SheetTitle>
          <SheetDescription className="text-xs">{APP_SUBTITLE}</SheetDescription>
        </SheetHeader>
        <NavLinks compact onNavigate={() => setOpen(false)} />
        <div className="mt-auto">
          <OversightNote />
        </div>
      </SheetContent>
    </Sheet>
  );
}
