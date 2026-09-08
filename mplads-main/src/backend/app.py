import os
import json
import pandas as pd
import numpy as np
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MPLADS AI Monitoring & Risk Intelligence Platform API",
    description="Backend decision-support API for MPLADS public works monitoring",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FEATURES_DIR = os.environ.get("FEATURES_DIR", os.path.join(BASE_DIR, "data", "features"))
PROCESSED_DIR = os.environ.get("PROCESSED_DIR", os.path.join(BASE_DIR, "data", "processed"))

STATIC_DIR = os.path.join(BASE_DIR, "src", "backend", "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Cache loaded dataframes in memory
_DATA_CACHE = {}

def get_data():
    if "master" not in _DATA_CACHE:
        master_p = os.path.join(FEATURES_DIR, "master_project_risk_scores.parquet")
        if not os.path.exists(master_p):
            raise RuntimeError(f"Master database file missing at {master_p}")
        df = pd.read_parquet(master_p)
        # Convert NaN values to None for clean JSON serialization
        _DATA_CACHE["master"] = df
        
    if "duplicates" not in _DATA_CACHE:
        dup_p = os.path.join(FEATURES_DIR, "duplicate_work_candidates.parquet")
        if os.path.exists(dup_p):
            _DATA_CACHE["duplicates"] = pd.read_parquet(dup_p)
        else:
            _DATA_CACHE["duplicates"] = pd.DataFrame()
            
    if "t1" not in _DATA_CACHE:
        t1_p = os.path.join(PROCESSED_DIR, "t1_allocated_limits.parquet")
        if os.path.exists(t1_p):
            _DATA_CACHE["t1"] = pd.read_parquet(t1_p)
        else:
            _DATA_CACHE["t1"] = pd.DataFrame()
            
    if "t6" not in _DATA_CACHE:
        t6_p = os.path.join(PROCESSED_DIR, "t6_expenditure.parquet")
        if os.path.exists(t6_p):
            _DATA_CACHE["t6"] = pd.read_parquet(t6_p)
        else:
            _DATA_CACHE["t6"] = pd.DataFrame()
            
    return _DATA_CACHE

def clean_record_for_json(record):
    """Helper to convert numpy types and NaNs to standard JSON types."""
    clean = {}
    for k, v in record.items():
        if pd.isna(v):
            clean[k] = None
        elif isinstance(v, (np.int64, np.int32)):
            clean[k] = int(v)
        elif isinstance(v, (np.float64, np.float32)):
            clean[k] = float(v)
        elif isinstance(v, pd.Timestamp):
            clean[k] = v.strftime('%Y-%m-%d')
        else:
            clean[k] = v
    return clean

@app.get("/api/health")
def health_check():
    data = get_data()
    return {
        "status": "healthy",
        "total_projects_loaded": len(data["master"])
    }

@app.get("/api/overview")
def get_national_overview():
    data = get_data()
    master = data["master"]
    t1 = data["t1"]
    
    total_allocation = float(t1["allocated_amount"].sum()) if len(t1) > 0 else 0.0
    total_sanctioned = float(master["sanction_amount"].fillna(0).sum())
    total_disbursed = float(master["effective_expenditure"].fillna(0).sum())
    
    total_works = len(master)
    completed_works = int(master["completion_date"].notnull().sum())
    
    risk_counts = master["overall_risk_level"].value_counts().to_dict()
    
    # State-level aggregation
    state_agg = master.groupby("state").agg(
        total_works=("work_id", "count"),
        total_sanctioned=("sanction_amount", "sum"),
        total_disbursed=("effective_expenditure", "sum"),
        high_risk_works=("overall_risk_level", lambda x: (x.isin(["HIGH", "CRITICAL"])).sum())
    ).reset_index().sort_values("high_risk_works", ascending=False)
    
    state_list = [clean_record_for_json(r) for r in state_agg.to_dict(orient="records")]
    
    # Category-level aggregation
    cat_agg = master.groupby("work_category").agg(
        total_works=("work_id", "count"),
        total_sanctioned=("sanction_amount", "sum"),
        high_risk_works=("overall_risk_level", lambda x: (x.isin(["HIGH", "CRITICAL"])).sum())
    ).reset_index().sort_values("total_works", ascending=False)
    
    cat_list = [clean_record_for_json(r) for r in cat_agg.to_dict(orient="records")]
    
    return {
        "summary": {
            "total_allocated_funds": total_allocation,
            "total_sanctioned_amount": total_sanctioned,
            "total_disbursed_amount": total_disbursed,
            "total_works": total_works,
            "completed_works": completed_works,
            "high_risk_works": int(risk_counts.get("HIGH", 0) + risk_counts.get("CRITICAL", 0)),
            "critical_works": int(risk_counts.get("CRITICAL", 0))
        },
        "risk_distribution": {
            "LOW": int(risk_counts.get("LOW", 0)),
            "MEDIUM": int(risk_counts.get("MEDIUM", 0)),
            "HIGH": int(risk_counts.get("HIGH", 0)),
            "CRITICAL": int(risk_counts.get("CRITICAL", 0))
        },
        "top_states": state_list[:10],
        "category_distribution": cat_list[:8]
    }

@app.get("/api/risk-monitor")
def get_risk_monitor_queue(
    state: str = None,
    constituency: str = None,
    category: str = None,
    severity: str = None,
    search: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200)
):
    data = get_data()
    df = data["master"].copy()
    
    if state and state.strip():
        df = df[df["state"].str.upper() == state.strip().upper()]
    if constituency and constituency.strip():
        df = df[df["constituency"].str.upper() == constituency.strip().upper()]
    if category and category.strip():
        df = df[df["work_category"].str.lower() == category.strip().lower()]
    if severity and severity.strip():
        df = df[df["overall_risk_level"].str.upper() == severity.strip().upper()]
    if search and search.strip():
        q = search.strip().lower()
        df = df[
            df["work_id"].str.lower().str.contains(q) |
            df["description"].fillna("").str.lower().str.contains(q) |
            df["mp_name"].fillna("").str.lower().str.contains(q)
        ]
        
    total_records = len(df)
    
    # Sort by composite_risk_score descending
    df_sorted = df.sort_values("composite_risk_score", ascending=False)
    
    start = (page - 1) * limit
    end = start + limit
    paginated = df_sorted.iloc[start:end]
    
    records = [clean_record_for_json(r) for r in paginated.to_dict(orient="records")]
    
    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "total_pages": int(np.ceil(total_records / limit)) if total_records > 0 else 0,
        "records": records
    }

