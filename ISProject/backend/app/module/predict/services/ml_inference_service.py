"""
ML Inference Service
Handles ML model predictions
"""
import numpy as np
from typing import Tuple
from app.shared.ml.svm_service import SVMService
import logging

logger = logging.getLogger(__name__)


def predict_digit(image_array: np.ndarray, model_type: str = "svm") -> Tuple[int, float, list]:
    """
    Predict digit from preprocessed image array
    
    Args:
        image_array: Preprocessed image array of shape (1, 784)
        model_type: Type of model to use ('svm', 'random_forest', 'neural_network')
    
    Returns:
        tuple: (predicted_digit, confidence_score, alternatives)
            - predicted_digit: Integer from 0-9
            - confidence_score: Float from 0.0 to 1.0
            - alternatives: List of top-3 alternative predictions with confidence
    """
    try:
        # Validate input array
        if image_array is None:
            logger.error("Image array is None")
            raise ValueError("Image array cannot be None")
        
        logger.info(
            f"ML inference - model_type: {model_type}, "
            f"input shape: {image_array.shape}, "
            f"input dtype: {image_array.dtype}"
        )
        
        # Use SVM service for SVM model type (default)
        if model_type == "svm" or model_type is None:
            svm_service = SVMService()
            predicted_digit, confidence, probabilities = svm_service.predict(image_array)
            
            # Get top-3 alternatives (excluding the primary prediction)
            prob_with_idx = [(idx, prob) for idx, prob in enumerate(probabilities)]
            prob_with_idx.sort(key=lambda x: x[1], reverse=True)
            
            # Get top 3 (including primary)
            top_3 = prob_with_idx[:3]
            alternatives = [
                {"digit": int(digit), "confidence": float(prob)}
                for digit, prob in top_3
            ]
            
            logger.info(
                f"ML inference result - digit: {predicted_digit}, "
                f"confidence: {confidence:.4f} ({confidence*100:.2f}%), "
                f"alternatives: {alternatives}"
            )
            return predicted_digit, confidence, alternatives
        else:
            # For other model types, would need model files (not implemented yet)
            logger.error(f"Unsupported model type: {model_type}")
            raise ValueError(f"Model type '{model_type}' not supported. Only 'svm' is currently available.")
    
    except Exception as e:
        logger.error(
            f"Error during ML inference - model_type: {model_type}, "
            f"error: {str(e)}, "
            f"type: {type(e).__name__}"
        )
        raise ValueError(f"Prediction failed: {str(e)}")
