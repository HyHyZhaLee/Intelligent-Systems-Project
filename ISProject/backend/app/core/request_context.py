"""
Request Context Utilities
Helper functions to extract request metadata (IP, user agent, etc.)
"""
from fastapi import Request
from typing import Optional


def get_client_ip(request: Request) -> Optional[str]:
    """
    Extract client IP address from request
    
    Handles proxy headers (X-Forwarded-For, X-Real-IP) and falls back to direct connection.
    
    Args:
        request: FastAPI Request object
        
    Returns:
        Client IP address string or None
    """
    # Check X-Forwarded-For header (most common proxy header)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        ip = forwarded_for.split(",")[0].strip()
        if ip:
            return ip
    
    # Check X-Real-IP header (nginx proxy)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fall back to direct connection IP
    if request.client and request.client.host:
        return request.client.host
    
    return None


def get_user_agent(request: Request) -> Optional[str]:
    """
    Extract user agent from request headers
    
    Args:
        request: FastAPI Request object
        
    Returns:
        User agent string or None
    """
    return request.headers.get("user-agent")
