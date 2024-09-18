import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.models import Base

load_dotenv()

POSTGRES_DATABASE_URL = os.environ.get("POSTGRES_DATABASE_URL")
if POSTGRES_DATABASE_URL is None:
    raise ValueError("POSTGRES_DATABASE_URL environment variable is not set")

engine = create_engine(POSTGRES_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(engine)
