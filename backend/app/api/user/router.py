from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from api.user.router import UserCreate
from database.manager import get_db

router = APIRouter()


@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)): ...


@router.post("/login")
async def login(user: UserCreate, db: Session = Depends(get_db)): ...


@router.get("/status/{user_id}")
async def get_user_status(user_id: int, db: Session = Depends(get_db)): ...
