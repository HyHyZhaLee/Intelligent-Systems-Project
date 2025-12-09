"""
Initialize database with tables and sample data
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import init_db, SessionLocal
from app.shared.models.user import User
from app.core.security import get_password_hash


def create_sample_users():
    """Create sample users for testing"""
    db = SessionLocal()
    
    try:
        # Check if users already exist
        existing = db.query(User).first()
        if existing:
            print("Users already exist. Skipping sample user creation.")
            return
        
        # Create sample users
        users = [
            {
                "email": "datascientist@example.com",
                "password": "password123",
                "name": "Data Scientist",
                "role": "data-scientist"
            },
            {
                "email": "admin@example.com",
                "password": "password123",
                "name": "Admin User",
                "role": "admin"
            }
        ]
        
        for user_data in users:
            user = User(
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                is_active=True
            )
            db.add(user)
        
        db.commit()
        print("✅ Sample users created:")
        for user_data in users:
            print(f"   - {user_data['email']} (password: {user_data['password']})")
    
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating sample users: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("✅ Database tables created")
    
    print("\nCreating sample users...")
    create_sample_users()
    
    print("\n✅ Database initialization complete!")
