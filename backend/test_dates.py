import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()
SERPER_API_KEY = os.environ.get('SERPER_API_KEY', '')

async def test_date():
    payload = {
        "q": 'site:linkedin.com/posts "#AI"',
        "num": 5,
        "tbs": "qdr:m6"
    }
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            "https://google.serper.dev/search",
            json=payload,
            headers=headers
        )
        data = response.json()
        for r in data.get("organic", []):
            print(r.keys())
            print(f"Date field: {r.get('date')}")
            print(f"Snippet: {r.get('snippet')[:50]}\n")

if __name__ == "__main__":
    asyncio.run(test_date())
