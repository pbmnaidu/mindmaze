import type { Metadata } from "next";
import { MethodologyView } from "@/components/methodology/methodology-view";

export const metadata: Metadata = {
  title: "Methodology",
};

export default function MethodologyPage() {
  return <MethodologyView />;
}
