import logging
import os
from typing import Dict

from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordRequestForm
from jose import ExpiredSignatureError
from jose import JWTError
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from supabase import Client
from supabase import create_client
from supabase.lib.client_options import ClientOptions

from database.manager import get_db
from database.models import PayingUser
from routes.auth.api import RefreshTokenRequest
from routes.auth.api import RegistrationResponse
from routes.auth.api import SessionResponse
from routes.auth.api import Token
from routes.auth.api import UserCreate
from routes.auth.api import UserResponse

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

SUPABASE_JWT_PUBLIC_KEY = os.environ.get("SUPABASE_JWT_PUBLIC_KEY")
if SUPABASE_JWT_PUBLIC_KEY is None:
    raise ValueError("SUPABASE_JWT_PUBLIC_KEY environment variable is not set")

# Create a Supabase client
supabase_client: Client = create_client(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    options=ClientOptions(
        auto_refresh_token=False,
        persist_session=False,
    ),
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def require_supabase_jwt_key() -> str:
    if SUPABASE_JWT_PUBLIC_KEY is None:
        raise ValueError("SUPABASE_JWT_PUBLIC_KEY environment variable is not set")
    return SUPABASE_JWT_PUBLIC_KEY


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    # db: Session = Depends(get_db),
) -> UserResponse:
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
        payload = jwt.decode(
            token,
            require_supabase_jwt_key(),
            algorithms=[ALGORITHM],
            options={
                "verify_aud": False,
                "verify_exp": True,
            },
        )
        uuid: str | None = payload.get("sub")
        if uuid is None:
            logger.info("UUID not found in token payload")
            raise credentials_exception
        logger.info(f"UUID extracted from token: {uuid}")
    except ExpiredSignatureError:
        logger.info("JWT token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        logger.info("JWT decoding failed", exc_info=True)
        raise credentials_exception

    logger.info(f"Checking supbase for user with uuid: {uuid}")

    try:
        response = supabase_client.auth.get_user(token)
        if response is None:
            logger.info(f"User not found for email: {uuid}")
            raise credentials_exception
    except Exception as e:
        logger.error(f"Error querying Supabase for user: {str(e)}")
        raise credentials_exception
    return UserResponse(supabase_user_id=response.user.id, email=response.user.email)


@router.post("/register", response_model=RegistrationResponse)
async def register(user_create: UserCreate) -> RegistrationResponse:
    """
    Register a new user.

    Args:
        user_create (UserCreate): The user creation data.
        request (Request): The FastAPI request object.

    Returns:
        RegistrationResponse: The registration response containing user information and verification status.
    """
    logger.info(f"Attempting to register user: {user_create.username}")
    try:
        # Construct the redirect URL
        base_url = "https://untab.xyz/"
        redirect_url = f"{base_url}register?email={user_create.username}"

        # Attempt to sign up the user using Supabase
        response = supabase_client.auth.sign_up(
            {
                "email": user_create.username,
                "password": user_create.password,
                "options": {"email_redirect_to": redirect_url},
            },
        )

        if response.user is None:
            logger.error(f"Registration failed for user: {user_create.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed: User could not be created",
            )

        # User created successfully
        logger.info(f"User successfully registered: {user_create.username}")

        return RegistrationResponse(
            message="Registration successful. Please check your email to confirm your account.",
            user_id=str(response.user.id),
            email=response.user.email or user_create.username,
            requires_verification=True,
        )

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

        if response.session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Login failed: Session not found",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = response.session.access_token
        refresh_token = response.session.refresh_token
        expires_in = response.session.expires_in
        token_type = response.session.token_type

        logger.info(f"access_token: {access_token}")

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            token_type=token_type,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.get("/session", response_model=SessionResponse)
async def get_session(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SessionResponse:
    """
    Get the current user's session information.

    Args:
        current_user (User): The current authenticated user.

    Returns:
        SessionResponse: The session information for the current user.
    """
    logger.info(f"Session requested for user: {current_user.email}")

    # Check if the user is in the paying_users table
    paying_user = db.query(PayingUser).filter(PayingUser.supabase_user_id == current_user.supabase_user_id).first()
    is_paying = paying_user is not None and paying_user.is_paying

    return SessionResponse(
        supabase_user_id=current_user.supabase_user_id,
        email=current_user.email,
        is_paying=is_paying,
    )


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


@router.post("/refresh", response_model=Token)
async def refresh_token(request: RefreshTokenRequest) -> Token:
    """
    Refresh the access token using the refresh token.

    Args:
        request (RefreshTokenRequest): The refresh token request data.

    Returns:
        Token: The new access token along with a new refresh token and expiry.
    """
    logger.info("Attempting to refresh access token")
    logger.info(f"Received refresh token: {request.refresh_token[:10]}...")

    try:
        logger.info("Calling supabase_client.auth.refresh_session")
        response = supabase_client.auth.refresh_session(request.refresh_token)

        logger.info(f"Supabase response: {response}")  # Log entire response for debugging

        if response.session is None:
            logger.warning("Refresh session returned None")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info("Successfully refreshed session")
        logger.info(f"New access token: {response.session.access_token[:10]}...")
        logger.info(f"New refresh token: {response.session.refresh_token[:10]}...")
        logger.info(f"Token expires in: {response.session.expires_in} seconds")

        access_token = response.session.access_token
        refresh_token = response.session.refresh_token
        expires_in = response.session.expires_in
        token_type = response.session.token_type

        return Token(
            access_token=access_token, refresh_token=refresh_token, expires_in=expires_in, token_type=token_type
        )
    except Exception as e:
        logger.error(f"Token refresh failed: {str(e)}", exc_info=True)  # Log full exception traceback
        logger.info(f"Exception type: {type(e).__name__}")
        logger.info(f"Exception args: {e.args}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token refresh failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
