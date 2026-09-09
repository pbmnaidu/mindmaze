import os
import json
import pandas as pd
import numpy as np
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="MPLADS AI Monitoring & Risk Intelligence Platform API",
    description="Backend decision-support API for MPLADS public works monitoring",
    version="1.0.0"
)

# Enable the deployed dashboard and the local Next.js development server.  The
# frontend normally uses its same-origin `/api` proxy locally, but allowing the
# local origins also keeps an explicitly configured API URL usable in a browser.
cors_origins = [
    "https://mindmaze16.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
cors_origins.extend(
    origin.strip()
    for origin in os.environ.get("CORS_ALLOW_ORIGINS", "").split(",")
    if origin.strip()
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

    if "t3" not in _DATA_CACHE:
        t3_p = os.path.join(PROCESSED_DIR, "t3_works_recommended.parquet")
        if os.path.exists(t3_p):
            _DATA_CACHE["t3"] = pd.read_parquet(t3_p)
        else:
            _DATA_CACHE["t3"] = pd.DataFrame()

    if "t5" not in _DATA_CACHE:
        t5_p = os.path.join(PROCESSED_DIR, "t5_works_completed.parquet")
        if os.path.exists(t5_p):
            _DATA_CACHE["t5"] = pd.read_parquet(t5_p)
        else:
            _DATA_CACHE["t5"] = pd.DataFrame()
            
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
        # Material analysis fields are structured lists/dicts; pd.isna on a
        # list returns an array and cannot be used as a scalar condition.
        if isinstance(v, (list, dict, np.ndarray)):
            clean[k] = v.tolist() if isinstance(v, np.ndarray) else v
            continue
        if isinstance(v, str) and k in {"explainable_audit_summary", "recommended_reviewer_action", "financial_explanation", "compliance_explanation"}:
            clean[k] = v.replace(" | ", "\n")
        elif pd.isna(v):
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


VALID_ROLES = {"national", "state", "constituency"}


def _normalise(value):
    return " ".join(str(value or "").strip().split()).casefold()


def _matches(series, value):
    """Exact, case-insensitive matching without changing stored display labels."""
    target = _normalise(value)
    if not target:
        return pd.Series(True, index=series.index)
    return series.fillna("").map(_normalise) == target


def _validate_scope(role, state, constituency):
    role = (role or "national").strip().lower()
    if role not in VALID_ROLES:
        raise HTTPException(status_code=422, detail="role must be national, state, or constituency.")
    if role == "state" and not str(state or "").strip():
        raise HTTPException(status_code=422, detail="A state is required for State Master monitoring.")
    if role == "constituency" and (not str(state or "").strip() or not str(constituency or "").strip()):
        raise HTTPException(status_code=422, detail="State and constituency are required for Constituency Master monitoring.")
    return role


def _scope_master(master, role="national", state=None, constituency=None):
    """Apply the monitoring hierarchy after existing risk calculations have run."""
    role = _validate_scope(role, state, constituency)
    scoped = master
    if role in {"state", "constituency"}:
        scoped = scoped[_matches(scoped["state"], state)]
    if role == "constituency":
        scoped = scoped[_matches(scoped["constituency"], constituency)]
    return scoped.copy(), role


def _completion_mask(df):
    return df["completion_date"].notna() if "completion_date" in df else pd.Series(False, index=df.index)

def _filter_df_by_scope(df, state=None, constituency=None):
    if df is None or len(df) == 0:
        return pd.DataFrame()
    scoped = df
    if state and str(state).strip() and "state" in scoped.columns:
        scoped = scoped[_matches(scoped["state"], state)]
    if constituency and str(constituency).strip() and "constituency" in scoped.columns:
        scoped = scoped[_matches(scoped["constituency"], constituency)]
    return scoped

@app.get("/dashboard")
@app.get("/dashboard.html")
def serve_dashboard():
    dash_path = os.path.join(STATIC_DIR, "dashboard.html")
    if not os.path.exists(dash_path):
        dash_path = os.path.join(BASE_DIR, "dashboard.html")
    if os.path.exists(dash_path):
        return FileResponse(dash_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="Dashboard HTML file not found.")

@app.get("/api/health")
def health_check():
    data = get_data()
    return {
        "status": "healthy",
        "total_projects_loaded": len(data["master"])
    }

@app.get("/api/overview")
def get_overview(
    role: str = "national",
    state: str = None,
    constituency: str = None,
):
    data = get_data()
    master, role = _scope_master(data["master"], role, state, constituency)
    
    # Filter T1 (Allocated) and T3 (Recommended) by scope
    t1_scoped = _filter_df_by_scope(data.get("t1"), state, constituency)
    t3_scoped = _filter_df_by_scope(data.get("t3"), state, constituency)

    total_allocation = float(t1_scoped["allocated_amount"].fillna(0).sum()) if len(t1_scoped) > 0 and "allocated_amount" in t1_scoped else (float(data["t1"]["allocated_amount"].sum()) if role == "national" and len(data.get("t1", [])) > 0 else 0.0)
    total_recommended_works = len(t3_scoped)
    total_recommended_amount = float(t3_scoped["recommended_amount"].fillna(0).sum()) if len(t3_scoped) > 0 and "recommended_amount" in t3_scoped else 0.0
    
    total_sanctioned = float(master["sanction_amount"].fillna(0).sum())
    total_disbursed = float(master["effective_expenditure"].fillna(0).sum())
    
    total_works = len(master)
    completed_works = int(_completion_mask(master).sum())
    
    risk_counts = master["overall_risk_level"].value_counts().to_dict()
    
    # The role determines the aggregation level: state → constituency → work.
    group_field = "state" if role == "national" else ("constituency" if role == "state" else "work_id")
    ranking_label = "State" if role == "national" else ("Constituency" if role == "state" else "Work")
    state_agg = master.groupby(group_field).agg(
        total_works=("work_id", "count"),
        total_sanctioned=("sanction_amount", "sum"),
        total_disbursed=("effective_expenditure", "sum"),
        high_risk_works=("overall_risk_level", lambda x: (x.isin(["HIGH", "CRITICAL"])).sum())
    ).reset_index().sort_values(["high_risk_works", "total_works"], ascending=False)
    state_agg = state_agg.rename(columns={group_field: "state"})
    
    state_list = [clean_record_for_json(r) for r in state_agg.to_dict(orient="records")]
    
    # Category-level aggregation
    category_field = "main_sector" if "main_sector" in master.columns else "effective_work_category"
    cat_agg = master.groupby(category_field).agg(
        total_works=("work_id", "count"),
        total_sanctioned=("sanction_amount", "sum"),
        high_risk_works=("overall_risk_level", lambda x: (x.isin(["HIGH", "CRITICAL"])).sum())
    ).reset_index().rename(columns={category_field: "main_sector"}).sort_values("total_works", ascending=False)
    
    cat_list = [clean_record_for_json(r) for r in cat_agg.to_dict(orient="records")]
    
    return {
        "summary": {
            "total_allocated_funds": total_allocation,
            "total_recommended_works": total_recommended_works,
            "total_recommended_amount": total_recommended_amount,
            "total_sanctioned_amount": total_sanctioned,
            "total_sanctioned_works": total_works,
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
        "category_distribution": cat_list[:8],
        "scope": {"role": role, "state": state if role != "national" else None, "constituency": constituency if role == "constituency" else None},
        "ranking_label": ranking_label,
    }

@app.get("/api/risk-monitor")
def get_risk_monitor_queue(
    role: str = "national",
    state: str = None,
    constituency: str = None,
    category: str = None,
    severity: str = None,
    completion_status: str = None,
    search: str = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200)
):
    data = get_data()
    df, _ = _scope_master(data["master"], role, state, constituency)
    
    # National users may optionally narrow the results; role scope can never be escaped.
    if role.strip().lower() == "national" and state and state.strip():
        df = df[df["state"].str.upper() == state.strip().upper()]
    if role.strip().lower() == "national" and constituency and constituency.strip():
        query_constituency = constituency.strip().casefold()
        df = df[df["constituency"].fillna("").str.casefold().str.contains(query_constituency, regex=False)]
    if category and category.strip():
        category_field = "main_sector" if "main_sector" in df.columns else "effective_work_category"
        df = df[df[category_field].fillna("").str.lower() == category.strip().lower()]
    if severity and severity.strip():
        df = df[df["overall_risk_level"].str.upper() == severity.strip().upper()]
    if completion_status and completion_status.strip():
        status = completion_status.strip().lower()
        completed = _completion_mask(df)
        if status == "completed":
            df = df[completed]
        elif status in {"not_completed", "not completed", "ongoing"}:
            df = df[~completed]
        else:
            raise HTTPException(status_code=422, detail="completion_status must be completed or not_completed.")
    if search and search.strip():
        q = search.strip().lower()
        df = df[
            df["work_id"].str.lower().str.contains(q) |
            df["description"].fillna("").str.lower().str.contains(q) |
            df["mp_name"].fillna("").str.lower().str.contains(q) |
            df["constituency"].fillna("").str.lower().str.contains(q)
        ]
        
    page_val = int(page.default) if hasattr(page, 'default') else int(page)
    limit_val = int(limit.default) if hasattr(limit, 'default') else int(limit)

    total_records = len(df)
    
    # Always put the work needing attention first. Tie-break with the
    # highest-priority components so the order remains stable and useful.
    priority_columns = [
        column for column in ["composite_risk_score", "compliance_risk_score", "financial_risk_score", "duplicate_risk_score"]
        if column in df.columns
    ]
    df_sorted = df.sort_values(priority_columns, ascending=[False] * len(priority_columns), kind="stable")
    
    start = (page_val - 1) * limit_val
    end = start + limit_val
    paginated = df_sorted.iloc[start:end]
    
    records = [clean_record_for_json(r) for r in paginated.to_dict(orient="records")]
    
    return {
        "total": total_records,
        "page": page_val,
        "limit": limit_val,
        "total_pages": int(np.ceil(total_records / limit_val)) if total_records > 0 else 0,
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
    
    # Only expose evidence when the source record has an actual image/file
    # reference. Classification must never create a proxy evidence image.
    work_record["evidence_image_present"] = bool(work_record.get("has_evidence_image") is True)
    work_record["evidence_image_source"] = "source Image field" if work_record["evidence_image_present"] else None
    work_record["evidence_image_reference"] = work_record.get("evidence_image_url") if work_record["evidence_image_present"] else None

    cand_dup = []
    if len(duplicates) > 0:
        dup_matches = duplicates[(duplicates["work_id_1"] == found_id) | (duplicates["work_id_2"] == found_id)]
        cand_dup = [clean_record_for_json(r) for r in dup_matches.to_dict(orient="records")]
        
    return {
        "work": work_record,
        "candidate_duplicates": cand_dup
    }

@app.get("/api/work-detail")
def get_work_detail_by_query(work_id: str = Query(...), role: str = "national", state: str = None, constituency: str = None):
    result = _fetch_work_detail_internal(work_id)
    scoped, scoped_role = _scope_master(get_data()["master"], role, state, constituency)
    if not _matches(scoped["work_id"], result["work"]["work_id"]).any():
        raise HTTPException(status_code=404, detail="Work record is outside the active monitoring scope.")
    if scoped_role != "national":
        candidates = result["candidate_duplicates"]
        if scoped_role == "state":
            candidates = [pair for pair in candidates if _normalise(pair.get("state")) == _normalise(state)]
        else:
            candidates = [pair for pair in candidates if _normalise(pair.get("state")) == _normalise(state) and _normalise(pair.get("constituency")) == _normalise(constituency)]
        result["candidate_duplicates"] = candidates
    return result

@app.get("/api/work-detail/{work_id:path}")
def get_work_detail_by_path(work_id: str, role: str = "national", state: str = None, constituency: str = None):
    return get_work_detail_by_query(work_id, role, state, constituency)

@app.get("/api/duplicate-candidates")
def get_duplicate_candidates(
    role: str = "national",
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
    
    role = _validate_scope(role, state, constituency)
    if role in {"state", "constituency"} and state and state.strip():
        dups = dups[dups["state"].str.upper() == state.strip().upper()]
    if role == "constituency" and constituency and constituency.strip():
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
def get_filter_options(role: str = "national", state: str = None, constituency: str = None):
    data = get_data()
    master, role = _scope_master(data["master"], role, state, constituency)
    
    states = sorted([str(s) for s in master["state"].dropna().unique() if str(s).strip() != ""])
    category_field = "main_sector" if "main_sector" in master.columns else "effective_work_category"
    categories = sorted([str(c) for c in master[category_field].dropna().unique() if str(c).strip() != ""])
    severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    
    constituencies_by_state = {
        str(s): sorted([str(c) for c in group["constituency"].dropna().unique() if str(c).strip() != ""])
        for s, group in master.groupby("state")
        if str(s).strip()
    }
    return {
        "states": states,
        "constituencies": sorted([str(c) for c in master["constituency"].dropna().unique() if str(c).strip() != ""]),
        "constituenciesByState": constituencies_by_state,
        "categories": categories,
        "severities": severities
    }

if __name__ == "__main__":
    import uvicorn
    # Render injects the listening port through PORT. Binding to 0.0.0.0 is
    # required in a container; 127.0.0.1 is reachable only from inside it.
    port = int(os.environ.get("PORT", "8000"))
    print(f"Starting FastAPI server on 0.0.0.0:{port} ...")
    uvicorn.run(app, host="0.0.0.0", port=port)
