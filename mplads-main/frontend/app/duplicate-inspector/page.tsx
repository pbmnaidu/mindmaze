import type { Metadata } from "next";
import { Suspense } from "react";
import { DuplicateInspectorView } from "@/components/duplicates/duplicate-inspector-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Duplicate Inspector",
};

export default function DuplicateInspectorPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <DuplicateInspectorView />
    </Suspense>
  );
}
