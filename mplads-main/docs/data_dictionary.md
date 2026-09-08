# Comprehensive Data Dictionary & Schema Report

## MPLADS AI Monitoring Platform — Raw Dataset Profiling Report

---

### Dataset Summary Overview

| ID | Dataset Name | Raw File Name | Row Count | Key Identified Schema & Primary Role |
| :--- | :--- | :--- | :--- | :--- |
| **T1** | Allocated Limit for MPs | `Allocated Limit for Honble MPs.csv` | 544 | MP Fund Allocation Ceiling Baseline |
| **T2** | Consented for Calamity | `Amount consented for Calamity.csv` | 13 | Calamity Special Purpose Fund Approvals |
| **T3** | Works Recommended | `Works Recommended.csv` | 28,001 | Recommended Works, Rec. Dates & Amounts |
| **T4** | Works Sanctioned | `Works Sanctioned.csv` | 79,068 | Approved Budget, Sanction Dates & Work Status |
| **T5** | Works Completed | `Works Completed.csv` | 12,001 | Completion Dates, Evidence Images & Descriptions |
| **T6** | Expenditure Records | `Expenditure on Completed and On-going Works as on Date (1).csv` | 45,001 | Disbursal Transactions, Vendor Names & Dates |

---

### Relational Key Discovery: `Work ID` Extraction
Across **T3**, **T4**, **T5**, and **T6**, work identifiers follow a standard pattern:
* **In T6**: Dedicated column `Work ID` (e.g., `WS/MP18218/2025-2026/233777`).
* **In T3, T4, T5**: Embedded in the `Work` column (e.g., `WS/MP418/2024-2025/133409-Construction of roads...`).

**Extraction Rule**: Regex pattern `r"(WS/[A-Z0-9/-]+)"` reliably extracts the clean `work_id`, enabling deterministic joins across the entire project lifecycle!

---

### Detailed Dataset Specifications

#### 1. Dataset T1: `Allocated Limit for Honble MPs.csv`
* **Target Entity**: MP Fund Allocations per Constituency (544 records)
* **Fields**:
  - `Sr. No.` (String)
  - `State` (Categorical String)
  - `Hon'ble Members of Parliaments` (String)
  - `Constituency` (String)
  - `Allocated AMOUNT ( ₹ )` (Numeric Float)

#### 2. Dataset T2: `Amount consented for Calamity.csv`
* **Target Entity**: Calamity Fund Approvals (13 records)
* **Fields**:
  - `Calamity Type` (`National Calamity` / `State Calamity`)
  - `Calamity Name`, `Hon'ble Members of Parliament`, `Date of Consent`, `Consent Amount ( ₹ )`

#### 3. Dataset T3: `Works Recommended.csv`
* **Target Entity**: Recommended Works (28,001 records)
* **Fields**:
  - `Work category` (String)
  - `WORK` (Contains embedded `Work ID` + Category Title)
  - `State`, `IDA`, `Hon'ble Members of Parliament`, `Constituency`
  - `Work description` (Text description for NLP processing)
  - `Recommended date` (Date string `%d-%b-%Y`)
  - `RECOMMENDED AMOUNT ( ₹ )` (Numeric Float)
  - `Sanction Date` (Date string)

#### 4. Dataset T4: `Works Sanctioned.csv`
* **Target Entity**: Approved Works & Budget Ceilings (79,068 records)
* **Fields**:
  - `Work category`, `Work`, `State`, `IDA`, `Hon'ble Members of Parliament`, `Constituency`
  - `Work description`
  - `Recommended date`, `Sanction Date`
  - `Sanction Amount ( ₹ )` (Approved Project Budget)
  - `Work Status` (`Sanction`, `Physical Inspection`, `Work partially Completed`)

#### 5. Dataset T5: `Works Completed.csv`
* **Target Entity**: Asset Creation & Evidence Verification (12,001 records)
* **Fields**:
  - `Work Category`, `Work`, `State`, `IDA`, `Work Description`
  - `Hon'ble Members of Parliament`, `Constituency`
  - `Image` (Evidence presence marker / status)
  - `Completion Date`
  - `Amount Disbursed ( ₹ )`

#### 6. Dataset T6: `Expenditure on Completed and On-going Works.csv`
* **Target Entity**: Financial Disbursal Transactions (45,001 records)
* **Fields**:
  - `State`, `Work`, `Work ID` (Primary Foreign Key)
  - `IDA` (Implementing District Authority)
  - `Hon'ble Members of Parliament`, `Constituency`
  - `Expenditure Date`
  - `Vendor Name` (Vendor Risk & Concentration Target)
  - `Payment Status` (`Payment Success`, `Payment In-Progress`)
  - `Fund Disbursed Amount ( ₹ )` (Disbursal Transaction Value)
