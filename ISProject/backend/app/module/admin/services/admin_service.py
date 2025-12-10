"""
Admin Service
Business logic for admin operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.module.admin.schemas import UserCreate, UserUpdate
from app.shared.models.user import User
from app.core.security import get_password_hash
from app.core.exceptions import ValidationError, NotFoundError
from typing import Optional, List
from datetime import datetime
import secrets
import string


class AdminService:
    """Service for admin operations"""
    
    async def get_system_stats(self, db: Session) -> dict:
        """
        Get system statistics
        
        TODO: Implement
        - Count images processed today
        - Calculate success rate
        - Count errors
        - Count active users
        """
        pass
    
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
        
        TODO: Implement
        - Query audit_logs table
        - Apply filters
        - Paginate results
        - Return logs and metadata
        """
        pass
    
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
        
        TODO: Implement
        - Query audit logs
        - Generate CSV content
        - Return CSV string
        """
        pass
    
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
