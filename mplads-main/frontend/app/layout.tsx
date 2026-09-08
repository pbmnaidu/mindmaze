import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { AppShell } from "@/components/layout/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | NIRIKSHAN AI",
    default: "NIRIKSHAN AI | MPLADS Monitoring & Risk Intelligence",
  },
  description:
    "AI-powered MPLADS monitoring and risk intelligence platform for identifying unusual patterns, prioritizing review, and supporting evidence-based verification.",
  applicationName: "NIRIKSHAN AI",
};

export const viewport: Viewport = {
  themeColor: "#1f3a63",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body>
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            <AppShell>{children}</AppShell>
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
