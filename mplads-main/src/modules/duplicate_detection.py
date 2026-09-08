import os
import re
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def normalize_description(text):
    if pd.isna(text):
        return ""
    # Lowercase
    s = str(text).lower()
    # Strip Work ID prefixes if present in description text
    s = re.sub(r"ws/mp[a-z0-9/\-_]+", "", s)
    # Strip punctuation and numbers
    s = re.sub(r"[^\w\s]", " ", s)
    # Strip excess whitespaces
    s = re.sub(r"\s+", " ", s).strip()
    return s

def run_duplicate_work_detection():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    processed_dir = os.environ.get("PROCESSED_DIR", os.path.join(base_dir, "data", "processed"))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    
    t4_path = os.path.join(processed_dir, "t4_works_sanctioned.parquet")
    master_path = os.path.join(features_dir, "master_analytical.parquet")
    
    if not os.path.exists(t4_path):
        raise FileNotFoundError(f"Sanctioned works dataset missing at {t4_path}")
        
    print("=== EXECUTING MODULE 4: POTENTIAL DUPLICATE WORK ENGINE (NLP) ===")
    df = pd.read_parquet(t4_path)
    print(f"Loaded sanctioned works base: {len(df):,} records")

    # 1. Clean & Filter Descriptions
    df["norm_desc"] = df["description"].apply(normalize_description)
    
    # Filter works with meaningful descriptions (length >= 10 chars)
    df_valid = df[df["norm_desc"].str.len() >= 10].copy()
    print(f"Valid work descriptions for NLP comparison: {len(df_valid):,} records")

    candidate_pairs = []
    
    # 2. Group comparison by State & Constituency to avoid O(N^2) explosion
    print("Performing TF-IDF & Cosine Similarity vector search per constituency block...")
    groups = df_valid.groupby(["state", "constituency"])
    
    group_count = 0
    for (state, const), group in groups:
        if len(group) < 2:
            continue
            
        group_count += 1
        descriptions = group["norm_desc"].tolist()
        work_ids = group["work_id"].tolist()
        raw_descs = group["description"].tolist()
        amounts = group["sanction_amount"].tolist()
        dates = group["sanction_date"].tolist()

        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
            tfidf_matrix = vectorizer.fit_transform(descriptions)
            sim_matrix = cosine_similarity(tfidf_matrix)

            # Find upper triangle pairs above threshold (>= 0.70)
            rows, cols = np.where(sim_matrix >= 0.70)
            for r, c in zip(rows, cols):
                if r < c: # Unique pairs only
                    sim_score = round(float(sim_matrix[r, c]) * 100, 1)
                    
                    # Ignore exact same work ID if duplicates exist in raw
                    if work_ids[r] == work_ids[c]:
                        continue
                        
                    candidate_pairs.append({
                        "work_id_1": work_ids[r],
                        "work_id_2": work_ids[c],
                        "state": state,
                        "constituency": const,
                        "similarity_score": sim_score,
                        "sanction_amount_1": amounts[r],
                        "sanction_amount_2": amounts[c],
                        "description_1": raw_descs[r],
                        "description_2": raw_descs[c],
                        "sanction_date_1": dates[r],
                        "sanction_date_2": dates[c]
                    })
        except Exception:
            continue

    pairs_df = pd.DataFrame(candidate_pairs)
    print(f"Discovered {len(pairs_df):,} candidate duplicate pairs across {group_count:,} constituency blocks!")

    if len(pairs_df) > 0:
        # Assign risk levels
        def assign_dup_level(score):
            if score >= 85:
                return "HIGH"
            elif score >= 70:
                return "MEDIUM"
            return "LOW"

        pairs_df["duplicate_risk_level"] = pairs_df["similarity_score"].apply(assign_dup_level)
        pairs_df["nlp_explanation"] = pairs_df.apply(
            lambda r: f"High semantic description overlap ({r['similarity_score']:.1f}% match) with Work ID '{r['work_id_2']}' in {r['constituency']}",
            axis=1
        )

        out_pairs = os.path.join(features_dir, "duplicate_work_candidates.parquet")
        pairs_df.to_parquet(out_pairs, index=False)
        print(f"Candidate duplicate pairs saved to: {out_pairs}")
        
        # 3. Create Work-Level Maximum Duplicate Score mapping for Master Dataset
        max_dup_1 = pairs_df.groupby("work_id_1")["similarity_score"].max().reset_index().rename(
            columns={"work_id_1": "work_id", "similarity_score": "duplicate_risk_score"}
        )
        max_dup_2 = pairs_df.groupby("work_id_2")["similarity_score"].max().reset_index().rename(
            columns={"work_id_2": "work_id", "similarity_score": "duplicate_risk_score"}
        )
        work_dup_summary = pd.concat([max_dup_1, max_dup_2]).groupby("work_id")["duplicate_risk_score"].max().reset_index()
        
        out_work_dup = os.path.join(features_dir, "work_duplicate_scores.parquet")
        work_dup_summary.to_parquet(out_work_dup, index=False)

    print("\n=== MODULE 4 EXECUTION SUMMARY ===")
    print(f"Total Duplicate Candidate Pairs Found (>=70% match): {len(pairs_df):,}")
    if len(pairs_df) > 0:
        print("Duplicate Risk Level Breakdown (Pairs):")
        print(pairs_df["duplicate_risk_level"].value_counts().to_string())
        print(f"High Similarity Candidates (>=85% match): {(pairs_df['similarity_score'] >= 85).sum():,}")

if __name__ == "__main__":
    run_duplicate_work_detection()
