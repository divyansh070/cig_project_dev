from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only Admin or Photographer can create events (Role-based access control example)
    if current_user.role not in [models.RoleEnum.admin, models.RoleEnum.photographer]:
        raise HTTPException(status_code=403, detail="Not enough permissions to create events")
        
    db_event = models.Event(
        **event.model_dump(),
        creator_id=current_user.id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/", response_model=List[schemas.Event])
def read_events(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Event)
    
    # Viewers can only see public events
    if current_user.role == models.RoleEnum.viewer:
        query = query.filter(models.Event.is_public == True)
        
    events = query.offset(skip).limit(limit).all()
    return events

@router.get("/{event_id}", response_model=schemas.Event)
def read_event(
    event_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if current_user.role == models.RoleEnum.viewer and not event.is_public:
        raise HTTPException(status_code=403, detail="You do not have permission to view this private event.")
        
    return event
