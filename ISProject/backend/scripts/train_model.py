"""
Script to train and save a pre-trained SVM model for digit recognition
Uses MNIST dataset from scikit-learn
"""
import os
import sys
import pickle
import numpy as np
from sklearn import svm
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import json

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import settings


def train_svm_model():
    """Train SVM model on MNIST dataset"""
    print("Loading MNIST dataset...")
    
    # Load MNIST dataset (this may take a few minutes on first run)
    # Using a subset for faster training
    mnist = fetch_openml('mnist_784', version=1, as_frame=False, parser='auto')
    
    # Use subset for faster training (use all 70k for production)
    # For quick setup, use 10k samples
    sample_size = 10000
    indices = np.random.choice(len(mnist.data), sample_size, replace=False)
    X = mnist.data[indices]
    y = mnist.target[indices].astype(int)
    
    print(f"Dataset loaded: {len(X)} samples")
    
    # Split into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    
    # Normalize pixel values to [0, 1]
    X_train = X_train / 255.0
    X_test = X_test / 255.0
    
    print("Training SVM model...")
    # Train SVM with RBF kernel (good for digit recognition)
    # Using smaller C and gamma for faster training
    model = svm.SVC(
        kernel='rbf',
        C=1.0,
        gamma='scale',
        random_state=42,
        probability=True  # Enable probability estimates for confidence scores
    )
    
    model.fit(X_train, y_train)
    
    print("Evaluating model...")
    # Evaluate on test set
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\nModel Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Calculate confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("\nConfusion Matrix:")
    print(cm)
    
    # Save model
    os.makedirs(settings.MODELS_DIR, exist_ok=True)
    model_path = os.path.join(settings.MODELS_DIR, "svm_model.pkl")
    
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"\nModel saved to: {model_path}")
    
    # Save metadata
    metadata = {
        "model_type": "svm",
        "kernel": "rbf",
        "C": 1.0,
        "gamma": "scale",
        "accuracy": float(accuracy),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "confusion_matrix": cm.tolist()
    }
    
    metadata_path = os.path.join(settings.MODELS_DIR, "svm_model_metadata.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"Metadata saved to: {metadata_path}")
    print("\n✅ Model training complete!")


if __name__ == "__main__":
    train_svm_model()
