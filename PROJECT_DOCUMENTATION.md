# MPLADS AI Monitoring & Risk Intelligence Platform — Master System Specification

## 1. EXECUTIVE SUMMARY & SYSTEM CONTEXT

The **MPLADS AI Monitoring & Risk Intelligence Platform** is an evidence-driven, analytical decision-support system designed to assist government officials, financial auditors, and administrative authorities in monitoring funds allocated under the **Member of Parliament Local Area Development Scheme (MPLADS)**.

### Core System Philosophy
- **Decision Support, Not Legal Adjudication**: The platform acts as an early-warning monitoring system. It identifies statistical anomalies, expenditure outliers, candidate duplicate works, and compliance evidence gaps requiring human review.
- **Responsible AI Governance Language**: The system avoids non-adjudicated labels such as *"Fraud Detected"*, *"Corrupt Project"*, or *"Fraudulent Vendor"*. It uses strict governance terminology:
  - *Risk Indicator*
  - *Financial Risk*
  - *Candidate Duplicate Pair*
  - *Compliance Evidence Gap*
  - *Potential Anomaly*
  - *Requires Review*
  - *Priority Audit Queue*

---

## 2. SYSTEM ARCHITECTURE & DATA FLOW

```
+-----------------------------------------------------------------------------------+
| RAW GOVERNMENT DATASETS (T1 - T6)                                                 |
| T1: MP Allocations | T3: Recommended | T4: Sanctioned | T5: Completed | T6: Payments |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PREPROCESSING & DATA CLEANING PIPELINE                                           |
| Regex Work ID Extractor | Fallback Generator | DateTime Normalization             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| MASTER ANALYTICAL DATASET                                                         |
| 79,068 Sanctioned Base Works Linked across T1 - T6 (100% Non-Null Work IDs)       |
+-----------------------------------------------------------------------------------+
                                          |
        +-------------------------+-------+-------+-------------------------+
        |                         |               |                         |
        v                         v               v                         v
+---------------+       +---------------+   +---------------+       +---------------+
| MODULE 2:     |       | MODULE 3:     |   | MODULE 4:     |       | MODULE 5:     |
| Financial     |       | Sector/NLP    |   | Duplicate     |       | Compliance    |
| Anomaly       |       | Classifier    |   | NLP Engine    |       | Matrix        |
| Engine        |       | (TF-IDF + SVM)|   | (TF-IDF &     |       | (4 Rules)     |
| (IQR & ML)    |       |              |   | Cosine Sim)   |       |               |
+---------------+       +---------------+   +---------------+       +---------------+
        |                         |               |                         |
        +-------------------------+-------+-------+-------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| MASTER COMPOSITE RISK ENGINE                                                      |
| Score = (0.40 * Comp) + (0.35 * Fin) + (0.23 * Dup) + (0.02 * Material)             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| FASTAPI BACKEND REST SERVER (Port 8000)                                           |
| /api/overview | /api/risk-monitor | /api/work-detail | /api/duplicate-candidates    |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| REACT / TYPESCRIPT VISUAL INTELLIGENCE DASHBOARD (Port 3000)                       |
| Executive Overview | Audit Queue | 360° Detail | Duplicate Inspector | Analytics |
+-----------------------------------------------------------------------------------+
```

---

## 3. COMPLETE TECHNOLOGY STACK

### Backend & Analytical Layer
- **Python**: Primary language powering data cleaning, statistical modeling, machine learning, and API routing.
- **Pandas**: High-performance data manipulation, regex extraction, peer-group aggregation, and multi-dataset joining.
- **PyArrow / Parquet**: Columnar disk storage format for instant loading and saving of master feature files.
- **Scikit-Learn**: Executes Isolation Forest ML anomaly detection and TF-IDF n-gram text vectorization.
- **SciPy**: Computes Cosine Similarity matrices to detect duplicate work candidates within constituency blocks.
- **FastAPI**: Asynchronous web framework exposing high-performance REST API endpoints.
- **Uvicorn**: ASGI web server hosting the FastAPI application on port 8000.

### Frontend & UI Layer
- **React**: Component-driven library building the single-page visual intelligence interface.
- **TypeScript**: Static typing enforcing schema compliance across API service layers and UI components.
- **Next.js 15**: Production-grade React framework with App Router, server rendering, and fast dev server.
- **Tailwind CSS**: Utility-first CSS framework delivering modern dark-slate aesthetics and WCAG-compliant high-contrast inputs.
- **Recharts**: Data visualization library rendering interactive bar charts, state rankings, and logarithmic visual scaling.
- **Lucide React**: Iconography library providing public-sector appropriate iconography.

---

## 4. DATA FOUNDATION & PREPROCESSING PIPELINE

