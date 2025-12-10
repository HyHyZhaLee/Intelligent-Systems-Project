"""
Model Management Controller
Handles all model-related endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.module.models.schemas import (
    ModelListResponse, ModelDetailResponse, MetricsResponse,
    ConfusionMatrixResponse, ROCCurveResponse,
    HyperparameterTuneRequest, HyperparameterTuneResponse,
    TrainModelRequest, TrainModelResponse
)
from app.module.models.services.models_service import ModelsService
from app.core.dependencies import get_current_data_scientist
from datetime import datetime

router = APIRouter()
models_service = ModelsService()


@router.get("", response_model=ModelListResponse, status_code=status.HTTP_200_OK)
async def list_models(
    db: Session = Depends(get_db)
):
    """
    List all available models
    
    Returns list of all models with basic information
    """
    # TODO: Implement model listing
    # models = await models_service.list_models(db)
    # return ModelListResponse(
    #     success=True,
    #     data=models,
    #     timestamp=datetime.utcnow().isoformat()
    # )
    
    return ModelListResponse(
        success=True,
        data=[
            {
                "id": 1,
                "model_type": "svm",
                "accuracy": 0.985,
                "precision": 0.986,
                "recall": 0.985,
                "f1_score": 0.985,
                "trained_at": datetime.utcnow(),
                "is_active": True
            }
        ],
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/{model_id}", response_model=ModelDetailResponse, status_code=status.HTTP_200_OK)
async def get_model_details(
    model_id: int,
    db: Session = Depends(get_db)
):
    """
    Get model details
    
    - **model_id**: Model identifier
    
    Returns detailed information about the model
    """
    # TODO: Implement model details retrieval
    return ModelDetailResponse(
        success=True,
        data={
            "id": model_id,
            "model_type": "svm",
            "hyperparameters": {"C": 1.0, "kernel": "rbf", "gamma": "scale"},
            "accuracy": 0.985,
            "precision": 0.986,
            "recall": 0.985,
            "f1_score": 0.985,
            "trained_at": datetime.utcnow().isoformat(),
            "is_active": True
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/{model_id}/metrics", response_model=MetricsResponse, status_code=status.HTTP_200_OK)
async def get_model_metrics(
    model_id: int,
    db: Session = Depends(get_db)
):
    """
    Get model performance metrics
    
    - **model_id**: Model identifier
    
    Returns accuracy, precision, recall, F1-score
    """
    # TODO: Implement metrics retrieval
    return MetricsResponse(
        success=True,
        data={
            "accuracy": 0.985,
            "precision": 0.986,
            "recall": 0.985,
            "f1_score": 0.985
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/{model_id}/confusion-matrix", response_model=ConfusionMatrixResponse, status_code=status.HTTP_200_OK)
async def get_confusion_matrix(
    model_id: int,
    db: Session = Depends(get_db)
):
    """
    Get confusion matrix data
    
    - **model_id**: Model identifier
    
    Returns 10x10 confusion matrix for digits 0-9
    """
    try:
        cm_data = await models_service.get_confusion_matrix(model_id, db)
        return ConfusionMatrixResponse(
            success=True,
            data=cm_data,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve confusion matrix: {str(e)}"
        )


@router.get("/{model_id}/roc-curve", response_model=ROCCurveResponse, status_code=status.HTTP_200_OK)
async def get_roc_curve(
    model_id: int,
    db: Session = Depends(get_db)
):
    """
    Get ROC curve data
    
    - **model_id**: Model identifier
    
    Returns ROC curve data for each digit class and micro/macro averages
    """
    # TODO: Implement ROC curve data retrieval
    return ROCCurveResponse(
        success=True,
        data={
            "curves": [
                {
                    "class": i,
                    "fpr": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                    "tpr": [0.0, 0.9, 0.95, 0.97, 0.98, 0.99, 0.99, 0.995, 0.998, 0.999, 1.0],
                    "auc": 0.99
                }
                for i in range(10)
            ],
            "micro_avg": {
                "fpr": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                "tpr": [0.0, 0.9, 0.95, 0.97, 0.98, 0.99, 0.99, 0.995, 0.998, 0.999, 1.0],
                "auc": 0.985
            },
            "macro_avg": {
                "fpr": [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                "tpr": [0.0, 0.9, 0.95, 0.97, 0.98, 0.99, 0.99, 0.995, 0.998, 0.999, 1.0],
                "auc": 0.984
            }
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/{model_id}/tune", response_model=HyperparameterTuneResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_hyperparameter_tuning(
    model_id: int,
    request: HyperparameterTuneRequest,
    current_user: dict = Depends(get_current_data_scientist),
    db: Session = Depends(get_db)
):
    """
    Start hyperparameter optimization
    
    - **model_id**: Model identifier
    - **hyperparameters**: Hyperparameters to tune
    - **optimization_method**: 'grid_search' or 'bayesian'
    
    Returns tune job ID for tracking optimization progress
    """
    # TODO: Implement hyperparameter tuning
    tune_id = f"tune_{model_id}_{datetime.utcnow().timestamp()}"
    return HyperparameterTuneResponse(
        success=True,
        data={
            "tune_id": tune_id,
            "status": "queued",
            "model_id": model_id
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/{model_id}/tune/{tune_id}", response_model=HyperparameterTuneResponse, status_code=status.HTTP_200_OK)
async def get_tuning_status(
    model_id: int,
    tune_id: str,
    current_user: dict = Depends(get_current_data_scientist),
    db: Session = Depends(get_db)
):
    """
    Get hyperparameter tuning status
    
    - **model_id**: Model identifier
    - **tune_id**: Tuning job identifier
    
    Returns current status and results of optimization
    """
    # TODO: Implement tuning status retrieval
    return HyperparameterTuneResponse(
        success=True,
        data={
            "tune_id": tune_id,
            "status": "processing",
            "progress": 45.0,
            "best_hyperparameters": None,
            "best_score": None
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/{model_id}/export", response_class=FileResponse, status_code=status.HTTP_200_OK)
async def export_model(
    model_id: int,
    current_user: dict = Depends(get_current_data_scientist),
    db: Session = Depends(get_db)
):
    """
    Export model as .pkl file
    
    - **model_id**: Model identifier
    
    Returns downloadable .pkl file with model weights and metadata
    """
    try:
        model_path = await models_service.export_model(model_id, db)
        
        # Get model type for filename (try to get from database, fallback to 'svm')
        from app.shared.models.model_metadata import ModelMetadata
        model_metadata = db.query(ModelMetadata).filter(
            ModelMetadata.id == model_id
        ).first()
        
        if model_metadata:
            model_type = model_metadata.model_type
        else:
            model_type = "svm"  # Default since we only support SVM currently
        
        filename = f"{model_type}_model_{model_id}.pkl"
        
        return FileResponse(
            path=model_path,
            filename=filename,
            media_type="application/octet-stream"
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export model: {str(e)}"
        )


@router.post("/train", response_model=TrainModelResponse, status_code=status.HTTP_202_ACCEPTED)
async def train_model(
    request: TrainModelRequest,
    current_user: dict = Depends(get_current_data_scientist),
    db: Session = Depends(get_db)
):
    """
    Train a new model
    
    - **model_type**: 'svm', 'random_forest', or 'neural_network'
    - **hyperparameters**: Optional hyperparameters
    - **dataset_path**: Optional path to custom dataset
    
    Returns training job ID
    """
    # TODO: Implement model training
    training_id = f"train_{request.model_type}_{datetime.utcnow().timestamp()}"
    return TrainModelResponse(
        success=True,
        data={
            "training_id": training_id,
            "status": "queued",
            "model_type": request.model_type
        },
        timestamp=datetime.utcnow().isoformat()
    )
