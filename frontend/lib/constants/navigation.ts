import {
  BookOpenText,
  Copy,
  FolderSearch,
  LayoutDashboard,
  LineChart,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Overview", description: "National monitoring summary", icon: LayoutDashboard },
  { href: "/risk-monitor", label: "Risk Monitor", description: "Prioritized audit queue", icon: ShieldAlert },
  { href: "/projects", label: "Projects", description: "Work directory", icon: FolderSearch },
  { href: "/analytics", label: "Analytics", description: "Pattern analysis", icon: LineChart },
  { href: "/duplicate-inspector", label: "Duplicate Inspector", description: "Similar work comparison", icon: Copy },
  { href: "/methodology", label: "Methodology", description: "How risk is computed", icon: BookOpenText },
];

export const APP_NAME = "NIRIKSHAN AI";
export const APP_SUBTITLE = "AI-Powered MPLADS Monitoring & Risk Intelligence";
export const APP_TAGLINE = "Detect anomalies. Prioritize risks. Enable evidence-based verification.";

export function getNavItemForPath(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS[0];
  return NAV_ITEMS.find((item) => item.href !== "/" && pathname.startsWith(item.href));
}
