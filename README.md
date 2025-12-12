# Handwritten Digit OCR System

A full-stack web application for handwritten digit recognition using Machine Learning models (SVM, Random Forest, Neural Network).

## 📋 Project Overview

This system enables three distinct user personas:
- **End Users (Guest)**: Upload images for instant digit recognition
- **Data Scientists**: Analyze model performance, tune hyperparameters, and experiment with models
- **Enterprise Administrators**: Manage users, monitor system health, and access APIs

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 3000)
│  (TypeScript)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  FastAPI Backend│  (Port 8000)
│  (Python)       │
├─────────────────┤
│ Module: Auth    │
│ Module: Predict │
│ Module: Models  │
│ Module: Admin   │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌──────┐  ┌──────────┐  ┌─────────┐
│SQLite│  │Local FS  │  │In-Memory│
│      │  │(uploads/ │  │Cache    │
│      │  │ models/) │  │         │
└──────┘  └──────────┘  └─────────┘
```

## 📁 Project Structure

```
Intelligent-Systems-Project/
├── docs/                          # Project documentation
│   ├── PRD.md                    # Product Requirements Document
│   ├── ARCHITECTURE.md           # System Architecture
│   ├── EPICS_AND_STORIES.md      # User Stories
│   ├── IMPLEMENTATION_READINESS.md
│   └── SPRINT_PLAN.md
│
├── ISProject/
│   ├── frontend/                 # React + TypeScript + Vite
│   │   ├── src/
│   │   │   ├── components/      # React components
│   │   │   └── ...
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── backend/                  # FastAPI + Python
│       ├── app/
│       │   ├── main.py          # FastAPI entry point
│       │   ├── module/          # Feature modules
│       │   │   ├── auth/
│       │   │   ├── predict/
│       │   │   ├── models/
│       │   │   └── admin/
│       │   └── shared/          # Shared models & utilities
│       ├── requirements.txt
│       └── .env.example
│
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** and **npm** (for frontend)
- **Make** (optional, for convenience commands)

### Installation

Install all project dependencies:

```bash
make install
```

Or manually:

```bash
# Backend
cd ISProject/backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd ISProject/frontend
npm install
```

### Development

Run both frontend and backend concurrently:

```bash
make dev-all
```

Or manually:

```bash
# Terminal 1 - Backend
cd ISProject/backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd ISProject/frontend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **API ReDoc**: http://localhost:8000/redoc

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[PRD.md](docs/PRD.md)** - Product Requirements Document with all features and requirements
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture and technical design

## 🔌 API Endpoints

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

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite 6.3.5** - Build tool
- **shadcn/ui** - UI components (Radix UI)
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Sonner** - Notifications

### Backend
- **FastAPI 0.109.0** - Web framework
- **Python 3.9+** - Programming language
- **Pydantic 2.5.3** - Data validation
- **SQLAlchemy 2.0.25** - ORM
- **SQLite** - Database (development)
- **scikit-learn 1.4.0** - ML models
- **Pillow 10.2.0** - Image processing
- **python-jose** - JWT authentication
- **email-validator** - Email validation for Pydantic
- **uvicorn** - ASGI server

## 📝 Development Status

### ✅ Completed
- Frontend UI implementation (all three role-based interfaces)
- Backend project structure
- All API endpoints defined
- Database models
- Authentication framework
- Configuration management
- Backend server setup and error fixes
- Pydantic v2 compatibility
- OpenAPI schema generation

### ⏳ In Progress / TODO
- Backend business logic implementation
- ML model integration
- Database operations
- Image preprocessing pipeline
- Model metrics calculation
- User management CRUD
- Audit logging
- API integration with frontend

## 🧪 Testing

```bash
# Backend tests (when implemented)
cd ISProject/backend
pytest

# Frontend tests (when implemented)
cd ISProject/frontend
npm test
```

## 📦 Build for Production

```bash
# Backend
cd ISProject/backend
# Use gunicorn with uvicorn workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend
cd ISProject/frontend
npm run build
# Output in build/ directory
```

## 🔧 Configuration

### Backend Configuration

Edit `ISProject/backend/.env`:

```env
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=your-secret-key
API_KEY=your-api-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend Configuration

Create `ISProject/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENVIRONMENT=development
```

## 🤝 Contributing

1. Follow the architecture patterns defined in `docs/ARCHITECTURE.md`
2. Implement features according to user stories in `docs/EPICS_AND_STORIES.md`
3. Follow the sprint plan in `docs/SPRINT_PLAN.md`
4. Ensure all endpoints are documented
5. Write tests for new features

## 📄 License

This project is part of an Intelligent Systems course at HCMUT.

## 👥 Team

- Product Manager
- System Architect
- Developers

## 🐛 Troubleshooting

### Backend Issues

**Issue**: `ValueError: "Settings" object has no field "ALLOWED_ORIGINS"`  
**Solution**: The `ALLOWED_ORIGINS` configuration is automatically parsed from the `.env` file. Ensure your `.env` file has the correct format:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Issue**: `ImportError: email-validator is not installed`  
**Solution**: Install the missing dependency:
```bash
cd ISProject/backend
pip install email-validator>=2.1.1
```

**Issue**: `PydanticSerializationError: Unable to serialize unknown type: <class 'ellipsis'>`  
**Solution**: This has been fixed. If you encounter this, ensure you're using the latest version of the schemas.

**Issue**: `Field "model_type" has conflict with protected namespace "model_"`  
**Solution**: This warning has been resolved. The models now use `ConfigDict(protected_namespaces=())` to allow `model_type` fields.

### Common Commands

```bash
# Stop backend server if port is in use
make stop-backend

# Check if backend is running
curl http://localhost:8000/health

# View API documentation
open http://localhost:8000/docs
```

## 📞 Support

For questions or issues, refer to the documentation in the `docs/` folder or check the API documentation at `/docs` endpoint.

---

**Status**: 🚧 In Development  
**Version**: 1.0.0  
**Last Updated**: 2025-01-27
