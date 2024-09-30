from datetime import UTC
from datetime import datetime

from sqlalchemy import Boolean
from sqlalchemy import Date
from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

Base = declarative_base()


class PayingUser(Base):
    __tablename__ = "paying_user"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str | None] = mapped_column(String, unique=True, index=True, nullable=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    is_paying: Mapped[bool] = mapped_column(Boolean, default=False)


class BlockedPattern(Base):
    __tablename__ = "blocked_pattern"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str] = mapped_column(String, ForeignKey("paying_user.supabase_user_id"))
    pattern: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


class UserStats(Base):
    __tablename__ = "user_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str] = mapped_column(String, ForeignKey("paying_user.supabase_user_id"))
    total_tabs_blocked: Mapped[int] = mapped_column(Integer, default=0)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))


class DailyStats(Base):
    __tablename__ = "daily_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str] = mapped_column(String, ForeignKey("paying_user.supabase_user_id"))
    date: Mapped[Date] = mapped_column(Date)
    tabs_blocked: Mapped[int] = mapped_column(Integer, default=0)


class BlockedPatternStats(Base):
    __tablename__ = "blocked_pattern_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    supabase_user_id: Mapped[str] = mapped_column(String, ForeignKey("paying_user.supabase_user_id"))
    pattern: Mapped[str] = mapped_column(String)
    count: Mapped[int] = mapped_column(Integer, default=0)