### Datasets Processed
1. **T1 (`data/raw/Allocated Limit for Honble MPs.csv`, 544 rows)**: MP entitlement ceilings.
2. **T2 (`data/raw/Amount consented for Calamity.csv`, 13 rows)**: Emergency calamity fund allocations.
3. **T3 (`data/raw/Works Recommended.csv`, 28,001 rows)**: Recommended works pipeline.
4. **T4 (`data/raw/Works Sanctioned.csv`, 79,068 rows)**: Master sanctioned works base.
5. **T5 (`data/raw/Works Completed.csv`, 12,001 rows)**: Completed project records.
6. **T6 (`data/raw/Expenditure on Completed and On-going Works as on Date.csv`, 45,001 rows)**: Payment disbursals and vendor transactions.

### Key Standardization Algorithms (`src/preprocessing/cleaner.py`)
- **Regex Work ID Extraction**: Standardized Work IDs extracted using regex pattern `r"(WS/[A-Za-z0-9\-_]+/\d{4}-\d{4}/\d+)"`.
- **Fallback Generator**: Sequential zero-padded identifiers (`WS/SANC/000001`) generated for raw records lacking formal IDs, ensuring **100% non-null unique Work IDs**.
- **Data Matching Rate**: Achieved **100% match rate** joining T6 expenditure records to T4 sanctioned base, and **98.3% match rate** for T5 completed works.

---

## 5. ANALYTICAL ENGINES & MATHEMATICAL FORMULAS

### Module 2: Financial Anomaly Engine (`src/modules/financial_anomaly.py`)
Identifies expenditure anomalies by comparing project costs against localized peer baselines.

1. **Description classification**: The description is normalized, related words are standardized/stemmed, and TF-IDF + linear SVM assigns the supplied sector and sub-sector taxonomy.
2. **Quantity-aware reference cost**: Explicit quantities, such as 9 poles, are multiplied by the reference per-unit cost and regional multiplier. Ambiguous subtypes use a reference range rather than an invented subtype.
3. **Peer Group Grouping**: Works are grouped by `(State, classified sector/sub-sector)`.
4. **Peer Ratio Formula**:
   $$\text{Peer Ratio} = \frac{\text{Sanction Budget}}{\text{Peer Group Median(State, Category)}}$$
5. **Interquartile Range (IQR) Outlier Upper Fence**:
   $$\text{IQR} = Q3 - Q1$$
   $$\text{Upper Bound} = Q3 + (1.5 \times \text{IQR})$$
6. **Financial risk decision**: A quantity-backed cost inside its valid reference range does not receive financial risk merely because the broad peer median is lower. Exceeding the valid reference maximum creates a financial signal; without a valid reference range, peer ratio, percentile, and IQR signals are used.
7. **Isolation Forest**: A secondary multivariate check uses sanction amount, effective expenditure, peer ratio, payment count, and expenditure-to-sanction ratio.
8. **Output**: The financial score is a review-priority indicator, not a finding of wrongdoing.

---

### Module 3: Sector and NLP Classification Engine (`src/modules/sector_classifier.py`)
Assigns every work to the supplied sector and sub-sector taxonomy from its description.

1. **Text normalization**: Related words are standardized and stemmed before vectorization.
2. **TF-IDF + linear SVM**: The classifier uses description features to assign sector and sub-sector.
3. **Output**: The assigned class and confidence become the financial peer-group keys.

---

### Module 4: Candidate Duplicate Work Engine (`src/modules/duplicate_detection.py`)
Detects candidate duplicate or highly similar works within the same constituency using NLP.

1. **Spatial Scoping**: Comparisons performed strictly within the same `(State, Constituency)` block.
2. **Text Normalization**: Lowercasing, stripping prefixes, removing punctuation, and whitespace normalization.
3. **TF-IDF N-Gram Vectorization**: Extracts unigrams and bigrams $(1, 2)$.
4. **Cosine Similarity Formula**:
   $$\text{Cosine Similarity}(\mathbf{A}, \mathbf{B}) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} \times 100$$
5. **Candidate Threshold**: Extracted **167,193 candidate duplicate pairs** with similarity match $\ge 70\%$.

---

### Module 5: Compliance Matrix Engine (`src/modules/compliance_engine.py`)
Evaluates the 12 NIRIKSHAN administrative, timing, progress, financial-consistency, and data-quality rules. C01, C02, C03, and C07 are critical; C04 is compliant; C06 is monitored. C02 checks the same normalized work description and constituency/location within 180 days. Image verification is optional and is not a failure by itself.

