import logging
import os
from datetime import datetime
from datetime import timedelta
from datetime import timezone
from typing import Any
from typing import Dict

from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from supabase import Client
from supabase import create_client

from database.manager import get_db
from database.models import User
from routes.auth.api import SessionResponse
from routes.auth.api import Token
from routes.auth.api import TokenData
from routes.user.api import UserCreate

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

# These should be stored securely, preferably in environment variables
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
if SUPABASE_ANON_KEY is None:
    raise ValueError("SUPABASE_ANON_KEY environment variable is not set")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
if SUPABASE_URL is None:
    raise ValueError("SUPABASE_URL environment variable is not set")

# Create a Supabase client
supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def require_supabase_anon_key() -> str:
    if SUPABASE_ANON_KEY is None:
        raise ValueError("SUPABASE_ANON_KEY environment variable is not set")
    return SUPABASE_ANON_KEY


def create_access_token(data: Dict[str, Any], expires_delta: timedelta | None = None) -> str:
    """
    Create a new access token.

    Args:
        data (Dict[str, Any]): The data to be encoded in the token.
        expires_delta (timedelta | None, optional): The expiration time for the token. Defaults to None.

    Returns:
        str: The encoded JWT token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, require_supabase_anon_key(), algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get the current authenticated user.

    Args:
        token (str): The JWT token from the request.
        db (Session): The database session.

    Returns:
        User: The authenticated user.

    Raises:
        HTTPException: If the credentials are invalid or the user is not found.
    """
    logger.info(f"Attempting to get current user with token: {token[:10]}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        logger.info("Decoding JWT token")
        payload = jwt.decode(token, require_supabase_anon_key(), algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            logger.info("Email not found in token payload")
            raise credentials_exception
        logger.info(f"Email extracted from token: {email}")
        token_data = TokenData(email=email)
    except JWTError:
        logger.info("JWT decoding failed", exc_info=True)
        raise credentials_exception
    logger.info(f"Querying database for user with email: {email}")
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        logger.info(f"User not found for email: {email}")
        raise credentials_exception
    logger.info(f"User found: {user.email}")
    return user


@router.post("/register", response_model=Token)
async def register(user_create: UserCreate) -> Token:
    """
    Register a new user.

    Args:
        user_create (UserCreate): The user creation data.

    Returns:
        Token: The access token for the newly registered user.

    Raises:
        HTTPException: If registration fails or email confirmation is required.
    """
    logger.info(f"Attempting to register user: {user_create.username}")
    try:
        # Attempt to sign up the user using Supabase
        response = supabase_client.auth.sign_up(
            {
                "email": user_create.username,
                "password": user_create.password,
            }
        )

        if response.user is None:
            logger.error(f"Registration failed for user: {user_create.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed: User could not be created",
            )

        if response.session is None:
            # User created but not automatically signed in
            # This might happen if email confirmation is required
            logger.info(f"User registered but requires email confirmation: {user_create.username}")
            raise HTTPException(
                status_code=status.HTTP_202_ACCEPTED,
                detail="Registration successful. Please check your email to confirm your account.",
                headers={"X-User-ID": str(response.user.id)},
            )

        # User created and automatically signed in
        logger.info(f"User successfully registered and signed in: {user_create.username}")
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": response.user.email}, expires_delta=access_token_expires)

        return Token(access_token=access_token, token_type="bearer")

    except Exception as e:
        # Handle any errors that occur during registration
        logger.error(f"Registration failed for user {user_create.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    """
    Authenticate a user and return an access token.

    Args:
        form_data (OAuth2PasswordRequestForm): The login credentials.
        db (Session): The database session.

    Returns:
        Token: The access token for the authenticated user.

    Raises:
        HTTPException: If login fails or credentials are incorrect.
    """
    logger.info(f"Attempting to register user: {form_data}")
    try:
        # Attempt to sign in the user with Supabase
        response = supabase_client.auth.sign_in_with_password(
            {
                "email": form_data.username,
                "password": form_data.password,
            }
        )

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # If successful, response.user will contain the user information
        user = response.user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return Token(access_token=access_token, token_type="bearer")


@router.get("/session", response_model=SessionResponse)
async def get_session(current_user: User = Depends(get_current_user)) -> SessionResponse:
    """
    Get the current user's session information.

    Args:
        current_user (User): The current authenticated user.

    Returns:
        SessionResponse: The session information for the current user.
    """
    logger.info(f"Session requested for user: {current_user.email}")
    return SessionResponse(email=current_user.email)


@router.post("/logout")
async def logout() -> Dict[str, str]:
    """
    Log out the current user.

    Returns:
        Dict[str, str]: A message indicating successful logout.
    """
    # In a stateless JWT system, logout is typically handled client-side
    # by removing the token. Here we can add any server-side logout logic if needed.
    return {"message": "Logged out successfully"}
