from fastapi import APIRouter
from fastapi import Depends
from fastapi import Request
from sqlalchemy.orm import Session

from database.manager import get_db

router = APIRouter()


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)): ...
