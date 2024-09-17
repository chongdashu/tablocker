from pydantic import BaseModel


class Token(BaseModel):
    """
    Represents an authentication token.

    Attributes:
        access_token (str): The access token string.
        token_type (str): The type of the token (e.g., "bearer").
    """

    access_token: str
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

    email: str
