from backend.app.routes.user.api import BlockedPattern
from backend.app.routes.user.api import SyncBlockedPatternsResponse
from fastapi import APIRouter

router = APIRouter()


@router.get("/blocklist", response_model=list[BlockedPattern])
async def get_blocklist() -> list[BlockedPattern]:
    # TODO
    return []


@router.post("/blocklist/sync", response_model=SyncBlockedPatternsResponse)
async def sync_blocklist() -> SyncBlockedPatternsResponse:
    # TODO
    return SyncBlockedPatternsResponse(success=True, blocked_patterns=[])