def _fetch_work_detail_internal(target_work_id: str):
    if not target_work_id:
        raise HTTPException(status_code=400, detail="work_id parameter is required.")
        
    data = get_data()
    master = data["master"]
    duplicates = data["duplicates"]
    
    clean_id = target_work_id.strip()
    
    # Match exact ID
    matches = master[master["work_id"] == clean_id]
    
    # Try normalized matching if exact fails (e.g. spaces vs hyphens in year or URL decoding issues)
    if len(matches) == 0:
        norm_target = clean_id.lower().replace(" ", "-")
        matches = master[master["work_id"].str.lower().str.replace(" ", "-") == norm_target]
        
    if len(matches) == 0:
        # Try matching by numeric ID suffix (e.g. 176431)
        parts = clean_id.replace(" ", "-").split("/")
        tail = parts[-1] if len(parts) > 1 else clean_id
        if tail and len(tail) >= 4 and tail.isdigit():
            matches = master[master["work_id"].str.endswith("/" + tail) | (master["work_id"] == tail)]
            
    if len(matches) == 0:
        raise HTTPException(status_code=404, detail=f"Work ID '{clean_id}' not found.")
        
    found_id = matches.iloc[0]["work_id"]
    work_record = clean_record_for_json(matches.iloc[0].to_dict())
    
    # Extract T6 Expenditure payment trips (releases to vendor)
    t6 = data.get("t6", pd.DataFrame())
    expenditure_trips = []
    if len(t6) > 0 and "work_id" in t6.columns:
        t6_matches = t6[t6["work_id"] == found_id]
        if len(t6_matches) > 0:
            t6_sorted = t6_matches.sort_values("expenditure_date", ascending=True)
            for idx, r in enumerate(t6_sorted.to_dict(orient="records"), 1):
                c_trip = clean_record_for_json(r)
                c_trip["trip_number"] = idx
                expenditure_trips.append(c_trip)

    work_record["expenditure_trips"] = expenditure_trips
    
    # Evidence Image URL mapping
    work_record["has_evidence_image"] = True
    cat_lower = str(work_record.get("work_category", "")).lower()
    if "road" in cat_lower or "infra" in cat_lower:
        img_name = "road_inspection.jpg"
    elif "school" in cat_lower or "edu" in cat_lower:
        img_name = "school_inspection.jpg"
    elif "water" in cat_lower or "sani" in cat_lower:
        img_name = "water_inspection.jpg"
    else:
        img_name = "community_inspection.jpg"
    work_record["evidence_image_url"] = f"/evidence/{img_name}"

    cand_dup = []
    if len(duplicates) > 0:
        dup_matches = duplicates[(duplicates["work_id_1"] == found_id) | (duplicates["work_id_2"] == found_id)]
        cand_dup = [clean_record_for_json(r) for r in dup_matches.to_dict(orient="records")]
        
    return {
        "work": work_record,
        "candidate_duplicates": cand_dup
    }

@app.get("/api/work-detail")
def get_work_detail_by_query(work_id: str = Query(...)):
    return _fetch_work_detail_internal(work_id)

@app.get("/api/work-detail/{work_id:path}")
def get_work_detail_by_path(work_id: str):
    return _fetch_work_detail_internal(work_id)

@app.get("/api/duplicate-candidates")
def get_duplicate_candidates(
    state: str = None,
    constituency: str = None,
    min_similarity: float = Query(70.0, ge=50.0, le=100.0),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    data = get_data()
    dups = data["duplicates"].copy()
    
    if len(dups) == 0:
        return {"total": 0, "page": page, "limit": limit, "records": []}
        
    dups = dups[dups["similarity_score"] >= min_similarity]
    
    if state and state.strip():
        dups = dups[dups["state"].str.upper() == state.strip().upper()]
    if constituency and constituency.strip():
        dups = dups[dups["constituency"].str.upper() == constituency.strip().upper()]
        
    total_records = len(dups)
    dups_sorted = dups.sort_values("similarity_score", ascending=False)
    
    start = (page - 1) * limit
    end = start + limit
    paginated = dups_sorted.iloc[start:end]
    
    records = [clean_record_for_json(r) for r in paginated.to_dict(orient="records")]
    
    return {
        "total": total_records,
        "page": page,
        "limit": limit,
        "records": records
    }

@app.get("/api/filters")
def get_filter_options():
    data = get_data()
    master = data["master"]
    
    states = sorted([str(s) for s in master["state"].dropna().unique() if str(s).strip() != ""])
    categories = sorted([str(c) for c in master["work_category"].dropna().unique() if str(c).strip() != ""])
    severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    
    return {
        "states": states,
        "categories": categories,
        "severities": severities
    }

if __name__ == "__main__":
    import uvicorn
    print("Starting FastAPI server on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
