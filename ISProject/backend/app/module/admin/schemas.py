"""
Admin Schemas
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: str  # 'data-scientist', 'admin', 'ml-engineer', 'analyst'


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserInfo(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime


class UserListResponse(BaseModel):
    success: bool
    data: List[UserInfo]
    timestamp: str


class UserResponse(BaseModel):
    success: bool
    data: UserInfo
    timestamp: str


class SystemStatsResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "images_processed_today": 1250,
                    "success_rate": 98.5,
                    "error_count": 19,
                    "active_users": 45
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class APIConfigResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "api_base_url": "https://api.ocr.com",
                    "api_key_configured": True,
                    "rate_limit": 10000,
                    "endpoints": [
                        {"path": "/api/predict", "method": "POST", "description": "Single image prediction"},
                        {"path": "/api/batch", "method": "POST", "description": "Batch processing"}
                    ]
                },
                "timestamp": "2025-01-27T10:00:00Z"
            }
        }


class AuditLogFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[int] = None
    event_type: Optional[str] = None  # 'api', 'user', 'system'
    search: Optional[str] = None
    page: int = 1
    page_size: int = 50


class AuditLogEntry(BaseModel):
    id: int
    user_id: Optional[int]
    event_type: str
    action: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime


class AuditLogsResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str


class BatchJobInfo(BaseModel):
    id: int
    job_id: str
    user_id: Optional[int]
    status: str
    total_images: int
    processed_images: int
    created_at: datetime
    completed_at: Optional[datetime]


class BatchJobsListResponse(BaseModel):
    success: bool
    data: List[BatchJobInfo]
    timestamp: str


class BatchJobDetailResponse(BaseModel):
    success: bool
    data: dict
    timestamp: str
