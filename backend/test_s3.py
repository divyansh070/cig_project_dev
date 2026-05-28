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

print("Testing S3...")
try:
    s3.list_objects_v2(Bucket=os.environ.get("AWS_BUCKET_NAME", "photography-platform-bucket"), MaxKeys=1)
    print("S3 connection successful!")
except Exception as e:
    print(f"S3 connection failed: {e}")
