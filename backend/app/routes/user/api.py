from datetime import date
from datetime import datetime
from typing import List

from pydantic import BaseModel


class BlockedPattern(BaseModel):
    """
    Represents the pattern of blocked url
    Attributes:
        pattern (str): The blocked URL pattern.
        created_at (str): The creation timestamp (aliased as createdAt for frontend compatibility).
    """

    pattern: str
    created_at: str

    class Config:
        allow_population_by_field_name = True


class SyncBlockedPatternsRequest(BaseModel):
    """
    Represents the request to sync blocked patterns
    Attributes:
        patterns (list[BlockedPattern]): The list of blocked patterns.
    """

    patterns: List[BlockedPattern]


class SyncBlockedPatternsResponse(BaseModel):
    """
    Represents the response to sync blocked patterns
    Attributes:
        success (bool): Whether the sync was successful.
        blocked_patterns (list[BlockedPattern]): The list of blocked patterns.
    """

    success: bool
    blocked_patterns: List[BlockedPattern]


class BlockingHistoryRecord(BaseModel):
    url: str
    pattern: str
    timestamp: datetime

    class Config:
        from_attributes = True


class BlockingHistoryRequest(BaseModel):
    blocking_history: list[BlockingHistoryRecord]


class GetStatsResponse(BaseModel):
    """
    Represents the response to a get statistics request.
    """

    class UserStats(BaseModel):
        """
        Represents the user's statistics.
        Attributes:
            total_tabs_blocked (int): The total number of tabs blocked.
            last_updated (datetime | None): The last time a tab was blocked.
        """

        total_tabs_blocked: int
        last_updated: datetime | None

    class DailyStats(BaseModel):
        """
        Represents the daily statistics.
        Attributes:
            date (date): The date for which the stats are recorded.
            tabs_blocked (int): The number of tabs blocked on that date.
        """

        date: date
        tabs_blocked: int

    class BlockedPatternStats(BaseModel):
        """
        Represents the statistics for a blocked pattern.
        Attributes:
            pattern (str): The pattern that was blocked.
            count (int): The number of times the pattern was blocked.
        """

        pattern: str
        count: int

    user_stats: UserStats
    daily_stats: list[DailyStats]
    blocked_pattern_stats: list[BlockedPatternStats]
