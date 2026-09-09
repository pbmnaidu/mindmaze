"""Create before/after peer benchmarking samples from generated outputs."""
import os
import pandas as pd

def create_report():
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    current = pd.read_parquet(os.path.join(base, "data", "features", "master_project_risk_scores.parquet"))
    old = pd.read_parquet(os.path.join(base, "data", "features", "financial_anomalies.parquet"))[["work_id", "peer_median", "amount_to_peer_ratio", "financial_risk_score", "financial_risk_level"]].rename(columns={"peer_median":"new_peer_median", "amount_to_peer_ratio":"new_ratio", "financial_risk_score":"new_score", "financial_risk_level":"new_level"})
    out = current.merge(old, on="work_id", how="left")
    out["old_peer_median"] = out.groupby(["work_category", "state"])["sanction_amount"].transform("median")
    out["old_ratio"] = out["sanction_amount"] / (out["old_peer_median"] + 1)
    out["old_level"] = "LOW"
    out.loc[out["old_ratio"] >= 1.5, "old_level"] = "MEDIUM"
    out.loc[out["old_ratio"] >= 2.0, "old_level"] = "HIGH"
    sample = out[out["original_work_category"].fillna("").str.contains("other|normal|general|misc", case=False, regex=True)].sort_values("new_score", ascending=False).head(100)
    columns = ["work_id", "sanctioned_work_description", "original_work_category", "ai_work_category", "effective_work_category", "old_peer_median", "new_peer_median", "old_ratio", "new_ratio", "old_level", "new_level", "financial_explanation"]
    os.makedirs(os.path.join(base, "data", "reports"), exist_ok=True)
    sample[columns].to_csv(os.path.join(base, "data", "reports", "category_peer_regression.csv"), index=False)
    print(f"Wrote {len(sample)} comparison records")

if __name__ == "__main__":
    create_report()
