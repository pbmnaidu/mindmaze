import { ImageOff, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkRecord } from "@/lib/types";

export function EvidencePanel({ work }: { work: WorkRecord }) {
  const hasRecorded = work.has_evidence_image === true;
  const imageUrl = hasRecorded ? work.evidence_image_url : null;

  return (
    <Card className="gap-3 rounded-md shadow-none border">
      <CardHeader className="pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold">Field Inspection & Evidence Photo</CardTitle>
        {imageUrl && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="size-3" /> Photo Verified
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        {imageUrl ? (
          <figure className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-md border bg-slate-100 dark:bg-slate-900">
              <img
                src={imageUrl}
                alt={`Geo-tagged field inspection proof for work ${work.work_id}`}
                className="aspect-video w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
            <figcaption className="text-[11px] text-muted-foreground flex justify-between items-center">
              <span>Geo-tagged official completion proof</span>
              <span className="font-mono text-[10px]">{work.work_id}</span>
            </figcaption>
          </figure>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-8 text-center">
            <ImageOff className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">Evidence image not available</p>
            <p className="text-xs text-muted-foreground text-pretty">
              Additional official records may be required for verification.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
