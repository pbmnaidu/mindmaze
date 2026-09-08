import sys
import os
import time

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from src.preprocessing.cleaner import preprocess_all
from src.data.master_builder import build_master_dataset
from src.modules.financial_anomaly import run_financial_anomaly_detection
from src.modules.vendor_risk import run_vendor_risk_analysis
from src.modules.duplicate_detection import run_duplicate_work_detection
from src.modules.compliance_engine import run_compliance_engine
from src.risk.composite_risk_engine import run_composite_risk_engine

def run_entire_pipeline():
    start_t = time.time()
    print("==================================================")
    print("   MPLADS AI PLATFORM — FULL PIPELINE EXECUTION   ")
    print("==================================================")
    
    print("\n--- PHASE 1: PREPROCESSING & CLEANING ---")
    preprocess_all()
    
    print("\n--- PHASE 1.5: MASTER DATASET BUILDING ---")
    build_master_dataset()
    
    print("\n--- PHASE 2: MODULE 2 (FINANCIAL ANOMALY) ---")
    run_financial_anomaly_detection()
    
    print("\n--- PHASE 2: MODULE 3 (VENDOR RISK) ---")
    run_vendor_risk_analysis()
    
    print("\n--- PHASE 2: MODULE 4 (DUPLICATE DETECTION NLP) ---")
    run_duplicate_work_detection()
    
    print("\n--- PHASE 2: MODULE 5 (COMPLIANCE RULE MATRIX) ---")
    run_compliance_engine()
    
    print("\n--- PHASE 3: COMPOSITE RISK INTELLIGENCE & ALERT ENGINE ---")
    run_composite_risk_engine()
    
    elapsed = time.time() - start_t
    print("\n==================================================")
    print(f"   FULL PIPELINE EXECUTION SUCCESSFUL ({elapsed:.1f}s)   ")
    print("==================================================")

if __name__ == "__main__":
    run_entire_pipeline()
