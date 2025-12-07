# Sprint Plan
## Handwritten Digit OCR System

**Version:** 1.0  
**Date:** 2025-01-27  
**Status:** Active  
**Author:** Scrum Master

---

## Sprint Overview

This document outlines the sprint plan for implementing the Handwritten Digit OCR System. The plan is organized into **5 sprints** over **5 weeks**, with each sprint focusing on delivering working, testable features.

**Team Size**: 2-3 students  
**Sprint Duration**: 1 week per sprint  
**Total Duration**: 5 weeks

---

## Sprint Planning Principles

1. **Incremental Delivery**: Each sprint delivers working features
2. **Dependency Management**: Stories are ordered to minimize blockers
3. **Risk Mitigation**: High-risk items addressed early
4. **MVP Focus**: P0 stories prioritized, P1 stories as stretch goals
5. **Definition of Done**: All stories must meet acceptance criteria before completion

---

## Sprint 1: Foundation & Infrastructure

**Duration**: Week 1  
**Goal**: Set up project foundation and core infrastructure  
**Sprint Capacity**: ~40 story points  
**Focus**: Infrastructure setup, no user-facing features yet

### Stories

| Story ID | Story | Points | Status |
|----------|-------|--------|--------|
| 5.1 | Set Up FastAPI Project | 3 | 🔲 To Do |
| 5.2 | Set Up SQLite Database | 5 | 🔲 To Do |
| 5.3 | Environment Configuration | 2 | 🔲 To Do |
| 5.4 | Error Handling | 3 | 🔲 To Do |
| 5.5 | Logging | 2 | 🔲 To Do |

**Total Points**: 15

### Sprint Goals

- ✅ FastAPI application runs and responds to requests
- ✅ SQLite database is set up with all required tables
- ✅ Configuration management works (.env loading)
- ✅ Error handling framework is in place
- ✅ Logging system is operational

### Deliverables

1. Working FastAPI application (`app/main.py`)
2. Database schema created (SQL scripts or SQLAlchemy models)
3. `.env.example` file with all required variables
4. Error handling middleware and custom exceptions
5. Logging configuration (file + console)

### Definition of Done

- [ ] `uvicorn app.main:app --reload` starts without errors
- [ ] `GET /health` endpoint returns `{"status": "ok"}`
- [ ] Database file `app.db` is created
- [ ] All tables exist (users, model_metadata, audit_logs, batch_jobs)
- [ ] `.env` file loads configuration correctly
- [ ] Errors return consistent JSON format
- [ ] Logs are written to file and console

### Dependencies

- None (foundation sprint)

### Risks

- ⚠️ **Low Risk**: Standard setup tasks, well-documented

---

## Sprint 2: Authentication & ML Foundation

**Duration**: Week 2  
**Goal**: Enable user authentication and ML model integration  
**Sprint Capacity**: ~40 story points  
**Focus**: Core authentication + ML model setup

### Stories

| Story ID | Story | Points | Status |
|----------|-------|--------|--------|
| 1.1 | User Login | 5 | 🔲 To Do |
| 1.2 | Guest Access | 2 | 🔲 To Do |
| 1.3 | User Session Management | 3 | 🔲 To Do |
| 6.4 | Pre-trained Model Setup | 5 | 🔲 To Do |
| 6.1 | Load Pre-trained Models | 3 | 🔲 To Do |
| 6.2 | Model Inference Service | 5 | 🔲 To Do |

**Total Points**: 23

### Sprint Goals

- ✅ Users can log in with email/password
- ✅ Guest users can access upload interface
- ✅ JWT tokens are generated and validated
- ✅ Pre-trained SVM model is available
- ✅ Model can be loaded and used for inference

### Deliverables

1. Login endpoint (`POST /api/auth/login`)
2. JWT token generation and validation
3. Guest access flow (no authentication required)
4. Pre-trained SVM model file (`models/svm_model.pkl`)
5. Model loading service
6. Basic inference service (can predict on test data)

### Definition of Done

