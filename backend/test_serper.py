import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()
SERPER_API_KEY = os.environ.get('SERPER_API_KEY', '')

async def test_serper():
    print(f"Token: {SERPER_API_KEY[:5]}...")
    
    payload = {
        "q": 'site:linkedin.com/posts "#AI"',
        "num": 50,
        "tbs": "qdr:m6"
    }
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    
    print("Calling Serper...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            json=payload,
            headers=headers
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:500]}")

if __name__ == "__main__":
    asyncio.run(test_serper())
