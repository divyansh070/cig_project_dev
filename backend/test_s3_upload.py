import os
import boto3
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    region_name=os.environ.get("AWS_REGION", "eu-north-1")
)

print("Testing S3 Upload...")
try:
    s3.put_object(
        Bucket=os.environ.get("AWS_BUCKET_NAME", "photography-platform-bucket"),
        Key="test_upload.txt",
        Body=b"hello world",
        ContentType="text/plain"
    )
    print("S3 Upload successful!")
except Exception as e:
    print(f"S3 Upload failed: {e}")
