// API Service Layer
// Base configuration and typed functions for all backend endpoints

const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to set auth token
const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Helper function to remove auth token
const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Base fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    // Handle backend error response format: { success: false, error: { message, code, ... } }
    const errorMessage = errorData?.error?.message || errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// File upload helper
async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    // Handle backend error response format: { success: false, error: { message, code, ... } }
    const errorMessage = errorData?.error?.message || errorData.detail || errorData.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// Authentication API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<import('../types/api').LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  logout: async () => {
    const response = await apiRequest<import('../types/api').LogoutResponse>(
      '/auth/logout',
      {
        method: 'POST',
      }
    );
    removeAuthToken();
    return response;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiRequest<import('../types/api').RefreshTokenResponse>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }
    );
    if (response.success && response.data.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  getCurrentUser: async () => {
    return apiRequest<import('../types/api').UserInfoResponse>('/auth/me');
  },
};

// Prediction API
export const predictApi = {
  predict: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<import('../types/api').PredictionResponse>('/predict', formData);
  },

  getTrainingStatus: async () => {
    return apiRequest<{ status: string; message: string; ready: boolean }>('/predict/status');
  },

  batchPredict: async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return apiUpload<import('../types/api').BatchJobResponse>('/batch', formData);
  },

  getBatchJobStatus: async (jobId: string) => {
    return apiRequest<import('../types/api').BatchJobStatusResponse>(`/batch/${jobId}`);
  },
};

// Models API
export const modelsApi = {
  listModels: async () => {
    return apiRequest<import('../types/api').ModelListResponse>('/models');
  },

  getModelDetails: async (modelId: number) => {
    return apiRequest<import('../types/api').ModelDetailResponse>(`/models/${modelId}`);
  },

  getModelMetrics: async (modelId: number) => {
    return apiRequest<import('../types/api').MetricsResponse>(`/models/${modelId}/metrics`);
  },

  getConfusionMatrix: async (modelId: number) => {
    return apiRequest<import('../types/api').ConfusionMatrixResponse>(`/models/${modelId}/confusion-matrix`);
  },

  getROCCurve: async (modelId: number) => {
    return apiRequest<import('../types/api').ROCCurveResponse>(`/models/${modelId}/roc-curve`);
  },

  startHyperparameterTuning: async (modelId: number, request: import('../types/api').HyperparameterTuneRequest) => {
    return apiRequest<import('../types/api').HyperparameterTuneResponse>(
      `/models/${modelId}/tune`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  },

  getTuningStatus: async (modelId: number, tuneId: string) => {
    return apiRequest<import('../types/api').HyperparameterTuneResponse>(`/models/${modelId}/tune/${tuneId}`);
  },

  exportModel: async (modelId: number) => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/models/${modelId}/export`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to export model: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_${modelId}.pkl`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  trainModel: async (request: import('../types/api').TrainModelRequest) => {
    return apiRequest<import('../types/api').TrainModelResponse>(
      '/models/train',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  },
};

// Admin API
export const adminApi = {
  getSystemStats: async () => {
    return apiRequest<import('../types/api').SystemStatsResponse>('/admin/stats');
  },

  listUsers: async (params?: { role?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);
    const query = queryParams.toString();
    return apiRequest<import('../types/api').UserListResponse>(`/admin/users${query ? `?${query}` : ''}`);
  },

  createUser: async (userData: import('../types/api').UserCreate) => {
    return apiRequest<import('../types/api').UserResponse>(
      '/admin/users',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
  },

  updateUser: async (userId: number, userData: import('../types/api').UserUpdate) => {
    return apiRequest<import('../types/api').UserResponse>(
      `/admin/users/${userId}`,
      {
        method: 'PUT',
        body: JSON.stringify(userData),
      }
    );
  },

  deactivateUser: async (userId: number) => {
    return apiRequest<{ success: boolean; message: string; timestamp: string }>(
      `/admin/users/${userId}`,
      {
        method: 'DELETE',
      }
    );
  },

  getAPIConfig: async () => {
    return apiRequest<import('../types/api').APIConfigResponse>('/admin/api-config');
  },

  getAuditLogs: async (params?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
    event_type?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.event_type) queryParams.append('event_type', params.event_type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    const query = queryParams.toString();
    return apiRequest<import('../types/api').AuditLogsResponse>(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },

  exportAuditLogs: async (params?: {
    start_date?: string;
    end_date?: string;
    user_id?: number;
    event_type?: string;
  }) => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params?.event_type) queryParams.append('event_type', params.event_type);
    const query = queryParams.toString();

    const response = await fetch(`${API_BASE_URL}/admin/audit-logs/export${query ? `?${query}` : ''}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to export audit logs: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  listBatchJobs: async (params?: { status?: string; page?: number; page_size?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    const query = queryParams.toString();
    return apiRequest<import('../types/api').BatchJobsListResponse>(`/admin/batch-jobs${query ? `?${query}` : ''}`);
  },

  getBatchJobDetails: async (jobId: string) => {
    return apiRequest<import('../types/api').BatchJobDetailResponse>(`/admin/batch-jobs/${jobId}`);
  },
};

// Export token management functions
export { getAuthToken, setAuthToken, removeAuthToken };
