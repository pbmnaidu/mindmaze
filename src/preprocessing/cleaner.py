import os
import re
import glob
import pandas as pd
import numpy as np

def extract_work_id(text, default_prefix="WS/UNID", row_idx=0):
    if pd.notnull(text):
        # Matches patterns like WS/MP418/2024-2025/133409 or WS/RS123/2025-2026/98765
        match = re.search(r"(WS/[A-Za-z0-9\-_]+/\d{4}-\d{4}/\d+)", str(text))
        if not match:
            match = re.search(r"(WS/[A-Za-z0-9\-_]+/\d+)", str(text))
        if match:
            return match.group(1).strip()
    return f"{default_prefix}/{row_idx+1:06d}"

def clean_currency(val):
    if pd.isna(val):
        return np.nan
    s = str(val).replace("₹", "").replace(",", "").strip()
    try:
        return float(s)
    except ValueError:
        return np.nan

def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).strip()

def preprocess_all():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_dir = os.environ.get("RAW_DIR", os.path.join(base_dir, "data", "raw"))
    processed_dir = os.environ.get("PROCESSED_DIR", os.path.join(base_dir, "data", "processed"))
    os.makedirs(processed_dir, exist_ok=True)
    
    print("=== STARTING DATA CLEANING & NORMALIZATION PIPELINE ===")

    # 1. Clean T1 - Allocated Limit
    f_t1 = os.path.join(raw_dir, "Allocated Limit for Honble MPs.csv")
    if os.path.exists(f_t1):
        df1 = pd.read_csv(f_t1)
        df1.columns = [c.strip() for c in df1.columns]
        df1 = df1[df1["Sr. No."].astype(str).str.replace(".","").str.isdigit()].copy()
        df1["allocated_amount"] = df1["Allocated AMOUNT ( ₹ )"].apply(clean_currency)
        df1["state"] = df1["State"].apply(clean_text).str.upper()
        df1["constituency"] = df1["Constituency"].apply(clean_text).str.upper()
        df1["mp_name"] = df1["Hon'ble Members of Parliaments"].apply(clean_text).str.upper()
        out1 = os.path.join(processed_dir, "t1_allocated_limits.parquet")
        df1.to_parquet(out1, index=False)
        print(f"[T1] Cleaned {len(df1):,} records -> {out1}")

    # 2. Clean T3 - Works Recommended
    f_t3 = os.path.join(raw_dir, "Works Recommended.csv")
    if os.path.exists(f_t3):
        df3 = pd.read_csv(f_t3, low_memory=False)
        df3.columns = [c.strip() for c in df3.columns]
        df3["work_id"] = [extract_work_id(val, "WS/REC", idx) for idx, val in enumerate(df3["WORK"])]
        df3["work_category"] = df3["Work category"].apply(clean_text) if "Work category" in df3.columns else ""
        df3["recommended_amount"] = df3["RECOMMENDED AMOUNT   ( ₹ )"].apply(clean_currency)
        df3["recommended_date"] = pd.to_datetime(df3["Recommended date"], errors='coerce')
        df3["sanction_date"] = pd.to_datetime(df3["Sanction Date"], errors='coerce')
        df3["state"] = df3["State"].apply(clean_text).str.upper()
        df3["constituency"] = df3["Constituency"].apply(clean_text).str.upper()
        df3["mp_name"] = df3["Hon'ble Members of Parliament"].apply(clean_text).str.upper()
        df3["description"] = df3["Work description"].apply(clean_text)
        out3 = os.path.join(processed_dir, "t3_works_recommended.parquet")
        df3.to_parquet(out3, index=False)
        print(f"[T3] Cleaned {len(df3):,} records -> {out3}")

    # 3. Clean T4 - Works Sanctioned
    f_t4 = os.path.join(raw_dir, "Works Sanctioned.csv")
    if os.path.exists(f_t4):
        df4 = pd.read_csv(f_t4, low_memory=False)
        df4.columns = [c.strip() for c in df4.columns]
        df4["work_id"] = [extract_work_id(val, "WS/SANC", idx) for idx, val in enumerate(df4["Work"])]
        df4["work_category"] = df4["Work category"].apply(clean_text) if "Work category" in df4.columns else ""
        df4["sanction_amount"] = df4["Sanction Amount ( ₹ )"].apply(clean_currency)
        df4["recommended_date"] = pd.to_datetime(df4["Recommended date"], errors='coerce')
        df4["sanction_date"] = pd.to_datetime(df4["Sanction Date"], errors='coerce')
        df4["state"] = df4["State"].apply(clean_text).str.upper()
        df4["constituency"] = df4["Constituency"].apply(clean_text).str.upper()
        df4["mp_name"] = df4["Hon'ble Members of Parliament"].apply(clean_text).str.upper()
        df4["description"] = df4["Work description"].apply(clean_text)
        df4["work_status"] = df4["Work Status"].apply(clean_text)
        out4 = os.path.join(processed_dir, "t4_works_sanctioned.parquet")
        df4.to_parquet(out4, index=False)
        print(f"[T4] Cleaned {len(df4):,} records -> {out4}")

    # 4. Clean T5 - Works Completed
    f_t5 = os.path.join(raw_dir, "Works Completed.csv")
    if os.path.exists(f_t5):
        df5 = pd.read_csv(f_t5, low_memory=False)
        df5.columns = [c.strip() for c in df5.columns]
        df5["work_id"] = [extract_work_id(val, "WS/COMP", idx) for idx, val in enumerate(df5["Work"])]
        df5["work_category"] = df5["Work Category"].apply(clean_text) if "Work Category" in df5.columns else ""
        df5["completed_disbursed_amount"] = df5["Amount Disbursed ( ₹ )"].apply(clean_currency)
        df5["completion_date"] = pd.to_datetime(df5["Completion Date"], errors='coerce')
        df5["state"] = df5["State"].apply(clean_text).str.upper()
        df5["constituency"] = df5["Constituency"].apply(clean_text).str.upper()
        df5["mp_name"] = df5["Hon'ble Members of Parliament"].apply(clean_text).str.upper()
        df5["description"] = df5["Work Description"].apply(clean_text)
        df5["has_image"] = df5["Image"].apply(lambda x: True if str(x).strip().lower() not in ['', 'nan', '\xa0'] else False)
        out5 = os.path.join(processed_dir, "t5_works_completed.parquet")
        df5.to_parquet(out5, index=False)
        print(f"[T5] Cleaned {len(df5):,} records -> {out5}")

    # 5. Clean T6 - Expenditure Records
    f_t6 = glob.glob(os.path.join(raw_dir, "Expenditure*.csv"))
    if f_t6:
        df6 = pd.read_csv(f_t6[0], low_memory=False)
        df6.columns = [c.strip() for c in df6.columns]
        df6["work_id"] = [extract_work_id(val, "WS/EXP", idx) for idx, val in enumerate(df6["Work ID"])]
        df6["expenditure_amount"] = df6["Fund Disbursed Amount ( ₹ )"].apply(clean_currency)
        df6["expenditure_date"] = pd.to_datetime(df6["Expenditure Date"], errors='coerce')
        df6["state"] = df6["State"].apply(clean_text).str.upper()
        df6["constituency"] = df6["Constituency"].apply(clean_text).str.upper()
        df6["mp_name"] = df6["Hon'ble Members of Parliament"].apply(clean_text).str.upper()
        df6["vendor_name"] = df6["Vendor Name"].apply(clean_text).str.upper()
        df6["payment_status"] = df6["Payment Status"].apply(clean_text)
        out6 = os.path.join(processed_dir, "t6_expenditure.parquet")
        df6.to_parquet(out6, index=False)
        print(f"[T6] Cleaned {len(df6):,} records -> {out6}")

    print("=== PREPROCESSING COMPLETE ===")

if __name__ == "__main__":
    preprocess_all()
