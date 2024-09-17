from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.models import Base

DATABASE_URL = "postgresql://user:password@localhost/dbname"  # Replace with your actual database URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
