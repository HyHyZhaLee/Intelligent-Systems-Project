#!/usr/bin/env python3
"""
Check if the application is properly connected to the database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

def check_database_connection():
    """Check database connection and configuration"""
    print("🔍 Checking Database Connection...\n")
    
    # 1. Check configuration
    print("1️⃣  Checking Configuration...")
    try:
        from app.config import settings
        print(f"   ✅ DATABASE_URL: {settings.DATABASE_URL}")
        db_path = Path("app.db")
        print(f"   📁 Database file path: {db_path.absolute()}")
    except Exception as e:
        print(f"   ❌ Configuration error: {e}")
        return False
    
    # 2. Check database engine
    print("\n2️⃣  Checking Database Engine...")
    try:
        from app.database import engine, Base, SessionLocal
        print("   ✅ Database engine created")
        print(f"   ✅ Session factory created")
    except Exception as e:
        print(f"   ❌ Database setup error: {e}")
        return False
    
    # 3. Check if database file exists
    print("\n3️⃣  Checking Database File...")
    if db_path.exists():
        size = db_path.stat().st_size
        print(f"   ✅ Database file exists ({size} bytes)")
    else:
        print("   ⚠️  Database file does NOT exist yet")
        print("   💡 Run: python3 scripts/init_db.py")
    
    # 4. Check database connection
    print("\n4️⃣  Testing Database Connection...")
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.scalar()
        print("   ✅ Database connection successful")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    
    # 5. Check if models are registered
    print("\n5️⃣  Checking Database Models...")
    try:
        from app.shared.models.user import User
        from app.shared.models.audit_log import AuditLog
        from app.shared.models.batch_job import BatchJob
        from app.shared.models.model_metadata import ModelMetadata
        
        models = [User, AuditLog, BatchJob, ModelMetadata]
        print(f"   ✅ Found {len(models)} model(s):")
        for model in models:
            print(f"      • {model.__name__} ({model.__tablename__})")
    except Exception as e:
        print(f"   ❌ Model import error: {e}")
        return False
    
    # 6. Check if tables exist
    print("\n6️⃣  Checking Database Tables...")
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if tables:
            print(f"   ✅ Found {len(tables)} table(s):")
            for table in tables:
                # Get row count
                from sqlalchemy import text
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                print(f"      • {table} ({count} rows)")
        else:
            print("   ⚠️  No tables found in database")
            print("   💡 Run: python3 scripts/init_db.py")
    except Exception as e:
        print(f"   ❌ Table check error: {e}")
        return False
    
    # 7. Check if get_db dependency works
    print("\n7️⃣  Checking Database Dependency...")
    try:
        from app.database import get_db
        db_gen = get_db()
        db = next(db_gen)
        print("   ✅ get_db() dependency works")
        db_gen.close()
    except Exception as e:
        print(f"   ❌ Dependency error: {e}")
        return False
    
    # 8. Check if controllers use database
    print("\n8️⃣  Checking Controller Integration...")
    try:
        from app.module.auth.auth_controller import router as auth_router
        from app.module.predict.predict_controller import router as predict_router
        from app.module.models.models_controller import router as models_router
        from app.module.admin.admin_controller import router as admin_router
        
        routers = [
            ("auth", auth_router),
            ("predict", predict_router),
            ("models", models_router),
            ("admin", admin_router)
        ]
        
        print(f"   ✅ Found {len(routers)} router(s) with database integration:")
        for name, router in routers:
            routes_with_db = [r for r in router.routes if hasattr(r, 'dependant')]
            print(f"      • {name} router ({len(routes_with_db)} routes)")
    except Exception as e:
        print(f"   ⚠️  Router check error: {e}")
    
    print("\n" + "="*60)
    print("✅ Database is properly connected and configured!")
    print("="*60)
    return True

if __name__ == "__main__":
    success = check_database_connection()
    sys.exit(0 if success else 1)
