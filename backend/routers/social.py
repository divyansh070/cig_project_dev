from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models, schemas, auth
from database import get_db
from routers.notifications import notify_all

router = APIRouter(prefix="/social", tags=["social"])

@router.post("/like/{media_id}")
async def like_media(
    media_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    existing_like = db.query(models.Like).filter(
        models.Like.media_id == media_id,
        models.Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"status": "unliked"}
    else:
        new_like = models.Like(media_id=media_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        
        # Real-time notification trigger
        await notify_all(f"{current_user.username} liked a photo!")
        
        return {"status": "liked"}

@router.get("/likes/{media_id}")
def get_likes(media_id: int, db: Session = Depends(get_db)):
    count = db.query(models.Like).filter(models.Like.media_id == media_id).count()
    return {"likes_count": count}

# Basic comment endpoint
from pydantic import BaseModel
class CommentCreate(BaseModel):
    text: str

@router.post("/comment/{media_id}")
async def comment_media(
    media_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    new_comment = models.Comment(
        text=comment.text,
        media_id=media_id,
        user_id=current_user.id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    # Real-time notification trigger
    await notify_all(f"{current_user.username} commented on a photo!")
    
    return {"status": "success", "comment_id": new_comment.id}

@router.get("/comments/{media_id}")
def get_comments(media_id: int, db: Session = Depends(get_db)):
    comments = db.query(models.Comment).filter(models.Comment.media_id == media_id).all()
    return [{"id": c.id, "text": c.text, "user_id": c.user_id, "username": c.user.username if c.user else f"User {c.user_id}", "created_at": c.created_at} for c in comments]
