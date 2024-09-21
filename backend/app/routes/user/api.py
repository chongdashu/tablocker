from pydantic import BaseModel


class BlockedPattern(BaseModel):
    """
    Represents the pattern of blocked url
    Attributes:
        urls (list[str]): The list of blocked urls.
    """

    pattern: str


class SyncBlockedPatternsResponse(BaseModel):
    """
    Represents the pattern of blocked url
    Attributes:
        urls (list[str]): The list of blocked urls.
    """

    success: bool
    blocked_patterns: list[BlockedPattern]