Rules evaluated: C01 recommendation-to-sanction delay; C02 repeat recommendation within 180 days; C03 completion under 15 days; C04 normal completion from 15 days to one year; C05 no progress after one year; C06 partial progress allowed to 18 months; C07 incomplete beyond 18 months; C08 date order; C09 expenditure consistency; C10 invalid financial data; C11 required fields; and C12 completion-status consistency.

---

## 6. MASTER COMPOSITE RISK MODEL (`src/risk/composite_risk_engine.py`)

Synthesizes all individual module outputs into an auditable Composite Risk Score (0 to 100):

$$\text{Composite Risk Score} = (0.40 \times S_{\text{compliance}}) + (0.35 \times S_{\text{financial}}) + (0.23 \times S_{\text{duplicate}}) + (0.02 \times S_{\text{material}})$$

### Risk Severity Cutoffs
- **LOW**: Score $0.0 - 34.99$ (74,117 Works) — Normal baseline.
- **MEDIUM**: Score $35.0 - 64.99$ (4,922 Works) — Moderate risk requiring routine review.
- **HIGH**: Score $65.0 - 84.99$ (29 Works) — Priority audit queue (peak composite scores 70.4 – 72.8).
- **CRITICAL**: Score $85.0 - 100.0$ (0 Overall Composite, 1,124 Financial Engine) — Severe multi-signal anomaly.

---

## 7. FASTAPI BACKEND SERVER (`src/backend/app.py`)

Runs asynchronously on `http://127.0.0.1:8000`:

| Endpoint | HTTP | Query / Path Params | Response Output |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | None | Backend status and total loaded projects (79,068). |
| `/api/overview` | GET | None | Portfolio financial summary, risk distribution, state rankings. |
| `/api/risk-monitor` | GET | `state`, `constituency`, `category`, `severity`, `search`, `page`, `limit` | Paginated priority audit queue records. |
| `/api/work-detail` | GET | `work_id` (Query or Path `{work_id:path}`) | Complete 360° project record, evidence breakdown, duplicate pairs. |
| `/api/duplicate-candidates` | GET | `state`, `constituency`, `min_similarity`, `page`, `limit` | Paginated pairwise duplicate candidate inspector data. |
| `/api/filters` | GET | None | Distinct states, categories, and severities for dropdowns. |

---

## 8. DASHBOARD PAGES & FEATURES (`frontend/src/pages/`)

1. **National Overview (`OverviewPage.tsx`)**: Executive KPIs (Allocated, Sanctioned, Disbursed, Review Cases), Log-Scaled System Risk Distribution Bar Chart, State Concentration Rankings (Count vs. Rate %).
2. **Risk Intelligence Monitor (`RiskMonitorPage.tsx`)**: Operational priority audit queue with multi-filter toolbar, high-contrast search bar, sortable table, and **Inspect** button triggers.
3. **360° Project Detail View (`ProjectDetailPage.tsx`)**: Complete analytical profile displaying overall score, 4 component cards, *"Why Flagged?"* Risk Evidence Panel (`RiskEvidencePanel.tsx`), and non-adjudicated review guidance.
4. **Candidate Duplicate Inspector (`DuplicatePage.tsx`)**: Side-by-side pairwise inspection comparing descriptions, sanction amounts, dates, and match percentage.
5. **Financial & Vendor Analytics (`AnalyticsPage.tsx`)**: Executive guide banners, metric cards, log-scaled budget outlier bar chart, and top vendor expenditure leaderboard.
6. **Compliance & Evidence Gaps (`CompliancePage.tsx`)**: Rule breakdown matrix and evidence gap analytics.
7. **Analytical Methodology (`MethodologyPage.tsx`)**: Mathematical transparency documentation exposing all formulas, IQR fences, HHI indices, and Cosine similarity equations.

---

## 9. SIH JURY PRESENTATION WALKTHROUGH (3-MINUTE FLOW)

1. **Step 1 — Portfolio Overview**: Open National Overview (`http://localhost:3000`). Highlight the **79,068 portfolio works**, **₹4,168 Crore sanctioned budget**, and **4,951 review cases**.
2. **Step 2 — Queue Filtering**: Click *Risk Intelligence Monitor*. Filter severity to `HIGH (65-84 Score)` to display top priority audit cases.
3. **Step 3 — Inspect Flagged Work**: Click **Inspect** on Work ID `WS/MP792/2024-2025/176431`.
4. **Step 4 — Present Evidence**: Show the *Risk Evidence Panel* explaining that the project budget (₹85.94 Lakh) is **$37.1\times$ higher than the peer group median** (₹2.32 Lakh) and sits in the top 0.1% percentile.
5. **Step 5 — Explain Methodology**: Open *Analytical Methodology* to demonstrate the description classification, quantity-aware reference cost, peer baseline, duplicate, compliance, and normalized composite calculations.
