from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import boto3
import os
from typing import List

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/face", tags=["face"])

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.environ.get("AWS_REGION", "eu-north-1")
COLLECTION_ID = "capturehub-faces"

S3_ENABLED = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)

rekognition_client = None
if S3_ENABLED:
    try:
        rekognition_client = boto3.client(
            "rekognition",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION
        )
        # Ensure collection exists on startup
        try:
            rekognition_client.create_collection(CollectionId=COLLECTION_ID)
        except rekognition_client.exceptions.ResourceAlreadyExistsException:
            pass
    except Exception as e:
        print(f"Failed to initialize Rekognition: {e}")

def index_image_faces(media_id: int, image_bytes: bytes):
    if not rekognition_client:
        return
    try:
        rekognition_client.index_faces(
            CollectionId=COLLECTION_ID,
            Image={'Bytes': image_bytes},
            ExternalImageId=str(media_id),
            MaxFaces=10,
            QualityFilter="AUTO",
            DetectionAttributes=['DEFAULT']
        )
        print(f"Successfully indexed faces for media {media_id}")
    except Exception as e:
        print(f"Rekognition Index Error: {e}")

@router.post("/search", response_model=List[schemas.Media])
async def search_faces(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not rekognition_client:
        raise HTTPException(status_code=500, detail="AWS Rekognition is not configured on the server")
        
    content = await file.read()
    
    try:
        response = rekognition_client.search_faces_by_image(
            CollectionId=COLLECTION_ID,
            Image={'Bytes': content},
            MaxFaces=50,
            FaceMatchThreshold=90
        )
    except rekognition_client.exceptions.InvalidParameterException:
        raise HTTPException(status_code=400, detail="No faces detected in the provided image.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Rekognition Search Error: {str(e)}")
        
    matched_media_ids = set()
    for match in response.get('FaceMatches', []):
        face = match.get('Face', {})
        external_id = face.get('ExternalImageId')
        if external_id and external_id.isdigit():
            matched_media_ids.add(int(external_id))
            
    if not matched_media_ids:
        return []
        
    # Fetch media items in one query
    media_items = db.query(models.Media).filter(models.Media.id.in_(list(matched_media_ids))).all()
    
    # Filter out private events the user doesn't have access to
    visible_media = []
    for m in media_items:
        if current_user.is_superuser:
            visible_media.append(m)
            continue
            
        event = m.event
        if not event:
            continue
            
        if event.is_public or current_user.is_club_member or event.creator_id == current_user.id:
            visible_media.append(m)
            continue
            
        user_role = db.query(models.EventRole).filter(
            models.EventRole.event_id == event.id,
            models.EventRole.user_id == current_user.id
        ).first()
        if user_role:
            visible_media.append(m)
            
    return visible_media
