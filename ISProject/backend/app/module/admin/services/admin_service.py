"""
Admin Service
Business logic for admin operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, and_
from sqlalchemy import desc
from app.module.admin.schemas import UserCreate, UserUpdate
from app.shared.models.user import User
from app.shared.models.audit_log import AuditLog
from app.core.security import get_password_hash
from app.core.exceptions import ValidationError, NotFoundError
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import secrets
import string
import csv
import io
import json


class AdminService:
    """Service for admin operations"""
    
    async def get_system_stats(self, db: Session) -> dict:
        """
        Get system statistics
        
        - Count images processed today (from audit logs with event_type='api' and action='predict')
        - Calculate success rate (successful predictions / total predictions)
        - Count errors (failed predictions or system errors)
        - Count all active users in the system
        """
        # Get today's date range (use UTC timezone-aware datetime)
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = now
        
        # Get all prediction logs for today
        prediction_logs = db.query(AuditLog).filter(
            and_(
                AuditLog.event_type == "api",
                AuditLog.action == "predict",
                AuditLog.created_at >= today_start,
                AuditLog.created_at <= today_end
            )
        ).all()
        
        # Count total predictions and successful predictions
        predictions_today = len(prediction_logs)
        successful_predictions = 0
        
        for log in prediction_logs:
            if log.details:
                try:
                    details_dict = json.loads(log.details)
                    # If details has 'digit' key and no 'error' key, it's successful
                    if "digit" in details_dict and "error" not in details_dict:
                        successful_predictions += 1
                except (json.JSONDecodeError, TypeError):
                    # If details is not valid JSON, check if it contains "error"
                    details_str = str(log.details).lower()
                    if "error" not in details_str:
                        successful_predictions += 1
            else:
                # No details means it might be an old log format, count as successful
                successful_predictions += 1
        
        # Calculate success rate
        success_rate = 0.0
        if predictions_today > 0:
            success_rate = (successful_predictions / predictions_today) * 100
        
        # Count errors (system events with error or failed predictions)
        # Get all logs that might contain errors
        potential_error_logs = db.query(AuditLog).filter(
            and_(
                AuditLog.created_at >= today_start,
                AuditLog.created_at <= today_end,
                or_(
                    # System events with "error" in action
                    and_(AuditLog.event_type == "system", AuditLog.action.like("%error%")),
                    # API predictions with error in details
                    and_(
                        AuditLog.event_type == "api",
                        AuditLog.action == "predict",
                        AuditLog.details.isnot(None),
                        AuditLog.details.like("%error%")
                    )
                )
            )
        ).all()
        
        # Count actual errors by checking JSON details
        error_count = 0
        for log in potential_error_logs:
            if log.details:
                try:
                    details_dict = json.loads(log.details)
                    if "error" in details_dict:
                        error_count += 1
                except (json.JSONDecodeError, TypeError):
                    # If details is not JSON but contains "error", count it
                    if "error" in str(log.details).lower():
                        error_count += 1
            elif log.event_type == "system" and "error" in log.action.lower():
                # System events with error in action name
                error_count += 1
        
        # Count all users in the system
        active_users = db.query(User).filter(User.is_active == True).count()
        
        return {
            "images_processed_today": predictions_today,
            "success_rate": round(success_rate, 1),
            "error_count": error_count,
            "active_users": active_users
        }
    
    async def list_users(
        self,
        db: Session,
        role: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[dict]:
        """
        List users with optional filters
        
        - Query users table
        - Apply role filter
        - Apply search filter
        - Return user list
        """
        query = db.query(User)
        
        # Apply role filter
        if role:
            query = query.filter(User.role == role)
        
        # Apply search filter (search by name or email)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern)
                )
            )
        
        users = query.order_by(User.created_at.desc()).all()
        
        return [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
            for user in users
        ]
    
    def _generate_random_password(self, length: int = 12) -> str:
        """Generate a secure random password"""
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        return password
    
    async def create_user(self, user_data: UserCreate, db: Session) -> dict:
        """
        Create new user
        
        - Validate email uniqueness
        - Hash password (or generate random if not provided)
        - Create user record
        - Return user info
        """
        # Validate email uniqueness
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise ValidationError(f"User with email {user_data.email} already exists")
        
        # Validate role
        valid_roles = ['data-scientist', 'admin', 'ml-engineer', 'analyst', 'guest']
        if user_data.role not in valid_roles:
            raise ValidationError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
        
        # Generate password if not provided
        password = user_data.password
        if not password:
            password = self._generate_random_password()
        
        # Hash password
        hashed_password = get_password_hash(password)
        
        # Create user
        new_user = User(
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            hashed_password=hashed_password,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": new_user.id,
            "email": new_user.email,
            "name": new_user.name,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at,
            "updated_at": new_user.updated_at
        }
    
    async def update_user(
        self,
        user_id: int,
        user_data: UserUpdate,
        db: Session
    ) -> dict:
        """
        Update user
        
        - Load user from database
        - Update provided fields
        - Hash password if provided
        - Validate email uniqueness if email is being updated
        - Save changes
        - Return updated user
        """
        # Load user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError(f"User with id {user_id} not found")
        
        # Validate email uniqueness if email is being updated
        if user_data.email and user_data.email != user.email:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise ValidationError(f"User with email {user_data.email} already exists")
            user.email = user_data.email
        
        # Update other fields
        if user_data.name is not None:
            user.name = user_data.name
        
        if user_data.role is not None:
            # Validate role
            valid_roles = ['data-scientist', 'admin', 'ml-engineer', 'analyst', 'guest']
            if user_data.role not in valid_roles:
                raise ValidationError(f"Invalid role. Must be one of: {', '.join(valid_roles)}")
            user.role = user_data.role
        
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        
        # Hash and update password if provided
        if user_data.password:
            user.hashed_password = get_password_hash(user_data.password)
        
        # Note: updated_at is automatically handled by SQLAlchemy's onupdate=func.now()
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
    
    async def deactivate_user(self, user_id: int, db: Session) -> bool:
        """
        Deactivate user (soft delete)
        
        - Load user by ID
        - Set is_active = False
        - Save changes
        """
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError(f"User with id {user_id} not found")
        
        user.is_active = False
        # Note: updated_at is automatically handled by SQLAlchemy's onupdate=func.now()
        
        db.commit()
        
        return True
    
    async def get_audit_logs(
        self,
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_id: Optional[int] = None,
        event_type: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> dict:
        """
        Get audit logs with filters and pagination
        
        - Query audit_logs table
        - Apply filters (date range, user_id, event_type, search)
        - Join with User table to get user email
        - Paginate results
        - Return logs and metadata
        """
        # Start with base query, joining User table
        query = db.query(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id)
        
        # Apply date filters
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        # Apply user_id filter
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        # Apply event_type filter
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        # Apply search filter (search in action or details)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    AuditLog.action.ilike(search_pattern),
                    AuditLog.details.ilike(search_pattern)
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(page_size)
        
        # Execute query and format results
        results = query.all()
        
        logs = []
        for audit_log, user_email in results:
            logs.append({
                "id": audit_log.id,
                "user_id": audit_log.user_id,
                "user_email": user_email,
                "event_type": audit_log.event_type,
                "action": audit_log.action,
                "details": audit_log.details,
                "ip_address": audit_log.ip_address,
                "created_at": audit_log.created_at.isoformat() if audit_log.created_at else None,
                "timestamp": audit_log.created_at.isoformat() if audit_log.created_at else None
            })
        
        # Calculate total pages
        total_pages = (total + page_size - 1) // page_size if total > 0 else 0
        
        return {
            "logs": logs,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    
    async def export_audit_logs_csv(
        self,
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_id: Optional[int] = None,
        event_type: Optional[str] = None
    ) -> str:
        """
        Export audit logs to CSV
        
        - Query audit logs with same filters as get_audit_logs
        - Generate CSV content with headers
        - Return CSV string
        """
        # Use same query logic as get_audit_logs but without pagination
        query = db.query(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id)
        
        # Apply filters
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        # Order by created_at descending
        query = query.order_by(desc(AuditLog.created_at))
        
        # Execute query
        results = query.all()
        
        # Generate CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "timestamp",
            "user_email",
            "event_type",
            "action",
            "details",
            "ip_address",
            "user_agent"
        ])
        
        # Write rows
        for audit_log, user_email in results:
            writer.writerow([
                audit_log.created_at.isoformat() if audit_log.created_at else "",
                user_email or "",
                audit_log.event_type or "",
                audit_log.action or "",
                audit_log.details or "",
                audit_log.ip_address or "",
                audit_log.user_agent or ""
            ])
        
        return output.getvalue()
    
    async def list_batch_jobs(
        self,
        db: Session,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> List[dict]:
        """
        List batch jobs
        
        TODO: Implement
        - Query batch_jobs table
        - Apply status filter
        - Paginate results
        """
        pass
    
    async def get_batch_job_details(self, job_id: str, db: Session) -> dict:
        """
        Get batch job details
        
        TODO: Implement
        - Load batch job from database
        - Return full details
        """
        pass
