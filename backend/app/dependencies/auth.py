from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.utils.security import decode_access_token
from app.models.user import User
import uuid

# Bearer token security schemes
security_scheme = HTTPBearer(
    description="JWT Bearer token required for API access"
)

# OAuth2 scheme for better OpenAPI documentation
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login",
    description="JWT Bearer token. Get it from /auth/login or /auth/signup"
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validates JWT Bearer token and returns the authenticated user.

    Required header: Authorization: Bearer <token>
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == uuid.UUID(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_role(required_role: str):
    """
    Role-based access control dependency.
    Validates that the current user has the required role.
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' required. Current role: '{current_user.role}'",
            )
        return current_user
    return role_checker
