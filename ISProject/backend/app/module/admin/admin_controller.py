"""
Admin Controller
Handles all admin endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.module.admin.schemas import (
    UserCreate, UserUpdate, UserListResponse, UserResponse,
    SystemStatsResponse, APIConfigResponse, AuditLogsResponse,
    BatchJobsListResponse, BatchJobDetailResponse
)
from app.module.admin.services.admin_service import AdminService
from app.core.dependencies import get_current_admin_user
from app.core.exceptions import ValidationError, NotFoundError
from app.core.audit_logger import AuditLogger
from app.core.request_context import get_client_ip, get_user_agent
from datetime import datetime
from typing import Optional

router = APIRouter()
admin_service = AdminService()


@router.get("/stats", response_model=SystemStatsResponse, status_code=status.HTTP_200_OK)
async def get_system_stats(
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get system statistics
    
    Returns:
    - Images processed today
    - Success rate
    - Error count
    - Active users count
    """
    stats = await admin_service.get_system_stats(db)
    return SystemStatsResponse(
        success=True,
        data=stats,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/users", response_model=UserListResponse, status_code=status.HTTP_200_OK)
async def list_users(
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    role: Optional[str] = Query(None, description="Filter by role"),
    search: Optional[str] = Query(None, description="Search by name or email")
):
    """
    List all users
    
    - **role**: Optional filter by role
    - **search**: Optional search by name or email
    """
    users = await admin_service.list_users(db, role=role, search=search)
    return UserListResponse(
        success=True,
        data=users,
        timestamp=datetime.utcnow().isoformat()
    )


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Create new user
    
    - **email**: User email address
    - **name**: User full name
    - **role**: User role ('data-scientist', 'admin', 'ml-engineer', 'analyst')
    - **password**: Optional password (will generate random if not provided)
    """
    user = await admin_service.create_user(user_data, db)
    
    # Log audit event
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    AuditLogger.log_user_action(
        db=db,
        action="user.created",
        user_id=current_user.get("id"),
        details={"target_user_id": user["id"], "target_user_email": user["email"], "target_user_role": user["role"]},
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return UserResponse(
        success=True,
        data=user,
        timestamp=datetime.utcnow().isoformat()
    )


@router.put("/users/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Update user
    
    - **user_id**: User identifier
    - **user_data**: Fields to update (name, email, role, is_active, password)
    """
    user = await admin_service.update_user(user_id, user_data, db)
    
    # Log audit event
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    details = {"target_user_id": user_id}
    if user_data.name is not None:
        details["name_changed"] = True
    if user_data.email is not None:
        details["email_changed"] = True
    if user_data.role is not None:
        details["role_changed"] = True
    if user_data.is_active is not None:
        details["is_active_changed"] = True
    if user_data.password is not None:
        details["password_changed"] = True
    
    AuditLogger.log_user_action(
        db=db,
        action="user.updated",
        user_id=current_user.get("id"),
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return UserResponse(
        success=True,
        data=user,
        timestamp=datetime.utcnow().isoformat()
    )


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def deactivate_user(
    user_id: int,
    request: Request,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate user (soft delete)
    
    - **user_id**: User identifier
    """
    await admin_service.deactivate_user(user_id, db)
    
    # Log audit event
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    AuditLogger.log_user_action(
        db=db,
        action="user.deactivated",
        user_id=current_user.get("id"),
        details={"target_user_id": user_id},
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {
        "success": True,
        "message": f"User {user_id} deactivated",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/api-config", response_model=APIConfigResponse, status_code=status.HTTP_200_OK)
async def get_api_config(
    current_user: dict = Depends(get_current_admin_user)
):
    """
    Get API configuration
    
    Returns API endpoints, rate limits, and API key status (from .env)
    """
    # TODO: Load from settings
    from app.config import settings
    
    return APIConfigResponse(
        success=True,
        data={
            "api_base_url": "http://localhost:8000/api",
            "api_key_configured": bool(settings.API_KEY and settings.API_KEY != "your-secret-api-key-here"),
            "rate_limit": settings.API_RATE_LIMIT,
            "endpoints": [
                {"path": "/api/predict", "method": "POST", "description": "Single image prediction"},
                {"path": "/api/batch", "method": "POST", "description": "Batch processing"},
                {"path": "/api/models", "method": "GET", "description": "List models"},
                {"path": "/api/models/{id}/metrics", "method": "GET", "description": "Get model metrics"}
            ]
        },
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/audit-logs", response_model=AuditLogsResponse, status_code=status.HTTP_200_OK)
async def get_audit_logs(
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    user_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    """
    Get audit logs with filters
    
    - **start_date**: Filter logs from this date
    - **end_date**: Filter logs until this date
    - **user_id**: Filter by user ID
    - **event_type**: Filter by event type ('api', 'user', 'system')
    - **search**: Search in action/details
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 50, max: 100)
    """
    result = await admin_service.get_audit_logs(
        db=db,
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        event_type=event_type,
        search=search,
        page=page,
        page_size=page_size
    )
    
    return AuditLogsResponse(
        success=True,
        data=result,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/audit-logs/export", response_class=StreamingResponse, status_code=status.HTTP_200_OK)
async def export_audit_logs(
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    user_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None)
):
    """
    Export audit logs to CSV
    
    Same filters as GET /audit-logs
    Returns CSV file download
    """
    csv_data = await admin_service.export_audit_logs_csv(
        db=db,
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        event_type=event_type
    )
    
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.utcnow().date()}.csv"}
    )


@router.get("/batch-jobs", response_model=BatchJobsListResponse, status_code=status.HTTP_200_OK)
async def list_batch_jobs(
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100)
):
    """
    List batch jobs
    
    - **status**: Optional filter by status
    - **page**: Page number
    - **page_size**: Items per page
    """
    # TODO: Implement batch job listing
    return BatchJobsListResponse(
        success=True,
        data=[],
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/batch-jobs/{job_id}", response_model=BatchJobDetailResponse, status_code=status.HTTP_200_OK)
async def get_batch_job_details(
    job_id: str,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get batch job details
    
    - **job_id**: Batch job identifier
    """
    # TODO: Implement batch job details retrieval
    return BatchJobDetailResponse(
        success=True,
        data={
            "job_id": job_id,
            "status": "completed",
            "total_images": 100,
            "processed_images": 100,
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": datetime.utcnow().isoformat()
        },
        timestamp=datetime.utcnow().isoformat()
    )
