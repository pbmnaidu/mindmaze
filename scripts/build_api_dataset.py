from pathlib import Path
import pandas as pd

root = Path(__file__).resolve().parents[1]
src = root / "data/features/master_project_risk_scores.parquet"
out = root / "data/features/master_api.parquet"
df = pd.read_parquet(src)
df = df.loc[:, ~df.columns.duplicated()].copy()
keep = [
    "work_id", "Sr. No.", "Work category", "Work", "State", "IDA", "Hon'ble Members of Parliament", "Constituency", "Work description", "Recommended date", "Sanction Date", "Sanction Amount ( ₹ )", "Work Status",
    "work_category", "sanction_amount", "recommended_date", "sanction_date", "state", "constituency", "mp_name", "description", "work_status", "total_expenditure", "effective_expenditure", "avg_payment", "max_payment", "payment_count", "first_payment_date", "last_payment_date", "completion_date", "has_evidence_image", "evidence_image_url",
    "main_sector", "work_domain", "effective_work_category", "work_subcategory", "sector_id", "ai_work_category", "category_confidence", "category_source", "classification_reason", "quantity_detected", "quantity_unit", "quantity_source", "base_avg_cost_inr", "regional_multiplier", "reference_expected_cost_inr", "reference_unit_cost_inr", "reference_total_cost_inr", "reference_unit_cost_min_inr", "reference_unit_cost_max_inr", "reference_total_cost_min_inr", "reference_total_cost_max_inr", "peer_category_median_amount", "amount_to_peer_ratio", "description_clean", "detected_work_type", "material", "material_cost_context_status", "material_cost_context_score", "material_context_explanation",
    "financial_risk_score", "financial_risk_level", "financial_explanation", "financial_anomaly_score", "peer_group_level", "peer_group_size", "peer_group_label", "peer_group_category", "peer_group_state", "peer_group_quality", "peer_group_median", "peer_group_q1", "peer_group_q3", "peer_group_iqr", "peer_group_upper_bound", "peer_percentile", "constituency_historic_avg_cost", "reference_cost_deviation_ratio", "historic_cost_deviation_ratio", "reference_cost_basis_inr", "duplicate_risk_score", "compliance_risk_score", "compliance_risk_level", "compliance_explanation", "triggered_rules", "composite_risk_score", "overall_risk_level", "requires_audit_action", "explainable_audit_summary", "recommended_reviewer_action",
]
keep = [name for name in keep if name in df.columns]
df[keep].to_parquet(out, index=False, compression="zstd")
print(f"Wrote {len(df):,} rows and {len(keep)} columns to {out}")
