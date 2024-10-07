from pydantic import BaseModel


class Token(BaseModel):
    """
    Represents an authentication token.

    Attributes:
        access_token (str): The access token string.
        refresh_token (str): The refresh token string.
        expires_in (int): Token expiry time in seconds.
        token_type (str): The type of the token (e.g., "bearer").
    """

    access_token: str
    refresh_token: str  # {{ added }}
    expires_in: int  # {{ added }}
    token_type: str


class TokenData(BaseModel):
    """
    Represents the data contained within a token.

    Attributes:
        email (str | None): The email associated with the token, if any. Defaults to None.
    """

    email: str | None = None


class SessionResponse(BaseModel):
    """
    Represents the response for a session.

    Attributes:
        email (str): The email of the user.
    """

    email: str | None = None
    supabase_user_id: str
    is_paying: bool


class UserResponse(BaseModel):
    """
    Represents the response for a user.

    Attributes:
        email (str): The email of the user.
    """

    email: str | None = None
    supabase_user_id: str


class UserCreate(BaseModel):
    username: str = "example@email.com"
    password: str = "password123"

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "strongpassword123",
            }
        }


class RefreshTokenRequest(BaseModel):
    """
    Represents a request to refresh the access token.

    Attributes:
        refresh_token (str): The refresh token provided by the client.
    """

    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """
    Represents the response containing the new access token.

    Attributes:
        access_token (str): The new access token.
        token_type (str): The type of the token (e.g., "bearer").
    """

    access_token: str
    token_type: str


class RegistrationResponse(BaseModel):
    message: str
    user_id: str
    email: str
    requires_verification: bool
