"use client";

import { ErrorState } from "@/components/shared/states";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <ErrorState
        title="Something went wrong."
        description="This section could not be displayed. Please try again."
        onRetry={reset}
        className="w-full max-w-md"
      />
    </div>
  );
}
