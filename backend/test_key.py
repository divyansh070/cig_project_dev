import os
from dotenv import load_dotenv

# Try to force reload
load_dotenv(override=True)
print("Key from dotenv:", os.environ.get("GEMINI_API_KEY"))

try:
    from google import genai
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    models = client.models.list()
    print("API Key is working!")
except Exception as e:
    print("API Key error:", e)
