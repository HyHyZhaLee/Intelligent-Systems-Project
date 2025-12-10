"""
Audit Logger Service
Centralized audit logging utility for tracking system events
"""
from sqlalchemy.orm import Session
from app.shared.models.audit_log import AuditLog
from typing import Optional, Dict, Any
import json
from datetime import datetime


class AuditLogger:
    """Utility class for creating audit log entries"""
    
    @staticmethod
    def log_api_call(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log an API endpoint call
        
        Args:
            db: Database session
            action: Action description (e.g., "predict", "batch.create")
            user_id: Optional user ID if authenticated
            details: Optional dictionary with additional details
            ip_address: Optional client IP address
            user_agent: Optional user agent string
            
        Returns:
            Created AuditLog entry
        """
        return AuditLogger._create_log(
            db=db,
            event_type="api",
            action=action,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_user_action(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log a user management action
        
        Args:
            db: Database session
            action: Action description (e.g., "user.created", "user.updated", "user.deactivated")
            user_id: Optional user ID of the actor (admin performing the action)
            details: Optional dictionary with additional details (e.g., target_user_id)
            ip_address: Optional client IP address
            user_agent: Optional user agent string
            
        Returns:
            Created AuditLog entry
        """
        return AuditLogger._create_log(
            db=db,
            event_type="user",
            action=action,
            user_id=user_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_system_event(
        db: Session,
        action: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Log a system-level event
        
        Args:
            db: Database session
            action: Action description (e.g., "model.training.started", "model.training.completed")
            details: Optional dictionary with additional details
            ip_address: Optional client IP address
            user_agent: Optional user agent string
            
        Returns:
            Created AuditLog entry
        """
        return AuditLogger._create_log(
            db=db,
            event_type="system",
            action=action,
            user_id=None,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def _create_log(
        db: Session,
        event_type: str,
        action: str,
        user_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """
        Internal method to create audit log entry
        
        Args:
            db: Database session
            event_type: Event type ('api', 'user', 'system')
            action: Action description
            user_id: Optional user ID
            details: Optional dictionary with additional details
            ip_address: Optional client IP address
            user_agent: Optional user agent string
            
        Returns:
            Created AuditLog entry
        """
        # Convert details dict to JSON string if provided
        details_json = None
        if details:
            try:
                details_json = json.dumps(details)
            except (TypeError, ValueError):
                # If details can't be serialized, convert to string
                details_json = str(details)
        
        # Truncate action if too long
        if len(action) > 255:
            action = action[:252] + "..."
        
        # Create audit log entry
        audit_log = AuditLog(
            user_id=user_id,
            event_type=event_type,
            action=action,
            details=details_json,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
