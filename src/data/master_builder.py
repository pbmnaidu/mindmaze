import os
import pandas as pd
import numpy as np

def build_master_dataset():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    processed_dir = os.environ.get("PROCESSED_DIR", os.path.join(base_dir, "data", "processed"))
    features_dir = os.environ.get("FEATURES_DIR", os.path.join(base_dir, "data", "features"))
    os.makedirs(features_dir, exist_ok=True)
    
    print("=== BUILDING MASTER ANALYTICAL DATASET ===")
    
    # Load processed dataframes
    t4 = pd.read_parquet(os.path.join(processed_dir, "t4_works_sanctioned.parquet"))
    t5 = pd.read_parquet(os.path.join(processed_dir, "t5_works_completed.parquet"))
    t6 = pd.read_parquet(os.path.join(processed_dir, "t6_expenditure.parquet"))
    
    # 1. Aggregate T6 Expenditure by work_id
    t6_work = t6.dropna(subset=["work_id"]).groupby("work_id").agg(
        total_expenditure=("expenditure_amount", "sum"),
        avg_payment=("expenditure_amount", "mean"),
        max_payment=("expenditure_amount", "max"),
        payment_count=("expenditure_amount", "count"),
        vendor_count=("vendor_name", "nunique"),
        first_payment_date=("expenditure_date", "min"),
        last_payment_date=("expenditure_date", "max")
    ).reset_index()
    
    # Top vendor per work_id
    t6_vendor_agg = t6.groupby(["work_id", "vendor_name"])["expenditure_amount"].sum().reset_index()
    idx_top = t6_vendor_agg.groupby("work_id")["expenditure_amount"].idxmax()
    top_vendors = t6_vendor_agg.loc[idx_top].rename(columns={
        "vendor_name": "top_vendor",
        "expenditure_amount": "top_vendor_expenditure"
    })
    
    t6_summary = pd.merge(t6_work, top_vendors, on="work_id", how="left")
    t6_summary["top_vendor_share"] = (t6_summary["top_vendor_expenditure"] / t6_summary["total_expenditure"]).fillna(0)
    
    # 2. Prepare T5 Completed Works summary
    t5_unique = t5.dropna(subset=["work_id"]).drop_duplicates(subset=["work_id"], keep="last")
    t5_summary = t5_unique[["work_id", "completion_date", "completed_disbursed_amount", "has_image"]].rename(columns={
        "has_image": "has_evidence_image"
    })
    
    # 3. Base dataframe is T4 Sanctioned Works
    master = pd.merge(t4, t6_summary, on="work_id", how="left")
    master = pd.merge(master, t5_summary, on="work_id", how="left")
    
    # Derive operational & baseline features
    master["effective_expenditure"] = master["total_expenditure"].fillna(master["completed_disbursed_amount"])
    
    # Calculate Cost Overrun % where sanction_amount and effective_expenditure exist
    valid_sanction = (master["sanction_amount"] > 0) & (master["effective_expenditure"] > 0)
    master["cost_overrun_pct"] = np.where(
        valid_sanction,
        ((master["effective_expenditure"] - master["sanction_amount"]) / master["sanction_amount"]) * 100,
        np.nan
    )
    
    # Calculate Project Duration / Delay (in Days)
    master["sanction_to_completion_days"] = (master["completion_date"] - master["sanction_date"]).dt.days
    
    # Work Category Baseline (Median & IQR for peer comparison)
    cat_median = master.groupby(["work_category", "state"])["sanction_amount"].transform("median")
    master["peer_category_median_amount"] = cat_median
    master["amount_to_peer_ratio"] = master["sanction_amount"] / (master["peer_category_median_amount"] + 1e-5)
    
    out_master = os.path.join(features_dir, "master_analytical.parquet")
    master.to_parquet(out_master, index=False)
    
    print(f"Master Analytical Dataset successfully created!")
    print(f" - Total Sanctioned Works Base: {len(master):,}")
    print(f" - Works with Expenditure Records (T6 link): {master['total_expenditure'].notnull().sum():,}")
    print(f" - Works Completed (T5 link): {master['completion_date'].notnull().sum():,}")
    print(f" - Saved to: {out_master}")

if __name__ == "__main__":
    build_master_dataset()
