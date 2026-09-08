import os
import pandas as pd
import numpy as np

def run_vendor_risk_analysis():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    processed_dir = os.environ.get("PROCESSED_DIR", os.path.join(base_dir, "data", "processed"))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    
    t6_path = os.path.join(processed_dir, "t6_expenditure.parquet")
    master_path = os.path.join(features_dir, "master_analytical.parquet")
    
    if not os.path.exists(t6_path) or not os.path.exists(master_path):
        raise FileNotFoundError("Required processed datasets (T6 or master_analytical) missing.")
        
    print("=== EXECUTING MODULE 3: VENDOR & PAYMENT RISK ENGINE ===")
    t6 = pd.read_parquet(t6_path)
    master = pd.read_parquet(master_path)
    
    print(f"Loaded T6 transactions: {len(t6):,} records across {t6['work_id'].nunique():,} unique works.")

    # 1. Vendor Concentration Analysis per Constituency
    # Filter out empty/unnamed vendors
    valid_v = t6[~t6["vendor_name"].isin(["", "NAN", "NONE", "UNKNOWN", "NOT AVAILABLE"])].copy()
    
    # Total expenditure per constituency
    const_total = valid_v.groupby("constituency")["expenditure_amount"].sum().reset_index().rename(
        columns={"expenditure_amount": "constituency_total_expenditure"}
    )
    
    # Vendor expenditure per constituency
    vendor_const = valid_v.groupby(["constituency", "vendor_name"]).agg(
        vendor_const_expenditure=("expenditure_amount", "sum"),
        vendor_work_count=("work_id", "nunique"),
        vendor_transaction_count=("expenditure_amount", "count")
    ).reset_index()
    
    vendor_const = pd.merge(vendor_const, const_total, on="constituency", how="left")
    vendor_const["vendor_constituency_share"] = vendor_const["vendor_const_expenditure"] / (vendor_const["constituency_total_expenditure"] + 1e-5)
    
    # Calculate Herfindahl-Hirschman Index (HHI) per constituency
    vendor_const["share_sq"] = (vendor_const["vendor_constituency_share"] * 100) ** 2
    hhi_df = vendor_const.groupby("constituency")["share_sq"].sum().reset_index().rename(
        columns={"share_sq": "constituency_hhi"}
    )
    vendor_const = pd.merge(vendor_const, hhi_df, on="constituency", how="left")

    # 2. Payment Burst / Rapid Disbursal Analysis per Work
    print("Analyzing payment transaction frequency & rapid disbursal bursts...")
    
    t6_sorted = t6.dropna(subset=["work_id", "expenditure_date"]).sort_values(["work_id", "expenditure_date"])
    t6_sorted["prev_date"] = t6_sorted.groupby("work_id")["expenditure_date"].shift(1)
    t6_sorted["days_since_prev"] = (t6_sorted["expenditure_date"] - t6_sorted["prev_date"]).dt.days
    
    burst_df = t6_sorted.groupby("work_id").agg(
        min_payment_gap_days=("days_since_prev", "min"),
        total_payment_count=("expenditure_date", "count")
    ).reset_index()
    
    burst_df["rapid_disbursal_burst_flag"] = (burst_df["min_payment_gap_days"].notnull()) & (burst_df["min_payment_gap_days"] <= 7)

    # 3. Merge Vendor & Disbursal Risk Metrics into Master Works Base
    print("Merging metrics into Master Works base...")
    
    # Attach top vendor details from master
    work_vendor_metrics = pd.merge(
        master[["work_id", "constituency", "top_vendor", "top_vendor_share", "total_expenditure"]],
        vendor_const[["constituency", "vendor_name", "vendor_constituency_share", "vendor_work_count", "constituency_hhi"]],
        left_on=["constituency", "top_vendor"],
        right_on=["constituency", "vendor_name"],
        how="left"
    )
    
    work_vendor_metrics = pd.merge(work_vendor_metrics, burst_df, on="work_id", how="left")

    # 4. Compute Vendor Risk Scores (0 to 100)
    def calc_vendor_score(row):
        conc_score = 0
        burst_score = 0
        
        share = row["vendor_constituency_share"] if pd.notnull(row["vendor_constituency_share"]) else 0
        hhi = row["constituency_hhi"] if pd.notnull(row["constituency_hhi"]) else 0
        works = row["vendor_work_count"] if pd.notnull(row["vendor_work_count"]) else 0
        top_share = row["top_vendor_share"] if pd.notnull(row["top_vendor_share"]) else 0
        
        # Vendor Concentration Scoring
        if share >= 0.40:
            conc_score += 50
        elif share >= 0.25:
            conc_score += 35
        elif share >= 0.15:
            conc_score += 20
            
        if hhi >= 4000:
            conc_score += 30
        elif hhi >= 2500:
            conc_score += 15
            
        if works >= 5:
            conc_score += 20
        elif works >= 3:
            conc_score += 10

        # Rapid Disbursal / Burst Scoring
        if row["rapid_disbursal_burst_flag"]:
            burst_score += 50
            
        if top_share >= 0.85 and row["total_payment_count"] > 1:
            burst_score += 35

        total_score = (0.6 * conc_score) + (0.4 * burst_score)
        return min(round(total_score, 1), 100)

    work_vendor_metrics["vendor_risk_score"] = work_vendor_metrics.apply(calc_vendor_score, axis=1)

    def assign_vendor_risk_level(score):
        if score >= 85:
            return "CRITICAL"
        elif score >= 65:
            return "HIGH"
        elif score >= 35:
            return "MEDIUM"
        return "LOW"

    work_vendor_metrics["vendor_risk_level"] = work_vendor_metrics["vendor_risk_score"].apply(assign_vendor_risk_level)
    work_vendor_metrics["is_vendor_risk_flagged"] = work_vendor_metrics["vendor_risk_score"] >= 65

    # 5. Explainability Generator
    def generate_vendor_explanation(row):
        reasons = []
        vendor = row["top_vendor"]
        share = row["vendor_constituency_share"]
        works = row["vendor_work_count"]
        const = row["constituency"]
        burst = row["rapid_disbursal_burst_flag"]
        gap = row["min_payment_gap_days"]
        
        if pd.notnull(share) and share >= 0.25:
            reasons.append(f"Vendor '{vendor}' controls {share*100:.1f}% of total expenditure in {const} across {works:.0f} works")
        if burst:
            reasons.append(f"Rapid disbursal pattern detected (consecutive payments within {gap:.0f} days)")
            
        if not reasons:
            return "Vendor transaction patterns within standard baseline limits."
        return " | ".join(reasons)

    work_vendor_metrics["vendor_risk_explanation"] = work_vendor_metrics.apply(generate_vendor_explanation, axis=1)

    # Save output
    out_file = os.path.join(features_dir, "vendor_risk_analysis.parquet")
    work_vendor_metrics.to_parquet(out_file, index=False)
    
    print("\n=== MODULE 3 EXECUTION SUMMARY ===")
    print(f"Total Works Evaluated: {len(work_vendor_metrics):,}")
    print("Vendor Risk Level Breakdown:")
    print(work_vendor_metrics["vendor_risk_level"].value_counts().to_string())
    print(f"\nFlagged High Vendor Risk Cases (Score >= 65): {work_vendor_metrics['is_vendor_risk_flagged'].sum():,}")
    print(f"Results saved to: {out_file}")

if __name__ == "__main__":
    run_vendor_risk_analysis()
