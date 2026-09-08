# MPLADS AI Monitoring & Risk Intelligence Platform — Master System Specification

## 1. EXECUTIVE SUMMARY & SYSTEM CONTEXT

The **MPLADS AI Monitoring & Risk Intelligence Platform** is an evidence-driven, analytical decision-support system designed to assist government officials, financial auditors, and administrative authorities in monitoring funds allocated under the **Member of Parliament Local Area Development Scheme (MPLADS)**.

### Core System Philosophy
- **Decision Support, Not Legal Adjudication**: The platform acts as an early-warning monitoring system. It identifies statistical anomalies, expenditure outliers, vendor concentrations, candidate duplicate works, and compliance evidence gaps requiring human review.
- **Responsible AI Governance Language**: The system avoids non-adjudicated labels such as *"Fraud Detected"*, *"Corrupt Project"*, or *"Fraudulent Vendor"*. It uses strict governance terminology:
  - *Risk Indicator*
  - *Financial Risk*
  - *Vendor Risk*
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
| Financial     |       | Vendor Risk   |   | Duplicate     |       | Compliance    |
| Anomaly       |       | Engine        |   | NLP Engine    |       | Matrix        |
| Engine        |       | (Market Share |   | (TF-IDF &     |       | (4 Rules)     |
| (IQR & ML)    |       | & Bursts)     |   | Cosine Sim)   |       |               |
+---------------+       +---------------+   +---------------+       +---------------+
        |                         |               |                         |
        +-------------------------+-------+-------+-------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| MASTER COMPOSITE RISK ENGINE                                                      |
| Score = (0.35 * Fin) + (0.25 * Ven) + (0.25 * Dup) + (0.15 * Comp)                |
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

1. **Peer Group Grouping**: Works are grouped by `(State, Work Category)`.
2. **Peer Ratio Formula**:
   $$\text{Peer Ratio} = \frac{\text{Sanction Budget}}{\text{Peer Group Median(State, Category)}}$$
3. **Interquartile Range (IQR) Outlier Upper Fence**:
   $$\text{IQR} = Q3 - Q1$$
   $$\text{Upper Bound} = Q3 + (1.5 \times \text{IQR})$$
4. **Isolation Forest Machine Learning**: Unsupervised tree model trained on financial feature space `[sanction_amount, effective_expenditure, peer_ratio, max_payment, single_payment_share]`.
5. **Output**: Flagged **3,722 works with Financial Risk Score $\ge 65$**, including **1,124 CRITICAL cases ($\ge 85$)**.

---

### Module 3: Vendor Risk Engine (`src/modules/vendor_risk.py`)
Identifies contractor payment concentration and rapid disbursal behavior within parliamentary constituencies.

1. **Herfindahl-Hirschman Market Concentration Index (HHI)**:
   $$\text{HHI} = \sum_{i=1}^{n} \left(\frac{\text{Vendor Expenditure}_i}{\text{Constituency Total Expenditure}} \times 100\right)^2$$
2. **Payment Frequency Burst Detection**: Detects multiple payment disbursals released to the same vendor within a 7-day window.
3. **Single Disbursal Ratio**:
   $$\text{Single Disbursal Ratio} = \frac{\text{Maximum Payment}}{\text{Total Expenditure}} \times 100$$
4. **Output**: Flagged **1,120 works with High Vendor Risk Score $\ge 65$**.

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
Evaluates administrative and data-quality completeness against 4 deterministic rules.

1. **`RULE_COMP_01` (Missing Evidence Image)**: Completed work missing asset inspection photo (+40 points). Flagged **4,187 cases**.
2. **`RULE_COMP_02` (Chronological Sequence Violation)**: Sanction date recorded before recommendation, or completion before sanction (+50 points).
3. **`RULE_COMP_03` (Incomplete Description)**: Description string length $< 15$ characters (+25 points).
4. **`RULE_COMP_04` (Zero Expenditure Disbursal)**: Work marked completed but recorded expenditure $\le 0$ (+25 points).
5. **Formula**:
   $$\text{Compliance Risk Score} = \min\Big(100, \, (\text{R1} \times 40) + (\text{R2} \times 50) + (\text{R3} \times 25) + (\text{R4} \times 25)\Big)$$

---

## 6. MASTER COMPOSITE RISK MODEL (`src/risk/composite_risk_engine.py`)

Synthesizes all individual module outputs into an auditable Composite Risk Score (0 to 100):

$$\text{Composite Risk Score} = (0.35 \times S_{\text{financial}}) + (0.25 \times S_{\text{vendor}}) + (0.25 \times S_{\text{duplicate}}) + (0.15 \times S_{\text{compliance}})$$

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
5. **Step 5 — Explain Methodology**: Open *Analytical Methodology* to demonstrate complete mathematical transparency $(0.35 \cdot S_{\text{fin}} + 0.25 \cdot S_{\text{ven}} + 0.25 \cdot S_{\text{dup}} + 0.15 \cdot S_{\text{comp}})$.
