from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

router = APIRouter()


class UserCreate(BaseModel):
    email: str
    password: str


@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Add user registration logic here
    pass


@router.post("/login")
async def login(user: UserCreate, db: Session = Depends(get_db)):
    # Add user login logic here
    pass


@router.get("/status/{user_id}")
async def get_user_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"is_paying": user.is_paying}
