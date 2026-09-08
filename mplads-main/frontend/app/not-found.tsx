import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <EmptyState
        icon={<FileQuestion />}
        title="Page not found."
        description="The page you requested does not exist in NIRIKSHAN AI."
        action={
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link href="/">Return to Overview</Link>
          </Button>
        }
        className="w-full max-w-md border-0"
      />
    </div>
  );
}
