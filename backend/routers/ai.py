from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import boto3
from botocore.exceptions import NoCredentialsError
import random

import models, auth
from database import get_db

router = APIRouter(prefix="/ai", tags=["ai"])

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AI_ENABLED = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)

rekognition = None
if AI_ENABLED:
    rekognition = boto3.client(
        'rekognition',
        region_name='us-east-1',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

@router.post("/tag/{media_id}")
async def generate_tags(
    media_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    tags = []
    
    if AI_ENABLED:
        try:
            # We would normally fetch the image bytes here from S3 or local disk
            # For demonstration, assuming we have image bytes:
            # response = rekognition.detect_labels(Image={'Bytes': image_bytes}, MaxLabels=5)
            # tags = [label['Name'] for label in response['Labels']]
            pass
        except Exception:
            pass

    # Fallback / Mock logic if AWS is not configured or fails
    if not tags:
        mock_tags = ["mountains", "beaches", "sports", "crowd", "nature", "portrait", "event", "night"]
        tags = random.sample(mock_tags, k=random.randint(2, 4))
        
    return {"tags": tags}

@router.post("/face-search")
async def search_faces(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # This endpoint receives a reference selfie and returns matching media IDs
    matched_media_ids = []
    
    content = await file.read()
    
    if AI_ENABLED:
        try:
            # response = rekognition.search_faces_by_image(
            #     CollectionId='MyCollection',
            #     Image={'Bytes': content}
            # )
            pass
        except Exception:
            pass
            
    # Mock fallback: return random media as matches to demonstrate the UI workflow
    all_media = db.query(models.Media).limit(10).all()
    if all_media:
        matched_media_ids = [m.id for m in random.sample(all_media, k=min(3, len(all_media)))]
        
    return {"matched_media_ids": matched_media_ids}
