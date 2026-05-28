import asyncio
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = genai.Client()
    response = await client.aio.models.generate_content(
        model='gemini-2.5-flash',
        contents="Hello, this is a test."
    )
    print(response.text)

asyncio.run(main())
