import type { Metadata } from "next";
import { OverviewView } from "@/components/dashboard/overview-view";

export const metadata: Metadata = {
  title: "Overview",
};

export default function OverviewPage() {
  return <OverviewView />;
}
