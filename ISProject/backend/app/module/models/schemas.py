"""
Model Management Schemas
"""
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class ModelInfo(BaseModel):
    id: int
    model_type: str
    accuracy: Optional[float]
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    trained_at: datetime
    is_active: bool


class ModelListResponse(BaseModel):
    success: bool
    data: List[ModelInfo]
    timestamp: str


class ModelDetailResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str


class MetricsResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "accuracy": 0.985,
                    "precision": 0.986,
                    "recall": 0.985,
                    "f1_score": 0.985
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class ConfusionMatrixResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "matrix": [[100, 0, 0, ...], [0, 95, 0, ...], ...],
                    "labels": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class ROCCurveResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "curves": [
                        {"class": 0, "fpr": [0, 0.1, ...], "tpr": [0, 0.9, ...], "auc": 0.99},
                        {"class": 1, "fpr": [0, 0.1, ...], "tpr": [0, 0.95, ...], "auc": 0.98},
                        ...
                    ],
                    "micro_avg": {"fpr": [...], "tpr": [...], "auc": 0.985},
                    "macro_avg": {"fpr": [...], "tpr": [...], "auc": 0.984}
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class HyperparameterTuneRequest(BaseModel):
    hyperparameters: Dict[str, any]
    optimization_method: str = "grid_search"  # 'grid_search' or 'bayesian'


class HyperparameterTuneResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str


class TrainModelRequest(BaseModel):
    model_type: str  # 'svm', 'random_forest', 'neural_network'
    hyperparameters: Optional[Dict[str, any]] = None
    dataset_path: Optional[str] = None


class TrainModelResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
