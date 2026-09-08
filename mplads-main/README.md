# MPLADS AI-Powered Monitoring, Anomaly Detection & Risk Intelligence Platform

## SIH Prototype Architecture

An AI-powered monitoring and decision-support platform designed to analyze administrative, financial, project, and evidence data from the Members of Parliament Local Area Development Scheme (MPLADS).

### Repository Structure

```
project/
├── data/
│   ├── raw/          # Original, untouched CSV/Excel datasets (T1 to T6)
│   ├── processed/    # Cleaned, normalized, and validated data
│   └── features/     # Feature-engineered analytical datasets
├── docs/             # Technical specifications & data dictionaries
├── models/           # Trained models and vector index artifacts
├── notebooks/        # Data exploration and prototyping notebooks
├── outputs/          # Generated risk reports, metrics, and alerts
├── src/
│   ├── data/         # Data loading and ingestion scripts
│   ├── preprocessing/# Data cleaning, type parsing, and validation
│   ├── features/     # Feature extraction engines
│   ├── modules/      # Core analytical engines (financial, vendor, duplicate, compliance)
│   ├── risk/         # Composite risk scoring and alert generation
│   └── utils/        # Common helpers and logging utilities
└── tests/            # Automated test suite
```

### Module Development Pipeline
1. **Module 1**: Data Foundation & Preprocessing
2. **Module 2**: Financial & Expenditure Anomaly Detection
3. **Module 3**: Vendor & Payment Risk Analysis
4. **Module 4**: Potential Duplicate / Similar Work Detection (NLP)
5. **Module 5**: Compliance & Data-Quality Monitoring
6. **Module 6**: Risk Engine, Explainability & Alert Engine
7. **Module 7**: Backend API & Visual Dashboard
