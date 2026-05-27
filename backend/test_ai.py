import os
import sys

# Try loading HuggingFace transformers pipeline
try:
    from transformers import pipeline
    print("Loading HuggingFace zero-shot image classification model...")
    image_classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")
    
    CANDIDATE_LABELS = [
        "portrait", "group of people", "mountain", "beach", "sports", 
        "indoor event", "night", "nature", "city", "wedding", "concert",
        "food", "pet", "architecture", "vehicle"
    ]
    
    # create dummy image
    from PIL import Image
    img = Image.new('RGB', (100, 100), color = 'red')
    img.save('dummy.jpg')
    
    results = image_classifier('dummy.jpg', candidate_labels=CANDIDATE_LABELS)
    print("Success:", results)
except Exception as e:
    print(f"Failed: {e}")

