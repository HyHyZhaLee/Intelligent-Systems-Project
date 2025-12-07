# Product Requirements Document (PRD)
## Handwritten Digit OCR System

**Version:** 1.1  
**Date:** 2025-01-27  
**Status:** Draft  
**Author:** Product Manager

---

## 1. Executive Summary

### 1.1 Product Vision
Build a production-ready, multi-tenant Handwritten Digit OCR System that enables end users to upload images for instant digit recognition, provides data scientists with comprehensive model analysis and tuning capabilities, and offers enterprise administrators full system control and API access.

### 1.2 Business Objectives
- **Primary Goal**: Deliver a scalable, AI-powered digit recognition service that serves three distinct user personas with role-appropriate functionality
- **Success Metrics**:
  - End-to-end prediction accuracy ≥ 95%
  - API response time < 500ms for single image predictions
  - System uptime ≥ 99.5%
  - Support for 10,000+ requests/minute
  - User satisfaction score ≥ 4.5/5.0

### 1.3 Target Users
1. **End Users (Guest)**: Casual users needing quick digit recognition
2. **Data Scientists**: ML practitioners requiring model insights, tuning, and experimentation
3. **Enterprise Administrators**: Organizations needing API access, user management, and system monitoring

---

## 2. Problem Statement

### 2.1 Current State
- Frontend UI is fully implemented with three role-based interfaces
- All functionality currently uses mock data - no backend integration exists
- No actual ML model inference is performed
- No authentication or authorization system
- No API endpoints for programmatic access

### 2.2 Why This Matters
**For End Users**: Without backend integration, users cannot actually recognize digits from uploaded images, making the product non-functional.

**For Data Scientists**: Without real model metrics and training capabilities, data scientists cannot improve model performance or make data-driven decisions.

**For Enterprises**: Without API access and user management, organizations cannot integrate the service into their workflows or manage team access.

### 2.3 Success Criteria
- Users can upload images and receive accurate digit predictions
- Data scientists can view real-time model performance and tune hyperparameters
- Enterprise admins can manage users, monitor system health, and access APIs
- System handles production-scale traffic with appropriate security measures

---

## 3. Product Overview

### 3.1 Product Description
A full-stack web application for handwritten digit recognition using Support Vector Machine (SVM) and other ML models. The system provides:
- **Web Interface**: React-based frontend with role-based access
- **REST API**: Python-based backend for ML inference and system management
- **ML Pipeline**: Model training, evaluation, and inference capabilities
- **Enterprise Features**: User management, API access (via .env configuration), audit logging

### 3.2 Technology Stack

#### Frontend (Existing)
- React 18.3.1 + TypeScript
- Vite 6.3.5
- shadcn/ui components (Radix UI)
- Tailwind CSS
- Recharts for visualizations
- Sonner for notifications

#### Backend (To Be Built)
- **Language**: Python 3.10+
- **Framework**: FastAPI (recommended for async support, automatic OpenAPI docs, and AI/ML integration)
- **ML Framework**: scikit-learn (SVM), TensorFlow/PyTorch (for Neural Network models)
- **Database**: SQLite (development/MVP) or PostgreSQL (production) - see Section 7.1.4 for analysis
- **File Storage**: Local filesystem (`backend/uploads/` for images, `backend/models/` for model artifacts)
- **Architecture**: Modular structure with feature-based modules (see Section 7.1.2)

### 3.3 Architecture Overview
```
┌─────────────────┐
│   React Frontend │
│  (Role-based UI) │
└────────┬─────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   FastAPI Backend│
│  (Python)        │
│  Modular Design  │
├─────────────────┤
│ Module: Auth    │
│ Module: Predict │
│ Module: Models  │
│ Module: Admin   │
└────────┬─────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌──────┐  ┌──────────┐  ┌─────────┐
│SQLite│  │Local FS  │  │In-Memory│
│      │  │(uploads/ │  │Cache    │
│      │  │ models/) │  │         │
└──────┘  └──────────┘  └─────────┘
```

---

## 4. User Personas & Use Cases

### 4.1 Persona 1: End User (Guest)
**Profile**: Casual user who needs to recognize handwritten digits from images

**Goals**:
- Quickly upload an image and get digit prediction
- See confidence score for the prediction
- Download results if needed

**Use Cases**:
1. **UC-GUEST-001**: Upload Single Image
   - User drags & drops or selects a PNG/JPG image (max 5MB)
   - System displays preview
   - User clicks "Process" or auto-processes
   - System returns predicted digit (0-9) with confidence score
   - User can download result or upload another image

**Pain Points**:
- Need for instant results
- Image quality variations
- File size limitations

**Success Metrics**:
- Prediction accuracy ≥ 95%
- Response time < 500ms
- User can complete task in < 30 seconds

### 4.2 Persona 2: Data Scientist
**Profile**: ML practitioner who needs to analyze model performance, tune hyperparameters, and experiment with different models

