import os
from database import SessionLocal
import models

def cleanup():
    db = SessionLocal()
    media_records = db.query(models.Media).all()
    count = 0
    for m in media_records:
        file_path = os.path.join("uploads", m.filename)
        # If it was uploaded locally (exists in uploads folder)
        if os.path.exists(file_path):
            print(f"Deleting local file and DB record: {m.filename}")
            os.remove(file_path)
            db.delete(m)
            count += 1
    db.commit()
    print(f"Cleanup complete. Deleted {count} local images.")
    
if __name__ == "__main__":
    cleanup()
