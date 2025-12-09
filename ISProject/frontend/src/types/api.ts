// Type definitions matching backend schemas

// Base response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponseData {
  token: string;
  refresh_token?: string;
  user: UserInfo;
}

export type LoginResponse = ApiResponse<LoginResponseData>;

export interface LogoutResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponseData {
  token: string;
}

export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseData>;

export type UserInfoResponse = ApiResponse<UserInfo>;

// Prediction Types
export interface PredictionData {
  digit: number;
  confidence: number;
  processing_time_ms: number;
}

export type PredictionResponse = ApiResponse<PredictionData>;

export interface BatchJobData {
  job_id: string;
  status: string;
  total_images: number;
}

export type BatchJobResponse = ApiResponse<BatchJobData>;

export interface BatchJobStatusData {
  job_id: string;
  status: string;
  total_images: number;
  processed_images: number;
  progress_percentage: number;
}

export type BatchJobStatusResponse = ApiResponse<BatchJobStatusData>;

// Model Types
export interface ModelInfo {
  id: number;
  model_type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  trained_at: string;
  is_active: boolean;
}

export type ModelListResponse = ApiResponse<ModelInfo[]>;

export interface ModelDetailData extends ModelInfo {
  hyperparameters: Record<string, any>;
}

export type ModelDetailResponse = ApiResponse<ModelDetailData>;

export interface MetricsData {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export type MetricsResponse = ApiResponse<MetricsData>;

export interface ConfusionMatrixData {
  matrix: number[][];
  labels: number[];
}

export type ConfusionMatrixResponse = ApiResponse<ConfusionMatrixData>;

export interface ROCCurvePoint {
  fpr: number;
  tpr: number;
}

export interface ROCCurveData {
  curves: Array<{
    class: number;
    fpr: number[];
    tpr: number[];
    auc: number;
  }>;
  micro_avg: {
    fpr: number[];
    tpr: number[];
    auc: number;
  };
  macro_avg: {
    fpr: number[];
    tpr: number[];
    auc: number;
  };
}

export type ROCCurveResponse = ApiResponse<ROCCurveData>;

export interface HyperparameterTuneRequest {
  hyperparameters?: Record<string, any>;
  optimization_method?: string;
}

export interface HyperparameterTuneData {
  tune_id: string;
  status: string;
  model_id: number;
  progress?: number;
  best_hyperparameters?: Record<string, any>;
  best_score?: number;
}

export type HyperparameterTuneResponse = ApiResponse<HyperparameterTuneData>;

export interface TrainModelRequest {
  model_type: string;
  hyperparameters?: Record<string, any>;
  dataset_path?: string;
}

export interface TrainModelData {
  training_id: string;
  status: string;
  model_type: string;
}

export type TrainModelResponse = ApiResponse<TrainModelData>;

// Admin Types
export interface SystemStatsData {
  images_processed_today: number;
  success_rate: number;
  error_count: number;
  active_users: number;
}

export type SystemStatsResponse = ApiResponse<SystemStatsData>;

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export type UserListResponse = ApiResponse<AdminUser[]>;

export interface UserCreate {
  email: string;
  name: string;
  role: string;
  password?: string;
}

export interface UserUpdate {
  email?: string;
  name?: string;
  role?: string;
  is_active?: boolean;
}

export type UserResponse = ApiResponse<AdminUser>;

export interface APIConfigData {
  api_base_url: string;
  api_key_configured: boolean;
  rate_limit: number;
  endpoints: Array<{
    path: string;
    method: string;
    description: string;
  }>;
}

export type APIConfigResponse = ApiResponse<APIConfigData>;

export interface AuditLog {
  id?: number;
  timestamp: string;
  user_id?: number;
  user_email?: string;
  action: string;
  event_type: string;
  details?: string;
}

export interface AuditLogsData {
  logs: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type AuditLogsResponse = ApiResponse<AuditLogsData>;

export interface BatchJobDetailData {
  job_id: string;
  status: string;
  total_images: number;
  processed_images: number;
  created_at: string;
  completed_at?: string;
}

export type BatchJobDetailResponse = ApiResponse<BatchJobDetailData>;

export type BatchJobsListResponse = ApiResponse<BatchJobDetailData[]>;
