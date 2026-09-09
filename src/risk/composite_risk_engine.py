import os
import pandas as pd
import numpy as np

def run_composite_risk_engine():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    
    master_path = os.path.join(features_dir, "master_analytical.parquet")
    fin_path = os.path.join(features_dir, "financial_anomalies.parquet")
    dup_path = os.path.join(features_dir, "work_duplicate_scores.parquet")
    comp_path = os.path.join(features_dir, "compliance_risk_analysis.parquet")
    
    print("=== EXECUTING PHASE 3: COMPOSITE RISK INTELLIGENCE & ALERT ENGINE ===")
    
    # Load base master
    df_base = pd.read_parquet(master_path)
    print(f"Loaded master project base: {len(df_base):,} works")
    
    # 1. Merge Financial Risk
    if os.path.exists(fin_path):
        fin_available = pd.read_parquet(fin_path, columns=None).columns
        fin_cols = ["work_id", "financial_risk_score", "financial_risk_level", "financial_explanation"]
        fin_cols += [c for c in ["financial_anomaly_score", "material_cost_context_score", "material_context_explanation", "detected_work_type", "detected_materials", "data_quality_flags", "risk_reasons", "peer_group_level", "peer_group_size", "peer_group_label", "peer_group_category", "peer_group_state", "peer_group_quality", "peer_group_median", "peer_group_q1", "peer_group_q3", "peer_group_iqr", "peer_group_upper_bound", "peer_percentile", "amount_to_peer_ratio", "constituency_historic_avg_cost", "reference_cost_deviation_ratio", "historic_cost_deviation_ratio", "reference_cost_basis_inr", "quantity_detected", "quantity_unit", "quantity_source", "reference_unit_cost_inr", "reference_total_cost_inr", "reference_unit_cost_min_inr", "reference_unit_cost_max_inr", "reference_total_cost_min_inr", "reference_total_cost_max_inr"] if c in fin_available and c not in df_base.columns]
        fin_df = pd.read_parquet(fin_path)[fin_cols].drop_duplicates("work_id")
        df_base = pd.merge(df_base, fin_df, on="work_id", how="left")
    else:
        df_base["financial_risk_score"] = 0.0
        df_base["financial_risk_level"] = "LOW"
        df_base["financial_explanation"] = ""

    # 2. Merge Duplicate Risk
    if os.path.exists(dup_path):
        dup_df = pd.read_parquet(dup_path)[["work_id", "duplicate_risk_score"]].drop_duplicates("work_id")
        df_base = pd.merge(df_base, dup_df, on="work_id", how="left")
    else:
        df_base["duplicate_risk_score"] = 0.0

    # 3. Merge Compliance Risk
    if os.path.exists(comp_path):
        comp_df = pd.read_parquet(comp_path)[["work_id", "compliance_risk_score", "compliance_risk_level", "compliance_explanation"]].drop_duplicates("work_id")
        df_base = pd.merge(df_base, comp_df, on="work_id", how="left")
    else:
        df_base["compliance_risk_score"] = 0.0
        df_base["compliance_risk_level"] = "LOW"
        df_base["compliance_explanation"] = ""

    # Fill NaNs in risk scores safely
    df_base["financial_risk_score"] = df_base["financial_risk_score"].fillna(0)
    df_base["duplicate_risk_score"] = df_base["duplicate_risk_score"].fillna(0)
    df_base["compliance_risk_score"] = df_base["compliance_risk_score"].fillna(0)

    if "material_cost_context_score" not in df_base:
        df_base["material_cost_context_score"] = 0.0
    df_base["material_cost_context_score"] = df_base["material_cost_context_score"].fillna(0)

    # 4. Composite review-priority calculation. Weights sum to 1.00.
    # These are configurable review-priority weights, not claims of statistical validation.
    # Compliance is elevated because date, progress, financial-consistency,
    # and required-field violations are direct administrative controls.
    w_fin, w_dup, w_comp, w_material = 0.35, 0.23, 0.40, 0.02
    
    df_base["composite_risk_score"] = (
        (w_fin * df_base["financial_risk_score"]) +
        (w_dup * df_base["duplicate_risk_score"]) +
        (w_comp * df_base["compliance_risk_score"]) +
        (w_material * df_base["material_cost_context_score"])
    ).round(1)

    def assign_overall_level(score):
        if score >= 85:
            return "CRITICAL"
        elif score >= 65:
            return "HIGH"
        elif score >= 35:
            return "MEDIUM"
        return "LOW"

    df_base["overall_risk_level"] = df_base["composite_risk_score"].apply(assign_overall_level)
    df_base["requires_audit_action"] = df_base["composite_risk_score"] >= 35

    # 5. Vectorized Audit Explanation & Recommended Action Generator
    print("Generating explainable audit summaries & recommended reviewer actions...")
    
    f_exp = df_base["financial_explanation"].fillna("").astype(str) if "financial_explanation" in df_base.columns else pd.Series([""]*len(df_base))
    c_exp = df_base["compliance_explanation"].fillna("").astype(str) if "compliance_explanation" in df_base.columns else pd.Series([""]*len(df_base))
    
    f_high = df_base["financial_risk_score"] >= 65
    d_high = df_base["duplicate_risk_score"] >= 85
    c_high = df_base["compliance_risk_score"] >= 35

    f_driver = np.where(f_high, "Financial reason:\n" + f_exp, "")
    d_driver = np.where(d_high, "Duplicate reason: This work description is very similar to another work.", "")
    c_driver = np.where(c_high, "Compliance reason:\n" + c_exp, "")

    f_act = np.where(f_high, "Check the cost against similar works and the expected range.", "")
    d_act = np.where(d_high, "Compare the two works to make sure they are not the same work.", "")
    c_act = np.where(c_high, "Check the dates, progress, required details, and money records.", "")

    def join_text(t1, t2, t3, fallback):
        parts = []
        for text in [t1, t2, t3]:
            if text:
                parts.extend(line.strip() for line in str(text).replace(" | ", "\n").splitlines() if line.strip())
        if not parts:
            return fallback
        cleaned = [part.split(". ", 1)[1] if ". " in part[:4] else part for part in parts]
        return "\n".join(f"{index}. {part}" for index, part in enumerate(cleaned, start=1))

    df_base["explainable_audit_summary"] = np.vectorize(join_text)(
        f_driver, d_driver, c_driver, "No major financial, duplicate, or compliance issue was found."
    )
    
    df_base["recommended_reviewer_action"] = np.vectorize(join_text)(
        f_act, d_act, c_act, "Continue normal monitoring."
    )

    out_file = os.path.join(features_dir, "master_project_risk_scores.parquet")
    df_base.to_parquet(out_file, index=False)
    
    print("\n=== PHASE 3 COMPOSITE RISK ENGINE SUMMARY ===")
    print(f"Total Projects Processed: {len(df_base):,}")
    print("Overall Composite Risk Level Breakdown:")
    print(df_base["overall_risk_level"].value_counts().to_string())
    print(f"\nProjects Requiring Review (Risk Score >= 35): {df_base['requires_audit_action'].sum():,}")
    print(f"High Risk Projects (Risk Score >= 65): {(df_base['composite_risk_score'] >= 65).sum():,}")
    print(f"Critical Action Items (Risk Score >= 85): {(df_base['overall_risk_level'] == 'CRITICAL').sum():,}")
    print(f"Master Risk Database saved to: {out_file}")

if __name__ == "__main__":
    run_composite_risk_engine()
