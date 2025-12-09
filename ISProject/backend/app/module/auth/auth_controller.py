"""
Authentication Controller
Handles all authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.module.auth.schemas import (
    LoginRequest, LoginResponse, LogoutResponse,
    RefreshTokenRequest, RefreshTokenResponse, UserInfoResponse
)
from app.module.auth.services.auth_service import AuthService
from app.core.dependencies import get_current_user
from datetime import datetime

router = APIRouter()
auth_service = AuthService()


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    
    - **email**: User email address
    - **password**: User password
    
    Returns JWT token and user information
    """
    result = await auth_service.login(request.email, request.password, db)
    return LoginResponse(
        success=True,
        data=result,
        message="Login successful",
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/logout", response_model=LogoutResponse, status_code=status.HTTP_200_OK)
async def logout(
    current_user: dict = Depends(get_current_user)
):
    """
    User logout endpoint
    
    Invalidates the current session token
    """
    # TODO: Implement logout logic (token blacklisting, etc.)
    return LogoutResponse(
        success=True,
        message="Logout successful",
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh JWT token endpoint
    
    - **refresh_token**: Refresh token from initial login
    
    Returns new access token
    """
    result = await auth_service.refresh_token(request.refresh_token, db)
    return RefreshTokenResponse(
        success=True,
        data=result,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/me", response_model=UserInfoResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user information
    
    Returns information about the authenticated user
    """
    # Load full user info from database
    from app.shared.models.user import User
    user = db.query(User).filter(User.id == current_user["id"]).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserInfoResponse(
        success=True,
        data={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at
        },
        timestamp=datetime.utcnow().isoformat()
    )
