"""
Shared Dependencies
Authentication, database, rate limiting
"""
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token, verify_api_key
from app.core.exceptions import AuthenticationError, AuthorizationError
from typing import Optional

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise AuthenticationError("Invalid or expired token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")
    
    # Load user from database
    from app.shared.models.user import User
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise AuthenticationError("User not found or inactive")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role
    }


def get_current_admin_user(current_user: dict = Depends(get_current_user)):
    """Dependency to ensure user is an admin"""
    if current_user.get("role") != "admin":
        raise AuthorizationError("Admin access required")
    return current_user


def get_current_data_scientist(current_user: dict = Depends(get_current_user)):
    """Dependency to ensure user is a data scientist"""
    if current_user.get("role") not in ["data-scientist", "admin"]:
        raise AuthorizationError("Data scientist access required")
    return current_user


def verify_api_key_header(api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Dependency to verify API key from header"""
    if not api_key:
        raise AuthenticationError("API key required")
    if not verify_api_key(api_key):
        raise AuthenticationError("Invalid API key")
    return True


def get_optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """Optional authentication - accepts JWT or API key"""
    if credentials:
        return get_current_user(credentials, db)
    elif api_key and verify_api_key(api_key):
        return {"id": None, "email": None, "role": "api_user"}
    return None
