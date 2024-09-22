import logging
from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session

from database.manager import get_db
from database.models import BlockedPattern
from routes.auth.api import UserResponse
from routes.auth.router import get_current_user
from routes.user.api import BlockedPattern as BlockedPatternSchema
from routes.user.api import SyncBlockedPatternsRequest
from routes.user.api import SyncBlockedPatternsResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/blocklist", response_model=list[BlockedPatternSchema])
async def get_blocklist(current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    logger.info(f"Fetching blocklist for user {current_user.supabase_user_id}")
    patterns = db.query(BlockedPattern).filter(BlockedPattern.supabase_user_id == current_user.supabase_user_id).all()
    logger.info(f"Found {len(patterns)} patterns for user {current_user.supabase_user_id}")
    return [
        BlockedPatternSchema(
            pattern=p.pattern,
            created_at=p.created_at.isoformat(),
        )
        for p in patterns
    ]


@router.post("/blocklist/sync", response_model=SyncBlockedPatternsResponse)
async def sync_blocklist(
    request: SyncBlockedPatternsRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info(f"Syncing blocklist for user {current_user.supabase_user_id}")
    # Get existing patterns
    existing_patterns = (
        db.query(BlockedPattern).filter(BlockedPattern.supabase_user_id == current_user.supabase_user_id).all()
    )
    existing_pattern_set = {p.pattern for p in existing_patterns}
    logger.info(f"Found {len(existing_patterns)} existing patterns for user {current_user.supabase_user_id}")

    # Add new patterns
    new_patterns_count = 0
    for pattern in request.patterns:
        if pattern.pattern not in existing_pattern_set:
            new_pattern = BlockedPattern(
                supabase_user_id=current_user.supabase_user_id,
                pattern=pattern.pattern,
                created_at=datetime.fromisoformat(pattern.created_at),
            )
            db.add(new_pattern)
            new_patterns_count += 1

    logger.info(f"Adding {new_patterns_count} new patterns for user {current_user.supabase_user_id}")
    db.commit()

    # Fetch updated patterns
    updated_patterns = (
        db.query(BlockedPattern).filter(BlockedPattern.supabase_user_id == current_user.supabase_user_id).all()
    )
    response_patterns = [
        BlockedPatternSchema(pattern=p.pattern, created_at=p.created_at.isoformat()) for p in updated_patterns
    ]
    logger.info(f"Returning {len(response_patterns)} total patterns for user {current_user.supabase_user_id}")

    return SyncBlockedPatternsResponse(success=True, blocked_patterns=response_patterns)
