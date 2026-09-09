export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface OverviewSummary {
  total_allocated_funds: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  total_works: number;
  completed_works: number;
  high_risk_works: number;
  critical_works: number;
}

export interface RiskDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface StateSummary {
  state: string;
  total_works: number;
  total_sanctioned: number;
  total_disbursed?: number;
  high_risk_works: number;
}

export interface CategorySummary {
  main_sector: string;
  total_works: number;
  total_sanctioned: number;
  high_risk_works: number;
}

export interface NationalOverviewResponse {
  summary: OverviewSummary;
  risk_distribution: RiskDistribution;
  top_states: StateSummary[];
  category_distribution?: CategorySummary[];
  ranking_label?: string;
}

export interface ExpenditureTrip {
  trip_number: number;
  work_id: string;
  vendor_name: string;
  expenditure_date: string;
  expenditure_amount: number;
  payment_status?: string;
  mp_name?: string;
  constituency?: string;
  state?: string;
}

export interface WorkRecord {
  work_id: string;
  work_category: string;
  main_sector?: string;
  State: string;
  Constituency: string;
  state?: string;
  constituency?: string;
  peer_category_median_amount?: number;
  mp_name: string;
  description: string;
  sanction_amount: number;
  effective_expenditure: number;
  completion_date?: string;
  sanction_date?: string;
  recommended_date?: string;
  has_evidence_image?: boolean;
  evidence_image_url?: string;
  top_vendor?: string;
  top_vendor_share?: number;
  expenditure_trips?: ExpenditureTrip[];
  financial_risk_score: number;
  financial_risk_level: string;
  financial_explanation: string;
  duplicate_risk_score: number;
  compliance_risk_score: number;
  compliance_risk_level: string;
  compliance_explanation: string;
  composite_risk_score: number;
  overall_risk_level: RiskLevel;
  explainable_audit_summary: string;
  recommended_reviewer_action: string;
  amount_to_peer_ratio?: number;
  category_percentile?: number;
  sanctioned_work_description?: string;
  recommended_work_description?: string;
  original_work_category?: string;
  ai_work_domain?: string;
  ai_work_category?: string;
  effective_work_category?: string;
  work_domain?: string;
  work_subcategory?: string;
  category_confidence?: number;
  category_confidence_band?: string;
  category_source?: string;
  classification_reason?: string;
  category_keywords_matched?: string[];
  peer_group_level?: string;
  peer_group_size?: number;
  peer_group_quality?: string;
  peer_group_median?: number;
  peer_percentile?: number;
  risk_reasons?: Array<Record<string, unknown>>;
}

export interface CandidateDuplicatePair {
  work_id_1: string;
  work_id_2: string;
  state: string;
  constituency: string;
  similarity_score: number;
  sanction_amount_1: number;
  sanction_amount_2: number;
  description_1: string;
  description_2: string;
  sanction_date_1?: string;
  sanction_date_2?: string;
  duplicate_risk_level: string;
  nlp_explanation: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  total_pages?: number;
  records: T[];
}

export interface FilterOptions {
  states: string[];
  constituencies?: string[];
  constituenciesByState?: Record<string, string[]>;
  categories: string[];
  severities: string[];
}

export interface WorkDetailResponse {
  work: WorkRecord;
  candidate_duplicates: CandidateDuplicatePair[];
}

export interface HealthResponse {
  status: string;
  total_projects_loaded: number;
}

export interface RiskQueueParams {
  role?: "national" | "state" | "constituency";
  state?: string;
  constituency?: string;
  category?: string;
  severity?: string;
  completion_status?: "completed" | "not_completed";
  search?: string;
  page?: number;
  limit?: number;
}

export interface DuplicateQueryParams {
  role?: "national" | "state" | "constituency";
  state?: string;
  constituency?: string;
  min_similarity?: number;
  page?: number;
  limit?: number;
}

export type DataSource = "api" | "dev-fallback";

export interface ApiResult<T> {
  data: T;
  source: DataSource;
}
