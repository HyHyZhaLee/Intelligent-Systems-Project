"""
FastAPI Main Application Entry Point
Handwritten Digit OCR System Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.logging import setup_logging
import logging

# Initialize logging
setup_logging()
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Handwritten Digit OCR API",
    description="REST API for handwritten digit recognition using ML models",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup exception handlers
setup_exception_handlers(app)

# Include routers
from app.module.auth.auth_controller import router as auth_router
from app.module.predict.predict_controller import router as predict_router
from app.module.models.models_controller import router as models_router
from app.module.admin.admin_controller import router as admin_router

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(predict_router, prefix="/api", tags=["Prediction"])
app.include_router(models_router, prefix="/api/models", tags=["Models"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])


@app.on_event("startup")
async def startup_event():
    """
    Initialize services on app startup
    
    This includes loading or training the ML model:
    - If a pre-trained model exists on disk, it will be loaded (fast startup)
    - If no model exists, training will start in the background (5-8 minutes)
    - The API will be available immediately, but predictions will return 503 until training completes
    """
    from app.shared.ml.svm_service import SVMService
    
    logger.info("="*80)
    logger.info("🚀 Starting Handwritten Digit OCR API")
    logger.info("="*80)
    
    # Initialize SVM service - this will load model if exists
    logger.info("📦 Initializing ML model...")
    svm_service = SVMService()
    
    # Check if model needs training
    training_status = SVMService.get_training_status()
    if training_status == "not_started":
        # Start background training
        logger.info("🔧 No pre-trained model found. Starting background training...")
        logger.info("⏱️  Training will take approximately 6-8 minutes")
        logger.info("📊 Using 30,000 MNIST samples for training")
        logger.info("🌐 API is available now, but predictions will return 503 until training completes")
        logger.info("💡 Use GET /api/predict/status to check training progress")
        SVMService.start_background_training()
    elif training_status == "completed":
        logger.info("✅ Pre-trained model loaded successfully - Ready for predictions!")
        logger.info("📍 Model location: ISProject/backend/models/svm_model.pkl")
    else:
        logger.info(f"⚠️  SVM model status: {training_status}")
    
    logger.info("="*80)


@app.get("/health", tags=["Health Check"])
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "digit-ocr-api"}
