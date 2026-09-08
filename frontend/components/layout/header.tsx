import Link from "next/link";
import { APP_NAME, APP_SUBTITLE } from "@/lib/constants/navigation";
import { MobileNav } from "./mobile-nav";
import { CurrentSection } from "./current-section";
import { BrandMark } from "./brand-mark";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav />
        <Link href="/" className="flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-ring">
          <BrandMark />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-wide text-foreground">{APP_NAME}</span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">{APP_SUBTITLE}</span>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <CurrentSection />
        </div>
      </div>
    </header>
  );
}
