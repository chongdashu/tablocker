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


class UserStats(BaseModel):
    """
    Represents the user's statistics.
    Attributes:
        total_tabs_blocked (int): The total number of tabs blocked.
        last_updated (str): The last time the user's stats were updated.
    """

    total_tabs_blocked: int
    last_updated: str


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


class SyncStatsRequest(BaseModel):
    """
    Represents the request to sync statistics.
    Attributes:
        user_stats (UserStats): The user's statistics.
        daily_stats (list[DailyStats]): A list of daily statistics.
        blocked_pattern_stats (list[BlockedPatternStats]): A list of statistics for blocked patterns.
    """

    user_stats: UserStats
    daily_stats: List[DailyStats]
    blocked_pattern_stats: List[BlockedPatternStats]


class SyncStatsResponse(BaseModel):
    """
    Represents the response to a sync statistics request.
    Attributes:
        success (bool): Indicates if the sync was successful.
        message (str): A message about the sync operation.
    """

    success: bool
    message: str


class BlockingHistoryRecord(BaseModel):
    url: str
    pattern: str
    timestamp: datetime

    class Config:
        from_attributes = True
