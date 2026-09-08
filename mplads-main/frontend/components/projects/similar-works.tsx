import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/states";
import { SimilarityCard } from "@/components/duplicates/similarity-card";
import type { CandidateDuplicatePair } from "@/lib/types";

export function SimilarWorks({ workId, pairs }: { workId: string; pairs: CandidateDuplicatePair[] }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="similar-heading">
      <SectionHeading
        title="Potential similar works"
        description="Description-level similarity computed with TF-IDF and cosine similarity within the same constituency."
      />
      {pairs.length === 0 ? (
        <EmptyState
          title="No potential duplicate candidates found."
          description="No other work description in this constituency exceeded the similarity threshold."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {pairs.map((pair) => (
            <SimilarityCard key={`${pair.work_id_1}-${pair.work_id_2}`} pair={pair} focusWorkId={workId} />
          ))}
        </div>
      )}
    </section>
  );
}
