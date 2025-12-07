# System Architecture Document
## Handwritten Digit OCR System

**Version:** 1.0  
**Date:** 2025-01-27  
**Status:** Draft  
**Author:** System Architect

---

## 1. Overview

This document describes a **simplified, lightweight architecture** for a university project - a Handwritten Digit OCR System. The architecture prioritizes **simplicity and ease of implementation** over scalability and advanced features.

### 1.1 Design Principles
- **Simplicity First**: Use minimal dependencies and straightforward patterns
- **Easy to Understand**: Clear structure that students can follow
- **Quick to Implement**: Focus on core functionality, defer advanced features
- **Self-Contained**: Minimal external services (no Redis, no Celery, no cloud storage)

### 1.2 System Scope
- **Frontend**: React application (already implemented)
- **Backend**: Python FastAPI application (to be built)
- **Database**: SQLite (single file, no server setup)
- **Storage**: Local filesystem (simple directories)
- **ML Models**: Pre-trained models loaded from files

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Already Implemented - No Changes Needed)              │
│  - WelcomeScreen.tsx                                    │
│  - EndUserUpload.tsx                                     │
│  - DataScientistDashboard.tsx                           │
│  - EnterprisePortal.tsx                                  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
                     │ (JSON requests/responses)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend (Python)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │  Auth    │  │ Predict  │  │  Models  │  │ Admin  ││
│  │  Module  │  │  Module  │  │  Module  │  │ Module ││
│  └──────────┘  └──────────┘  └──────────┘  └────────┘│
└──────┬───────────────────────────────────────────┬──────┘
       │                                           │
       ▼                                           ▼
