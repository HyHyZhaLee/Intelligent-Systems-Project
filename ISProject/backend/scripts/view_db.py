#!/usr/bin/env python3
"""
Simple script to view database contents
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, inspect
from app.config import settings
from app.database import Base

def view_database():
    """View database tables and their contents"""
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)
    
    # Check if database file exists
    db_path = Path("app.db")
    if not db_path.exists():
        print("❌ Database file not found!")
        print(f"   Expected location: {db_path.absolute()}")
        print("\n💡 Initialize the database first:")
        print("   python3 scripts/init_db.py")
        return
    
    print(f"📊 Database: {db_path.absolute()}\n")
    
    # Get all table names
    tables = inspector.get_table_names()
    
    if not tables:
        print("⚠️  Database exists but has no tables.")
        print("   Run: python3 scripts/init_db.py")
        return
    
    print(f"📋 Found {len(tables)} table(s):\n")
    
    # Display each table
    for table_name in tables:
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📑 Table: {table_name}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        
        # Get column info
        columns = inspector.get_columns(table_name)
        print("\nColumns:")
        for col in columns:
            nullable = "NULL" if col['nullable'] else "NOT NULL"
            print(f"  • {col['name']}: {col['type']} {nullable}")
        
        # Get row count
        with engine.connect() as conn:
            result = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = result.scalar()
            print(f"\nRow count: {count}")
        
        # Show sample data (first 5 rows)
        if count > 0:
            print("\nSample data (first 5 rows):")
            with engine.connect() as conn:
                result = conn.execute(f"SELECT * FROM {table_name} LIMIT 5")
                rows = result.fetchall()
                for i, row in enumerate(rows, 1):
                    print(f"  Row {i}: {dict(row._mapping)}")
        
        print()

if __name__ == "__main__":
    view_database()
