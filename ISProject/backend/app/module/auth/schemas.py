"""
Authentication Schemas
Pydantic models for request/response validation
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    success: bool
    data: dict
    message: Optional[str] = None
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "user": {
                        "id": 1,
                        "email": "user@example.com",
                        "name": "John Doe",
                        "role": "data-scientist"
                    }
                },
                "message": "Login successful",
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class LogoutResponse(BaseModel):
    success: bool
    message: str
    timestamp: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str


class UserInfo(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime


class UserInfoResponse(BaseModel):
    success: bool
    data: UserInfo
    timestamp: str