**Goals**:
- View real-time model performance metrics
- Compare different models (SVM, Random Forest, Neural Network)
- Tune hyperparameters and retrain models
- Export trained models
- Analyze confusion matrices and ROC curves

**Use Cases**:
1. **UC-DS-001**: View Model Performance
   - Data scientist logs in and selects a model
   - System displays accuracy, precision, recall, F1-score
   - Data scientist views confusion matrix and ROC curves

2. **UC-DS-002**: Hyperparameter Tuning
   - Data scientist adjusts C parameter, gamma, kernel type
   - System runs optimization (grid search or Bayesian optimization)
   - System displays new metrics and allows model comparison

3. **UC-DS-003**: Model Comparison
   - Data scientist selects two models to compare
   - System displays side-by-side metrics, confusion matrices, ROC curves
   - Data scientist can export comparison report

4. **UC-DS-004**: Model Export
   - Data scientist clicks "Export Model"
   - System generates .pkl file with model weights and metadata
   - Data scientist downloads model for deployment

5. **UC-DS-005**: Dataset Management
   - Data scientist uploads new training dataset
   - System validates and preprocesses dataset
   - Data scientist triggers model retraining

**Pain Points**:
- Need for accurate, real-time metrics
- Long training times for hyperparameter optimization
- Model versioning and comparison complexity

**Success Metrics**:
- Model metrics update in real-time (< 1 second latency)
- Hyperparameter optimization completes in < 30 minutes for standard grid search
- Model export generates valid .pkl files

### 4.3 Persona 3: Enterprise Administrator
**Profile**: Organization admin who needs to manage users, monitor system usage, and provide API access to teams

**Goals**:
- Manage team members and roles
- Monitor system health and usage metrics
- Configure batch processing limits
- View audit logs for compliance
- Access API using environment-configured API keys

**Use Cases**:
1. **UC-ENT-001**: User Management
   - Admin adds new user with email and role assignment
   - Admin edits user roles (Data Scientist, ML Engineer, Analyst, Admin)
   - Admin deactivates users
   - System sends invitation email to new users

2. **UC-ENT-002**: API Access Configuration
   - API keys are configured in backend `.env` file
   - Admin views API endpoint documentation
   - Admin can see current API key status (configured/not configured)
   - API keys are validated from environment variables

3. **UC-ENT-003**: System Monitoring
   - Admin views dashboard with:
     - Images processed today
     - Success rate
     - Error count
     - Active users
   - Admin views real-time API activity log
   - Admin receives alerts for system issues

4. **UC-ENT-004**: Batch Processing Configuration
   - Admin configures max images per batch job (default: 50,000)
   - Admin sets rate limits (default: 10,000 requests/minute)
   - Admin monitors batch job queue and completion status

5. **UC-ENT-005**: Audit Logging
   - Admin views complete activity log (API calls, user actions, system events)
   - Admin searches/filters logs by date, user, event type
   - Admin exports logs to CSV for compliance

**Pain Points**:
- Need for comprehensive system visibility
- Security and compliance requirements
- Scalability concerns for large organizations

**Success Metrics**:
- User management operations complete in < 2 seconds
- API key validation from environment in < 10ms
- Dashboard metrics update every 5 seconds
- Audit log search returns results in < 500ms

---

## 5. Functional Requirements

### 5.1 Authentication & Authorization

#### FR-AUTH-001: Role-Based Access Control
- **Requirement**: System must support three roles: Guest, Data Scientist, Enterprise Admin
- **Acceptance Criteria**:
  - Guest users can access upload interface without authentication
  - Data Scientists must authenticate with email/password to access dashboard
  - Enterprise Admins must authenticate with email/password to access portal
  - Invalid credentials show appropriate error messages
  - Sessions persist for 24 hours (configurable)

#### FR-AUTH-002: User Registration & Management
- **Requirement**: Enterprise Admins can create, edit, and deactivate user accounts
- **Acceptance Criteria**:
  - Admin can add users with email, name, and role
  - System sends invitation email with temporary password
  - Admin can edit user details and roles
  - Admin can deactivate users (soft delete)
  - Deactivated users cannot log in

#### FR-AUTH-003: Session Management
- **Requirement**: System must manage user sessions securely
- **Acceptance Criteria**:
  - JWT tokens issued upon successful login
  - Tokens expire after 24 hours
  - Refresh tokens available for extended sessions
  - Logout invalidates tokens immediately
  - Tokens stored in httpOnly cookies (recommended) or localStorage

### 5.2 Image Upload & Processing

#### FR-UPLOAD-001: File Upload
- **Requirement**: Users can upload images via drag-and-drop or file browser
- **Acceptance Criteria**:
  - Supports PNG, JPG, JPEG formats
  - Maximum file size: 5MB
  - File validation on client and server
  - Image preview displayed before processing
  - Clear error messages for invalid files

