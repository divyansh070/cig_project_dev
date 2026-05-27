from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import enum
import datetime
from database import Base

class EventRoleEnum(str, enum.Enum):
    admin = "Admin"
    photographer = "Photographer"
    viewer = "Viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_club_member = Column(Boolean, default=False)
    
    events = relationship("Event", back_populates="creator")
    media = relationship("Media", back_populates="uploader")
    event_roles = relationship("EventRole", back_populates="user")

class EventRole(Base):
    __tablename__ = "event_roles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    role = Column(Enum(EventRoleEnum), default=EventRoleEnum.viewer)
    
    user = relationship("User", back_populates="event_roles")
    event = relationship("Event", back_populates="roles")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    category = Column(String, index=True, nullable=True)
    is_public = Column(Boolean, default=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    creator = relationship("User", back_populates="events")
    media = relationship("Media", back_populates="event")
    roles = relationship("EventRole", back_populates="event")

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    url = Column(String) # Local path or S3 URL
    tags = Column(String, nullable=True) # JSON string of tags
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    event_id = Column(Integer, ForeignKey("events.id"))
    uploader_id = Column(Integer, ForeignKey("users.id"))
    
    event = relationship("Event", back_populates="media")
    uploader = relationship("User", back_populates="media")
    likes = relationship("Like", back_populates="media")
    comments = relationship("Comment", back_populates="media")

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, ForeignKey("media.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    media = relationship("Media", back_populates="likes")
    user = relationship("User")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    media_id = Column(Integer, ForeignKey("media.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    media = relationship("Media", back_populates="comments")
    user = relationship("User")
