"""
SVM Service
Trains and caches SVM model for digit recognition using sklearn's digits dataset
"""
import numpy as np
from typing import Tuple, Optional
from sklearn import datasets
from sklearn.svm import SVC
from PIL import Image
import logging
import threading

logger = logging.getLogger(__name__)

# Thread-safe model cache
_model_lock = threading.Lock()
_model: Optional[SVC] = None


class SVMService:
    """SVM service for digit recognition"""
    
    def __init__(self):
        """Initialize SVM service, training model if not already cached"""
        global _model
        if _model is None:
            with _model_lock:
                # Double-check pattern to avoid race conditions
                if _model is None:
                    SVMService._train_model()
    
    @staticmethod
    def _train_model():
        """
        Train SVM model on sklearn digits dataset
        Upscales 8x8 images to 28x28 to match preprocessing format
        """
        global _model
        
        logger.info("Training SVM model on sklearn digits dataset...")
        
        try:
            # Load sklearn digits dataset (8x8 images, 10 classes 0-9)
            digits = datasets.load_digits()
            X_train = digits.data  # Shape: (1797, 64) - flattened 8x8 images
            y_train = digits.target  # Shape: (1797,) - labels 0-9
            
            logger.info(f"Loaded {len(X_train)} training samples")
            
            # Upscale 8x8 images to 28x28 to match preprocessing format
            X_train_28x28 = SVMService._upscale_images(X_train)
            
            logger.info("Training SVM classifier...")
            
            # Train SVM with RBF kernel and probability estimates
            _model = SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True,
                random_state=42
            )
            
            _model.fit(X_train_28x28, y_train)
            
            logger.info("SVM model training completed successfully")
            
        except Exception as e:
            logger.error(f"Error training SVM model: {str(e)}")
            raise ValueError(f"Failed to train SVM model: {str(e)}")
    
    @staticmethod
    def _upscale_images(images_8x8: np.ndarray) -> np.ndarray:
        """
        Upscale images from 8x8 to 28x28 using PIL
        
        Args:
            images_8x8: Array of shape (n_samples, 64) - flattened 8x8 images
        
        Returns:
            Array of shape (n_samples, 784) - flattened 28x28 images
        """
        n_samples = images_8x8.shape[0]
        images_28x28 = []
        
        for i in range(n_samples):
            # Reshape to 8x8
            img_8x8 = images_8x8[i].reshape(8, 8)
            
            # Normalize to 0-255 range (sklearn digits are 0-16)
            img_8x8 = (img_8x8 / 16.0 * 255.0).astype(np.uint8)
            
            # Convert to PIL Image
            pil_img = Image.fromarray(img_8x8, mode='L')
            
            # Upscale to 28x28 using LANCZOS resampling
            pil_img_28x28 = pil_img.resize((28, 28), Image.Resampling.LANCZOS)
            
            # Convert back to numpy array and normalize to [0, 1]
            img_28x28 = np.array(pil_img_28x28, dtype=np.float32) / 255.0
            
            # Flatten to (784,)
            images_28x28.append(img_28x28.flatten())
        
        return np.array(images_28x28)
    
    def predict(self, image_array: np.ndarray) -> Tuple[int, float]:
        """
        Predict digit from preprocessed image array
        
        Args:
            image_array: Preprocessed image array of shape (1, 784) or (784,)
        
        Returns:
            tuple: (predicted_digit, confidence_score)
                - predicted_digit: Integer from 0-9
                - confidence_score: Float from 0.0 to 1.0
        """
        global _model
        
        if _model is None:
            raise ValueError("SVM model not initialized. Call _train_model() first.")
        
        try:
            # Ensure correct shape: (1, 784)
            if image_array.ndim == 1:
                image_array = image_array.reshape(1, -1)
            elif image_array.shape[1] != 784:
                raise ValueError(f"Expected image array of shape (1, 784), got {image_array.shape}")
            
            # Run prediction
            prediction = _model.predict(image_array)
            predicted_digit = int(prediction[0])
            
            # Get confidence score using predict_proba
            probabilities = _model.predict_proba(image_array)
            confidence = float(probabilities[0][predicted_digit])
            
            logger.debug(f"Prediction: digit={predicted_digit}, confidence={confidence:.4f}")
            
            return predicted_digit, confidence
        
        except Exception as e:
            logger.error(f"Error during SVM prediction: {str(e)}")
            raise ValueError(f"Prediction failed: {str(e)}")
    
    @staticmethod
    def get_model_info() -> dict:
        """
        Get information about the cached model
        
        Returns:
            dict with model information
        """
        global _model
        
        if _model is None:
            return {"status": "not_trained"}
        
        return {
            "status": "trained",
            "kernel": _model.kernel,
            "C": _model.C,
            "gamma": str(_model.gamma),
            "n_support_vectors": len(_model.support_vectors_) if hasattr(_model, 'support_vectors_') else None
        }
