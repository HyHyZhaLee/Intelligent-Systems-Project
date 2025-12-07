# Epics and User Stories
## Handwritten Digit OCR System

**Version:** 1.0  
**Date:** 2025-01-27  
**Status:** Draft  
**Author:** Product Manager

---

## Overview

This document breaks down the PRD into **Epics** (large features) and **User Stories** (specific, implementable tasks). Each story follows the format:

**As a [user type], I want [goal] so that [benefit].**

Stories are organized by **Epic** and prioritized for implementation. This structure aligns with the simplified architecture for a university project.

---

## Epic 1: Authentication & User Management

**Goal**: Enable secure access to the system with role-based permissions  
**Priority**: P0 (Critical - Must Have)  
**Estimated Effort**: 1-2 weeks

### Story 1.1: User Login
**As a** Data Scientist or Enterprise Admin  
**I want** to log in with email and password  
**So that** I can access my role-specific dashboard

**Acceptance Criteria:**
- User can enter email and password on welcome screen
- System validates credentials against database
- System returns JWT token on successful login
- System shows error message for invalid credentials
- JWT token is stored in frontend (localStorage or httpOnly cookie)
- User is redirected to appropriate dashboard based on role

**Technical Notes:**
- Endpoint: `POST /api/auth/login`
- Use bcrypt for password hashing
- JWT expires after 24 hours (configurable)

**Story Points**: 5

---

### Story 1.2: Guest Access
**As a** Guest user  
**I want** to access the upload interface without logging in  
**So that** I can quickly recognize digits without creating an account

**Acceptance Criteria:**
- Guest role selection on welcome screen works
- No authentication required for guest access
- Guest can upload images and get predictions
- Guest cannot access Data Scientist or Enterprise features

**Technical Notes:**
- Guest endpoints may require API key from .env (optional)
- No user record created for guests

**Story Points**: 2

---

### Story 1.3: User Session Management
**As a** logged-in user  
**I want** my session to persist across page refreshes  
**So that** I don't have to log in repeatedly

**Acceptance Criteria:**
- JWT token persists in browser storage
- User remains logged in after page refresh
- Token is validated on each API request
- User is logged out when token expires
- Logout button clears session

**Technical Notes:**
- Store JWT in localStorage or httpOnly cookie
- Validate token on protected routes

**Story Points**: 3

---

### Story 1.4: Create User (Admin)
**As an** Enterprise Admin  
**I want** to create new user accounts  
**So that** team members can access the system

**Acceptance Criteria:**
- Admin can open "Add User" dialog
- Admin enters name, email, and selects role
- System creates user with hashed password (temporary password)
- System displays success message
- New user appears in user list

**Technical Notes:**
- Endpoint: `POST /api/admin/users`
- Generate temporary password or send invitation email (optional)
- Default password: "TempPassword123!" (user must change on first login)

**Story Points**: 5

---

### Story 1.5: Edit User (Admin)
**As an** Enterprise Admin  
**I want** to edit user details and roles  
**So that** I can manage team access and permissions

**Acceptance Criteria:**
- Admin can click "Edit" on any user
- Admin can modify name, email, and role
- System updates user in database
- Changes are reflected immediately in user list
- System displays success message

**Technical Notes:**
- Endpoint: `PUT /api/admin/users/{id}`
- Validate email format and role values

**Story Points**: 3

---

### Story 1.6: Deactivate User (Admin)
**As an** Enterprise Admin  
**I want** to deactivate user accounts  
**So that** former team members cannot access the system

**Acceptance Criteria:**
- Admin can deactivate a user (soft delete)
- Deactivated users cannot log in
- Deactivated users are marked in user list
- Admin can reactivate users if needed

**Technical Notes:**
- Endpoint: `PUT /api/admin/users/{id}` (set `is_active = false`)
- Soft delete - don't remove from database

**Story Points**: 2

---

## Epic 2: Image Upload & Prediction

**Goal**: Enable users to upload images and receive digit predictions  
**Priority**: P0 (Critical - Must Have)  
**Estimated Effort**: 1-2 weeks

### Story 2.1: Upload Image
**As a** Guest user or authenticated user  
**I want** to upload an image file  
**So that** the system can process it for digit recognition