#### FR-UPLOAD-002: Image Preprocessing
- **Requirement**: System must preprocess images before model inference
- **Acceptance Criteria**:
  - Convert to grayscale
  - Resize to 28x28 pixels (MNIST standard)
  - Normalize pixel values to [0, 1] range
  - Handle various input image sizes and aspect ratios
  - Preserve image quality during preprocessing

#### FR-UPLOAD-003: Digit Prediction
- **Requirement**: System must predict digit (0-9) from preprocessed image
- **Acceptance Criteria**:
  - Returns predicted digit (0-9)
  - Returns confidence score (0-100%)
  - Response time < 500ms for single image
  - Handles edge cases (blurry images, multiple digits, non-digit content)
  - Returns appropriate error for unprocessable images

#### FR-UPLOAD-004: Result Display & Download
- **Requirement**: Users can view and download prediction results
- **Acceptance Criteria**:
  - Display predicted digit prominently
  - Display confidence score with visual indicator
  - Download button generates JSON/PDF with results
  - Users can upload another image without page refresh

### 5.3 Model Management (Data Scientist)

#### FR-MODEL-001: Model Selection
- **Requirement**: Data scientists can select from available models
- **Acceptance Criteria**:
  - Dropdown shows: SVM, Random Forest, Neural Network
  - Selected model's hyperparameters displayed
  - Model performance metrics update based on selection
  - Model switching is instant (< 100ms)

#### FR-MODEL-002: Performance Metrics Display
- **Requirement**: System displays comprehensive model performance metrics
- **Acceptance Criteria**:
  - Accuracy, Precision, Recall, F1-Score displayed
  - Confusion Matrix (10x10) visualized with color coding
  - ROC Curves for each digit class (0-9) and micro/macro averages
  - Metrics update in real-time when model changes
  - All metrics calculated from test dataset

#### FR-MODEL-003: Hyperparameter Tuning
- **Requirement**: Data scientists can tune model hyperparameters
- **Acceptance Criteria**:
  - For SVM: Adjust C parameter, gamma, kernel type (RBF, linear, poly)
  - For Random Forest: Adjust n_estimators, max_depth, min_samples_split
  - For Neural Network: Adjust layers, neurons, learning rate, batch size
  - "Optimize" button runs grid search or Bayesian optimization
  - Progress indicator shows optimization status
  - Results displayed with before/after comparison
  - Option to save optimized model or revert

#### FR-MODEL-004: Model Comparison
- **Requirement**: Data scientists can compare two models side-by-side
- **Acceptance Criteria**:
  - Select two models from dropdown
  - Display metrics comparison table
  - Side-by-side confusion matrices
  - Overlaid ROC curves
  - Export comparison report (PDF/CSV)

#### FR-MODEL-005: Model Export
- **Requirement**: Data scientists can export trained models
- **Acceptance Criteria**:
  - Export button generates .pkl file (scikit-learn format)
  - File includes model weights, hyperparameters, and metadata
  - Metadata includes: model type, training date, accuracy, dataset info
  - Download starts immediately
  - File size displayed before download

#### FR-MODEL-006: Dataset Management
- **Requirement**: Data scientists can upload and manage training datasets
- **Acceptance Criteria**:
  - Upload dataset in CSV or NPY format
  - System validates dataset format (28x28 images, labels 0-9)
  - Display dataset statistics (size, distribution, split info)
  - Option to split dataset (train/validation/test)
  - Trigger model retraining with new dataset

### 5.4 Enterprise Features

#### FR-ENT-001: API Configuration
- **Requirement**: Enterprise admins can view API configuration and documentation
- **Acceptance Criteria**:
  - Display API endpoint URL (e.g., `https://api.ocr.com/predict`)
  - Show API key status (configured in .env or not configured)
  - Display API documentation (OpenAPI/Swagger)
  - Display rate limits (configured in .env, default: 10,000 requests/minute)
  - Show example API requests with authentication headers
  - **Note**: API keys are configured in backend `.env` file, not through UI

#### FR-ENT-003: User Management
- **Requirement**: Enterprise admins can manage organization users
- **Acceptance Criteria**:
  - View list of all users with name, email, role, status
  - Add new user with email, name, role assignment
  - Edit user details (name, email, role)
  - Deactivate/activate users
  - Filter users by role or status
  - Search users by name or email

#### FR-ENT-004: System Dashboard
- **Requirement**: Enterprise admins can monitor system health and usage
- **Acceptance Criteria**:
  - Display key metrics:
    - Images processed today (real-time counter)
    - Success rate percentage
    - Error count
    - Active users count
  - Metrics update every 5 seconds
  - Historical trends (last 7 days, 30 days)
  - Visual charts for metrics over time

