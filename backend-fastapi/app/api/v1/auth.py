"""
Authentication API Routes
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from app.core.config import get_settings
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_access_token,
    verify_refresh_token
)
from app.core.logging import get_logger
from app.db.repositories import user_repository
from app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    ErrorResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = get_logger(__name__)
settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = await user_repository.get(user_id)
    if user is None:
        raise credentials_exception
    
    user["id"] = user_id
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    """Get current active user."""
    if not current_user.get("is_active", True):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user.
    
    Creates a new user account and returns access tokens.
    """
    # Check if user exists
    existing_user = await user_repository.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_id = await user_repository.create_user(
        email=user_data.email,
        hashed_password=hashed_password,
        name=user_data.name,
        role=user_data.role.value
    )
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    logger.info(f"New user registered: {user_data.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """
    Login with email and password.
    
    Returns access and refresh tokens.
    """
    # Get user
    user = await user_repository.get_by_email(user_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Update last login
    user_id = user.get("id")
    if user_id:
        await user_repository.update_last_login(user_id)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    logger.info(f"User logged in: {user_data.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/token", response_model=TokenResponse)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token endpoint.
    
    Used by Swagger UI for authentication.
    """
    user = await user_repository.get_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = user.get("id")
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token.
    
    Use refresh token to get a new access token.
    """
    payload = verify_refresh_token(request.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Verify user still exists and is active
    user = await user_repository.get(user_id)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new tokens
    access_token = create_access_token(data={"sub": user_id})
    new_refresh_token = create_refresh_token(data={"sub": user_id})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_active_user)):
    """
    Get current user profile.
    """
    return UserResponse(
        id=current_user.get("id"),
        email=current_user.get("email"),
        name=current_user.get("name"),
        role=current_user.get("role", "farmer"),
        is_active=current_user.get("is_active", True),
        created_at=current_user.get("created_at"),
        last_login=current_user.get("last_login")
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_active_user)):
    """
    Logout user.
    
    Note: In a stateless JWT system, logout is handled client-side.
    This endpoint can be used to log the event.
    """
    logger.info(f"User logged out: {current_user.get('email')}")
    return {"success": True, "message": "Logged out successfully"}