- [ ] User can log in via frontend
- [ ] JWT token is returned and stored
- [ ] Protected routes require valid JWT
- [ ] Guest can access upload page without login
- [ ] Model file exists in `models/` directory
- [ ] Model can be loaded into memory
- [ ] Model can predict on sample data
- [ ] All acceptance criteria met for each story

### Dependencies

- ✅ Sprint 1 must be complete (database, error handling)

### Risks

- ⚠️ **Medium Risk**: ML model training/setup may take time
- ⚠️ **Low Risk**: JWT authentication is standard pattern

### Notes

- Model training can be done in parallel with other stories
- Test with MNIST dataset to ensure model works

---

## Sprint 3: Image Upload & Prediction

**Duration**: Week 3  
**Goal**: Complete end-to-end prediction flow  
**Sprint Capacity**: ~40 story points  
**Focus**: Core user feature - digit recognition

### Stories

| Story ID | Story | Points | Status |
|----------|-------|--------|--------|
| 2.1 | Upload Image | 3 | 🔲 To Do |
| 2.2 | Image Preprocessing | 5 | 🔲 To Do |
| 2.3 | Digit Prediction | 8 | 🔲 To Do |
| 2.4 | Display Prediction Results | 2 | 🔲 To Do |
| 2.5 | Download Results | 3 | 🔲 To Do |
| 2.6 | Upload Another Image | 1 | 🔲 To Do |

**Total Points**: 22

### Sprint Goals

- ✅ Users can upload images
- ✅ Images are preprocessed correctly
- ✅ Predictions are returned accurately
- ✅ Results are displayed in frontend
- ✅ Users can download results

### Deliverables

1. Image upload endpoint (`POST /api/predict`)
2. Image preprocessing service (resize, grayscale, normalize)
3. Prediction endpoint integration
4. Frontend API integration (replace mock data)
5. Result display and download functionality

### Definition of Done

- [ ] User can upload PNG/JPG image (max 5MB)
- [ ] Image is preprocessed to 28x28 grayscale
- [ ] Prediction returns digit (0-9) and confidence score
- [ ] Frontend displays result correctly
- [ ] Download button generates JSON file
- [ ] User can upload another image without refresh
- [ ] Error handling for invalid files
- [ ] Response time < 500ms

### Dependencies

- ✅ Sprint 2 must be complete (authentication, ML model)

### Risks

- ⚠️ **Medium Risk**: Image preprocessing edge cases
- ⚠️ **Low Risk**: Prediction accuracy (using pre-trained model)

### Notes

- This is the **core user feature** - prioritize quality
- Test with various image sizes and formats
- Frontend integration is critical

---

## Sprint 4: Model Metrics & Analytics

**Duration**: Week 4  
**Goal**: Enable data scientists to view model performance  
**Sprint Capacity**: ~40 story points  
**Focus**: Data scientist dashboard features

### Stories

| Story ID | Story | Points | Status |
|----------|-------|--------|--------|
| 3.1 | List Available Models | 3 | 🔲 To Do |
| 3.2 | View Model Performance Metrics | 5 | 🔲 To Do |
| 3.3 | View Confusion Matrix | 5 | 🔲 To Do |
| 3.4 | View ROC Curves | 8 | 🔲 To Do |
| 4.1 | View System Statistics | 5 | 🔲 To Do |
| 4.3 | View Audit Logs | 5 | 🔲 To Do |

**Total Points**: 31

### Sprint Goals

- ✅ Data scientists can view all available models
- ✅ Model performance metrics are displayed
- ✅ Confusion matrix is visualized
- ✅ ROC curves are displayed
- ✅ System statistics are available
- ✅ Audit logs are viewable

### Deliverables

1. Model listing endpoint (`GET /api/models`)
2. Metrics calculation service
3. Confusion matrix endpoint and visualization
4. ROC curve calculation and visualization
5. System statistics endpoint
6. Audit log viewing endpoint

### Definition of Done

