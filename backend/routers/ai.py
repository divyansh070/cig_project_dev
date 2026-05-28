from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import random
import json

import models, auth
from database import get_db

USE_LOCAL_AI = os.environ.get("USE_LOCAL_AI", "True").lower() == "true"

# Try loading HuggingFace transformers pipeline only if enabled
if USE_LOCAL_AI:
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
else:
    print("Local AI disabled via USE_LOCAL_AI environment variable. Using lightweight fallback.")
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
    
    # Load image content (from local disk or S3)
    filename = media.url.split('/')[-1]
    file_path = os.path.join("uploads", filename)
    
    image_content = None
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            image_content = f.read()
    else:
        # Try fetching from S3
        from routers.media import s3_client, S3_ENABLED, AWS_BUCKET_NAME
        if S3_ENABLED and s3_client:
            try:
                obj = s3_client.get_object(Bucket=AWS_BUCKET_NAME, Key=filename)
                image_content = obj['Body'].read()
                # Temporarily save to disk for HuggingFace pipeline which expects a file path
                with open(file_path, 'wb') as f:
                    f.write(image_content)
            except Exception as e:
                print(f"Error fetching from S3 for AI tagging: {e}")
                
    if image_content:
        # Run the actual local AI model
        if AI_ENABLED and image_classifier:
            try:
                # Run inference using Zero-Shot
                results = image_classifier(file_path, candidate_labels=CANDIDATE_LABELS)
                
                # Extract top 3 labels with score > 0.1
                top_results = sorted(results, key=lambda x: x['score'], reverse=True)
                tags = [res['label'] for res in top_results if res['score'] > 0.1][:3]
            except Exception as e:
                print(f"AI tagging error: {e}")

        # Fallback: Google Cloud Vision API if Local AI is disabled
        elif not USE_LOCAL_AI:
            try:
                from google.cloud import vision
                
                # Ensure Google credentials exist in environment
                if "GOOGLE_APPLICATION_CREDENTIALS" in os.environ:
                    client = vision.ImageAnnotatorClient()
                    
                    image = vision.Image(content=image_content)
                    response = client.label_detection(image=image)
                    labels = response.label_annotations
                    
                    # Extract tag descriptions from Google Vision
                    vision_tags = [label.description.lower() for label in labels]
                    
                    # Try to map Google tags to our specific CANDIDATE_LABELS for UI consistency
                    matched_tags = []
                    for v_tag in vision_tags:
                        for c_tag in CANDIDATE_LABELS:
                            if c_tag in v_tag or v_tag in c_tag:
                                if c_tag not in matched_tags:
                                    matched_tags.append(c_tag)
                                    
                    # Take up to 3 mapped tags, or fallback to generic Google tags
                    tags = matched_tags[:3] if matched_tags else vision_tags[:3]
                else:
                    print("GOOGLE_APPLICATION_CREDENTIALS not set. Using mock tags.")
            except Exception as e:
                print(f"Google Vision API error: {e}")

    # Final Fallback / Mock logic if all AI fails
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
