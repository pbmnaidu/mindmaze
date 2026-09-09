import os
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def run_financial_anomaly_detection():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    master_path = os.path.join(features_dir, "master_analytical.parquet")
    
    if not os.path.exists(master_path):
        raise FileNotFoundError(f"Master analytical dataset not found at {master_path}")
        
    print("=== EXECUTING MODULE 2: FINANCIAL & EXPENDITURE ANOMALY DETECTION ===")
    df = pd.read_parquet(master_path)
    print(f"Loaded master dataset: {len(df):,} records")

    # 1. Fill missing financial values safely
    df["sanction_amount_clean"] = df["sanction_amount"].fillna(0)
    df["effective_expenditure_clean"] = df["effective_expenditure"].fillna(0)
    df["payment_count_clean"] = df["payment_count"].fillna(0)
    df["expenditure_to_sanction_ratio"] = np.where(
        df["sanction_amount_clean"] > 0,
        df["effective_expenditure_clean"] / df["sanction_amount_clean"],
        0.0,
    )

    # 2. Peer Group Baseline Calculation using description-corrected category.
    peer_category = "effective_work_category" if "effective_work_category" in df.columns else "work_category"
    print("Computing peer-group statistical baselines (Median & IQR)...")
    
    # Calculate group medians and IQRs
    group_stats = df.groupby([peer_category, "state"])["sanction_amount_clean"].agg(
        peer_median="median",
        q1=lambda x: np.percentile(x, 25),
        q3=lambda x: np.percentile(x, 75)
    ).reset_index()
    group_stats["iqr"] = group_stats["q3"] - group_stats["q1"]
    group_stats["upper_bound"] = group_stats["q3"] + 1.5 * group_stats["iqr"]
    
    df = pd.merge(df, group_stats, on=[peer_category, "state"], how="left")
    df["peer_group_level"] = "CATEGORY_STATE"
    df["peer_group_size"] = df.groupby([peer_category, "state"])["work_id"].transform("size")
    df["peer_group_label"] = df[peer_category].astype(str) + " | " + df["state"].astype(str)
    df["peer_group_category"] = df[peer_category]
    df["peer_group_state"] = df["state"]
    df["peer_group_quality"] = np.where(df["peer_group_size"] >= 30, "HIGH", np.where(df["peer_group_size"] >= 10, "MEDIUM", "LOW"))
    if "reference_expected_cost_inr" in df.columns:
        df["constituency_historic_avg_cost"] = df.groupby([peer_category, "state", "constituency"])["sanction_amount_clean"].transform("mean")
        reference_basis = df["reference_total_cost_inr"].where(df.get("reference_total_cost_inr", pd.Series(np.nan, index=df.index)).notna(), df["reference_expected_cost_inr"])
        df["reference_cost_basis_inr"] = reference_basis
        df["reference_cost_deviation_ratio"] = df["sanction_amount_clean"] / (reference_basis + 1)
        df["historic_cost_deviation_ratio"] = df["sanction_amount_clean"] / (df["constituency_historic_avg_cost"] + 1)
        df["reference_range_valid"] = df["reference_total_cost_max_inr"].notna() & df["quantity_detected"].notna()
        df["reference_range_exceeded"] = df["reference_range_valid"] & (df["sanction_amount_clean"] > df["reference_total_cost_max_inr"])
    
    # Calculate Statistical Ratios & Percentiles
    df["amount_to_peer_ratio"] = df["sanction_amount_clean"] / (df["peer_median"] + 1)
    df["category_percentile"] = df.groupby([peer_category, "state"])["sanction_amount_clean"].rank(pct=True) * 100
    df["peer_percentile"] = df["category_percentile"]
    df["peer_group_median"] = df["peer_median"]
    df["peer_group_q1"] = df["q1"]
    df["peer_group_q3"] = df["q3"]
    df["peer_group_iqr"] = df["iqr"]
    df["peer_group_upper_bound"] = df["upper_bound"]

    # 3. Statistical Anomaly Score (0 to 100)
    def calc_stat_score(row):
        score = 0
        ratio = row["amount_to_peer_ratio"]
        percentile = row["category_percentile"]
        bound = row["upper_bound"]
        amount = row["sanction_amount_clean"]
        
        # Outlier severity based on peer ratio
        if ratio > 3.0:
            score += 50
        elif ratio > 2.0:
            score += 35
        elif ratio > 1.5:
            score += 20
            
        # Percentile ranking score
        if percentile >= 98:
            score += 35
        elif percentile >= 95:
            score += 25
        elif percentile >= 90:
            score += 15
            
        # IQR Upper bound check
        if bound > 0 and amount > bound:
            score += 15
        reference_ratio = row.get("reference_cost_deviation_ratio", np.nan)
        if pd.notna(reference_ratio):
            if reference_ratio > 3:
                score += 20
            elif reference_ratio > 2:
                score += 10
            
        return min(score, 100)

    df["stat_financial_score"] = df.apply(calc_stat_score, axis=1)

    # 4. Unsupervised ML Anomaly Detection (Isolation Forest)
    print("Training Isolation Forest on multi-variate financial features...")
    feature_cols = [
        "sanction_amount_clean",
        "effective_expenditure_clean",
        "amount_to_peer_ratio",
        "payment_count_clean",
        "expenditure_to_sanction_ratio"
    ]
    
    X = df[feature_cols].fillna(0)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42
    )
    iso_forest.fit(X_scaled)
    
    # Raw decision function scores (lower = more anomalous)
    raw_ml_scores = iso_forest.decision_function(X_scaled)
    
    # Scale ML score to 0-100 where higher = more anomalous
    min_s, max_s = raw_ml_scores.min(), raw_ml_scores.max()
    df["ml_financial_score"] = (1.0 - (raw_ml_scores - min_s) / (max_s - min_s + 1e-5)) * 100

    # 5. Composite Financial Risk Score & Risk Levels
    material_score = df.get("material_cost_context_score", pd.Series(0.0, index=df.index)).fillna(0)
    df["financial_anomaly_score"] = (0.6 * df["stat_financial_score"] + 0.4 * df["ml_financial_score"]).round(1)
    df["financial_risk_score"] = (0.55 * df["stat_financial_score"] + 0.35 * df["ml_financial_score"] + 0.10 * material_score).round(1)
    # When a quantity-backed sector range exists, it is the primary financial
    # test. A cost inside the supplied range is not a financial anomaly merely
    # because a broad peer median is lower.
    within_reference = df["reference_range_valid"] & ~df["reference_range_exceeded"]
    df.loc[within_reference, "stat_financial_score"] = 0.0
    df.loc[within_reference, "financial_anomaly_score"] = 0.0
    df.loc[within_reference, "financial_risk_score"] = 0.0
    
    def assign_risk_level(score):
        if score >= 85:
            return "CRITICAL"
        elif score >= 65:
            return "HIGH"
        elif score >= 35:
            return "MEDIUM"
        return "LOW"

    df["financial_risk_level"] = df["financial_risk_score"].apply(assign_risk_level)
    df["is_financial_outlier"] = df["financial_risk_score"] >= 65

    # 6. Natural Language Explainability Generator
    def generate_explanation(row):
        reasons = []
        amount = row["sanction_amount_clean"]
        ratio = row["amount_to_peer_ratio"]
        pct = row["category_percentile"]
        cat = row[peer_category]
        state = row["state"]
        
        reference_valid = bool(row.get("reference_range_valid", False))
        reference_exceeded = bool(row.get("reference_range_exceeded", False))
        if reference_valid and not reference_exceeded:
            return f"Cost is within the expected range: ₹{row['reference_total_cost_min_inr']:,.0f} to ₹{row['reference_total_cost_max_inr']:,.0f}."
        if ratio > 1.5 and not reference_valid:
            reasons.append(f"Cost is {ratio:.1f} times higher than similar works in {state}.")
        if reference_exceeded:
            reasons.append(f"Cost is above the expected range of ₹{row['reference_total_cost_min_inr']:,.0f} to ₹{row['reference_total_cost_max_inr']:,.0f}.")
        elif not reference_valid and pd.notna(row.get("reference_cost_deviation_ratio")) and row.get("reference_cost_deviation_ratio", 0) > 2:
            reasons.append(f"Cost is {row['reference_cost_deviation_ratio']:.1f} times higher than the reference cost.")
        if pd.notna(row.get("quantity_detected")) and pd.notna(row.get("reference_total_cost_inr")):
            reasons.append(f"The description lists {row['quantity_detected']:.0f} units; expected total is ₹{row['reference_total_cost_inr']:,.0f}.")
            if pd.notna(row.get("reference_total_cost_min_inr")) and row.get("reference_total_cost_min_inr") != row.get("reference_total_cost_max_inr"):
                reasons.append(f"Expected range is ₹{row['reference_total_cost_min_inr']:,.0f} to ₹{row['reference_total_cost_max_inr']:,.0f}.")
        if pct >= 95:
            reasons.append(f"Cost is higher than {pct:.1f}% of similar works.")
        if not reasons:
            return "Cost is within the normal range for similar works."
        return "\n".join(f"{index}. {reason}" for index, reason in enumerate(reasons, start=1))

    df["financial_explanation"] = df.apply(generate_explanation, axis=1)
    def reasons(row):
        result = []
        if row.get("category_source") not in (None, "UNCLASSIFIED"):
            result.append({"type": "CLASSIFICATION", "severity": "INFO", "message": f"Description-based classification: {row.get(peer_category)}", "confidence": float(row.get("category_confidence", 0))})
        if row.get("amount_to_peer_ratio", 0) > 1.5:
            result.append({"type": "PEER_DEVIATION", "severity": "HIGH", "metric": "amount_to_peer_median", "value": float(row["amount_to_peer_ratio"]), "peer_count": int(row.get("peer_group_size", 0)), "message": f"Sanction amount is {row['amount_to_peer_ratio']:.1f}x the comparable peer median."})
        if row.get("ml_financial_score", 0) >= 65:
            result.append({"type": "STATISTICAL_ANOMALY", "severity": "MEDIUM", "metric": "isolation_forest", "value": float(row["ml_financial_score"]), "message": "Isolation Forest identifies an unusual financial pattern."})
        return result
    df["risk_reasons"] = df.apply(reasons, axis=1)

    # Save output
    out_file = os.path.join(features_dir, "financial_anomalies.parquet")
    df.to_parquet(out_file, index=False)
    
    print("\n=== MODULE 2 EXECUTION SUMMARY ===")
    print(f"Total Works Evaluated: {len(df):,}")
    print("Risk Level Breakdown:")
    print(df["financial_risk_level"].value_counts().to_string())
    print(f"\nFlagged Financial Outliers (Score >= 65): {df['is_financial_outlier'].sum():,}")
    print(f"Results saved to: {out_file}")

if __name__ == "__main__":
    run_financial_anomaly_detection()
