"""
Security Utilities
JWT token generation, password hashing, API key validation
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

# Password hashing context
# Configure bcrypt with explicit settings to avoid initialization issues
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"  # Use 2b identifier to avoid compatibility issues
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        # Try direct bcrypt first
        import bcrypt
        pwd_bytes = plain_password.encode('utf-8')
        if len(pwd_bytes) > 72:
            pwd_bytes = pwd_bytes[:72]
        hash_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        # Fallback to passlib
        return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Bcrypt has a 72-byte limit, so we need to ensure the password is within that limit
    if not isinstance(password, str):
        password = str(password)
    
    # Remove any leading/trailing whitespace
    password = password.strip()
    
    # Convert to bytes to check actual byte length
    try:
        password_bytes = password.encode('utf-8')
    except (UnicodeEncodeError, AttributeError):
        # Fallback: convert to string and try again
        password = str(password).strip()
        password_bytes = password.encode('utf-8', errors='ignore')
    
    # CRITICAL: Force truncate to exactly 72 bytes maximum
    if len(password_bytes) > 72:
        # Simply truncate to 72 bytes - bcrypt will handle it
        password_bytes = password_bytes[:72]
        # Try to decode, but if it fails, use the raw bytes as string
        try:
            password = password_bytes.decode('utf-8')
        except (UnicodeDecodeError, UnicodeError):
            # If decode fails, create a safe string representation
            password = password_bytes.decode('utf-8', errors='replace')
    
    # Final verification - ensure we're definitely under 72 bytes
    final_check = password.encode('utf-8')
    if len(final_check) > 72:
        # Last resort: take first 72 bytes and decode with replacement
        password = final_check[:72].decode('utf-8', errors='replace')
    
    # Hash the password (bcrypt will handle any remaining edge cases)
    # Ensure password is definitely a string and within limits
    if not isinstance(password, str):
        password = str(password)
    
    # Final byte check
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        password = pwd_bytes[:72].decode('utf-8', errors='replace')
    
    try:
        # Use bcrypt directly to avoid passlib initialization issues
        import bcrypt
        # Generate salt and hash
        salt = bcrypt.gensalt(rounds=12)
        pwd_bytes_final = password.encode('utf-8')
        if len(pwd_bytes_final) > 72:
            pwd_bytes_final = pwd_bytes_final[:72]
        hashed = bcrypt.hashpw(pwd_bytes_final, salt)
        # Return as string (bcrypt returns bytes)
        return hashed.decode('utf-8')
    except Exception as e:
        # Fallback to passlib if direct bcrypt fails
        try:
            return pwd_context.hash(password)
        except ValueError as ve:
            # If still fails, try with a truncated ASCII version
            if "longer than 72 bytes" in str(ve):
                password_ascii = password.encode('ascii', errors='ignore')[:72].decode('ascii', errors='ignore')
                return pwd_context.hash(password_ascii)
            raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_api_key(api_key: str) -> bool:
    """Verify API key against configured key in .env"""
    return api_key == settings.API_KEY