- [ ] Model list displays all available models
- [ ] Metrics (accuracy, precision, recall, F1) are accurate
- [ ] Confusion matrix displays correctly (10x10 grid)
- [ ] ROC curves render with multiple digit classes
- [ ] System stats show: processed today, success rate, errors, active users
- [ ] Audit logs are searchable and filterable
- [ ] All data comes from backend (no mock data)
- [ ] Frontend charts update correctly

### Dependencies

- ✅ Sprint 3 must be complete (prediction flow working)
- ✅ Model metadata must be in database

### Risks

- ⚠️ **Medium Risk**: Metrics calculation complexity
- ⚠️ **Medium Risk**: ROC curve calculation and visualization

### Notes

- Metrics can be pre-calculated and stored in database
- Use Recharts for frontend visualizations (already in project)
- Test with real model predictions

---

## Sprint 5: Admin Features & Polish

**Duration**: Week 5  
**Goal**: Complete enterprise admin features and polish  
**Sprint Capacity**: ~40 story points  
**Focus**: User management, API config, final polish

### Stories

| Story ID | Story | Points | Status |
|----------|-------|--------|--------|
| 1.4 | Create User (Admin) | 5 | 🔲 To Do |
| 1.5 | Edit User (Admin) | 3 | 🔲 To Do |
| 1.6 | Deactivate User (Admin) | 2 | 🔲 To Do |
| 4.2 | View API Configuration | 2 | 🔲 To Do |
| 4.4 | Export Audit Logs | 3 | 🔲 To Do |
| 3.5 | Export Model | 3 | 🔲 To Do |

**Total Points**: 18

### Sprint Goals

- ✅ Admins can manage users (create, edit, deactivate)
- ✅ API configuration is viewable
- ✅ Audit logs can be exported
- ✅ Models can be exported
- ✅ All MVP features are complete

### Deliverables

1. User management endpoints (CRUD)
2. API configuration endpoint
3. CSV export functionality for audit logs
4. Model export endpoint
5. Frontend integration for all admin features

### Definition of Done

- [ ] Admin can create new users
- [ ] Admin can edit user details and roles
- [ ] Admin can deactivate users
- [ ] API config displays endpoint and key status
- [ ] Audit logs export to CSV works
- [ ] Model export downloads .pkl file
- [ ] All admin features work from Enterprise portal
- [ ] Error handling is comprehensive

### Dependencies

- ✅ Sprint 4 must be complete (audit logging)

### Risks

- ⚠️ **Low Risk**: Standard CRUD operations
- ⚠️ **Low Risk**: CSV export is straightforward

### Notes

- This sprint completes MVP
- Focus on polish and error handling
- Test all admin workflows end-to-end

---

## Sprint Summary

| Sprint | Focus | Stories | Points | Priority |
|--------|-------|---------|--------|----------|
| Sprint 1 | Infrastructure | 5 | 15 | P0 |
| Sprint 2 | Auth + ML | 6 | 23 | P0 |
| Sprint 3 | Prediction | 6 | 22 | P0 |
| Sprint 4 | Metrics | 6 | 31 | P1 |
| Sprint 5 | Admin | 6 | 18 | P1 |

**Total**: 29 stories, 109 story points

---

## Velocity Planning

### Assumptions

- **Team Velocity**: ~20-25 story points per sprint (2-3 students)
- **Story Point Scale**: 1 = few hours, 3 = half day, 5 = 1 day, 8 = 1-2 days
- **Buffer**: 20% buffer for unexpected issues

### Sprint Capacity

- **Sprint 1**: 15 points (under capacity - good for foundation)
- **Sprint 2**: 23 points (at capacity)
- **Sprint 3**: 22 points (at capacity)
- **Sprint 4**: 31 points (over capacity - may need to defer some)
- **Sprint 5**: 18 points (under capacity - good for polish)

### Risk Mitigation

- **Sprint 4 is overloaded**: Consider moving Story 3.4 (ROC Curves) to Sprint 5 if needed
- **Sprint 5 is lighter**: Good buffer for Sprint 4 overflow or additional polish

---

## Dependencies & Critical Path

