from fastapi import APIRouter

router = APIRouter()


@router.get("/check")
async def get_health():
    return {"status": "ok"}
