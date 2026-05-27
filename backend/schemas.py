from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str
    is_club_member: bool = False

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    is_public: bool = False

class EventCreate(EventBase):
    pass

class MediaBase(BaseModel):
    filename: str
    url: str

class MediaCreate(MediaBase):
    event_id: int

class Media(MediaBase):
    id: int
    upload_date: datetime
    event_id: int
    uploader_id: int

    class Config:
        from_attributes = True

class Event(EventBase):
    id: int
    date: datetime
    creator_id: int
    media: List[Media] = []

    class Config:
        from_attributes = True
