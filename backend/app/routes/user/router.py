import logging
from datetime import datetime

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session

from database.manager import get_db
from database.models import BlockedPattern
from database.models import BlockedPatternStats
from database.models import BlockingHistory
from database.models import DailyStats
from database.models import UserStats
from routes.auth.api import UserResponse
from routes.auth.router import get_current_user
from routes.user.api import BlockedPattern as BlockedPatternSchema
from routes.user.api import BlockingHistoryRecord
from routes.user.api import BlockingHistoryRequest
from routes.user.api import SyncBlockedPatternsRequest
from routes.user.api import SyncBlockedPatternsResponse
from routes.user.api import SyncStatsRequest
from routes.user.api import SyncStatsResponse

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


@router.post("/stats/sync", response_model=SyncStatsResponse)
async def sync_stats(
    request: SyncStatsRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info(f"Syncing stats for user {current_user.supabase_user_id}")

    # Update or create UserStats
    user_stats = db.query(UserStats).filter(UserStats.supabase_user_id == current_user.supabase_user_id).first()
    if user_stats:
        user_stats.total_tabs_blocked = request.user_stats.total_tabs_blocked
        user_stats.last_updated = datetime.fromisoformat(request.user_stats.last_updated)
    else:
        user_stats = UserStats(
            supabase_user_id=current_user.supabase_user_id,
            total_tabs_blocked=request.user_stats.total_tabs_blocked,
            last_updated=datetime.fromisoformat(request.user_stats.last_updated),
        )
        db.add(user_stats)

    # Update or create DailyStats
    for daily_stat in request.daily_stats:
        db_daily_stat = (
            db.query(DailyStats)
            .filter(DailyStats.supabase_user_id == current_user.supabase_user_id, DailyStats.date == daily_stat.date)
            .first()
        )
        if db_daily_stat:
            db_daily_stat.tabs_blocked = daily_stat.tabs_blocked
        else:
            db_daily_stat = DailyStats(
                supabase_user_id=current_user.supabase_user_id,
                date=daily_stat.date,
                tabs_blocked=daily_stat.tabs_blocked,
            )
            db.add(db_daily_stat)

    # Update or create BlockedPatternStats
    for pattern_stat in request.blocked_pattern_stats:
        db_pattern_stat = (
            db.query(BlockedPatternStats)
            .filter(
                BlockedPatternStats.supabase_user_id == current_user.supabase_user_id,
                BlockedPatternStats.pattern == pattern_stat.pattern,
            )
            .first()
        )
        if db_pattern_stat:
            db_pattern_stat.count = pattern_stat.count
        else:
            db_pattern_stat = BlockedPatternStats(
                supabase_user_id=current_user.supabase_user_id, pattern=pattern_stat.pattern, count=pattern_stat.count
            )
            db.add(db_pattern_stat)

    try:
        db.commit()
        logger.info(f"Successfully synced stats for user {current_user.supabase_user_id}")
        return SyncStatsResponse(success=True, message="Stats synced successfully")
    except Exception as e:
        db.rollback()
        logger.error(f"Error syncing stats for user {current_user.supabase_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error syncing stats")


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
    Add new blocking history entries for the current user, de-duplicating based on timestamps.
    """
    # Create a dictionary to store entries, using timestamp as the key
    unique_entries: dict[datetime, BlockingHistoryRecord] = {}

    for entry in request.blocking_history:
        if entry.timestamp not in unique_entries or entry.timestamp > unique_entries[entry.timestamp].timestamp:
            unique_entries[entry.timestamp] = entry

    # Add unique entries to the database
    new_entries: list[BlockingHistory] = []
    for unique_entry in unique_entries.values():
        new_entry = BlockingHistory(
            supabase_user_id=current_user.supabase_user_id,
            url=unique_entry.url,
            pattern=unique_entry.pattern,
            timestamp=unique_entry.timestamp,
        )
        db.add(new_entry)
        new_entries.append(new_entry)

    db.commit()
    for entry in new_entries:
        db.refresh(entry)

    return [
        BlockingHistoryRecord(url=entry.url, pattern=entry.pattern, timestamp=entry.timestamp) for entry in new_entries
    ]