#### FR-ENT-005: Batch Processing
- **Requirement**: Enterprise admins can configure and monitor batch processing
- **Acceptance Criteria**:
  - Configure max images per batch job (default: 50,000)
  - Set batch processing rate limits
  - View batch job queue status
  - Monitor job progress and completion
  - Download batch results as ZIP file
  - View batch job history

#### FR-ENT-006: Audit Logging
- **Requirement**: System logs all user actions, API calls, and system events
- **Acceptance Criteria**:
  - Log entries include: timestamp, user, action type, details
  - Filter logs by: date range, user, event type (API/User/System)
  - Search logs by keyword
  - Export logs to CSV
  - Logs retained for minimum 90 days (configurable)
  - Real-time log streaming for recent events

### 5.5 API Endpoints

#### FR-API-001: Authentication Endpoints
- `POST /api/auth/login` - User login (email, password) → JWT token
- `POST /api/auth/logout` - Invalidate session
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

#### FR-API-002: Prediction Endpoints
- `POST /api/predict` - Single image prediction
  - Request: multipart/form-data with image file
  - Response: `{digit: 0-9, confidence: 0-100, processing_time_ms: number}`
  - Auth: Optional (guest) or JWT token
  - Rate limit: 100 requests/minute (guest), 10,000/minute (authenticated)

- `POST /api/batch` - Batch image processing
  - Request: multipart/form-data with multiple images or ZIP file
  - Response: `{job_id: string, status: "queued", total_images: number}`
  - Poll `GET /api/batch/{job_id}` for status and results
  - Auth: JWT token or API key required
  - Rate limit: 10 jobs/minute

#### FR-API-003: Model Management Endpoints
- `GET /api/models` - List available models
- `GET /api/models/{model_id}` - Get model details and metrics
- `GET /api/models/{model_id}/metrics` - Get performance metrics
- `GET /api/models/{model_id}/confusion-matrix` - Get confusion matrix data
- `GET /api/models/{model_id}/roc-curve` - Get ROC curve data
- `POST /api/models/{model_id}/tune` - Start hyperparameter optimization
- `GET /api/models/{model_id}/tune/{tune_id}` - Get optimization status
- `GET /api/models/{model_id}/export` - Download model .pkl file
- `POST /api/models/train` - Train new model with dataset

