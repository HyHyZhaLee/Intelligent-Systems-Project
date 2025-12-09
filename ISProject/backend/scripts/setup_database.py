#!/usr/bin/env python3
"""
Setup database and check if users exist (without creating sample users)
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import init_db, SessionLocal, engine
from app.shared.models.user import User


def setup_database():
    """Initialize database tables only (no sample users) and check if users exist"""
    print("📦 Initializing database tables...")
    
    # Check if database file exists before initialization (fresh install check)
    db_path = Path("app.db")
    db_existed_before = db_path.exists()
    db_size_before = db_path.stat().st_size if db_existed_before else 0
    
    # Only create tables, don't create sample users
    init_db()
    print("✅ Database tables created")
    
    # Check if database was just created (fresh install)
    db_existed_after = db_path.exists()
    db_size_after = db_path.stat().st_size if db_existed_after else 0
    is_fresh_install = not db_existed_before or (db_existed_before and db_size_before == 0 and db_size_after > 0)
    
    # Check if users exist
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        db.close()
        
        if user_count == 0:
            # No users found - definitely need to prompt
            return True
        elif is_fresh_install:
            # Fresh install but users exist (maybe from init_db.py) - still prompt for first admin user
            print(f"⚠️  Found {user_count} user(s) from previous setup")
            print("   You may want to create an additional admin user")
            # Return True to prompt anyway on fresh install
            return True
        else:
            print(f"✅ Found {user_count} user(s) in database")
            return False  # Users already exist, not a fresh install
    except Exception as e:
        db.close()
        print(f"⚠️  Error checking users: {e}")
        return True  # Assume we need to create user


if __name__ == "__main__":
    need_user = setup_database()
    sys.exit(0 if not need_user else 1)
