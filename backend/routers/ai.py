from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import random
import json

import models, auth
from database import get_db

# Try loading HuggingFace transformers pipeline
try:
    from transformers import pipeline
    print("Loading HuggingFace zero-shot image classification model...")
    # Using a lightweight CLIP model
    image_classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
    AI_ENABLED = True
except Exception as e:
    print(f"Failed to load transformers AI model: {e}")
    image_classifier = None
    AI_ENABLED = False

router = APIRouter(prefix="/ai", tags=["ai"])

CANDIDATE_LABELS = [
    "portrait", "group of people", "mountain", "beach", "sports", 
    "indoor event", "night", "nature", "city", "wedding", "concert",
    "food", "pet", "architecture", "vehicle"
]

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
    
    # Run the actual local AI model
    if AI_ENABLED and image_classifier:
        try:
            filename = media.url.split('/')[-1]
            file_path = os.path.join("uploads", filename)
            
            if os.path.exists(file_path):
                # Run inference
                results = image_classifier(file_path, candidate_labels=CANDIDATE_LABELS)
                
                # Extract top 3 labels with score > 0.1
                top_results = sorted(results, key=lambda x: x['score'], reverse=True)
                tags = [res['label'] for res in top_results if res['score'] > 0.1][:3]
        except Exception as e:
            print(f"AI tagging error: {e}")

    # Fallback / Mock logic if AI fails
    if not tags:
        tags = ["photography"]
        
    # Save the tags to the database
    media.tags = json.dumps(tags)
    db.commit()
        
    return {"tags": tags}

@router.post("/face-search")
async def search_faces(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # This endpoint receives a reference selfie and returns matching media objects
    matched_media = []
    
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
            
    # Local fallback: actual facial recognition using face_recognition library
    if not matched_media:
        try:
            import face_recognition
            import io
            
            reference_image = face_recognition.load_image_file(io.BytesIO(content))
            reference_encodings = face_recognition.face_encodings(reference_image)
            
            if reference_encodings:
                reference_encoding = reference_encodings[0]
                all_media = db.query(models.Media).all()
                
                for m in all_media:
                    filename = m.url.split('/')[-1]
                    file_path = os.path.join("uploads", filename)
                    
                    if os.path.exists(file_path):
                        try:
                            unknown_image = face_recognition.load_image_file(file_path)
                            unknown_encodings = face_recognition.face_encodings(unknown_image)
                            
                            for unknown_encoding in unknown_encodings:
                                results = face_recognition.compare_faces([reference_encoding], unknown_encoding, tolerance=0.55)
                                if results[0]:
                                    matched_media.append(m)
                                    break # Match found, stop checking other faces in this image
                        except Exception as img_err:
                            print(f"Error processing {filename}: {img_err}")
        except Exception as e:
            print(f"Facial recognition error: {e}")
            
    return {"matched_media": [{"id": m.id, "url": m.url, "filename": m.filename, "upload_date": m.upload_date} for m in matched_media]}
