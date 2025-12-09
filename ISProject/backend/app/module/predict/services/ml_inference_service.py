"""
ML Inference Service
Handles ML model predictions
"""
import numpy as np
from typing import Tuple
from app.shared.ml.model_loader import load_model
import logging

logger = logging.getLogger(__name__)


def predict_digit(image_array: np.ndarray, model_type: str = "svm") -> Tuple[int, float]:
    """
    Predict digit from preprocessed image array
    
    Args:
        image_array: Preprocessed image array of shape (1, 784)
        model_type: Type of model to use ('svm', 'random_forest', 'neural_network')
    
    Returns:
        tuple: (predicted_digit, confidence_score)
            - predicted_digit: Integer from 0-9
            - confidence_score: Float from 0.0 to 1.0
    """
    try:
        # Load model
        model = load_model(model_type)
        
        # Run prediction
        prediction = model.predict(image_array)
        predicted_digit = int(prediction[0])
        
        # Get confidence score (probability)
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(image_array)
            confidence = float(probabilities[0][predicted_digit])
        else:
            # For models without predict_proba, use decision function or default confidence
            if hasattr(model, 'decision_function'):
                decision_scores = model.decision_function(image_array)
                # Normalize decision score to [0, 1] range (simple approach)
                max_score = decision_scores.max()
                min_score = decision_scores.min()
                if max_score != min_score:
                    confidence = float((decision_scores[0][predicted_digit] - min_score) / (max_score - min_score))
                else:
                    confidence = 0.5
            else:
                # Default confidence if no probability method available
                confidence = 0.9
        
        logger.info(f"Prediction: digit={predicted_digit}, confidence={confidence:.4f}")
        
        return predicted_digit, confidence
    
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise ValueError(f"Prediction failed: {str(e)}")
