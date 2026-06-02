"""
Middleware for rate limiting, error handling, and security headers.
"""
import time
import logging
import os
from collections import defaultdict
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from app.config import settings

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    For production, use Redis-based rate limiting (e.g., slowapi with Redis backend).
    """
    
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip rate limiting in test mode
        if os.environ.get("PYTEST_CURRENT_TEST"):
            return await call_next(request)
        
        # Resolve client IP (supporting proxies)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")
        
        # Detect authentication endpoints
        is_auth_route = request.url.path.endswith("/auth/login") or request.url.path.endswith("/auth/register")
        
        if is_auth_route:
            max_requests = settings.LOGIN_MAX_ATTEMPTS
            window_seconds = 900  # 15 minutes (900 seconds)
        else:
            max_requests = self.max_requests
            window_seconds = self.window_seconds
        
        # Extract username for per-user rate limiting on auth endpoints
        username = None
        if is_auth_route and request.method == "POST":
            content_length = request.headers.get("content-length")
            if content_length and int(content_length) < 1048576:  # limit body reading to < 1MB for security
                try:
                    body_bytes = await request.body()
                    # Reset request body receive state so next steps can read it
                    async def receive():
                        return {"type": "http.request", "body": body_bytes, "more_body": False}
                    request._receive = receive
                    
                    content_type = request.headers.get("content-type", "")
                    if "application/x-www-form-urlencoded" in content_type:
                        import urllib.parse
                        parsed_form = urllib.parse.parse_qs(body_bytes.decode("utf-8"))
                        username_list = parsed_form.get("username")
                        if username_list:
                            username = username_list[0]
                    elif "application/json" in content_type:
                        import json
                        json_data = json.loads(body_bytes)
                        username = json_data.get("username")
                except Exception as e:
                    logger.debug(f"Could not parse request body for rate limiting: {e}")
        
        now = time.time()
        cutoff = now - window_seconds
        
        # 1. Check IP limit
        ip_key = f"ip:{client_ip}"
        self.requests[ip_key] = [t for t in self.requests[ip_key] if t > cutoff]
        if len(self.requests[ip_key]) >= max_requests:
            logger.warning(f"IP Rate limit exceeded for {client_ip} on {request.url.path}")
            return self._rate_limit_response(max_requests, window_seconds)
        
        # 2. Check Username limit (if present)
        user_key = None
        if username:
            user_key = f"user:{username}"
            self.requests[user_key] = [t for t in self.requests[user_key] if t > cutoff]
            if len(self.requests[user_key]) >= max_requests:
                logger.warning(f"Username Rate limit exceeded for user '{username}' on {request.url.path}")
                return self._rate_limit_response(max_requests, window_seconds)
        
        # Record this request
        self.requests[ip_key].append(now)
        if user_key:
            self.requests[user_key].append(now)
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self' http://localhost:8000 http://127.0.0.1:8000; "
            "frame-src 'self' https://app.powerbi.com; "
            "frame-ancestors 'none';"
        )
        
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

    def _rate_limit_response(self, max_requests: int, window_seconds: int) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "status_code": 429,
                "message": "Too many requests",
                "detail": f"Rate limit exceeded. Maximum {max_requests} attempts per {window_seconds // 60} minutes.",
                "retry_after": window_seconds
            },
            headers={"Retry-After": str(window_seconds)}
        )


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Global error handling middleware to ensure consistent error responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException:
            raise
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status_code": 400,
                    "message": "Validation error",
                    "detail": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Unhandled exception: {type(e).__name__}: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "status_code": 500,
                    "message": "Internal server error",
                    "detail": "An unexpected error occurred" if not settings.DEBUG else str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests and responses with timing information.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log incoming request
        logger.info(
            f"Request: {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}"
        )
        
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log response with timing
        logger.info(
            f"Response: {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)"
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