**Acceptance Criteria:**
- User can drag & drop image onto upload area
- User can click "Browse Files" to select image
- System accepts PNG, JPG, JPEG formats
- System rejects files larger than 5MB
- System displays image preview after selection
- System shows clear error for invalid files

**Technical Notes:**
- Endpoint: `POST /api/predict` (multipart/form-data)
- Validate file type and size on backend
- Store uploaded file temporarily in `uploads/` directory

**Story Points**: 3

---

### Story 2.2: Image Preprocessing
**As a** system  
**I want** to preprocess uploaded images  
**So that** they are in the correct format for ML model inference

**Acceptance Criteria:**
- System converts image to grayscale
- System resizes image to 28x28 pixels
- System normalizes pixel values to [0, 1] range
- System reshapes image to (1, 784) array
- Preprocessing completes in < 50ms

**Technical Notes:**
- Use PIL/Pillow for image processing
- Handle various input image sizes and aspect ratios
- Preserve image quality during resize

**Story Points**: 5

---

### Story 2.3: Digit Prediction
**As a** user  
**I want** to get a digit prediction from my uploaded image  
**So that** I know what digit the image contains

**Acceptance Criteria:**
- System loads pre-trained ML model (SVM default)
- System runs prediction on preprocessed image
- System returns predicted digit (0-9)
- System returns confidence score (0-100%)
- Prediction completes in < 500ms total
- System handles errors gracefully (invalid image, model not found)

**Technical Notes:**
- Endpoint: `POST /api/predict`
- Load model from `models/svm_model.pkl`
- Cache model in memory after first load
- Use scikit-learn's `predict()` and `predict_proba()`

**Story Points**: 8

---

### Story 2.4: Display Prediction Results
**As a** user  
**I want** to see the prediction result clearly  
**So that** I know what digit was recognized

**Acceptance Criteria:**
- System displays predicted digit prominently (large number)
- System displays confidence score with visual indicator
- System shows processing progress while predicting
- User can see result immediately after upload
- Result is clearly visible and easy to read

**Technical Notes:**
- Frontend already has UI for this (EndUserUpload.tsx)
- Connect to real API endpoint
- Replace mock data with API response

**Story Points**: 2

---

### Story 2.5: Download Results
**As a** user  
**I want** to download the prediction result  
**So that** I can save it for my records

**Acceptance Criteria:**
- User can click "Download Result" button
- System generates JSON file with prediction data
- File includes: digit, confidence, timestamp, image info
- File downloads automatically
- File has meaningful name (e.g., `prediction_2025-01-27_14-30-45.json`)

**Technical Notes:**
- Generate JSON on backend or frontend
- Use browser download API

**Story Points**: 3

---

### Story 2.6: Upload Another Image
**As a** user  
**I want** to upload another image after getting a result  
**So that** I can process multiple images without leaving the page

**Acceptance Criteria:**
- User can click "Try Another Image" button
- System clears previous result and preview
- System resets upload area
- User can immediately upload new image
- No page refresh required

**Technical Notes:**
- Frontend state management
- Reset form state

**Story Points**: 1

---

## Epic 3: Model Management & Metrics

**Goal**: Enable data scientists to view and analyze model performance  
**Priority**: P1 (High - Should Have)  
**Estimated Effort**: 1-2 weeks

### Story 3.1: List Available Models
**As a** Data Scientist  
**I want** to see all available ML models  
**So that** I can select which model to analyze

**Acceptance Criteria:**
- System displays list of models (SVM, Random Forest, Neural Network)
- Each model shows: type, accuracy, training date
- User can select a model from dropdown
- Selected model's details are displayed
- System loads model metadata from database

**Technical Notes:**
- Endpoint: `GET /api/models`
- Query `model_metadata` table
- Return list of active models

**Story Points**: 3

---

### Story 3.2: View Model Performance Metrics
**As a** Data Scientist  
**I want** to see model performance metrics  
**So that** I can evaluate model quality

**Acceptance Criteria:**
- System displays accuracy, precision, recall, F1-score
- Metrics are calculated from test dataset
- Metrics update when model selection changes
- Metrics are displayed with progress bars/visual indicators
- System shows metrics in real-time (< 1 second latency)

**Technical Notes:**
- Endpoint: `GET /api/models/{id}/metrics`
- Calculate metrics from stored test predictions or pre-calculated values
- Store metrics in `model_metadata` table

**Story Points**: 5

---