#### FR-API-004: Enterprise Endpoints
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{user_id}` - Update user
- `DELETE /api/admin/users/{user_id}` - Deactivate user
- `GET /api/admin/api-config` - Get API configuration (endpoints, rate limits from .env)
- `GET /api/admin/audit-logs` - Get audit logs (with filters)
- `GET /api/admin/batch-jobs` - List batch jobs
- `GET /api/admin/batch-jobs/{job_id}` - Get batch job details

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **NFR-PERF-001**: Single image prediction response time < 500ms (p95)
- **NFR-PERF-002**: API supports 10,000 requests/minute (configurable in .env)
- **NFR-PERF-003**: Batch processing handles up to 50,000 images per job
- **NFR-PERF-004**: Dashboard metrics update latency < 1 second
- **NFR-PERF-005**: Database query response time < 100ms (p95)
- **NFR-PERF-006**: Image preprocessing time < 50ms per image

### 6.2 Scalability
- **NFR-SCALE-001**: System supports horizontal scaling (multiple backend instances) - *Note: SQLite limits single-server deployment*
- **NFR-SCALE-002**: Database connection pooling (SQLite uses file-based connections, PostgreSQL: min 10, max 100 connections)
- **NFR-SCALE-003**: In-memory caching for frequently accessed data (Python dict, model caching)
- **NFR-SCALE-004**: FastAPI background tasks for batch processing (async processing without separate workers)
- **NFR-SCALE-005**: Local filesystem storage (`uploads/`, `models/` directories)

### 6.3 Security
- **NFR-SEC-001**: All API endpoints use HTTPS in production
- **NFR-SEC-002**: JWT tokens signed with HS256 or RS256 algorithm
- **NFR-SEC-003**: API keys stored in `.env` file (not in database), compared using secure string comparison
- **NFR-SEC-004**: Rate limiting enforced at API gateway level
- **NFR-SEC-005**: Input validation on all user inputs (file type, size, format)
- **NFR-SEC-006**: SQL injection prevention (parameterized queries)
- **NFR-SEC-007**: CORS configured for allowed origins only
- **NFR-SEC-008**: File uploads scanned for malware (optional but recommended)
- **NFR-SEC-009**: Audit logs include IP addresses and user agents

### 6.4 Reliability
- **NFR-REL-001**: System uptime ≥ 99.5% (target: 99.9%)
- **NFR-REL-002**: Database backups daily with point-in-time recovery
- **NFR-REL-003**: Error handling for all API endpoints (no 500 errors to users)
- **NFR-REL-004**: Graceful degradation if ML model service is unavailable
- **NFR-REL-005**: Retry logic for transient failures (3 retries with exponential backoff)

### 6.5 Usability
- **NFR-USE-001**: UI responsive on desktop, tablet, and mobile devices
- **NFR-USE-002**: Loading indicators for all async operations
- **NFR-USE-003**: Clear error messages with actionable guidance
- **NFR-USE-004**: Accessibility: WCAG 2.1 Level AA compliance
- **NFR-USE-005**: Internationalization support (i18n) - English default, extensible

### 6.6 Maintainability
- **NFR-MAIN-001**: Code coverage ≥ 80% for backend
- **NFR-MAIN-002**: API documentation (OpenAPI/Swagger) auto-generated
- **NFR-MAIN-003**: Comprehensive logging (structured JSON logs)
- **NFR-MAIN-004**: Monitoring and alerting (Prometheus + Grafana recommended)
- **NFR-MAIN-005**: Docker containerization for easy deployment

---

## 7. Technical Architecture

### 7.1 Backend Architecture

#### 7.1.1 Framework Selection: FastAPI
**Rationale**: 
- Native async/await support for high concurrency
- Automatic OpenAPI documentation
- Excellent performance (comparable to Node.js)
- Strong type hints and validation (Pydantic)
- Easy integration with ML libraries (scikit-learn, TensorFlow, PyTorch)
- Built-in dependency injection for clean architecture

#### 7.1.2 Project Structure (Modular Architecture)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Configuration management
│   ├── database.py             # Database connection & session
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── config.py           # Settings (Pydantic)
│   │   ├── exceptions.py       # Custom exceptions
│   │   └── dependencies.py     # Shared dependencies (auth, db)
│   │
│   ├── module/
│   │   ├── __init__.py
│   │   │
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── auth-controller.py    # Authentication endpoints
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth-service.py   # Authentication logic
│   │   │   │   └── token-service.py  # JWT token management
│   │   │   └── schemas.py            # Pydantic schemas for auth
│   │   │
│   │   ├── predict/
│   │   │   ├── __init__.py
│   │   │   ├── predict-controller.py # Prediction endpoints
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── predict-service.py    # Prediction orchestration
│   │   │   │   ├── image-service.py      # Image preprocessing
│   │   │   │   └── ml-inference-service.py # ML model inference
│   │   │   └── schemas.py                # Request/response schemas
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── models-controller.py     # Model management endpoints
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── models-service.py    # Model CRUD operations
│   │   │   │   ├── training-service.py  # Model training logic
│   │   │   │   ├── evaluation-service.py # Metrics calculation
│   │   │   │   └── hyperparameter-service.py # Hyperparameter tuning
│   │   │   └── schemas.py               # Model schemas
│   │   │
│   │   ├── admin/
│   │   │   ├── __init__.py
│   │   │   ├── admin-controller.py      # Enterprise/admin endpoints
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user-service.py      # User management
│   │   │   │   ├── api-config-service.py   # API configuration (reads from .env)
│   │   │   │   ├── audit-service.py     # Audit logging
│   │   │   │   ├── stats-service.py     # System statistics
│   │   │   │   └── batch-service.py     # Batch processing
│   │   │   └── schemas.py               # Admin schemas
│   │   │
│   │   └── shared/
│   │       ├── __init__.py
│   │       ├── models/                  # SQLAlchemy ORM models
│   │       │   ├── __init__.py
│   │       │   ├── user.py
│   │       │   ├── audit_log.py
│   │       │   ├── batch_job.py
│   │       │   └── model_metadata.py
│   │       └── ml/                      # Shared ML utilities
│   │           ├── __init__.py
│   │           ├── model_wrappers/
│   │           │   ├── svm_model.py
│   │           │   ├── rf_model.py
│   │           │   └── nn_model.py
│   │           ├── preprocessing.py
│   │           └── evaluation.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── file_handler.py      # File upload/download utilities
│       └── rate_limiter.py      # In-memory rate limiting
│
├── uploads/                     # Uploaded images (gitignored)
├── models/                      # Trained model files (.pkl)
├── tests/
│   ├── test_module/
│   │   ├── test_auth/
│   │   ├── test_predict/
│   │   ├── test_models/
│   │   └── test_admin/
│   └── conftest.py
│
├── alembic/                     # Database migrations
├── requirements.txt
├── .env.example
└── README.md
```

**Module Structure Pattern:**
Each module follows this pattern:
- `{module}-controller.py`: FastAPI route handlers (HTTP endpoints)
- `services/`: Business logic layer
  - `{module}-service.py`: Main service for the module
  - `{module}-serviceABC.py`: Additional specialized services
  - `{module}-serviceXYZ.py`: Additional specialized services
- `schemas.py`: Pydantic models for request/response validation

#### 7.1.3 Database Selection: SQLite vs PostgreSQL

**SQLite Analysis:**

