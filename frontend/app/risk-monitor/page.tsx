import type { Metadata } from "next";
import { Suspense } from "react";
import { RiskMonitorView } from "@/components/risk/risk-monitor-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Risk Monitor",
};

export default function RiskMonitorPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <RiskMonitorView />
    </Suspense>
  );
}
