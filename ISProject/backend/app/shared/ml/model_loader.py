"""
Model Loader
Loads and caches ML models from disk
"""
import pickle
import os
from typing import Optional, Dict, Any
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Global model cache
_model_cache: Dict[str, Any] = {}


def load_model(model_type: str = "svm", force_reload: bool = False):
    """
    Load ML model from file with caching
    
    Args:
        model_type: Type of model ('svm', 'random_forest', 'neural_network')
        force_reload: Force reload even if cached
    
    Returns:
        Loaded model object
    """
    # Check cache first
    if not force_reload and model_type in _model_cache:
        logger.info(f"Loading {model_type} model from cache")
        return _model_cache[model_type]
    
    # Construct model path
    model_filename = f"{model_type}_model.pkl"
    model_path = os.path.join(settings.MODELS_DIR, model_filename)
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found: {model_path}. "
            f"Please train and save a model first using the setup script."
        )
    
    # Load model
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Cache the model
        _model_cache[model_type] = model
        logger.info(f"Loaded {model_type} model from {model_path}")
        return model
    
    except Exception as e:
        logger.error(f"Error loading model from {model_path}: {str(e)}")
        raise


def clear_model_cache():
    """Clear the model cache"""
    global _model_cache
    _model_cache.clear()
    logger.info("Model cache cleared")
