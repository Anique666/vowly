"""
Local Authentication Routes for Vowly

Simple JSON-based authentication for MVP:
- Organizer authentication (create weddings, manage guests/vendors)
- Guest authentication (view schedule, RSVP, access album)

Stores users in /backend/data/users.json
Sessions stored in memory for MVP
"""

from fastapi import APIRouter, HTTPException, Depends, Response, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
import uuid
import hashlib
import os
import json
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import secrets

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/api/auth")

# Paths
ROOT_DIR = Path(__file__).parent.parent
DATA_DIR = ROOT_DIR / "data"
USERS_JSON = DATA_DIR / "users.json"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# In-memory session store (for MVP - would use Redis in production)
sessions = {}

# Session expiry (24 hours)
SESSION_EXPIRY_HOURS = 24

# Security
security = HTTPBearer(auto_error=False)


# ============================================================================
# MODELS
# ============================================================================

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    role: Literal["organizer", "guest"]


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: Literal["organizer", "guest"]


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    weddingId: Optional[str] = None
    createdAt: str


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str


class TokenValidation(BaseModel):
    valid: bool
    user: Optional[UserResponse] = None


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt"""
    salt = os.environ.get("AUTH_SALT", "vowly_mvp_salt_2026")
    return hashlib.sha256(f"{password}{salt}".encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed


def generate_session_token() -> str:
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)


def read_users() -> dict:
    """Read users from JSON file"""
    if not USERS_JSON.exists():
        return {"organizers": [], "guests": []}
    try:
        with open(USERS_JSON, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading users.json: {e}")
        return {"organizers": [], "guests": []}


def write_users(data: dict) -> bool:
    """Write users to JSON file"""
    try:
        with open(USERS_JSON, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        logger.error(f"Error writing users.json: {e}")
        return False


def find_user(email: str, role: str) -> Optional[dict]:
    """Find a user by email and role"""
    users = read_users()
    collection = "organizers" if role == "organizer" else "guests"
    for user in users.get(collection, []):
        if user.get("email", "").lower() == email.lower():
            return user
    return None


def create_session(user: dict) -> str:
    """Create a new session for a user"""
    token = generate_session_token()
    sessions[token] = {
        "userId": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "weddingId": user.get("weddingId"),
        "expiresAt": (datetime.now(timezone.utc) + timedelta(hours=SESSION_EXPIRY_HOURS)).isoformat()
    }
    return token


def get_session(token: str) -> Optional[dict]:
    """Get session data from token"""
    session = sessions.get(token)
    if not session:
        return None
    
    # Check expiry
    expires_at = datetime.fromisoformat(session["expiresAt"])
    if datetime.now(timezone.utc) > expires_at:
        del sessions[token]
        return None
    
    return session


def invalidate_session(token: str) -> bool:
    """Invalidate a session"""
    if token in sessions:
        del sessions[token]
        return True
    return False


# ============================================================================
# ENDPOINTS
# ============================================================================

@auth_router.post("/signup", response_model=AuthResponse)
async def signup(data: UserSignup):
    """
    Create a new user account (organizer or guest).
    
    - Validates email is not already registered for that role
    - Hashes password
    - Creates session token
    """
    # Check if user already exists
    existing = find_user(data.email, data.role)
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"An account with this email already exists as {data.role}"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "email": data.email.lower(),
        "name": data.name,
        "password": hash_password(data.password),
        "role": data.role,
        "weddingId": None,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    # Save user
    users = read_users()
    collection = "organizers" if data.role == "organizer" else "guests"
    if collection not in users:
        users[collection] = []
    users[collection].append(new_user)
    
    if not write_users(users):
        raise HTTPException(status_code=500, detail="Failed to create account")
    
    # Create session
    token = create_session(new_user)
    
    logger.info(f"New {data.role} registered: {data.email}")
    
    return AuthResponse(
        user=UserResponse(
            id=user_id,
            email=new_user["email"],
            name=new_user["name"],
            role=new_user["role"],
            weddingId=new_user.get("weddingId"),
            createdAt=new_user["createdAt"]
        ),
        token=token,
        message=f"Welcome to Vowly, {data.name}!"
    )


@auth_router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin):
    """
    Login with email and password.
    
    - Validates credentials
    - Creates new session token
    """
    user = find_user(data.email, data.role)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    if not verify_password(data.password, user.get("password", "")):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Create session
    token = create_session(user)
    
    logger.info(f"{data.role} logged in: {data.email}")
    
    return AuthResponse(
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            weddingId=user.get("weddingId"),
            createdAt=user.get("createdAt", "")
        ),
        token=token,
        message=f"Welcome back, {user['name']}!"
    )


@auth_router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Logout and invalidate session token.
    """
    if credentials:
        invalidate_session(credentials.credentials)
    return {"message": "Logged out successfully"}


@auth_router.get("/me", response_model=UserResponse)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current authenticated user from session token.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = get_session(credentials.credentials)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    
    return UserResponse(
        id=session["userId"],
        email=session["email"],
        name=session["name"],
        role=session["role"],
        weddingId=session.get("weddingId"),
        createdAt=""
    )


@auth_router.post("/validate", response_model=TokenValidation)
async def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate a session token without requiring auth.
    Returns whether the token is valid and user info if so.
    """
    if not credentials:
        return TokenValidation(valid=False)
    
    session = get_session(credentials.credentials)
    if not session:
        return TokenValidation(valid=False)
    
    return TokenValidation(
        valid=True,
        user=UserResponse(
            id=session["userId"],
            email=session["email"],
            name=session["name"],
            role=session["role"],
            weddingId=session.get("weddingId"),
            createdAt=""
        )
    )


@auth_router.post("/update-wedding")
async def update_user_wedding(
    wedding_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Update the wedding ID associated with an organizer.
    Called after creating a wedding.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = get_session(credentials.credentials)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired")
    
    if session["role"] != "organizer":
        raise HTTPException(status_code=403, detail="Only organizers can own weddings")
    
    # Update user in JSON
    users = read_users()
    for user in users.get("organizers", []):
        if user["id"] == session["userId"]:
            user["weddingId"] = wedding_id
            break
    
    write_users(users)
    
    # Update session
    session["weddingId"] = wedding_id
    
    return {"message": "Wedding linked to account", "weddingId": wedding_id}