### Critical Path

```
Sprint 1 (Infrastructure)
    ↓
Sprint 2 (Auth + ML)
    ↓
Sprint 3 (Prediction) ← Core user feature
    ↓
Sprint 4 (Metrics)
    ↓
Sprint 5 (Admin)
```

### Key Dependencies

1. **Sprint 2 depends on Sprint 1**: Database must exist for user authentication
2. **Sprint 3 depends on Sprint 2**: ML model must be loaded for predictions
3. **Sprint 4 depends on Sprint 3**: Need prediction flow working for metrics
4. **Sprint 5 depends on Sprint 4**: Audit logging needed for admin features

### Blockers to Watch

- ⚠️ **Sprint 1 delays** → All subsequent sprints affected
- ⚠️ **Sprint 2 ML model issues** → Sprint 3 blocked
- ⚠️ **Sprint 3 prediction issues** → Sprint 4 metrics can't be calculated

---

## Risk Management

### High-Risk Items

| Risk | Sprint | Mitigation |
|------|--------|------------|
| ML model accuracy | Sprint 2 | Use pre-trained MNIST models (known good) |
| Image preprocessing edge cases | Sprint 3 | Test with various image formats early |
| Metrics calculation complexity | Sprint 4 | Pre-calculate and store in database |
| Timeline delays | All | 20% buffer, prioritize P0 stories |

### Contingency Plans

- **If Sprint 4 is too heavy**: Move Story 3.4 (ROC Curves) to Sprint 5
- **If ML model issues**: Use simpler model or mock data temporarily
- **If timeline slips**: Focus on P0 stories, defer P1 to "if time permits"

---

## Definition of Done (Sprint-Level)

Each sprint is considered "Done" when:

- [ ] All stories meet their individual Definition of Done
- [ ] Code is reviewed (peer review or self-review)
- [ ] Features are tested manually
- [ ] Documentation is updated (API docs, README)
- [ ] No critical bugs remain
- [ ] Sprint demo is prepared (if required)

---

## Sprint Ceremonies

### Daily Standups (Recommended)

- **Duration**: 15 minutes
- **Format**: What did I do? What will I do? Any blockers?
- **Frequency**: Daily (or every 2 days for university project)

### Sprint Planning (This Document)

- **Duration**: 1-2 hours
- **Activities**: Review stories, assign tasks, identify dependencies
- **Frequency**: Start of each sprint

### Sprint Review (Demo)

- **Duration**: 30 minutes
- **Activities**: Demo working features, gather feedback
- **Frequency**: End of each sprint

### Sprint Retrospective

- **Duration**: 30 minutes
- **Activities**: What went well? What to improve? Action items
- **Frequency**: End of each sprint

---

## Success Metrics

### Sprint 1 Success
- ✅ Application runs without errors
- ✅ Database is set up
- ✅ Health check works

### Sprint 2 Success
- ✅ Users can log in
- ✅ ML model loads and predicts

### Sprint 3 Success
- ✅ End-to-end prediction works
- ✅ Users can upload and get results

### Sprint 4 Success
- ✅ Data scientists can view metrics
- ✅ Charts display correctly

### Sprint 5 Success
- ✅ All MVP features complete
- ✅ Admin features work
- ✅ System is ready for demo

---

## Notes for Team

1. **Start with Sprint 1**: Don't skip infrastructure setup
2. **Test Early**: Test each story as you complete it
3. **Communicate Blockers**: Raise issues immediately
4. **Follow Architecture**: Stick to module structure
5. **Update Documentation**: Keep API docs current
6. **Focus on MVP**: P0 stories first, P1 if time permits

---

## Adjustments & Updates

This sprint plan is a **living document**. Update as needed:

- [ ] Story completion status
- [ ] Velocity adjustments
- [ ] Scope changes
- [ ] Risk updates
- [ ] Dependency changes

**Last Updated**: 2025-01-27

---

**Document Status**: ✅ Active - Ready for Sprint 1

**Next Action**: Begin Sprint 1 - Infrastructure Setup
