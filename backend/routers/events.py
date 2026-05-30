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
    db_event = models.Event(
        **event.model_dump(),
        creator_id=current_user.id
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Give the creator Admin rights for this specific event
    event_role = models.EventRole(
        user_id=current_user.id,
        event_id=db_event.id,
        role=models.EventRoleEnum.admin
    )
    db.add(event_role)
    db.commit()
    
    return db_event

@router.get("/", response_model=List[schemas.Event])
def read_events(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Get all events
    all_events = db.query(models.Event).offset(skip).limit(limit).all()
    
    # Filter based on contextual permissions
    visible_events = []
    for ev in all_events:
        if ev.is_public:
            visible_events.append(ev)
        elif current_user.is_club_member:
            # Club members see all private events
            visible_events.append(ev)
        else:
            # Check if this specific user has ANY role in this event
            user_role = db.query(models.EventRole).filter(
                models.EventRole.event_id == ev.id,
                models.EventRole.user_id == current_user.id
            ).first()
            if user_role or ev.creator_id == current_user.id:
                visible_events.append(ev)
                
    return visible_events

@router.get("/{event_id}", response_model=schemas.Event)
def read_event(
    event_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if not event.is_public:
        if not current_user.is_superuser and not current_user.is_club_member and event.creator_id != current_user.id:
            user_role = db.query(models.EventRole).filter(
                models.EventRole.event_id == event.id,
                models.EventRole.user_id == current_user.id
            ).first()
            if not user_role:
                raise HTTPException(status_code=403, detail="You do not have permission to view this private event.")
        
    return event

@router.post("/{event_id}/roles")
def assign_role(
    event_id: int,
    username: str,
    role: models.EventRoleEnum,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Check if current user is admin of THIS event
    current_user_role = db.query(models.EventRole).filter(
        models.EventRole.event_id == event_id,
        models.EventRole.user_id == current_user.id
    ).first()
    
    if not current_user.is_superuser:
        if not current_user_role or current_user_role.role != models.EventRoleEnum.admin:
            if event.creator_id != current_user.id:
                raise HTTPException(status_code=403, detail="Only Event Admins can assign roles.")
            
    target_user = db.query(models.User).filter(models.User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    # Assign or update role
    existing_role = db.query(models.EventRole).filter(
        models.EventRole.event_id == event_id,
        models.EventRole.user_id == target_user.id
    ).first()
    
    if existing_role:
        existing_role.role = role
    else:
        new_role = models.EventRole(
            user_id=target_user.id,
            event_id=event_id,
            role=role
        )
        db.add(new_role)
        
    db.commit()
    return {"message": f"Successfully assigned {role.value} to {username}"}

@router.get("/{event_id}/role")
def get_user_role(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.is_superuser:
        return {"role": "Admin"}
        
    # Check if they are the creator
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event and event.creator_id == current_user.id:
        return {"role": "Admin"}
        
    user_role = db.query(models.EventRole).filter(
        models.EventRole.event_id == event_id,
        models.EventRole.user_id == current_user.id
    ).first()
    
    if user_role:
        return {"role": user_role.role.value}
        
    return {"role": "Viewer"}

@router.get("/{event_id}/members", response_model=List[schemas.EventMember])
def get_event_members(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # We want to return club members AND anyone who has a role in the event.
    users = db.query(models.User).filter(
        (models.User.is_club_member == True) | 
        (models.User.event_roles.any(event_id=event_id))
    ).all()
    
    members = []
    for u in users:
        role = "Viewer"
        if event.creator_id == u.id:
            role = "Admin"
        else:
            ur = db.query(models.EventRole).filter(models.EventRole.event_id == event_id, models.EventRole.user_id == u.id).first()
            if ur:
                role = ur.role.value
        
        members.append({
            "username": u.username,
            "is_club_member": u.is_club_member,
            "role": role
        })
        
    return members

@router.delete("/{event_id}/roles/{username}")
def remove_role(
    event_id: int,
    username: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    current_user_role = db.query(models.EventRole).filter(
        models.EventRole.event_id == event_id,
        models.EventRole.user_id == current_user.id
    ).first()
    
    if not current_user.is_superuser:
        if not current_user_role or current_user_role.role != models.EventRoleEnum.admin:
            if event.creator_id != current_user.id:
                raise HTTPException(status_code=403, detail="Only Event Admins can remove roles.")
            
    target_user = db.query(models.User).filter(models.User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
        
    existing_role = db.query(models.EventRole).filter(
        models.EventRole.event_id == event_id,
        models.EventRole.user_id == target_user.id
    ).first()
    
    if existing_role:
        db.delete(existing_role)
        db.commit()
        
    return {"message": f"Successfully removed role for {username}"}

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    current_user_role = db.query(models.EventRole).filter(
        models.EventRole.event_id == event_id,
        models.EventRole.user_id == current_user.id
    ).first()
    
    if not current_user.is_superuser:
        if (not current_user_role or current_user_role.role != models.EventRoleEnum.admin) and event.creator_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only Event Admins can delete events.")
            
    # Delete associated data
    media_items = db.query(models.Media).filter(models.Media.event_id == event.id).all()
    for m in media_items:
        db.query(models.Like).filter(models.Like.media_id == m.id).delete()
        db.query(models.Comment).filter(models.Comment.media_id == m.id).delete()
        db.delete(m)
        
    db.query(models.EventRole).filter(models.EventRole.event_id == event.id).delete()
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}
