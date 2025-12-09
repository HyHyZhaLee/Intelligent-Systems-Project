# Backend Scripts

Utility scripts for backend setup and maintenance.

## Available Scripts

### `init_db.py`
Initialize database with tables and create sample users.

```bash
cd ISProject/backend
python3 scripts/init_db.py
```

**Creates:**
- All database tables (users, audit_logs, batch_jobs, model_metadata)
- Sample users:
  - `datascientist@example.com` / `password123` (data-scientist role)
  - `admin@example.com` / `password123` (enterprise role)

### `train_model.py`
Train and save a pre-trained SVM model using MNIST dataset.

```bash
cd ISProject/backend
python3 scripts/train_model.py
```

**Creates:**
- `models/svm_model.pkl` - Trained SVM model
- `models/svm_model_metadata.json` - Model metadata and metrics

**Note:** First run will download MNIST dataset (~11MB), which may take a few minutes.

## Setup Workflow

1. **Initialize database:**
   ```bash
   python3 scripts/init_db.py
   ```

2. **Train model (optional, for testing):**
   ```bash
   python3 scripts/train_model.py
   ```

3. **Start server:**
   ```bash
   python3 -m uvicorn app.main:app --reload
   ```

## Requirements

All scripts require:
- Python 3.10+
- Installed backend dependencies (`pip install -r requirements.txt`)
- Proper `.env` configuration
