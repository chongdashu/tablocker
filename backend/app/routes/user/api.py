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
