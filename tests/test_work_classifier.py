import pandas as pd
from src.modules.work_classifier import classify_work_descriptions

def classify(text):
    row = pd.DataFrame([{"description": text, "work_category": "Normal/Others"}])
    return classify_work_descriptions(row).iloc[0]

def test_bridge_classification():
    assert classify("Construction of RCC Bridge over River XYZ").ai_work_category == "Bridges & Culverts"

def test_road_classification():
    assert classify("Construction of CC Road to village").ai_work_category == "Roads"

def test_lighting_classification():
    assert classify("Providing LED Street Lights in village").ai_work_category == "Street Lighting / Electrification"

def test_community_and_cultural_distinction():
    assert classify("Construction of Community Hall").ai_work_category == "Community Buildings"
    assert classify("Construction of Cultural Bhavan").ai_work_category == "Cultural Facilities"

def test_missing_description_is_conservative():
    result = classify("")
    assert result.effective_work_category == "Other / Unclassified"
    assert result.category_confidence == 0
