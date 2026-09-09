"""Hybrid, conservative work-description classification for MPLADS records."""
import os
import re
import json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

WORK_GROUPS = {
    "Roads": ["cc road", "cement concrete road", "concrete road", "bituminous road", "black top road", "road", "pavement", "road widening"],
    "Bridges & Culverts": ["bridge", "culvert", "causeway", "box culvert", "canal crossing", "across the stream"],
    "Street Lighting / Electrification": ["street light", "streetlight", "led light", "led street lights", "solar light", "solar street light", "high mast", "highmast", "highmast lights", "led highmast lights", "electric pole", "electrification", "transformer"],
    "Water Supply": ["drinking water", "water supply", "pipeline", "water tank", "overhead tank", "oht", "borewell", "hand pump", "water purification"],
    "Drainage / Sewerage": ["drain", "drainage", "storm water", "sewer", "sewerage", "nala", "drainage channel"],
    "Irrigation / Water Infrastructure": ["irrigation", "irrigation canal", "check dam", "water harvesting", "farm pond", "minor irrigation"],
    "School / Education Infrastructure": ["school", "classroom", "college", "laboratory", "library", "education", "school toilet"],
    "Healthcare Infrastructure": ["hospital", "health centre", "health center", "primary health", "phc", "dispensary", "medical"],
    "Community Buildings": ["community hall", "community centre", "community center", "public hall", "multipurpose hall", "marriage hall"],
    "Cultural Facilities": ["cultural bhavan", "cultural bhawan", "cultural centre", "cultural center", "samudaya bhavan"],
    "Sanitation": ["toilet", "sanitation", "sanitary complex", "waste management", "solid waste"],
    "Boundary Walls": ["boundary wall", "compound wall", "fencing", "retaining wall"],
    "Sports Infrastructure": ["playground", "sports ground", "stadium", "sports complex", "football ground", "cricket ground", "volleyball court"],
    "Public Buildings": ["public building", "office building", "panchayat building", "administrative building"],
    "Repair / Renovation": ["repair", "renovation", "restoration", "refurbishment", "repairing"],
}
GENERIC = {"", "normal", "normal others", "normal other", "other", "others", "general", "miscellaneous", "other works", "na", "n a", "unknown", "unclassified"}

def normalize(text):
    text = "" if pd.isna(text) else str(text).lower()
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", text)).strip()

def classify_work_descriptions(df):
    text = df["description"].map(normalize)
    labels, scores, matches, sources = [], [], [], []
    for value in text:
        found = [(len(phrase), group, phrase) for group, phrases in WORK_GROUPS.items() for phrase in phrases if re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", value)]
        if found:
            found.sort(reverse=True)
            labels.append(found[0][1]); scores.append(0.98 if len(found[0][2].split()) > 1 else 0.92)
            matches.append([x[2] for x in found]); sources.append("DESCRIPTION_RULE")
        else:
            labels.append("Other / Unclassified"); scores.append(0.0); matches.append([]); sources.append("UNCLASSIFIED")

    # Train a lightweight text model from only high-confidence rule labels.
    train_mask = np.array(scores) >= 0.92
    if train_mask.sum() >= 20 and len(set(np.array(labels)[train_mask])) >= 2:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), analyzer="word", min_df=2, max_features=50000)
        x_train = vectorizer.fit_transform(text[train_mask])
        model = LogisticRegression(max_iter=300, class_weight="balanced")
        model.fit(x_train, np.array(labels)[train_mask])
        uncertain = ~train_mask
        if uncertain.any():
            probs = model.predict_proba(vectorizer.transform(text[uncertain]))
            pred = model.classes_[probs.argmax(axis=1)]
            conf = probs.max(axis=1)
            for idx, category, confidence in zip(np.flatnonzero(uncertain), pred, conf):
                if confidence >= 0.75:
                    labels[idx] = category; scores[idx] = float(confidence); sources[idx] = "DESCRIPTION_HYBRID_CLASSIFIER"

    original = df["work_category"].fillna("").astype(str).str.strip()
    effective = [a if c >= 0.75 else (o if normalize(o) not in GENERIC else "Other / Unclassified") for a, c, o in zip(labels, scores, original)]
    confidence_band = ["HIGH" if c >= .90 else "MEDIUM" if c >= .75 else "LOW" if c >= .60 else "UNCERTAIN" for c in scores]
    out = pd.DataFrame({
        "original_work_category": original,
        "ai_work_category": labels,
        "effective_work_category": effective,
        "category_confidence": np.round(scores, 3),
        "category_confidence_band": confidence_band,
        "category_source": sources,
        "primary_work_group": labels,
        "secondary_work_groups": [[] for _ in labels],
        "category_keywords_matched": matches,
        "category_model_scores": [{labels[i]: float(scores[i])} for i in range(len(labels))],
        "work_domain": ["Transport Infrastructure" if x in {"Roads", "Bridges & Culverts"} else "Public Utilities" if x in {"Water Supply", "Drainage / Sewerage", "Street Lighting / Electrification"} else "Social Infrastructure" if x in {"School / Education Infrastructure", "Healthcare Infrastructure", "Community Buildings"} else "Other Infrastructure" for x in effective],
        "work_subcategory": labels,
        "classification_reason": ["Matched: " + ", ".join(m[:5]) if m else "No high-confidence asset indicator; source category fallback used" for m in matches],
        "classification_uncertainty": [c < .75 for c in scores],
        "primary_asset": labels,
        "secondary_assets": [[] for _ in labels],
        "location_entities": [[] for _ in labels],
    }, index=df.index)
    return pd.concat([df, out], axis=1)

def write_profile(df, path):
    profile = {"rows": len(df), "unique_original_categories": int(df.work_category.nunique()), "generic_category_rows": int(df.work_category.map(normalize).isin(GENERIC).sum()), "missing_description_rows": int(df.description.fillna("").str.strip().eq("").sum()), "category_frequency": df.work_category.fillna("").value_counts().head(100).to_dict(), "effective_category_frequency": df.effective_work_category.value_counts().to_dict()}
    with open(path, "w", encoding="utf-8") as handle: json.dump(profile, handle, indent=2, ensure_ascii=False)

def write_validation_template(df, path, sample_size=500):
    generic = df["work_category"].map(normalize).isin(GENERIC)
    groups = [df[generic], df[~generic]]
    sample = pd.concat([g.sample(min(len(g), max(1, sample_size // len(groups))), random_state=42) for g in groups]).drop_duplicates("work_id")
    if len(sample) < sample_size:
        remaining = df[~df.work_id.isin(sample.work_id)].sample(min(sample_size-len(sample), len(df)-len(sample)), random_state=42)
        sample = pd.concat([sample, remaining])
    out = pd.DataFrame({"work_id": sample.work_id, "sanctioned_work_description": sample.description, "original_work_category": sample.work_category, "human_category": "", "human_subcategory": "", "ai_category": sample.ai_work_category, "ai_subcategory": sample.work_subcategory, "classification_confidence": sample.category_confidence, "classification_source": sample.category_source, "correct": "", "reviewer_notes": ""})
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out.head(sample_size).to_csv(path, index=False)
