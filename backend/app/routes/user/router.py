import logging
from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.manager import get_db
from database.models import BlockedPattern
from database.models import BlockingHistory
from routes.auth.api import UserResponse
from routes.auth.router import get_current_user
from routes.user.api import BlockedPattern as BlockedPatternSchema
from routes.user.api import BlockingHistoryRecord
from routes.user.api import BlockingHistoryRequest
from routes.user.api import GetStatsResponse
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

    # Add new patterns and track patterns to keep
    new_patterns_count = 0
    patterns_to_keep: set[str] = set()
    for pattern in request.patterns:
        patterns_to_keep.add(pattern.pattern)
        if pattern.pattern not in existing_pattern_set:
            new_pattern = BlockedPattern(
                supabase_user_id=current_user.supabase_user_id,
                pattern=pattern.pattern,
                created_at=datetime.fromisoformat(pattern.created_at),
            )
            db.add(new_pattern)
            new_patterns_count += 1

    # Remove patterns not in the request
    patterns_to_remove = existing_pattern_set - patterns_to_keep
    if patterns_to_remove:
        db.query(BlockedPattern).filter(
            BlockedPattern.supabase_user_id == current_user.supabase_user_id,
            BlockedPattern.pattern.in_(patterns_to_remove),
        ).delete(synchronize_session=False)

    logger.info(
        f"Adding {new_patterns_count=}, removing {len(patterns_to_remove)=} for {current_user.supabase_user_id=}"
    )
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


@router.get("/blocking_history", response_model=list[BlockingHistoryRecord])
async def get_blocking_history(current_user: UserResponse = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieve the blocking history for the current user.
    """
    history = db.query(BlockingHistory).filter(BlockingHistory.supabase_user_id == current_user.supabase_user_id).all()
    return history


@router.post("/blocking_history", response_model=list[BlockingHistoryRecord])
async def post_blocking_history(
    request: BlockingHistoryRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[BlockingHistoryRecord]:
    """
    Merge new blocking history entries with existing ones for the current user.

    This function de-duplicates entries based on timestamps, updating existing entries
    if necessary and creating new ones if they don't exist.

    Args:
        request: The BlockingHistoryRequest containing new history entries.
        current_user: The current authenticated user.
        db: The database session.

    Returns:
        A list of BlockingHistoryRecord representing the updated entries.
    """
    user_id = current_user.supabase_user_id

    # Create a dictionary of new entries, using timestamp as the key
    new_entries = {entry.timestamp: entry for entry in request.blocking_history}

    # Fetch existing entries for the user with matching timestamps
    existing_entries = (
        db.query(BlockingHistory)
        .filter(BlockingHistory.supabase_user_id == user_id)
        .filter(BlockingHistory.timestamp.in_(new_entries.keys()))
        .all()
    )

    updated_entries: list[BlockingHistory] = []

    for entry in existing_entries:
        new_entry = new_entries.pop(entry.timestamp)
        if new_entry.url != entry.url or new_entry.pattern != entry.pattern:
            entry.url = new_entry.url
            entry.pattern = new_entry.pattern
            updated_entries.append(entry)

    # Add remaining new entries
    for timestamp, entry in new_entries.items():
        new_entry = BlockingHistory(
            supabase_user_id=user_id,
            url=entry.url,
            pattern=entry.pattern,
            timestamp=timestamp,
        )
        db.add(new_entry)
        updated_entries.append(new_entry)

    if updated_entries:
        db.commit()
        for entry in updated_entries:
            db.refresh(entry)

    return [
        BlockingHistoryRecord(url=entry.url, pattern=entry.pattern, timestamp=entry.timestamp)
        for entry in updated_entries
    ]


@router.get("/stats", response_model=GetStatsResponse)
async def get_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve user statistics derived from BlockingHistory.
    """
    user_id = current_user.supabase_user_id

    # Calculate UserStats
    total_tabs_blocked = (
        db.query(func.count(BlockingHistory.id)).filter(BlockingHistory.supabase_user_id == user_id).scalar()
    )

    last_updated = (
        db.query(func.max(BlockingHistory.timestamp)).filter(BlockingHistory.supabase_user_id == user_id).scalar()
    )

    # Calculate DailyStats
    daily_stats = (
        db.query(
            func.date(BlockingHistory.timestamp).label("date"), func.count(BlockingHistory.id).label("tabs_blocked")
        )
        .filter(BlockingHistory.supabase_user_id == user_id)
        .group_by(func.date(BlockingHistory.timestamp))
        .all()
    )

    # Calculate BlockedPatternStats
    pattern_stats = (
        db.query(BlockingHistory.pattern, func.count(BlockingHistory.id).label("total_count"))
        .filter(BlockingHistory.supabase_user_id == user_id)
        .group_by(BlockingHistory.pattern)
        .all()
    )

    return GetStatsResponse(
        user_stats=GetStatsResponse.UserStats(total_tabs_blocked=total_tabs_blocked, last_updated=last_updated),
        daily_stats=[
            GetStatsResponse.DailyStats(date=stat.date, tabs_blocked=stat.tabs_blocked) for stat in daily_stats
        ],
        blocked_pattern_stats=[
            GetStatsResponse.BlockedPatternStats(pattern=stat.pattern, count=stat.total_count) for stat in pattern_stats
        ],
    )
