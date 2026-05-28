from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./photography_platform.db")

# SQLAlchemy requires postgresql:// instead of postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
engine_kwargs = {}

if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # For Supabase/PostgreSQL connection poolers, we must handle dropped connections
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300 # Recycle connections after 5 minutes
    
    # Ensure SSL is used for external databases
    if "sslmode" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

engine = create_engine(
    DATABASE_URL, connect_args=connect_args, **engine_kwargs
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
