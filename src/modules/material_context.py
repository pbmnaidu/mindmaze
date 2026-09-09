"""Description-based material context for MPLADS works.

This module is deliberately rule-based and conservative: keywords provide
context, while quantities and reference costs are emitted only when the
description explicitly supplies a quantity and a matching benchmark exists.
"""
import json
import os
import re
from pathlib import Path

import numpy as np
import pandas as pd


MATERIAL_KEYWORDS = {
    "Cement 50kg": ["cement", "cement concrete", "pcc", "rcc", "reinforced cement concrete", "concrete slab", "concrete work", "cement flooring"],
    "Fe500D TMT Steel": ["steel", "tmt", "tmt steel", "fe500", "fe500d", "reinforcement", "reinforcement steel", "rebar", "steel bars", "rcc", "reinforced concrete"],
    "Coarse Aggregate 20mm": ["aggregate", "20mm aggregate", "stone aggregate", "coarse aggregate", "metal", "stone chips", "gravel", "gsb", "wmm", "road metal"],
    "Construction Brick": ["brick", "bricks", "brick masonry", "brick wall", "masonry", "fly ash brick", "red brick", "brickwork"],
}

WORK_TYPE_KEYWORDS = {
    "CC Road": ["cc road", "concrete road", "cement concrete road"],
    "RCC Structure": ["rcc", "reinforced concrete", "concrete slab"],
    "Brick Masonry": ["brick masonry", "brick wall", "brickwork"],
    "Boundary Wall": ["boundary wall", "compound wall"],
    "Road": ["road", "pavement", "wmm", "gsb"],
    "Drainage": ["drain", "drainage", "culvert"],
    "Bridge": ["bridge"],
    "Building": ["building", "school building", "community hall", "classroom", "toilet"],
    "Water Supply": ["water tank", "water supply", "pipeline", "submersible pump"],
    "Flooring": ["flooring", "floor"],
}

WORK_PROFILES = {
    "RCC Structure": {"Cement 50kg": 1.0, "Fe500D TMT Steel": 1.0, "Coarse Aggregate 20mm": 1.0, "Construction Brick": 0.2},
    "Brick Masonry": {"Construction Brick": 1.0, "Cement 50kg": 0.6, "Fe500D TMT Steel": 0.2, "Coarse Aggregate 20mm": 0.2},
    "CC Road": {"Cement 50kg": 1.0, "Coarse Aggregate 20mm": 1.0, "Fe500D TMT Steel": 0.3},
    "Boundary Wall": {"Construction Brick": 1.0, "Cement 50kg": 0.6, "Fe500D TMT Steel": 0.3, "Coarse Aggregate 20mm": 0.2},
    "Road": {"Cement 50kg": 0.4, "Coarse Aggregate 20mm": 0.8},
    "Building": {"Cement 50kg": 0.7, "Fe500D TMT Steel": 0.7, "Coarse Aggregate 20mm": 0.6, "Construction Brick": 0.5},
}

UNIT_MAP = {"m": "meter", "meter": "meter", "metre": "meter", "km": "km", "sq ft": "sq ft", "sq. ft": "sq ft", "square feet": "sq ft", "sq m": "sq m", "square meter": "sq m", "cu ft": "cu ft", "cu m": "cu m", "cubic meter": "cu m", "kg": "kg", "tonne": "tonne", "mt": "MT", "bags": "bags", "bag": "bags", "pieces": "pieces", "piece": "pieces", "nos": "pieces", "no": "pieces", "number": "pieces"}


