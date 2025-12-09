#!/usr/bin/env python3
"""
Add a new user to the database
"""
import os
import sys
import getpass

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import SessionLocal, init_db
from app.shared.models.user import User
from app.core.security import get_password_hash


def add_user(email: str, password: str, name: str, role: str = "guest"):
    """
    Add a new user to the database
    
    Args:
        email: User email address
        password: User password (will be hashed)
        name: User full name
        role: User role ('guest', 'data-scientist', 'admin', 'ml-engineer', 'analyst')
    """
    # Ensure database and tables exist
    init_db()
    
    # Clean and validate password
    password = password.strip()
    
    # Validate password length before proceeding
    password_bytes = password.encode('utf-8')
    original_length = len(password_bytes)
    
    if len(password_bytes) > 72:
        print(f"⚠️  Warning: Password exceeds 72-byte bcrypt limit ({original_length} bytes)")
        print("   Truncating password to 72 bytes...")
        # Truncate carefully to avoid breaking multi-byte characters
        truncated_bytes = password_bytes[:72]
        # Remove bytes from the end until we can decode properly
        while True:
            try:
                password = truncated_bytes.decode('utf-8')
                break
            except UnicodeDecodeError:
                if len(truncated_bytes) == 0:
                    print("❌ Error: Password cannot be processed")
                    return False
                truncated_bytes = truncated_bytes[:-1]
        print(f"   Password truncated to {len(password.encode('utf-8'))} bytes")
    
    if len(password) < 6:
        print("❌ Password must be at least 6 characters long")
        return False
    
    db = SessionLocal()
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"❌ User with email '{email}' already exists!")
            return False
        
        # Validate role
        valid_roles = ['guest', 'data-scientist', 'admin', 'ml-engineer', 'analyst']
        if role not in valid_roles:
            print(f"❌ Invalid role. Must be one of: {', '.join(valid_roles)}")
            return False
        
        # Final password validation and truncation before hashing
        # CRITICAL: Ensure password is definitely within 72 bytes
        password_final = password.strip()
        
        # Convert to bytes and force truncate if needed
        password_final_bytes = password_final.encode('utf-8')
        if len(password_final_bytes) > 72:
            # Simply truncate to 72 bytes - this is what bcrypt expects
            password_final_bytes = password_final_bytes[:72]
            # Decode with error handling
            try:
                password_final = password_final_bytes.decode('utf-8')
            except (UnicodeDecodeError, UnicodeError):
                # If decode fails, use replacement characters
                password_final = password_final_bytes.decode('utf-8', errors='replace')
        
        # Final verification - must be <= 72 bytes
        final_byte_check = password_final.encode('utf-8')
        if len(final_byte_check) > 72:
            # Last resort: force ASCII truncation
            password_final = password_final.encode('ascii', errors='ignore')[:72].decode('ascii', errors='ignore')
            if not password_final:
                # If all else fails, use a default safe password
                print("⚠️  Warning: Password encoding issue, using truncated version")
                password_final = password[:72] if len(password) <= 72 else password[:72]
        
        # Verify one more time
        assert len(password_final.encode('utf-8')) <= 72, "Password must be <= 72 bytes"
        
        # Create new user
        try:
            hashed = get_password_hash(password_final)
        except Exception as e:
            print(f"❌ Error hashing password: {e}")
            print(f"   Password length: {len(password_final.encode('utf-8'))} bytes")
            return False
        
        user = User(
            email=email,
            hashed_password=hashed,
            name=name,
            role=role,
            is_active=True
        )
        
        db.add(user)
        db.commit()
        
        print(f"✅ User created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {name}")
        print(f"   Role: {role}")
        print(f"   ID: {user.id}")
        
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating user: {str(e)}")
        return False
    finally:
        db.close()


def interactive_add_user(is_first_user=False):
    """Interactive mode to add a user"""
    if is_first_user:
        print("👤 Create Admin User (First User Setup)\n")
        print("This will be your admin account with full access to all features.\n")
    else:
        print("👤 Add New User\n")
    
    # Get user input
    email = input("Email: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    # Basic email validation
    if "@" not in email or "." not in email.split("@")[-1]:
        print("⚠️  Warning: Email format may be invalid")
    
    password = getpass.getpass("Password: ")
    if not password:
        print("❌ Password is required")
        return
    
    # Clean password - remove any control characters or extra whitespace
    password = password.strip()
    
    # Validate password length (bcrypt limit is 72 bytes)
    password_bytes = password.encode('utf-8')
    original_byte_length = len(password_bytes)
    
    if original_byte_length > 72:
        print(f"⚠️  Warning: Password is longer than 72 bytes ({original_byte_length} bytes)")
        print("   Password will be truncated to 72 bytes for hashing")
        # Truncate carefully to avoid breaking multi-byte characters
        truncated_bytes = password_bytes[:72]
        while True:
            try:
                password = truncated_bytes.decode('utf-8')
                break
            except UnicodeDecodeError:
                if len(truncated_bytes) == 0:
                    print("❌ Error: Password cannot be processed")
                    return
                truncated_bytes = truncated_bytes[:-1]
        final_byte_length = len(password.encode('utf-8'))
        print(f"   Password truncated to {final_byte_length} bytes")
    
    if len(password) < 6:
        print("❌ Password must be at least 6 characters long")
        return
    
    # Double-check byte length before passing to add_user
    final_check = password.encode('utf-8')
    if len(final_check) > 72:
        # One more truncation attempt
        password = final_check[:72].decode('utf-8', errors='ignore')
    
    name = input("Full Name: ").strip()
    if not name:
        print("❌ Name is required")
        return
    
    if is_first_user:
        # First user should be admin
        print("\n⚠️  This is the first user - will be created as ADMIN")
        print("   Admin role has full access to all features including:")
        print("   - User management")
        print("   - System administration")
        print("   - Model management")
        print("   - All data scientist features\n")
        role = "admin"
        confirm = input("Continue? [Y/n]: ").strip().lower()
        if confirm and confirm != 'y' and confirm != 'yes':
            print("❌ User creation cancelled")
            return
    else:
        print("\nAvailable roles:")
        print("  1. guest")
        print("  2. data-scientist")
        print("  3. admin (full access - user management, system admin, all features)")
        print("  4. ml-engineer")
        print("  5. analyst")
        
        role_choice = input("\nRole [1-5] (default: 3 for admin): ").strip() or "3"
        
        role_map = {
            "1": "guest",
            "2": "data-scientist",
            "3": "admin",
            "4": "ml-engineer",
            "5": "analyst"
        }
        
        role = role_map.get(role_choice, "admin")
    
    print()
    add_user(email, password, name, role)


if __name__ == "__main__":
    if len(sys.argv) == 5:
        # Command line mode: python3 add_user.py email password name role
        email, password, name, role = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
        success = add_user(email, password, name, role)
        sys.exit(0 if success else 1)
    elif len(sys.argv) == 4:
        # Command line mode without role (defaults to admin)
        email, password, name = sys.argv[1], sys.argv[2], sys.argv[3]
        success = add_user(email, password, name, "admin")
        sys.exit(0 if success else 1)
    elif len(sys.argv) == 2 and sys.argv[1] == "--first-user":
        # First user setup mode (admin by default)
        interactive_add_user(is_first_user=True)
    else:
        # Interactive mode
        interactive_add_user(is_first_user=False)