**Pros:**
- ✅ Zero configuration - no separate database server needed
- ✅ Single file database - easy backup and deployment
- ✅ Perfect for development and MVP
- ✅ Low resource usage
- ✅ ACID compliant
- ✅ Good performance for read-heavy workloads
- ✅ Built into Python (sqlite3 module)

**Cons:**
- ⚠️ Limited concurrent writes (serialized write operations)
- ⚠️ No network access (file-based, local only)
- ⚠️ Lower performance under high write concurrency
- ⚠️ Limited to single server deployment
- ⚠️ No advanced features (full-text search, advanced indexing)

**Recommendation:**
- **Development/MVP**: Use SQLite - simpler setup, sufficient for initial development
- **Production (if scaling needed)**: Migrate to PostgreSQL when:
  - Concurrent users > 50
  - Write operations > 100/second
  - Need for distributed deployment
  - Require advanced database features

**For this project**: SQLite is acceptable for MVP and small-scale deployment. The schema below works for both SQLite and PostgreSQL (with minor adjustments for JSONB → JSON in SQLite).

#### 7.1.4 Database Schema

**Users Table**
```sql
-- SQLite compatible (use INTEGER PRIMARY KEY AUTOINCREMENT for SQLite)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- SERIAL for PostgreSQL
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- 'guest', 'data-scientist', 'enterprise'
    is_active BOOLEAN DEFAULT 1,  -- TRUE for PostgreSQL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Audit Logs Table**
```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,  -- 'api', 'user', 'system'
    action VARCHAR(255) NOT NULL,
    details TEXT,  -- JSON string (SQLite) or JSONB (PostgreSQL)
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Note: For PostgreSQL, use JSONB instead of TEXT for details
```

**Batch Jobs Table**
```sql
CREATE TABLE batch_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,  -- 'queued', 'processing', 'completed', 'failed'
    total_images INTEGER NOT NULL,
    processed_images INTEGER DEFAULT 0,
    results_path TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);
```

**Model Metadata Table**
```sql
CREATE TABLE model_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_type VARCHAR(50) NOT NULL,  -- 'svm', 'random_forest', 'neural_network'
    model_path TEXT NOT NULL,
    hyperparameters TEXT,  -- JSON string (SQLite) or JSONB (PostgreSQL)
    accuracy REAL,  -- DECIMAL(5,4) for PostgreSQL
    precision REAL,
    recall REAL,
    f1_score REAL,
    confusion_matrix TEXT,  -- JSON string (SQLite) or JSONB (PostgreSQL)
    roc_curve_data TEXT,    -- JSON string (SQLite) or JSONB (PostgreSQL)
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);
-- Note: For PostgreSQL, use JSONB for JSON fields and DECIMAL for numeric fields
```

### 7.2 ML Model Implementation

#### 7.2.1 Model Training Pipeline
1. **Data Loading**: Load MNIST dataset (or custom dataset)
2. **Preprocessing**: Normalize, reshape to 28x28
3. **Train/Test Split**: 60k train / 10k test (MNIST standard)
4. **Model Training**: Train SVM/RF/NN with hyperparameters
5. **Evaluation**: Calculate metrics (accuracy, precision, recall, F1, confusion matrix, ROC)
6. **Model Persistence**: Save model as .pkl file with metadata
7. **Database Update**: Store metrics in `model_metadata` table

#### 7.2.2 Inference Pipeline
1. **Image Upload**: Receive image file (PNG/JPG)
2. **Preprocessing**: 
   - Convert to grayscale
   - Resize to 28x28
   - Normalize to [0, 1]
   - Reshape to (1, 784) for model input
3. **Model Inference**: Load active model, predict digit
4. **Post-processing**: Get predicted class and confidence score
5. **Response**: Return JSON with digit and confidence

#### 7.2.3 Model Selection Strategy
- Default model: SVM (fast, good accuracy for digits)
- Users can switch models via API/dashboard
- Active model stored in database/config
- Model loading: Lazy loading on first request, then cached in memory

### 7.3 API Design

#### 7.3.1 RESTful Conventions
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Resource-based URLs (`/api/models/{id}` not `/api/get-model`)
- Consistent response format:
  ```json
  {
    "success": true,
    "data": {...},
    "message": "Optional message",
    "timestamp": "2025-01-27T10:00:00Z"
  }
  ```
- Error responses:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid image format",
      "details": {...}
    }
  }
  ```

#### 7.3.2 Authentication
- JWT tokens in Authorization header: `Authorization: Bearer <token>`
- API keys in header: `X-API-Key: <key>` (validated against `API_KEY` in .env)
- Guest endpoints: No authentication required

#### 7.3.3 Rate Limiting
- Implement using in-memory dictionary (Python dict) with sliding window algorithm
- Store rate limit data per user/IP in memory (API key rate limit from .env)
- Alternative: Database-based rate limiting (slower but persistent across restarts)
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 status code when limit exceeded
- **Note**: In-memory rate limiting resets on server restart. For production, consider database-based rate limiting or upgrade to Redis if needed.

