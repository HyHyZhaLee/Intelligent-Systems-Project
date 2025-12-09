"""
Authentication Service
Business logic for authentication
"""
from sqlalchemy.orm import Session
from app.core.security import verify_password, create_access_token, decode_access_token
from app.core.exceptions import AuthenticationError
from app.shared.models.user import User
from datetime import timedelta
from app.config import settings
from typing import Dict, Optional


class AuthService:
    """Service for authentication operations"""
    
    async def login(self, email: str, password: str, db: Session) -> Dict:
        """
        Authenticate user and generate JWT token
        
        Returns:
            dict: Contains token and user information
        """
        # Load user from database by email
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise AuthenticationError("Invalid email or password")
        
        if not user.is_active:
            raise AuthenticationError("User account is inactive")
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid email or password")
        
        # Generate JWT token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
        access_token = create_access_token(data=token_data)
        
        return {
            "token": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }
    
    async def logout(self, token: str, db: Session) -> bool:
        """
        Invalidate token (logout)
        
        Note: For a simple implementation, we don't blacklist tokens.
        Tokens will expire naturally. For production, consider implementing
        a token blacklist table.
        """
        # For now, just return success
        # In production, you might want to add token to blacklist
        return True
    
    async def refresh_token(self, refresh_token: str, db: Session) -> Dict:
        """
        Generate new access token from refresh token
        
        Note: For simplicity, we use the same token format.
        In production, implement separate refresh token logic.
        """
        # Decode the refresh token
        payload = decode_access_token(refresh_token)
        
        if payload is None:
            raise AuthenticationError("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token payload")
        
        # Load user to verify they still exist and are active
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise AuthenticationError("User not found or inactive")
        
        # Generate new access token
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
        new_token = create_access_token(data=token_data)
        
        return {"token": new_token}
