"""
SVM Service
Trains and caches SVM model for digit recognition using MNIST dataset
Supports model persistence to avoid retraining on every startup
Includes background training and feature scaling
"""
import numpy as np
from typing import Tuple, Optional
from sklearn.datasets import fetch_openml
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
import logging
import threading
import warnings
import pickle
import os
from pathlib import Path
from app.config import settings

logger = logging.getLogger(__name__)

# Suppress warnings from fetch_openml
warnings.filterwarnings('ignore', category=UserWarning)

# Thread-safe model cache
_model_lock = threading.Lock()
_model: Optional[SVC] = None
_scaler: Optional[StandardScaler] = None

# Training status tracking
_training_status_lock = threading.Lock()
_training_status = "not_started"  # not_started, in_progress, completed, failed

# Model file paths
MODEL_FILE = os.path.join(settings.MODELS_DIR, "svm_model.pkl")
SCALER_FILE = os.path.join(settings.MODELS_DIR, "svm_scaler.pkl")


class SVMService:
    """SVM service for digit recognition"""
    
    def __init__(self):
        """Initialize SVM service, loading saved model or starting background training"""
        global _model, _training_status
        
        if _model is None:
            with _model_lock:
                # Double-check pattern to avoid race conditions
                if _model is None:
                    # Try to load saved model first
                    if SVMService._load_model():
                        logger.info("Loaded pre-trained SVM model from disk")
                        with _training_status_lock:
                            _training_status = "completed"
                    else:
                        # Model doesn't exist, will be trained in background
                        logger.info("No saved model found, training will start in background")
                        with _training_status_lock:
                            _training_status = "not_started"
    
    @staticmethod
    def get_training_status() -> str:
        """
        Get current training status
        
        Returns:
            str: Training status - one of: not_started, in_progress, completed, failed
        """
        global _training_status
        with _training_status_lock:
            logger.debug(f"Training status requested: {_training_status}")
            return _training_status
    
    @staticmethod
    def start_background_training():
        """
        Start model training in a background thread
        This allows the app to start up immediately while training happens asynchronously
        """
        global _training_status
        
        with _training_status_lock:
            if _training_status == "in_progress":
                logger.info("Background training already in progress, skipping new request")
                return
            if _training_status == "completed":
                logger.info("Model already trained, skipping background training")
                return
            _training_status = "in_progress"
            logger.info("Training status set to in_progress")
        
        def train_in_background():
            """Background training function"""
            global _model, _scaler, _training_status
            
            try:
                logger.info("Background training thread started")
                SVMService._train_model()
                SVMService._save_model()
                
                with _training_status_lock:
                    _training_status = "completed"
                logger.info("Background training completed successfully, status set to completed")
            except Exception as e:
                logger.error(f"Background training failed: {str(e)}")
                with _training_status_lock:
                    _training_status = "failed"
                    logger.info("Training status set to failed due to error")
                # Reset model on failure
                with _model_lock:
                    _model = None
                    _scaler = None
                    logger.debug("Model and scaler reset after training failure")
        
        # Start training in background thread
        training_thread = threading.Thread(target=train_in_background, daemon=True)
        training_thread.start()
        logger.info("Background training thread started")
    
    @staticmethod
    def _load_model() -> bool:
        """
        Load saved model and scaler from disk
        
        Returns:
            True if model and scaler were loaded successfully, False otherwise
        """
        global _model, _scaler
        
        try:
            if os.path.exists(MODEL_FILE) and os.path.exists(SCALER_FILE):
                logger.info(f"Loading SVM model from {MODEL_FILE}...")
                with open(MODEL_FILE, 'rb') as f:
                    _model = pickle.load(f)
                
                logger.info(f"Loading scaler from {SCALER_FILE}...")
                with open(SCALER_FILE, 'rb') as f:
                    _scaler = pickle.load(f)
                
                logger.info("Model and scaler loaded successfully")
                return True
            else:
                if not os.path.exists(MODEL_FILE):
                    logger.info(f"No saved model found at {MODEL_FILE}")
                if not os.path.exists(SCALER_FILE):
                    logger.info(f"No saved scaler found at {SCALER_FILE}")
                return False
        except Exception as e:
            logger.warning(f"Failed to load saved model/scaler: {str(e)}")
            return False
    
    @staticmethod
    def _save_model():
        """Save trained model and scaler to disk"""
        global _model, _scaler
        
        if _model is None:
            logger.warning("Cannot save model: model is not trained")
            return
        
        if _scaler is None:
            logger.warning("Cannot save scaler: scaler is not fitted")
            return
        
        try:
            # Ensure models directory exists
            os.makedirs(settings.MODELS_DIR, exist_ok=True)
            
            logger.info(f"Saving SVM model to {MODEL_FILE}...")
            with open(MODEL_FILE, 'wb') as f:
                pickle.dump(_model, f)
            
            logger.info(f"Saving scaler to {SCALER_FILE}...")
            with open(SCALER_FILE, 'wb') as f:
                pickle.dump(_scaler, f)
            
            logger.info("Model and scaler saved successfully")
        except Exception as e:
            logger.error(f"Failed to save model/scaler: {str(e)}")
    
    @staticmethod
    def _train_model():
        """
        Train SVM model on MNIST dataset (real handwritten digits)
        Uses optimized hyperparameters and feature scaling for better accuracy
        """
        global _model, _scaler
        
        logger.info("Training SVM model on MNIST dataset...")
        
        try:
            # Load MNIST dataset (real handwritten digits, 28x28 images)
            # This downloads on first run and may take a few minutes
            # Using 'liac-arff' parser to avoid pandas dependency
            logger.info("Downloading/loading MNIST dataset from OpenML...")
            mnist = fetch_openml('mnist_784', version=1, as_frame=False, parser='liac-arff')
            
            X_full = mnist.data.astype(np.float32)
            y_full = mnist.target.astype(int)
            
            logger.info(f"MNIST dataset loaded: {len(X_full)} samples")
            
            # Use larger subset for better accuracy
            # Since training runs in background, we can use more samples
            # Increased to 20000 for significantly better accuracy
            # Training time will be longer (~5-8 minutes) but accuracy should improve to ~95-96%+
            # Using 20k samples provides good balance between accuracy and training time
            sample_size = 20000
            if len(X_full) > sample_size:
                # Use stratified sampling to ensure balanced classes
                from sklearn.model_selection import train_test_split
                X_subset, _, y_subset, _ = train_test_split(
                    X_full, y_full, 
                    train_size=sample_size, 
                    stratify=y_full,
                    random_state=42
                )
                X_train = X_subset
                y_train = y_subset
                logger.info(f"Using subset of {sample_size} samples for training (stratified)")
            else:
                X_train = X_full
                y_train = y_full
                logger.info("Dataset smaller than sample_size; using full dataset")
            
            # Normalize pixel values to [0, 1] (MNIST is already 0-255)
            X_train = X_train / 255.0
            
            # Apply feature scaling (StandardScaler) - critical for good performance
            # This standardizes features to have mean=0 and std=1
            logger.info("Fitting StandardScaler on training data...")
            _scaler = StandardScaler()
            X_train_scaled = _scaler.fit_transform(X_train)
            
            logger.info(f"Training SVM classifier on {len(X_train)} samples...")
            logger.info("Using optimized hyperparameters: C=10, gamma=0.001")
            logger.info(f"This may take 5-8 minutes depending on your system (training {len(X_train)} samples)...")
            
            # Train SVM with RBF kernel and optimized hyperparameters
            # Based on GridSearchCV results from lab notebook:
            # C=10, gamma=0.001 showed ~94% accuracy vs ~91% with defaults
            _model = SVC(
                kernel='rbf',
                C=10,  # Optimized from default 1.0
                gamma=0.001,  # Optimized from 'scale'
                probability=True,
                random_state=42,
                verbose=False
            )
            
            _model.fit(X_train_scaled, y_train)
            
            logger.info("SVM model training completed successfully")
            logger.info(f"Model trained on {len(X_train)} real handwritten digit samples from MNIST")
            logger.info("Feature scaling applied for improved accuracy")
            
        except Exception as e:
            logger.error(f"Error training SVM model: {str(e)}")
            logger.error("If this is the first run, MNIST dataset download may take a few minutes")
            raise ValueError(f"Failed to train SVM model: {str(e)}")
    
    
    def predict(self, image_array: np.ndarray) -> Tuple[int, float]:
        """
        Predict digit from preprocessed image array
        
        Args:
            image_array: Preprocessed image array of shape (1, 784) or (784,)
        
        Returns:
            tuple: (predicted_digit, confidence_score)
                - predicted_digit: Integer from 0-9
                - confidence_score: Float from 0.0 to 1.0
        
        Raises:
            ValueError: If model is not ready or training is in progress
        """
        global _model, _scaler, _training_status
        
        # Check training status
        with _training_status_lock:
            status = _training_status
        
        if status == "in_progress":
            logger.info("Prediction requested while training is in progress")
            raise ValueError("Model is currently training. Please wait for training to complete.")
        
        if status == "failed":
            logger.error("Prediction requested but training previously failed")
            raise ValueError("Model training failed. Please retry or check logs.")
        
        if _model is None or _scaler is None:
            if status == "not_started":
                logger.warning("Prediction requested before training started")
                raise ValueError("Model training has not started. Please wait.")
            logger.error("Prediction requested but model or scaler not initialized")
            raise ValueError("SVM model or scaler not initialized.")
        
        try:
            # Log input details
            logger.info(
                f"SVM prediction input - shape: {image_array.shape}, "
                f"ndim: {image_array.ndim}, "
                f"dtype: {image_array.dtype}, "
                f"min: {image_array.min():.4f}, max: {image_array.max():.4f}"
            )
            
            # Ensure correct shape: (1, 784)
            if image_array.ndim == 1:
                image_array = image_array.reshape(1, -1)
                logger.debug(f"Reshaped 1D array to 2D: {image_array.shape}")
            elif image_array.shape[1] != 784:
                logger.error(f"Invalid image array shape: {image_array.shape}, expected (1, 784) or (784,)")
                raise ValueError(f"Expected image array of shape (1, 784), got {image_array.shape}")
            
            # Validate shape before prediction
            if image_array.shape != (1, 784):
                logger.error(f"Final shape validation failed: {image_array.shape}, expected (1, 784)")
                raise ValueError(f"Image array must have shape (1, 784), got {image_array.shape}")
            
            # Apply feature scaling (same as training data)
            image_array_scaled = _scaler.transform(image_array)
            
            logger.debug("Applied feature scaling before prediction")
            
            # Run prediction
            logger.debug("Running SVM model prediction...")
            prediction = _model.predict(image_array_scaled)
            predicted_digit = int(prediction[0])
            
            # Get confidence score using predict_proba
            probabilities = _model.predict_proba(image_array_scaled)
            confidence = float(probabilities[0][predicted_digit])
            
            # Log full probability distribution for debugging
            logger.info(
                f"SVM prediction result - digit: {predicted_digit}, "
                f"confidence: {confidence:.4f}, "
                f"all probabilities: {probabilities[0]}"
            )
            
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
