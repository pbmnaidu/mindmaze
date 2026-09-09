import os
import re
import numpy as np
import pandas as pd


def _first(frame, names, default=np.nan):
    for name in names:
        if name in frame.columns:
            return frame[name]
    return pd.Series(default, index=frame.index)


def _clean(value):
    return re.sub(r"\W+", " ", str(value).lower()).strip()


def run_compliance_engine():
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    features = os.environ.get("FEATURES_DIR", os.path.join(base, "data", "features"))
    processed = os.environ.get("PROCESSED_DIR", os.path.join(base, "data", "processed"))
    master_path = os.path.join(features, "master_analytical.parquet")
    if not os.path.exists(master_path):
        raise FileNotFoundError(master_path)
    master = pd.read_parquet(master_path)

    t3_path = os.path.join(processed, "t3_works_recommended.parquet")
    if os.path.exists(t3_path):
        t3 = pd.read_parquet(t3_path)
        if {"work_id", "recommended_date"}.issubset(t3.columns):
            t3 = t3[["work_id", "recommended_date"]].drop_duplicates("work_id")
            master = master.merge(t3, on="work_id", how="left", suffixes=("", "_t3"))
            if "recommended_date_t3" in master:
                master["recommended_date"] = master["recommended_date"].fillna(master["recommended_date_t3"])
                master.drop(columns=["recommended_date_t3"], inplace=True)

    rec = pd.to_datetime(_first(master, ["recommended_date", "Recommended date"]), errors="coerce")
    sanction = pd.to_datetime(_first(master, ["sanction_date", "Sanction Date"]), errors="coerce")
    start = pd.to_datetime(_first(master, ["start_date", "first_payment_date"]), errors="coerce")
    completion = pd.to_datetime(_first(master, ["completion_date"]), errors="coerce")
    today = pd.Timestamp.now().normalize()
    status = _first(master, ["work_status", "Work Status"], "").fillna("").astype(str).str.lower()
    completed = completion.notna() | status.str.contains("complete", na=False)
    amount = pd.to_numeric(_first(master, ["effective_expenditure", "total_expenditure"], 0), errors="coerce").fillna(0)
    sanctioned = pd.to_numeric(_first(master, ["sanction_amount"], 0), errors="coerce").fillna(0)
    partial = status.str.contains("partial|progress|ongoing", na=False) | amount.gt(0)
    description = _first(master, ["description", "Work description"], "").fillna("").astype(str)
    constituency = _first(master, ["constituency", "Constituency"], "").fillna("").astype(str).str.lower().str.strip()

    c01 = rec.notna() & sanction.notna() & ((sanction - rec).dt.days > 45)
    repeat = pd.DataFrame({"key": description.map(_clean), "constituency": constituency, "date": rec})
    c02 = pd.Series(False, index=master.index)
    for _, group in repeat[(repeat.key != "") & repeat.date.notna()].groupby(["key", "constituency"]):
        dates = group.date.sort_values()
        if len(dates) > 1:
            c02.loc[dates.index[dates.diff().dt.days.fillna(999999).le(180)]] = True

    elapsed = (completion.fillna(today) - sanction).dt.days
    c03 = completed & sanction.notna() & elapsed.lt(15)
    c04 = completed & sanction.notna() & elapsed.ge(15) & elapsed.le(365) & ~c03
    c05 = sanction.notna() & ~completed & ~partial & (today - sanction).dt.days.gt(365)
    c06 = partial & ~completed & sanction.notna() & (today - sanction).dt.days.gt(365) & (today - sanction).dt.days.le(548)
    c07 = partial & ~completed & sanction.notna() & (today - sanction).dt.days.gt(548)
    c08 = ((rec.notna() & sanction.notna() & rec.gt(sanction)) |
           (sanction.notna() & start.notna() & sanction.gt(start)) |
           (start.notna() & completion.notna() & start.gt(completion)) |
           (sanction.notna() & completion.notna() & sanction.gt(completion)))
    c09 = amount.gt(sanctioned) & sanctioned.gt(0)
    c10 = amount.lt(0) | sanctioned.lt(0) | (amount.gt(0) & sanctioned.eq(0))
    c11 = rec.isna() | sanction.isna() | description.str.len().lt(5) | constituency.eq("")
    c12 = ((status.str.contains("complete", na=False) & completion.isna()) |
           (completion.notna() & status.str.contains("ongoing|progress|sanction", na=False)))

    rules = {
        "C01": (c01, 100, "Recommendation to sanction took more than 45 days."),
        "C02": (c02, 100, "A similar work was recommended within 180 days."),
        "C03": (c03, 100, "The work was marked complete in less than 15 days."),
        "C04": (c04, 0, "The completion time is within the normal 15-day to 1-year window."),
        "C05": (c05, 35, "There is no completion or progress after 1 year."),
        "C06": (c06, 10, "The work has progress and is still within the 18-month window."),
        "C07": (c07, 100, "The work has progress but is still incomplete after 18 months."),
        "C08": (c08, 50, "The recorded dates are not in the correct order."),
        "C09": (c09, 50, "Recorded spending is higher than the sanctioned amount."),
        "C10": (c10, 35, "The financial values are missing, negative, or invalid."),
        "C11": (c11, 35, "Required work information is missing."),
        "C12": (c12, 35, "The completion status does not match the completion date."),
    }
    score = pd.Series(0.0, index=master.index)
    messages = pd.DataFrame(index=master.index)
    for rule_id, (mask, points, label) in rules.items():
        score = score + mask.astype(int) * points
        messages[rule_id] = np.where(mask, label, "")
    master["compliance_risk_score"] = score.clip(upper=100)
    master["compliance_explanation"] = messages.apply(lambda row: "\n".join(f"{index}. {value}" for index, value in enumerate((v for v in row if v), start=1)) or "No compliance rule triggered. Image verification is optional.", axis=1)
    master["triggered_rules"] = messages.apply(lambda row: ", ".join(k for k, v in row.items() if v), axis=1)
    master["compliance_risk_level"] = master.compliance_risk_score.map(lambda x: "CRITICAL" if x >= 85 else "HIGH" if x >= 65 else "MEDIUM" if x >= 35 else "LOW")
    master["is_compliance_flagged"] = master.compliance_risk_score.ge(35)
    out = os.path.join(features, "compliance_risk_analysis.parquet")
    master.to_parquet(out, index=False)
    print(f"Compliance rules evaluated for {len(master):,} works; saved to {out}")


if __name__ == "__main__":
    run_compliance_engine()
