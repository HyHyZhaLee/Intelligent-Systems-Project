# Handwritten Digit OCR System - Backend API

FastAPI backend for the Handwritten Digit OCR System.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration management
│   ├── database.py             # Database connection & session
│   │
│   ├── core/
│   │   ├── security.py         # JWT, password hashing
│   │   ├── exceptions.py       # Custom exceptions
│   │   ├── logging.py          # Logging configuration
│   │   └── dependencies.py     # Shared dependencies (auth, db)
│   │
│   ├── module/
│   │   ├── auth/               # Authentication module
│   │   │   ├── auth_controller.py
│   │   │   ├── schemas.py
│   │   │   └── services/
│   │   │       └── auth_service.py
│   │   │
│   │   ├── predict/            # Prediction module
│   │   │   ├── predict_controller.py
│   │   │   ├── schemas.py
│   │   │   └── services/
│   │   │       └── predict_service.py
│   │   │
│   │   ├── models/             # Model management module
│   │   │   ├── models_controller.py
│   │   │   ├── schemas.py
│   │   │   └── services/
│   │   │       └── models_service.py
│   │   │
│   │   └── admin/             # Enterprise admin module
│   │       ├── admin_controller.py
│   │       ├── schemas.py
│   │       └── services/
│   │           └── admin_service.py
│   │
│   └── shared/
│       └── models/            # SQLAlchemy ORM models
│           ├── user.py
│           ├── audit_log.py
│           ├── batch_job.py
│           └── model_metadata.py
│
├── uploads/                    # Uploaded images (gitignored)
├── models/                     # Trained model files (.pkl)
├── logs/                       # Application logs
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `SECRET_KEY`: Change to a secure random string
- `API_KEY`: Set your API key for API authentication
- `DATABASE_URL`: SQLite by default (no changes needed for development)

### 3. Initialize Database

```bash
python -c "from app.database import init_db; init_db()"
```

Or run the FastAPI app once - it will create tables on first run.

### 4. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

### Prediction (`/api`)
- `POST /api/predict` - Single image prediction
- `POST /api/batch` - Batch image processing
- `GET /api/batch/{job_id}` - Get batch job status

### Model Management (`/api/models`)
- `GET /api/models` - List available models
- `GET /api/models/{model_id}` - Get model details
- `GET /api/models/{model_id}/metrics` - Get performance metrics
- `GET /api/models/{model_id}/confusion-matrix` - Get confusion matrix
- `GET /api/models/{model_id}/roc-curve` - Get ROC curve data
- `POST /api/models/{model_id}/tune` - Start hyperparameter optimization
- `GET /api/models/{model_id}/tune/{tune_id}` - Get optimization status
- `GET /api/models/{model_id}/export` - Download model .pkl file
- `POST /api/models/train` - Train new model

### Admin (`/api/admin`)
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{user_id}` - Update user
- `DELETE /api/admin/users/{user_id}` - Deactivate user
- `GET /api/admin/api-config` - Get API configuration
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/audit-logs/export` - Export audit logs to CSV
- `GET /api/admin/batch-jobs` - List batch jobs
- `GET /api/admin/batch-jobs/{job_id}` - Get batch job details

## Implementation Status

### ✅ Completed (Sprint 1 & 2)
- ✅ FastAPI project structure
- ✅ Database models and initialization
- ✅ Configuration management (.env)
- ✅ Error handling framework
- ✅ Logging system
- ✅ **Authentication service** (login, JWT generation, password verification)
- ✅ **User loading from database** in dependencies
- ✅ **ML model loading service** with caching
- ✅ **Image preprocessing** (resize, grayscale, normalize)
- ✅ **ML inference service** for predictions
- ✅ **Prediction endpoint** with real ML inference

### ⏳ In Progress / Pending
- ⏳ Model training script execution (needs MNIST dataset)
- ⏳ Audit logging for predictions
- ⏳ Model metrics calculation
- ⏳ User management CRUD operations
- ⏳ Batch processing
- ⏳ Model management endpoints (metrics, confusion matrix, ROC curves)
- ⏳ Admin endpoints (stats, audit logs, batch jobs)

## Development

### Adding New Endpoints

1. Add route to appropriate controller in `app/module/{module}/{module}_controller.py`
2. Define schemas in `app/module/{module}/schemas.py`
3. Implement business logic in `app/module/{module}/services/{module}_service.py`
4. Update database models if needed in `app/shared/models/`

### Database Migrations

For now, tables are created automatically via SQLAlchemy. For production, consider using Alembic for migrations.

### Testing

```bash
# Run tests (when implemented)
pytest

# Test specific endpoint
curl http://localhost:8000/health
```

## Notes

- All endpoints follow RESTful conventions
- Consistent response format: `{success: bool, data: {...}, timestamp: string}`
- Error responses: `{success: false, error: {code, message, details}}`
- JWT tokens in `Authorization: Bearer <token>` header
- API keys in `X-API-Key: <key>` header
- CORS configured for frontend origins

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize database:**
   ```bash
   python3 scripts/init_db.py
   ```
   This creates tables and sample users:
   - `datascientist@example.com` / `password123`
   - `admin@example.com` / `password123`

3. **Train model (optional, for testing):**
   ```bash
   python3 scripts/train_model.py
   ```
   This downloads MNIST dataset and trains an SVM model.

4. **Start server:**
   ```bash
   python3 -m uvicorn app.main:app --reload
   ```

5. **Test endpoints:**
   - Health: http://localhost:8000/health
   - Docs: http://localhost:8000/docs
   - Login: `POST /api/auth/login` with sample user credentials
   - Predict: `POST /api/predict` with an image file

## Next Steps

1. ✅ ~~Implement authentication service~~ - **DONE**
2. ✅ ~~Implement image preprocessing and ML inference~~ - **DONE**
3. ⏳ Implement model metrics calculation
4. ⏳ Implement user management CRUD operations
5. ⏳ Add audit logging
6. ⏳ Add unit tests
7. ⏳ Add integration tests