### 7.4 Frontend Integration

#### 7.4.1 API Client Service
Create `src/services/api.ts`:
```typescript
// API client with axios/fetch
// Request/response interceptors
// Error handling
// Token management
```

#### 7.4.2 State Management
- Consider Zustand or React Query for:
  - User session state
  - Model metrics caching
  - API response caching
  - Loading/error states

#### 7.4.3 Environment Configuration

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENVIRONMENT=development
```

**Backend (.env)**
```env
# Database
DATABASE_URL=sqlite:///./app.db
# or for PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/dbname

# API Configuration
API_KEY=your-secret-api-key-here
API_RATE_LIMIT=10000  # requests per minute

# JWT Configuration
SECRET_KEY=your-secret-key-for-jwt-tokens
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours

# Application
ENVIRONMENT=development
DEBUG=True

# File Storage Paths
UPLOADS_DIR=./uploads
MODELS_DIR=./models

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Note**: API keys are configured in the backend `.env` file. The API key is validated against the `API_KEY` environment variable when requests include the `X-API-Key` header.

---

## 8. Implementation Phases

### Phase 1: Core Backend & Authentication (Weeks 1-2)
**Goal**: Enable basic functionality with authentication

**Tasks**:
1. Set up FastAPI project structure
2. Configure PostgreSQL database and Alembic migrations
3. Implement user models and authentication (JWT)
4. Create authentication endpoints (`/api/auth/*`)
5. Implement image upload endpoint (`POST /api/predict`)
6. Basic ML inference service (SVM model with MNIST)
7. Image preprocessing pipeline
8. Connect frontend to backend API
9. Replace mock data in `EndUserUpload.tsx`

**Deliverables**:
- Users can log in and upload images
- Images are processed and predictions returned
- Basic error handling

**Success Criteria**:
- End-to-end flow works: Upload → Predict → Display result
- Authentication works for Data Scientist and Enterprise roles
- Response time < 500ms for predictions

### Phase 2: Data Scientist Features (Weeks 3-4)
**Goal**: Enable model analysis and tuning

**Tasks**:
1. Implement model management endpoints (`/api/models/*`)
2. Model metrics calculation (accuracy, precision, recall, F1)
3. Confusion matrix generation
4. ROC curve calculation
5. Hyperparameter tuning service (grid search)
6. Model comparison functionality
7. Model export (.pkl generation)
8. Connect `DataScientistDashboard.tsx` to real APIs
9. Replace static data with API calls

**Deliverables**:
- Data scientists can view real model metrics
- Hyperparameter tuning works
- Models can be exported

**Success Criteria**:
- Metrics update in real-time
- Hyperparameter optimization completes successfully
- Exported .pkl files are valid and loadable

### Phase 3: Enterprise Features (Weeks 5-6)
**Goal**: Enable enterprise administration

**Tasks**:
1. User management endpoints (`/api/admin/users/*`)
2. API configuration service (reads from .env)
3. Rate limiting implementation
4. System statistics endpoint
5. Audit logging service
6. Batch processing with Celery
7. Connect `EnterprisePortal.tsx` to real APIs
8. CSV export for audit logs

**Deliverables**:
- Admins can manage users
- API keys from .env authenticate requests correctly
- Audit logs are comprehensive
- Batch processing handles large jobs

**Success Criteria**:
- User CRUD operations work
- API key authentication works (validates against .env)
- Audit logs capture all events
- Batch jobs process 50k+ images

### Phase 4: Optimization & Production Readiness (Weeks 7-8)
**Goal**: Performance, security, and reliability

**Tasks**:
1. Performance optimization (caching, database indexing)
2. Security hardening (input validation, SQL injection prevention)
3. Error handling and logging improvements
4. Monitoring and alerting setup
5. Docker containerization
6. Load testing and scaling
7. Documentation (API docs, deployment guide)
8. Frontend error boundaries and loading states

**Deliverables**:
- System handles 10k+ requests/minute
- Security audit passed
- Monitoring dashboard operational
- Production deployment ready

**Success Criteria**:
- All NFRs met
- System uptime ≥ 99.5%
- Documentation complete

---

## 9. Dependencies & Integrations

### 9.1 External Dependencies
- **MNIST Dataset**: For initial model training (can be downloaded via scikit-learn or TensorFlow)
- **Cloud Storage** (Optional): AWS S3 or compatible for production file storage
- **Email Service** (Optional): SendGrid, AWS SES for user invitation emails

### 9.2 Internal Dependencies
- Frontend must be deployed and accessible
- Backend API must be accessible from frontend domain
- Database (SQLite file) must be accessible from backend (same filesystem)
- Local filesystem directories (`uploads/`, `models/`) must be writable