┌──────────────┐                          ┌──────────────┐
│   SQLite     │                          │ Local Files  │
│   Database   │                          │ - uploads/   │
│   (app.db)   │                          │ - models/   │
└──────────────┘                          └──────────────┘
```

### 2.1 Component Responsibilities

**Frontend (React)**
- User interface and interactions
- API calls to backend
- State management (React hooks)
- No business logic

**Backend (FastAPI)**
- API endpoints (REST)
- Authentication (JWT)
- Business logic
- ML model inference
- Database operations

**SQLite Database**
- User accounts
- Audit logs
- Model metadata
- Batch job status

**Local Filesystem**
- Uploaded images (`uploads/`)
- Trained models (`models/*.pkl`)

---

## 3. Backend Architecture (Simplified)

### 3.1 Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app entry point
│   ├── config.py                  # Configuration (.env loading)
│   ├── database.py                # SQLite connection
│   │
│   ├── module/
│   │   ├── auth/
│   │   │   ├── auth-controller.py      # POST /api/auth/login
│   │   │   └── services/
│   │   │       └── auth-service.py     # Login logic, JWT generation
│   │   │
│   │   ├── predict/
│   │   │   ├── predict-controller.py   # POST /api/predict
│   │   │   └── services/
│   │   │       ├── predict-service.py  # Main prediction flow
│   │   │       ├── image-service.py    # Image preprocessing
│   │   │       └── ml-service.py       # ML model loading & inference
│   │   │
│   │   ├── models/
│   │   │   ├── models-controller.py    # GET /api/models, /api/models/{id}/metrics
│   │   │   └── services/
│   │   │       ├── models-service.py   # Model metadata from DB
│   │   │       └── metrics-service.py  # Calculate metrics from test data
│   │   │
│   │   └── admin/
│   │       ├── admin-controller.py      # GET /api/admin/users, /api/admin/stats
│   │       └── services/
│   │           ├── user-service.py     # User CRUD operations
│   │           └── stats-service.py    # System statistics
│   │
│   ├── shared/
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── audit_log.py
│   │   │   ├── batch_job.py
│   │   │   └── model_metadata.py
│   │   │
│   │   └── ml/                          # ML utilities
│   │       ├── model_loader.py          # Load .pkl models
│   │       ├── preprocessing.py         # Image preprocessing
│   │       └── evaluation.py            # Metrics calculation
│   │
│   └── core/
│       ├── security.py                  # JWT, password hashing
│       └── dependencies.py               # Auth dependency for routes
│
├── uploads/                              # User uploaded images
├── models/                               # Pre-trained .pkl model files
├── requirements.txt
├── .env                                  # Configuration
└── README.md
```

### 3.2 Module Pattern (Simple)

Each module follows this simple pattern:

```
module/{feature}/
├── {feature}-controller.py    # FastAPI routes (HTTP endpoints)
└── services/
    └── {feature}-service.py   # Business logic
```

**Example: Predict Module**
- `predict-controller.py`: Defines `POST /api/predict` endpoint
- `services/predict-service.py`: Orchestrates image preprocessing + ML inference
- `services/image-service.py`: Converts image to 28x28 grayscale array
- `services/ml-service.py`: Loads model, runs prediction

---

## 4. Data Flow

### 4.1 User Uploads Image (Simple Flow)

```
1. User uploads image (Frontend)
   ↓
2. POST /api/predict (multipart/form-data)
   ↓
3. predict-controller.py receives request
   ↓
4. image-service.py: Preprocess image (resize, grayscale, normalize)
   ↓
5. ml-service.py: Load model from file, predict digit
   ↓
6. Return JSON: {digit: 5, confidence: 0.95}
   ↓
7. Frontend displays result
```

### 4.2 User Logs In

```
1. User enters email/password (Frontend)
   ↓
2. POST /api/auth/login
   ↓
3. auth-controller.py receives credentials
   ↓
4. auth-service.py: Verify password, generate JWT
   ↓
5. Return JSON: {token: "jwt_token", user: {...}}
   ↓
6. Frontend stores token, navigates to dashboard
```

### 4.3 Data Scientist Views Metrics

```
1. Data scientist selects model (Frontend)
   ↓
2. GET /api/models/{model_id}/metrics
   ↓
3. models-controller.py receives request
   ↓
4. models-service.py: Load model metadata from DB
   ↓
5. metrics-service.py: Calculate metrics (if not cached)
   ↓
6. Return JSON: {accuracy: 0.985, precision: 0.986, ...}
   ↓
7. Frontend displays charts
```

---

## 5. Technology Stack (Minimal)

### 5.1 Backend Dependencies

**Core Framework**
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `python-multipart` - File uploads

**Database**
- `sqlalchemy` - ORM
- `sqlite3` - Built into Python (no install needed)

**Authentication**
- `python-jose[cryptography]` - JWT tokens
- `passlib[bcrypt]` - Password hashing

**ML**
- `scikit-learn` - SVM model (pre-trained)
- `numpy` - Array operations
- `Pillow` - Image processing

**Utilities**
- `pydantic` - Data validation (comes with FastAPI)
- `python-dotenv` - Load .env file

**Total: ~10 packages** (very minimal!)

### 5.2 No External Services Required
- ❌ No Redis (use in-memory dict for rate limiting)
- ❌ No Celery (use FastAPI background tasks if needed)
- ❌ No PostgreSQL (use SQLite)
- ❌ No S3/Cloud Storage (use local filesystem)
- ❌ No Message Queue (synchronous processing)

---

## 6. Database Schema (SQLite)

### 6.1 Tables (4 Simple Tables)

**users**
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'data-scientist' or 'enterprise'
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**model_metadata**
```sql
CREATE TABLE model_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_type VARCHAR(50) NOT NULL,  -- 'svm', 'random_forest', 'neural_network'
    model_path TEXT NOT NULL,         -- Path to .pkl file
    accuracy REAL,
    precision REAL,
    recall REAL,
    f1_score REAL,
    confusion_matrix TEXT,            -- JSON string
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
```

**audit_logs**
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    event_type VARCHAR(50) NOT NULL,  -- 'api', 'user', 'system'
    action VARCHAR(255) NOT NULL,
    details TEXT,                      -- JSON string
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**batch_jobs** (Optional - for future batch processing)
```sql
CREATE TABLE batch_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    total_images INTEGER NOT NULL,
    processed_images INTEGER DEFAULT 0,
    results_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 Database Setup
- Single file: `app.db` in backend directory
- No migrations needed initially (can add Alembic later if needed)
- Create tables on first run with simple SQL scripts

---

## 7. API Endpoints (Simplified)

### 7.1 Authentication
- `POST /api/auth/login` - Login, returns JWT token

### 7.2 Prediction
- `POST /api/predict` - Upload image, get digit prediction
  - Request: `multipart/form-data` with image file
  - Response: `{digit: 5, confidence: 0.95}`

### 7.3 Models (Data Scientist)
- `GET /api/models` - List all models
- `GET /api/models/{id}` - Get model details
- `GET /api/models/{id}/metrics` - Get performance metrics
- `GET /api/models/{id}/confusion-matrix` - Get confusion matrix
- `GET /api/models/{id}/roc-curve` - Get ROC curve data

### 7.4 Admin (Enterprise)
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/audit-logs` - Get audit logs

### 7.5 Authentication
- Most endpoints require JWT token in header: `Authorization: Bearer <token>`
- Guest endpoints (`/api/predict`) can be public or require API key from .env

---

## 8. ML Model Integration (Simple)

### 8.1 Model Storage
- Pre-trained models stored as `.pkl` files in `backend/models/`
- Example: `backend/models/svm_model.pkl`
- Models loaded once at startup, cached in memory

### 8.2 Model Loading (Simple Pattern)
```python
# ml-service.py
import pickle
import os

_model_cache = {}

def load_model(model_type: str):
    if model_type in _model_cache:
        return _model_cache[model_type]
    
    model_path = f"models/{model_type}_model.pkl"
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    _model_cache[model_type] = model
    return model

def predict(image_array):
    model = load_model("svm")
    prediction = model.predict(image_array)
    probabilities = model.predict_proba(image_array)
    confidence = probabilities.max()
    return prediction[0], confidence
```

### 8.3 Image Preprocessing (Simple)
```python
# image-service.py
from PIL import Image
import numpy as np

def preprocess_image(image_file):
    # 1. Open image
    img = Image.open(image_file)
    
    # 2. Convert to grayscale
    img = img.convert('L')
    
    # 3. Resize to 28x28 (MNIST standard)
    img = img.resize((28, 28))
    
    # 4. Convert to numpy array
    img_array = np.array(img)
    
    # 5. Normalize to [0, 1]
    img_array = img_array / 255.0
    
    # 6. Reshape to (1, 784) for model
    img_array = img_array.reshape(1, 784)
    
    return img_array
```

---

## 9. Configuration (.env)

Simple `.env` file:

```env
# Database
DATABASE_URL=sqlite:///./app.db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# API Key (for guest/public endpoints)
API_KEY=your-api-key-here

# File Paths
UPLOADS_DIR=./uploads
MODELS_DIR=./models

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 10. Implementation Steps (Simple Order)

### Phase 1: Basic Setup (Week 1)
1. Create FastAPI project structure
2. Set up SQLite database and tables
3. Create basic `main.py` with health check endpoint
4. Test: `curl http://localhost:8000/health`

### Phase 2: Authentication (Week 1-2)
1. Create `auth` module
2. Implement user model and password hashing
3. Implement login endpoint
4. Test: Login from frontend

### Phase 3: Prediction (Week 2)
1. Create `predict` module
2. Implement image upload endpoint
3. Implement image preprocessing
4. Load pre-trained SVM model
5. Implement prediction
6. Test: Upload image, get prediction

### Phase 4: Models Dashboard (Week 3)
1. Create `models` module
2. Implement model listing endpoint
3. Implement metrics calculation
4. Connect to frontend dashboard
5. Test: View metrics in Data Scientist dashboard

### Phase 5: Admin Features (Week 3-4)
1. Create `admin` module
2. Implement user management endpoints
3. Implement stats endpoint
4. Implement audit logging
5. Test: Manage users from Enterprise portal

### Phase 6: Polish (Week 4)
1. Error handling
2. Input validation
3. Testing
4. Documentation

---

## 11. File Structure Example

### 11.1 Main Entry Point
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="Digit OCR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from app.module.auth.auth_controller import router as auth_router
from app.module.predict.predict_controller import router as predict_router
from app.module.models.models_controller import router as models_router
from app.module.admin.admin_controller import router as admin_router

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(predict_router, prefix="/api/predict", tags=["predict"])
app.include_router(models_router, prefix="/api/models", tags=["models"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])

@app.get("/health")
def health():
    return {"status": "ok"}
```

### 11.2 Simple Controller Example
```python
# app/module/predict/predict_controller.py
from fastapi import APIRouter, UploadFile, File
from app.module.predict.services.predict_service import PredictService

router = APIRouter()
predict_service = PredictService()

@router.post("/")
async def predict_digit(file: UploadFile = File(...)):
    result = await predict_service.predict(file)
    return result
```

### 11.3 Simple Service Example
```python
# app/module/predict/services/predict_service.py
from app.module.predict.services.image_service import preprocess_image
from app.module.predict.services.ml_service import predict

class PredictService:
    async def predict(self, image_file):
        # Preprocess
        image_array = preprocess_image(image_file)
        
        # Predict
        digit, confidence = predict(image_array)
        
        return {
            "digit": int(digit),
            "confidence": float(confidence)
        }
```

---

## 12. Key Simplifications

### 12.1 What We're NOT Doing (For Simplicity)
- ❌ No database migrations (Alembic) - create tables with SQL scripts
- ❌ No complex caching - use simple in-memory dict
- ❌ No async file I/O - use synchronous file operations
- ❌ No background tasks - synchronous processing
- ❌ No rate limiting initially - add later if needed
- ❌ No model training UI - use pre-trained models
- ❌ No batch processing initially - single image only
- ❌ No hyperparameter tuning UI - use fixed models

### 12.2 What We ARE Doing (Core Features)
- ✅ User authentication (JWT)
- ✅ Image upload and prediction
- ✅ Model metrics display
- ✅ User management (CRUD)
- ✅ Audit logging
- ✅ System statistics

---

## 13. Deployment (Simple)

### 13.1 Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

### 13.2 Production (Simple)
```bash
# Use gunicorn with uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

No Docker needed initially - can add later if required.

---

## 14. Testing Strategy (Simple)

### 14.1 Manual Testing
- Test each endpoint with Postman/curl
- Test frontend integration
- Test user flows end-to-end

### 14.2 Unit Tests (Optional)
- Test service functions
- Test ML preprocessing
- Test authentication logic

### 14.3 Integration Tests (Optional)
- Test API endpoints
- Test database operations

**Note**: For a university project, manual testing is often sufficient. Add automated tests if time permits.

---

## 15. Common Pitfalls & Solutions

### 15.1 Image Preprocessing
**Problem**: Images not in correct format for model  
**Solution**: Always resize to 28x28, convert to grayscale, normalize to [0,1]

### 15.2 Model Loading
**Problem**: Model file not found  
**Solution**: Check `MODELS_DIR` path, ensure .pkl file exists

### 15.3 CORS Issues
**Problem**: Frontend can't call backend  
**Solution**: Configure CORS middleware with correct origins

### 15.4 Database Locking (SQLite)
**Problem**: Database locked errors  
**Solution**: Use connection pooling, avoid concurrent writes

---

## 16. Future Enhancements (If Time Permits)

These are **optional** and can be added later:
- Database migrations (Alembic)
- Model training UI
- Batch processing
- Rate limiting
- Docker containerization
- Unit tests
- API documentation (Swagger UI - auto-generated by FastAPI)

---

## 17. Summary

This architecture is designed to be:
- ✅ **Simple**: Minimal dependencies, straightforward patterns
- ✅ **Easy to Understand**: Clear module structure
- ✅ **Quick to Implement**: Focus on core features
- ✅ **Self-Contained**: No external services required
- ✅ **Perfect for University Projects**: Realistic but achievable

**Estimated Implementation Time**: 3-4 weeks for a team of 2-3 students

---

**Document Status**: ✅ Ready for Implementation
