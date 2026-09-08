import os
import pandas as pd
import numpy as np

def run_composite_risk_engine():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    
    master_path = os.path.join(features_dir, "master_analytical.parquet")
    fin_path = os.path.join(features_dir, "financial_anomalies.parquet")
    ven_path = os.path.join(features_dir, "vendor_risk_analysis.parquet")
    dup_path = os.path.join(features_dir, "work_duplicate_scores.parquet")
    comp_path = os.path.join(features_dir, "compliance_risk_analysis.parquet")
    
    print("=== EXECUTING PHASE 3: COMPOSITE RISK INTELLIGENCE & ALERT ENGINE ===")
    
    # Load base master
    df_base = pd.read_parquet(master_path)
    print(f"Loaded master project base: {len(df_base):,} works")
    
    # 1. Merge Financial Risk
    if os.path.exists(fin_path):
        fin_df = pd.read_parquet(fin_path)[["work_id", "financial_risk_score", "financial_risk_level", "financial_explanation"]].drop_duplicates("work_id")
        df_base = pd.merge(df_base, fin_df, on="work_id", how="left")
    else:
        df_base["financial_risk_score"] = 0.0
        df_base["financial_risk_level"] = "LOW"
        df_base["financial_explanation"] = ""

    # 2. Merge Vendor Risk
    if os.path.exists(ven_path):
        ven_df = pd.read_parquet(ven_path)[["work_id", "vendor_risk_score", "vendor_risk_level", "vendor_risk_explanation"]].drop_duplicates("work_id")
        df_base = pd.merge(df_base, ven_df, on="work_id", how="left")
    else:
        df_base["vendor_risk_score"] = 0.0
        df_base["vendor_risk_level"] = "LOW"
        df_base["vendor_risk_explanation"] = ""

    # 3. Merge Duplicate Risk
    if os.path.exists(dup_path):
        dup_df = pd.read_parquet(dup_path)[["work_id", "duplicate_risk_score"]].drop_duplicates("work_id")
        df_base = pd.merge(df_base, dup_df, on="work_id", how="left")
    else:
        df_base["duplicate_risk_score"] = 0.0

    # 4. Merge Compliance Risk
    if os.path.exists(comp_path):
        comp_df = pd.read_parquet(comp_path)[["work_id", "compliance_risk_score", "compliance_risk_level", "compliance_explanation"]].drop_duplicates("work_id")
        df_base = pd.merge(df_base, comp_df, on="work_id", how="left")
    else:
        df_base["compliance_risk_score"] = 0.0
        df_base["compliance_risk_level"] = "LOW"
        df_base["compliance_explanation"] = ""

    # Fill NaNs in risk scores safely
    df_base["financial_risk_score"] = df_base["financial_risk_score"].fillna(0)
    df_base["vendor_risk_score"] = df_base["vendor_risk_score"].fillna(0)
    df_base["duplicate_risk_score"] = df_base["duplicate_risk_score"].fillna(0)
    df_base["compliance_risk_score"] = df_base["compliance_risk_score"].fillna(0)

    # 5. Composite Risk Calculation
    # Weights: Financial=0.35, Vendor=0.25, Duplicate=0.25, Compliance=0.15
    w_fin, w_ven, w_dup, w_comp = 0.35, 0.25, 0.25, 0.15
    
    df_base["composite_risk_score"] = (
        (w_fin * df_base["financial_risk_score"]) +
        (w_ven * df_base["vendor_risk_score"]) +
        (w_dup * df_base["duplicate_risk_score"]) +
        (w_comp * df_base["compliance_risk_score"])
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

    # 6. Vectorized Audit Explanation & Recommended Action Generator
    print("Generating explainable audit summaries & recommended reviewer actions...")
    
    f_exp = df_base["financial_explanation"].fillna("").astype(str) if "financial_explanation" in df_base.columns else pd.Series([""]*len(df_base))
    v_exp = df_base["vendor_risk_explanation"].fillna("").astype(str) if "vendor_risk_explanation" in df_base.columns else pd.Series([""]*len(df_base))
    c_exp = df_base["compliance_explanation"].fillna("").astype(str) if "compliance_explanation" in df_base.columns else pd.Series([""]*len(df_base))
    
    f_high = df_base["financial_risk_score"] >= 65
    v_high = df_base["vendor_risk_score"] >= 65
    d_high = df_base["duplicate_risk_score"] >= 85
    c_high = df_base["compliance_risk_score"] >= 35

    f_driver = np.where(f_high, "Financial Anomaly: " + f_exp, "")
    v_driver = np.where(v_high, "Vendor Risk: " + v_exp, "")
    d_driver = np.where(d_high, "Potential Duplicate: " + df_base["duplicate_risk_score"].round(1).astype(str) + "% text match", "")
    c_driver = np.where(c_high, "Compliance Gap: " + c_exp, "")

    f_act = np.where(f_high, "Verify sanction budget against peer category baseline", "")
    v_act = np.where(v_high, "Audit vendor allocation share and payment disbursal log", "")
    d_act = np.where(d_high, "Review candidate duplicate project to rule out double-funding", "")
    c_act = np.where(c_high, "Request physical site evidence photo & missing compliance metadata", "")

    def join_text(t1, t2, t3, t4, fallback):
        parts = [p for p in [t1, t2, t3, t4] if p != ""]
        if not parts:
            return fallback
        return " | ".join(parts)

    df_base["explainable_audit_summary"] = np.vectorize(join_text)(
        f_driver, v_driver, d_driver, c_driver, "All financial, vendor, duplicate, and compliance parameters within standard operational limits."
    )
    
    df_base["recommended_reviewer_action"] = np.vectorize(join_text)(
        f_act, v_act, d_act, c_act, "Standard periodic monitoring."
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
