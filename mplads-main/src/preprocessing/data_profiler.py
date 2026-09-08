import os
import sys
import glob
import pandas as pd
import json

# Ensure UTF-8 output encoding for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

def profile_csv(file_path):
    filename = os.path.basename(file_path)
    print(f"\n==========================================")
    print(f"PROFILING: {filename}")
    print(f"==========================================")
    
    try:
        # Try reading with default utf-8, fallback to latin-1 or cp1252 if needed
        try:
            df = pd.read_csv(file_path, low_memory=False)
        except Exception:
            df = pd.read_csv(file_path, encoding='latin-1', low_memory=False)
            
        # Strip whitespace from column names
        df.columns = [str(col).strip() for col in df.columns]
        
        print(f"Row Count: {len(df):,}")
        print(f"Column Count: {len(df.columns)}")
        print(f"\nColumns & Data Types:")
        col_info = {}
        for col in df.columns:
            missing_count = df[col].isnull().sum()
            missing_pct = (missing_count / len(df)) * 100 if len(df) > 0 else 0
            dtype = str(df[col].dtype)
            sample_vals = df[col].dropna().unique()[:3]
            sample_str = ", ".join([str(v) for v in sample_vals])
            print(f" - '{col}' | Type: {dtype} | Missing: {missing_count:,} ({missing_pct:.2f}%) | Samples: [{sample_str}]")
            col_info[col] = {
                "type": dtype,
                "missing_count": int(missing_count),
                "missing_pct": round(missing_pct, 2),
                "samples": [str(v) for v in sample_vals]
            }
            
        return {
            "filename": filename,
            "rows": len(df),
            "columns": list(df.columns),
            "column_details": col_info
        }
    except Exception as e:
        print(f"ERROR profiling {filename}: {str(e)}")
        return None

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_dir = os.environ.get("RAW_DIR", os.path.join(base_dir, "data", "raw"))
    csv_files = sorted(glob.glob(os.path.join(raw_dir, "*.csv")))
    
    results = []
    print(f"Found {len(csv_files)} CSV files in {raw_dir}:")
    for f in csv_files:
        print(f" - {os.path.basename(f)}")
        
    for f in csv_files:
        res = profile_csv(f)
        if res:
            results.append(res)
            
    # Save full profiling metadata as JSON
    docs_dir = os.path.join(base_dir, "docs")
    os.makedirs(docs_dir, exist_ok=True)
    out_json = os.path.join(docs_dir, "raw_data_profile.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nProfiling complete! Metadata saved to {out_json}")
