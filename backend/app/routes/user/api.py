from pydantic import BaseModel


class UserCreate(BaseModel):
    email: str = "example@email.com"
    password: str = "password123"

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "strongpassword123",
            }
        }
