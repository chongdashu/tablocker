from pydantic import BaseModel


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
