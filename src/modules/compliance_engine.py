import os
import pandas as pd
import numpy as np

def run_compliance_engine():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    processed_dir = os.environ.get("PROCESSED_DIR", os.path.join(base_dir, "data", "processed"))
    
    master_path = os.path.join(features_dir, "master_analytical.parquet")
    t3_path = os.path.join(processed_dir, "t3_works_recommended.parquet")
    
    if not os.path.exists(master_path):
        raise FileNotFoundError(f"Master dataset missing at {master_path}")
        
    print("=== EXECUTING MODULE 5: COMPLIANCE & DATA-QUALITY RULE MATRIX ===")
    master = pd.read_parquet(master_path)
    print(f"Loaded master dataset: {len(master):,} records")
    
    # Merge recommended_date from T3 if available
    if os.path.exists(t3_path):
        t3 = pd.read_parquet(t3_path)[["work_id", "recommended_date"]].drop_duplicates("work_id")
        master = pd.merge(master, t3, on="work_id", how="left", suffixes=("", "_t3"))
        if "recommended_date_t3" in master.columns:
            master["recommended_date"] = master["recommended_date"].fillna(master["recommended_date_t3"])
            master.drop(columns=["recommended_date_t3"], inplace=True)

    # Fast datetime parsing
    master["sanction_date"] = pd.to_datetime(master["sanction_date"], errors="coerce")
    master["recommended_date"] = pd.to_datetime(master["recommended_date"], errors="coerce")
    master["completion_date"] = pd.to_datetime(master["completion_date"], errors="coerce")
    master["has_evidence_image"] = master["has_evidence_image"].infer_objects(copy=False).fillna(False)

    # 1. Vectorized Rule Checks
    # RULE_COMP_01: Completed Work Missing Evidence Image
    r1_mask = master["completion_date"].notnull() & (~master["has_evidence_image"])
    
    # RULE_COMP_02: Chronological Sequence Violation
    r2_mask = (master["recommended_date"].notnull() & master["sanction_date"].notnull() & (master["sanction_date"] < master["recommended_date"])) | \
              (master["sanction_date"].notnull() & master["completion_date"].notnull() & (master["completion_date"] < master["sanction_date"]))
              
    # RULE_COMP_03: Data Quality Gap (Missing or Incomplete Description)
    desc_str = master["description"].fillna("").astype(str).str.strip()
    r3_mask = desc_str.str.len() < 15
    
    # RULE_COMP_04: Completed Status with Zero Expenditure Disbursal Record
    exp_val = master["effective_expenditure"].fillna(0)
    r4_mask = master["completion_date"].notnull() & (exp_val <= 0)

    # Calculate compliance score vectorially
    master["compliance_risk_score"] = (
        (r1_mask.astype(int) * 40) +
        (r2_mask.astype(int) * 50) +
        (r3_mask.astype(int) * 25) +
        (r4_mask.astype(int) * 25)
    ).clip(upper=100)

    # Build Triggered Rules List & Audit Explanation Vectorially
    rule1_txt = np.where(r1_mask, "RULE_COMP_01: Missing Evidence Image for Completed Asset", "")
    rule2_txt = np.where(r2_mask, "RULE_COMP_02: Chronological Date Sequence Violation", "")
    rule3_txt = np.where(r3_mask, "RULE_COMP_03: Data Quality Gap (Incomplete Description)", "")
    rule4_txt = np.where(r4_mask, "RULE_COMP_04: Completed Status with Zero Expenditure Disbursal", "")

    def join_reasons(r1, r2, r3, r4):
        parts = [p for p in [r1, r2, r3, r4] if p != ""]
        if not parts:
            return "Full administrative & data compliance verified."
        return " | ".join(parts)

    reasons_vec = np.vectorize(join_reasons)(rule1_txt, rule2_txt, rule3_txt, rule4_txt)
    master["compliance_explanation"] = reasons_vec
    master["triggered_rules"] = reasons_vec

    def assign_comp_level(score):
        if score >= 85:
            return "CRITICAL"
        elif score >= 65:
            return "HIGH"
        elif score >= 35:
            return "MEDIUM"
        return "LOW"

    master["compliance_risk_level"] = master["compliance_risk_score"].apply(assign_comp_level)
    master["is_compliance_flagged"] = master["compliance_risk_score"] >= 35

    out_file = os.path.join(features_dir, "compliance_risk_analysis.parquet")
    master.to_parquet(out_file, index=False)
    
    print("\n=== MODULE 5 EXECUTION SUMMARY ===")
    print(f"Total Works Evaluated: {len(master):,}")
    print("Compliance Risk Level Breakdown:")
    print(master["compliance_risk_level"].value_counts().to_string())
    print(f"\nWorks Flagged for Missing Evidence Images (RULE_COMP_01): {r1_mask.sum():,}")
    print(f"Works Flagged for Date Sequence Violations (RULE_COMP_02): {r2_mask.sum():,}")
    print(f"Works Flagged for Incomplete Descriptions (RULE_COMP_03): {r3_mask.sum():,}")
    print(f"Results saved to: {out_file}")

if __name__ == "__main__":
    run_compliance_engine()