### 9.3 Integration Points
- **Frontend ↔ Backend**: REST API over HTTPS
- **Backend ↔ Database**: SQLAlchemy ORM
- **Backend ↔ Redis**: Redis-py for caching and Celery broker
- **Backend ↔ ML Models**: scikit-learn, TensorFlow/PyTorch
- **Celery ↔ Redis**: Message broker for async tasks

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

**Risk 1: ML Model Accuracy Below Target**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**: 
  - Start with pre-trained MNIST models (known good accuracy)
  - Implement data augmentation for training
  - Allow model retraining with custom datasets
  - Set up A/B testing for model improvements

**Risk 2: Performance Issues Under Load**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Load testing early (Week 4)
  - Implement caching aggressively
  - Use async/await throughout
  - Horizontal scaling architecture from start

**Risk 3: Security Vulnerabilities**
- **Probability**: Low
- **Impact**: Critical
- **Mitigation**:
  - Security review before production
  - Input validation on all endpoints
  - Regular dependency updates
  - Penetration testing

### 10.2 Business Risks

**Risk 4: Scope Creep**
- **Probability**: High
- **Impact**: Medium
- **Mitigation**:
  - Strict adherence to this PRD
  - Change requests require PRD update
  - Phase-based delivery (can stop after Phase 1 if needed)

**Risk 5: Timeline Delays**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**:
  - Buffer time in each phase
  - MVP after Phase 1 (core functionality)
  - Prioritize must-have features

---

## 11. Success Metrics & KPIs

### 11.1 Technical Metrics
- **Prediction Accuracy**: ≥ 95% on test set
- **API Response Time**: p95 < 500ms
- **System Uptime**: ≥ 99.5%
- **Error Rate**: < 1% of requests
- **Throughput**: 10,000+ requests/minute

### 11.2 User Experience Metrics
- **Task Completion Time**: < 30 seconds for end users
- **User Satisfaction**: ≥ 4.5/5.0 (survey)
- **Error Recovery**: Users can recover from errors without support
- **API Adoption**: 80%+ of enterprise users use API

### 11.3 Business Metrics
- **User Adoption**: Track active users per role
- **API Usage**: Requests per day/week
- **Model Improvements**: Accuracy improvements over time
- **Support Tickets**: < 5% of users submit tickets

---

## 12. Open Questions & Assumptions

### 12.1 Assumptions
1. **Dataset**: Initial model uses MNIST dataset (70k images, 28x28 grayscale)
2. **Deployment**: On-premises or cloud (AWS/GCP/Azure) - TBD
3. **Scale**: Initial target: 100 concurrent users, 10k requests/day
4. **Budget**: Sufficient for cloud infrastructure (if cloud deployment)
5. **Team**: Backend developer(s) familiar with Python/FastAPI

### 12.2 Open Questions
1. **Q1**: Should we support custom model uploads by data scientists?
   - **Decision Needed**: Yes/No
   - **Impact**: Additional complexity in model management

2. **Q2**: What is the target deployment environment (cloud vs on-premises)?
   - **Decision Needed**: Cloud (AWS/GCP) or On-premises
   - **Impact**: Infrastructure setup and costs

3. **Q3**: Should we implement real-time model training (users trigger training) or scheduled training?
   - **Decision Needed**: Real-time vs Scheduled
   - **Impact**: Resource usage and user experience

4. **Q4**: Do we need multi-tenancy (multiple organizations) or single organization?
   - **Decision Needed**: Multi-tenant vs Single-tenant
   - **Impact**: Database schema and API design

5. **Q5**: What is the data retention policy for uploaded images and predictions?
   - **Decision Needed**: Retention period (e.g., 30 days, 1 year, indefinite)
   - **Impact**: Storage costs and privacy compliance

---

## 13. Appendix

### 13.1 Glossary
- **SVM**: Support Vector Machine - ML algorithm for classification
- **ROC Curve**: Receiver Operating Characteristic curve - model performance visualization
- **Confusion Matrix**: Table showing prediction accuracy per class
- **Hyperparameter**: Model configuration parameter (not learned from data)
- **JWT**: JSON Web Token - authentication token format
- **MNIST**: Modified National Institute of Standards and Technology dataset - standard digit recognition dataset

### 13.2 References
- Frontend Functionality Analysis: `ISProject/frontend/FUNCTIONALITY_ANALYSIS.md`
- FastAPI Documentation: https://fastapi.tiangolo.com/
- scikit-learn Documentation: https://scikit-learn.org/
- MNIST Dataset: http://yann.lecun.com/exdb/mnist/

### 13.3 Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2025-01-27 | PM | Updated architecture: modular structure, SQLite, removed Redis/Celery, API keys in .env |
| 1.0 | 2025-01-27 | PM | Initial PRD creation |

---

## 14. Approval

**Product Manager**: _________________ Date: _______

**Technical Lead**: _________________ Date: _______

**Stakeholder**: _________________ Date: _______

---

**Document Status**: ✅ Ready for Review