def clean_description(value):
    text = "" if pd.isna(value) else str(value).lower()
    text = re.sub(r"[^\w\s./-]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _contains(text, phrase):
    return re.search(r"(?<!\w)" + re.escape(phrase.lower()) + r"(?!\w)", text) is not None


def _work_type(text):
    matches = [(len(k), name) for name, keys in WORK_TYPE_KEYWORDS.items() for k in keys if _contains(text, k)]
    return max(matches)[1] if matches else None


def _quantities(text):
    units = "|".join(sorted((re.escape(k) for k in UNIT_MAP), key=len, reverse=True))
    values = []
    for match in re.finditer(r"(?<!\w)(\d+(?:\.\d+)?)\s*(" + units + r")(?!\w)", text, re.I):
        values.append({"quantity": float(match.group(1)), "unit": UNIT_MAP[match.group(2).lower()], "confidence": 1.0})
    return values


def _benchmark_path(base_dir):
    configured = os.environ.get("MATERIAL_BENCHMARK_PATH")
    candidates = [configured] if configured else []
    candidates += [os.path.join(base_dir, "data", "reference", "nirikshan_material_price_benchmarks.csv"), os.path.join(base_dir, "data", "nirikshan_material_price_benchmarks.csv")]
    return next((p for p in candidates if p and os.path.exists(p)), None)


def _load_benchmarks(base_dir):
    path = _benchmark_path(base_dir)
    if not path:
        return pd.DataFrame(columns=["state", "year", "material", "unit", "price", "source", "representative_market", "dominant_type"])
    data = pd.read_csv(path)
    data.columns = [str(c).strip().lower() for c in data.columns]
    data["state"] = data["state"].fillna("").astype(str).str.strip().str.upper()
    data["material"] = data["material"].fillna("").astype(str).str.strip()
    data["year"] = pd.to_numeric(data["year"], errors="coerce")
    data["price"] = pd.to_numeric(data["price"], errors="coerce")
    return data


def _year(row):
    for field in ("sanction_date", "recommended_date"):
        if field in row and pd.notna(row[field]):
            return int(pd.Timestamp(row[field]).year)
    return None


def analyze_material_context(df, base_dir):
    benchmarks = _load_benchmarks(base_dir)
    benchmark_years = sorted(benchmarks["year"].dropna().astype(int).unique().tolist())
    default_year = max(benchmark_years) if benchmark_years else None

    def analyze(row):
        clean = clean_description(row.get("description", ""))
        state = str(row.get("state", "") or "").strip().upper()
        work_type = _work_type(clean)
        quantities = _quantities(clean)
        target_year = _year(row)
        explicit_materials = [m for m, keys in MATERIAL_KEYWORDS.items() if any(_contains(clean, k) for k in keys)]
        profile = WORK_PROFILES.get(work_type, {})
        materials = []
        for material in dict.fromkeys(explicit_materials + [m for m, score in profile.items() if score > 0]):
            source = "EXPLICIT" if material in explicit_materials else "INFERRED_FROM_WORK_TYPE"
            # Length/area/dimension quantities describe the work, not a
            # material quantity. Only material-native units can support a
            # reference material-cost calculation without a BOQ.
            material_units = {"kg", "tonne", "MT", "bags", "pieces"}
            quantity = quantities[0] if len(quantities) == 1 and quantities[0]["unit"] in material_units and material in explicit_materials else None
            matched = benchmarks[(benchmarks["state"] == state) & (benchmarks["material"].str.casefold() == material.casefold())]
            year_match = target_year is not None and not matched[matched["year"] == target_year].empty
            if year_match:
                hit = matched[matched["year"] == target_year].iloc[0]
            elif default_year is not None and not matched[matched["year"] == default_year].empty:
                hit = matched[matched["year"] == default_year].iloc[0]
            else:
                hit = None
            price = float(hit["price"]) if hit is not None and pd.notna(hit["price"]) else None
            ref_cost = quantity["quantity"] * price if quantity and price is not None else None
            materials.append({"material": material, "source": source, "quantity": quantity["quantity"] if quantity else None, "unit": quantity["unit"] if quantity else None, "benchmark_price": price, "benchmark_unit": hit.get("unit") if hit is not None else None, "reference_material_cost": ref_cost, "relevance_score": profile.get(material, 1.0 if source == "EXPLICIT" else 0.0)})
        flags = []
        if not clean: flags.append("missing description")
        if not state: flags.append("missing state")
        if target_year and default_year and target_year != default_year and len(benchmarks) > 0: flags.append("benchmark year mismatch")
        if not materials and clean: flags.append("material benchmark unavailable")
        available = any(m["benchmark_price"] is not None for m in materials)
        explicit_quantity = any(m["quantity"] is not None for m in materials)
        score = min(100.0, (25 if available else 0) + (35 if explicit_quantity else 0) + (20 if work_type else 0) + (20 if state and available else 0))
        status = "REFERENCE_COST_CALCULABLE" if any(m["reference_material_cost"] is not None for m in materials) else ("BENCHMARK_CONTEXT_ONLY" if available else "NOT_AVAILABLE")
        return pd.Series({"description_clean": clean, "detected_work_type": work_type, "detected_materials": materials, "material_detection_source": "EXPLICIT" if explicit_materials else ("INFERRED_FROM_WORK_TYPE" if work_type else "NOT_DETECTED"), "material_quantity_available": explicit_quantity, "material_quantities": quantities, "benchmark_year": default_year, "benchmark_state": state or None, "material_benchmark_available": available, "material_benchmark_details": materials, "material_cost_context_status": status, "material_reference_cost": sum(m["reference_material_cost"] or 0 for m in materials) if explicit_quantity else None, "material_cost_context_score": score, "material_context_explanation": ("Reference benchmark available; quantity/BOQ not available for direct material-cost calculation." if available and not explicit_quantity else ("Explicit quantity and reference benchmark support a contextual material-cost calculation." if explicit_quantity else "No matching state/material reference benchmark was available.")), "data_quality_flags": flags})

    return pd.concat([df.reset_index(drop=True), df.apply(analyze, axis=1)], axis=1)
