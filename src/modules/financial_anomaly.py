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
    df["single_payment_ratio_clean"] = df["top_vendor_share"].fillna(0)
    df["payment_count_clean"] = df["payment_count"].fillna(0)

    # 2. Peer Group Baseline Calculation (by work_category & state)
    print("Computing peer-group statistical baselines (Median & IQR)...")
    
    # Calculate group medians and IQRs
    group_stats = df.groupby(["work_category", "state"])["sanction_amount_clean"].agg(
        peer_median="median",
        q1=lambda x: np.percentile(x, 25),
        q3=lambda x: np.percentile(x, 75)
    ).reset_index()
    group_stats["iqr"] = group_stats["q3"] - group_stats["q1"]
    group_stats["upper_bound"] = group_stats["q3"] + 1.5 * group_stats["iqr"]
    
    df = pd.merge(df, group_stats, on=["work_category", "state"], how="left")
    
    # Calculate Statistical Ratios & Percentiles
    df["amount_to_peer_ratio"] = df["sanction_amount_clean"] / (df["peer_median"] + 1)
    df["category_percentile"] = df.groupby("work_category")["sanction_amount_clean"].rank(pct=True) * 100

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
            
        return min(score, 100)

    df["stat_financial_score"] = df.apply(calc_stat_score, axis=1)

    # 4. Unsupervised ML Anomaly Detection (Isolation Forest)
    print("Training Isolation Forest on multi-variate financial features...")
    feature_cols = [
        "sanction_amount_clean",
        "effective_expenditure_clean",
        "amount_to_peer_ratio",
        "single_payment_ratio_clean",
        "payment_count_clean"
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
    df["financial_risk_score"] = (0.6 * df["stat_financial_score"] + 0.4 * df["ml_financial_score"]).round(1)
    
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
        cat = row["work_category"]
        state = row["state"]
        share = row["single_payment_ratio_clean"]
        
        if ratio > 1.5:
            reasons.append(f"Sanctioned budget (₹{amount:,.0f}) is {ratio:.1f}x higher than peer median for '{cat}' in {state}")
        if pct >= 95:
            reasons.append(f"Expenditure is in the top {100-pct:.1f}% percentile for category")
        if share > 0.8 and row["payment_count_clean"] > 1:
            reasons.append(f"Single vendor payment captures {share*100:.1f}% of total project disbursals")
            
        if not reasons:
            return "Financial parameters within normal baseline range."
        return " | ".join(reasons)

    df["financial_explanation"] = df.apply(generate_explanation, axis=1)

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
