"use client";

import { Info } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataSourceNotice } from "@/components/shared/data-source-notice";
import { ChartCardSkeleton } from "@/components/shared/chart-card";
import { ErrorState } from "@/components/shared/states";
import { useAnalytics } from "@/hooks/use-analytics";
import { ANALYTICS_SAMPLE_SIZE } from "@/lib/api/analytics";
import { formatNumber } from "@/lib/utils/format";
import { FinancialSection } from "./financial-section";
import { VendorSection } from "./vendor-section";
import { PaymentSection } from "./payment-section";
import { DuplicateSection } from "./duplicate-section";
import { ComplianceSection } from "./compliance-section";
import { useRoleScope } from "@/components/providers/role-scope-provider";
import { MonitoringRequired } from "@/components/shared/monitoring-required";

export function AnalyticsView() {
  const { apiScope, role, label } = useRoleScope();
  const analytics = useAnalytics();
  const data = analytics.data?.data;

  if (!apiScope) return <MonitoringRequired />;
  const level = role === "NATIONAL" ? "State" : role === "STATE" ? "Constituency" : "Work";
  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${level}-level pattern analysis within ${label}, across financial, vendor, payment, duplicate, and compliance indicators.`}
      />

      <DataSourceNotice source={analytics.data?.source} />

      {data && (
        <div className="flex items-start gap-2 rounded-md border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-medium text-foreground">Basis of analysis.</span> Distribution and state/category
            figures come from the active monitoring scope over {formatNumber(data.overview.summary.total_works)} works. Record-level
            patterns (peer ratios, vendor shares, disbursal, compliance) are computed from the{" "}
            <span className="font-medium text-foreground">top {formatNumber(Math.min(ANALYTICS_SAMPLE_SIZE, data.works.length))} prioritized works</span>{" "}
            returned by the risk engine, not the full dataset.
          </p>
        </div>
      )}

      {analytics.isError ? (
        <ErrorState title="Unable to load analytics." onRetry={() => analytics.refetch()} retrying={analytics.isFetching} />
      ) : analytics.isPending ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <ChartCardSkeleton key={i} />)}
        </div>
      ) : (
        <Tabs defaultValue="financial" className="gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              ["financial", "Financial anomalies"],
              ["vendor", "Vendor analysis"],
              ["payment", "Payment analysis"],
              ["duplicate", "Duplicate analysis"],
              ["compliance", "Compliance"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-md border border-transparent px-3 py-1.5 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="financial"><FinancialSection data={data!} /></TabsContent>
          <TabsContent value="vendor"><VendorSection data={data!} /></TabsContent>
          <TabsContent value="payment"><PaymentSection data={data!} /></TabsContent>
          <TabsContent value="duplicate"><DuplicateSection data={data!} /></TabsContent>
          <TabsContent value="compliance"><ComplianceSection data={data!} /></TabsContent>
        </Tabs>
      )}
    </>
  );
}
