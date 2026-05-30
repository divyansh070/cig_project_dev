from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
import random
import json

import models, auth
from database import get_db

USE_LOCAL_AI = False
AI_ENABLED = False
image_classifier = None
print("Local HuggingFace AI permanently disabled to preserve memory on Free Tier. Relying solely on Gemini.")

router = APIRouter(prefix="/ai", tags=["ai"])

CANDIDATE_LABELS = [
    "portrait", "group of people", "mountain", "beach", "sports", 
    "indoor event", "night", "nature", "city", "wedding", "concert",
    "food", "pet", "architecture", "vehicle","person"
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
        # Try fetching from S3 directly into memory
        from routers.media import s3_client, S3_ENABLED, AWS_BUCKET_NAME
        if S3_ENABLED and s3_client:
            try:
                obj = s3_client.get_object(Bucket=AWS_BUCKET_NAME, Key=filename)
                image_content = obj['Body'].read()
            except Exception as e:
                print(f"Error fetching from S3 for AI tagging: {e}")
                
    if image_content:

        # Fallback: Gemini API if Local AI is disabled
        elif not USE_LOCAL_AI:
            try:
                from google import genai
                from google.genai import types
                from PIL import Image
                import io
                
                # Ensure Gemini credentials exist in environment
                if "GEMINI_API_KEY" in os.environ:
                    client = genai.Client() # Picks up GEMINI_API_KEY from os.environ
                    
                    # Gemini expects a PIL image
                    img = Image.open(io.BytesIO(image_content))
                    
                    prompt = "You are an expert image captioner. Provide 2 to 3 short, beautiful, and engaging captions describing this image (each caption should be 3-6 words long). Separate each caption strictly with a pipe character '|', and do not use commas. Example: A breathtaking sunset|Enjoying the summer breeze|Nature at its finest. If you cannot determine any captions, return 'A beautiful moment captured|Photography'."
                    
                    response = await client.aio.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=[prompt, img],
                        config=types.GenerateContentConfig(
                            max_output_tokens=60,
                            temperature=0.4
                        )
                    )
                    
                    # Parse the pipe-separated response
                    if response.text:
                        gemini_tags = [t.strip() for t in response.text.split('|')]
                        tags = gemini_tags[:3]
                else:
                    print("GEMINI_API_KEY not set. Using mock tags.")
            except Exception as e:
                error_msg = str(e)[:30]
                print(f"Gemini API error: {e}")
                tags = [f"error: {error_msg}"]
        
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
