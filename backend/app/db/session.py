from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from app.core.config import Settings

engine = create_engine(Settings.DATABASE_URL, pool_pre_ping=True) # why 2nd parameter ?

SessionLocal = sessionmaker(bind=engine) # getting session to db 

# Dependency to get DB session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()