### Story 3.3: View Confusion Matrix
**As a** Data Scientist  
**I want** to see the confusion matrix  
**So that** I can understand which digits are confused with each other

**Acceptance Criteria:**
- System displays 10x10 confusion matrix (digits 0-9)
- Matrix shows correct predictions (diagonal) in green
- Matrix shows misclassifications in red/yellow
- Matrix is color-coded for easy interpretation
- User can hover over cells to see exact counts

**Technical Notes:**
- Endpoint: `GET /api/models/{id}/confusion-matrix`
- Store confusion matrix as JSON in database
- Calculate from test dataset predictions
- Return as 2D array

**Story Points**: 5

---

### Story 3.4: View ROC Curves
**As a** Data Scientist  
**I want** to see ROC curves for each digit class  
**So that** I can analyze model performance per class

**Acceptance Criteria:**
- System displays ROC curve chart
- Chart shows curves for multiple digit classes (0, 1, 5, 8 as examples)
- Chart shows micro-average and macro-average curves
- Chart includes random classifier reference line
- User can see AUC scores for each curve
- Chart is interactive (tooltips, zoom)

**Technical Notes:**
- Endpoint: `GET /api/models/{id}/roc-curve`
- Calculate ROC curve data from test predictions
- Store as JSON array of (FPR, TPR) points
- Frontend uses Recharts to display

**Story Points**: 8

---

### Story 3.5: Export Model
**As a** Data Scientist  
**I want** to export a trained model  
**So that** I can use it in other systems

**Acceptance Criteria:**
- User can click "Export Model" button
- System generates .pkl file with model weights
- File includes model metadata (type, hyperparameters, accuracy)
- File downloads automatically
- File is valid and can be loaded in Python

**Technical Notes:**
- Endpoint: `GET /api/models/{id}/export`
- Read .pkl file from `models/` directory
- Optionally add metadata to file or return separately

**Story Points**: 3

---

### Story 3.6: Model Comparison (Optional)
**As a** Data Scientist  
**I want** to compare two models side-by-side  
**So that** I can choose the best model for deployment

**Acceptance Criteria:**
- User can select two models to compare
- System displays metrics comparison table
- System shows side-by-side confusion matrices
- System shows overlaid ROC curves
- User can export comparison report

**Technical Notes:**
- Endpoint: `GET /api/models/compare?model1={id}&model2={id}`
- Return metrics for both models
- Frontend displays comparison UI

**Story Points**: 8 (Optional - can defer)

---

## Epic 4: Enterprise Administration

**Goal**: Enable enterprise admins to manage system and users  
**Priority**: P1 (High - Should Have)  
**Estimated Effort**: 1 week

### Story 4.1: View System Statistics
**As an** Enterprise Admin  
**I want** to see system usage statistics  
**So that** I can monitor system health and usage

**Acceptance Criteria:**
- Dashboard displays key metrics:
  - Images processed today
  - Success rate percentage
  - Error count
  - Active users count
- Metrics update every 5 seconds (or on refresh)
- Metrics are displayed with visual indicators (icons, colors)
- Historical trends are shown (last 7 days)

**Technical Notes:**
- Endpoint: `GET /api/admin/stats`
- Calculate from audit logs and batch jobs
- Cache results for performance

**Story Points**: 5

---

### Story 4.2: View API Configuration
**As an** Enterprise Admin  
**I want** to view API endpoint documentation  
**So that** developers can integrate with the system

**Acceptance Criteria:**
- System displays API endpoint URL
- System shows API key status (configured/not configured)
- System displays rate limits
- System shows example API requests
- System links to OpenAPI/Swagger documentation

