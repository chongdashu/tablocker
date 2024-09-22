from typing import List

from pydantic import BaseModel


class BlockedPattern(BaseModel):
    """
    Represents the pattern of blocked url
    Attributes:
        urls (list[str]): The list of blocked urls.
    """

    pattern: str
    createdAt: str  # Changed from created_at to createdAt to match the client-side


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
