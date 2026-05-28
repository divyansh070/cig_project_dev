import asyncio
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv(override=True)

async def main():
    try:
        client = genai.Client()
        print(f"Using API Key ending in ...{os.environ.get('GEMINI_API_KEY', '')[-4:]}")
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents="Say 'hello world'",
            config=types.GenerateContentConfig(
                max_output_tokens=30,
                temperature=0.2
            )
        )
        print("Success!", response.text)
    except Exception as e:
        print("Error:", e)

asyncio.run(main())