**Technical Notes:**
- Endpoint: `GET /api/admin/api-config`
- Read API_KEY from .env (don't expose actual key)
- FastAPI auto-generates OpenAPI docs at `/docs`

**Story Points**: 2

---

### Story 4.3: View Audit Logs
**As an** Enterprise Admin  
**I want** to view system activity logs  
**So that** I can track usage and troubleshoot issues

**Acceptance Criteria:**
- System displays list of audit log entries
- Each entry shows: timestamp, user, action, event type
- User can search logs by keyword
- User can filter by event type (API, User, System)
- User can filter by date range
- Logs are paginated (50 per page)

**Technical Notes:**
- Endpoint: `GET /api/admin/audit-logs?search=&type=&start_date=&end_date=&page=`
- Query `audit_logs` table
- Implement pagination

**Story Points**: 5

---

### Story 4.4: Export Audit Logs
**As an** Enterprise Admin  
**I want** to export audit logs to CSV  
**So that** I can analyze them offline or share with compliance

**Acceptance Criteria:**
- User can click "Download CSV" button
- System generates CSV file with all filtered logs
- CSV includes: timestamp, user, action, event type, details
- File downloads automatically
- File has meaningful name (e.g., `audit_logs_2025-01-27.csv`)

**Technical Notes:**
- Generate CSV on backend
- Use Python csv module
- Include all columns from audit_logs table

**Story Points**: 3

---

## Epic 5: System Infrastructure

**Goal**: Set up core backend infrastructure and utilities  
**Priority**: P0 (Critical - Must Have)  
**Estimated Effort**: 1 week

### Story 5.1: Set Up FastAPI Project
**As a** developer  
**I want** a working FastAPI project structure  
**So that** I can start implementing features

**Acceptance Criteria:**
- Project structure follows architecture document
- Main FastAPI app is configured
- CORS middleware is set up
- Health check endpoint works (`GET /health`)
- Project can be run with `uvicorn app.main:app --reload`
- OpenAPI docs are accessible at `/docs`

**Technical Notes:**
- Create `app/main.py`
- Set up CORS for frontend origin
- Configure logging

**Story Points**: 3

---

### Story 5.2: Set Up SQLite Database
**As a** developer  
**I want** a SQLite database with all required tables  
**So that** I can store and retrieve data

**Acceptance Criteria:**
- Database file `app.db` is created
- All tables are created (users, model_metadata, audit_logs, batch_jobs)
- SQLAlchemy models are defined
- Database connection is configured
- Can perform CRUD operations on all tables

**Technical Notes:**
- Create `app/database.py` with SQLAlchemy setup
- Create SQL scripts or use SQLAlchemy to create tables
- Define ORM models in `app/shared/models/`

**Story Points**: 5

---

### Story 5.3: Environment Configuration
**As a** developer  
**I want** configuration loaded from .env file  
**So that** settings are easy to change without code changes

**Acceptance Criteria:**
- `.env` file is read on startup
- Configuration values are accessible throughout app
- Default values are provided for missing config
- `.env.example` file documents all required variables
- Configuration is validated (required fields)

**Technical Notes:**
- Use `python-dotenv` to load .env
- Use Pydantic Settings for configuration
- Create `app/config.py`

**Story Points**: 2

---

### Story 5.4: Error Handling
**As a** user  
**I want** clear error messages when something goes wrong  
**So that** I understand what happened and can fix it

**Acceptance Criteria:**
- All API endpoints return consistent error format
- Error messages are user-friendly (not technical stack traces)
- HTTP status codes are correct (400, 401, 404, 500)
- Frontend displays errors clearly
- Errors are logged for debugging

**Technical Notes:**
- Create custom exception classes
- Use FastAPI exception handlers
- Return JSON error responses

**Story Points**: 3

---

### Story 5.5: Logging
**As a** developer  
**I want** comprehensive logging  
**So that** I can debug issues and monitor system behavior

**Acceptance Criteria:**
- All API requests are logged
- Errors are logged with stack traces
- Logs include: timestamp, level, message, context
- Logs are written to file and console
- Log rotation is configured (optional)

**Technical Notes:**
- Use Python logging module
- Configure log format and levels
- Log to `logs/app.log` file

**Story Points**: 2

---

## Epic 6: ML Model Integration

**Goal**: Integrate pre-trained ML models for digit recognition  
**Priority**: P0 (Critical - Must Have)  
**Estimated Effort**: 1 week

### Story 6.1: Load Pre-trained Models
**As a** system  
**I want** to load pre-trained ML models from files  
**So that** I can use them for predictions

**Acceptance Criteria:**
- System loads SVM model from `models/svm_model.pkl`
- Model is cached in memory after first load
- System handles missing model file gracefully
- System can load multiple model types (SVM, RF, NN)
- Model loading is fast (< 1 second)

**Technical Notes:**
- Use pickle to load .pkl files
- Cache models in global dictionary
- Load on first request (lazy loading)

**Story Points**: 3

---

### Story 6.2: Model Inference Service
**As a** system  
**I want** to run predictions using loaded models  
**So that** users can get digit predictions

**Acceptance Criteria:**
- Service accepts preprocessed image array
- Service runs model prediction
- Service returns predicted digit (0-9)
- Service returns confidence score
- Inference completes in < 100ms

**Technical Notes:**
- Create `ml-service.py`
- Use scikit-learn's `predict()` and `predict_proba()`
- Handle model errors gracefully

**Story Points**: 5

---

### Story 6.3: Calculate Model Metrics
**As a** system  
**I want** to calculate model performance metrics  
**So that** data scientists can view them

**Acceptance Criteria:**
- System calculates accuracy, precision, recall, F1-score
- System calculates confusion matrix
- System calculates ROC curve data
- Metrics are calculated from test dataset
- Metrics can be cached in database

**Technical Notes:**
- Use scikit-learn metrics functions
- Run predictions on test set (MNIST test set)
- Store results in `model_metadata` table

**Story Points**: 8

---

### Story 6.4: Pre-trained Model Setup
**As a** developer  
**I want** pre-trained models available in the system  
**So that** the application works out of the box

**Acceptance Criteria:**
- SVM model is trained and saved as .pkl file
- Model achieves > 95% accuracy on test set
- Model file is placed in `models/` directory
- Model metadata is inserted into database
- Documentation explains how to train new models

**Technical Notes:**
- Train SVM on MNIST dataset
- Save using pickle
- Create script to populate model_metadata table

**Story Points**: 5

---

## Story Prioritization

### Must Have (P0) - MVP
1. Epic 5: System Infrastructure (all stories)
2. Epic 1: Authentication (Stories 1.1, 1.2, 1.3)
3. Epic 2: Image Upload & Prediction (all stories)
4. Epic 6: ML Model Integration (all stories)

**Total Estimated Effort**: 3-4 weeks

### Should Have (P1) - Phase 2
1. Epic 1: User Management (Stories 1.4, 1.5, 1.6)
2. Epic 3: Model Management & Metrics (all stories)
3. Epic 4: Enterprise Administration (all stories)

**Total Estimated Effort**: 2-3 weeks

### Nice to Have (P2) - Future
- Story 3.6: Model Comparison
- Batch processing
- Hyperparameter tuning UI
- Model training UI

---

## Implementation Order

### Week 1: Foundation
- Story 5.1: Set Up FastAPI Project
- Story 5.2: Set Up SQLite Database
- Story 5.3: Environment Configuration
- Story 5.4: Error Handling
- Story 5.5: Logging

### Week 2: Core Features
- Story 1.1: User Login
- Story 1.2: Guest Access
- Story 1.3: User Session Management
- Story 6.4: Pre-trained Model Setup
- Story 6.1: Load Pre-trained Models
- Story 6.2: Model Inference Service

### Week 3: Prediction Flow
- Story 2.1: Upload Image
- Story 2.2: Image Preprocessing
- Story 2.3: Digit Prediction
- Story 2.4: Display Prediction Results
- Story 2.5: Download Results
- Story 2.6: Upload Another Image

### Week 4: Advanced Features
- Story 3.1: List Available Models
- Story 3.2: View Model Performance Metrics
- Story 3.3: View Confusion Matrix
- Story 3.4: View ROC Curves
- Story 4.1: View System Statistics
- Story 4.3: View Audit Logs

### Week 5: Admin Features (If Time Permits)
- Story 1.4: Create User (Admin)
- Story 1.5: Edit User (Admin)
- Story 1.6: Deactivate User (Admin)
- Story 4.2: View API Configuration
- Story 4.4: Export Audit Logs
- Story 3.5: Export Model

---

## Definition of Done

Each user story is considered "Done" when:
- ✅ Code is implemented and follows architecture
- ✅ All acceptance criteria are met
- ✅ Code is tested (manually or with unit tests)
- ✅ API endpoints work and return correct responses
- ✅ Frontend integration works (if applicable)
- ✅ Error handling is implemented
- ✅ Documentation is updated (if needed)

---

## Notes

- **Story Points**: Rough estimate (1 = few hours, 8 = 1-2 days)
- **Effort estimates** are for a team of 2-3 students
- **Prioritization** can be adjusted based on project timeline
- **Optional stories** can be deferred if time is limited
- Focus on **core functionality first** (authentication + prediction)

---

**Document Status**: ✅ Ready for Development
