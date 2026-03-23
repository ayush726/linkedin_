from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import httpx
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ENV vars
SERPER_API_KEY = os.environ.get('SERPER_API_KEY', '')
APIFY_API_TOKEN = os.environ.get('APIFY_API_TOKEN', '')

# ---- Models ----

TIME_RANGE_MAP = {
    "1w": {"tbs": "qdr:w", "days": 7, "label": "Past 1 week"},
    "1m": {"tbs": "qdr:m", "days": 30, "label": "Past 1 month"},
    "3m": {"tbs": "qdr:m3", "days": 90, "label": "Past 3 months"},
    "6m": {"tbs": "qdr:m6", "days": 180, "label": "Past 6 months"},
    "1y": {"tbs": "qdr:y", "days": 365, "label": "Past 1 year"},
}

class SearchRequest(BaseModel):
    keywords: List[str]
    timeRange: str = "6m"

class PostData(BaseModel):
    postText: str = ""
    authorName: str = ""
    authorTitle: str = ""
    authorProfileUrl: str = ""
    postedDate: str = ""
    likesCount: int = 0
    commentsCount: int = 0
    sharesCount: int = 0
    postUrl: str = ""
    hashtags: List[str] = Field(default_factory=list)
    mentionedPeople: List[str] = Field(default_factory=list)
    mentionedCompanies: List[str] = Field(default_factory=list)

class SearchResponse(BaseModel):
    posts: List[PostData] = Field(default_factory=list)
    totalPosts: int = 0
    searchKeywords: List[str] = Field(default_factory=list)
    error: Optional[str] = None

# ---- Helper functions ----

def classify_keyword(keyword: str) -> dict:
    """Classify a keyword as hashtag, person, or company."""
    keyword = keyword.strip()
    if keyword.startswith('#'):
        return {"type": "hashtag", "value": keyword}
    elif keyword.startswith('@'):
        return {"type": "mention", "value": keyword[1:]}
    else:
        return {"type": "general", "value": keyword}

def build_serper_query(classified: dict) -> str:
    """Build a Serper query for the keyword type."""
    ktype = classified["type"]
    value = classified["value"]
    if ktype == "hashtag":
        return f'site:linkedin.com/posts "{value}"'
    elif ktype == "mention":
        return f'site:linkedin.com "@{value}" OR "{value}" mentioned'
    else:
        return f'site:linkedin.com/posts "{value}"'

async def search_serper(query: str, tbs: str = "qdr:m6") -> List[dict]:
    """Call Serper API and return list of LinkedIn post organic search results."""
    if not SERPER_API_KEY:
        logger.error("SERPER_API_KEY not set")
        return []

    payload = {
        "q": query,
        "num": 20,  # Max allowed by Serper API for this tier/query type
        "tbs": tbs
    }
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as http_client:
            response = await http_client.post(
                "https://google.serper.dev/search",
                json=payload,
                headers=headers
            )
            if response.status_code != 200:
                logger.error(f"Serper API error: {response.status_code} - {response.text}")
                return []

            data = response.json()
            results = []
            for result in data.get("organic", []):
                link = result.get("link", "")
                if "linkedin.com" in link:
                    results.append({
                        "url": link,
                        "title": result.get("title", ""),
                        "snippet": result.get("snippet", "")
                    })
            logger.info(f"Serper returned {len(results)} LinkedIn URLs for query: {query}")
            return results
    except Exception as e:
        logger.error(f"Serper search error: {e}")
        return []

async def scrape_with_apify(urls: List[str]) -> List[dict]:
    """Scrape LinkedIn posts using Apify actor."""
    if not APIFY_API_TOKEN or not urls:
        return []

    # Use the Apify actor run-sync-get-dataset-items endpoint
    actor_id = "curious_coder~linkedin-post-scraper"
    endpoint = f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"

    input_data = {
        "urls": urls,
        "maxResults": len(urls)
    }

    try:
        async with httpx.AsyncClient(timeout=320.0) as http_client:
            response = await http_client.post(
                endpoint,
                json=input_data,
                params={"token": APIFY_API_TOKEN, "timeout": 300}
            )
            if response.status_code != 200:
                logger.error(f"Apify API error: {response.status_code} - {response.text[:500]}")
                return []

            data = response.json()
            if isinstance(data, list):
                logger.info(f"Apify returned {len(data)} scraped posts")
                return data
            return []
    except Exception as e:
        logger.error(f"Apify scraping error: {e}")
        return []

def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from post text."""
    return re.findall(r'#\w+', text)

def extract_mentions(text: str) -> List[str]:
    """Extract @mentions from post text."""
    return re.findall(r'@\w+', text)

def normalize_post(raw: dict) -> PostData:
    """Normalize a raw scraped post into PostData."""
    post_text = raw.get("postText", "") or raw.get("text", "") or ""
    author_name = raw.get("authorName", "") or raw.get("author", {}).get("name", "") or ""
    author_title = raw.get("authorTitle", "") or raw.get("author", {}).get("headline", "") or ""
    author_url = raw.get("authorProfileUrl", "") or raw.get("author", {}).get("url", "") or ""

    # Handle different date field names
    posted_date = raw.get("postedDate", "") or raw.get("postedAt", "") or raw.get("timestamp", "") or raw.get("scrapedAt", "") or ""

    # Handle different engagement field names
    likes = raw.get("likesCount", 0) or raw.get("reactions", 0) or raw.get("numLikes", 0) or 0
    comments = raw.get("commentsCount", 0) or raw.get("numComments", 0) or 0
    shares = raw.get("sharesCount", 0) or raw.get("numShares", 0) or 0
    post_url = raw.get("postUrl", "") or raw.get("url", "") or ""

    hashtags = extract_hashtags(post_text)
    mentioned_people = extract_mentions(post_text)
    mentioned_companies = []  # Would need NER for accurate company detection

    return PostData(
        postText=post_text,
        authorName=str(author_name),
        authorTitle=str(author_title),
        authorProfileUrl=str(author_url),
        postedDate=str(posted_date),
        likesCount=int(likes) if likes else 0,
        commentsCount=int(comments) if comments else 0,
        sharesCount=int(shares) if shares else 0,
        postUrl=str(post_url),
        hashtags=hashtags,
        mentionedPeople=mentioned_people,
        mentionedCompanies=mentioned_companies,
    )

def is_within_time_range(date_str: str, days: int = 180) -> bool:
    """Check if a date string is within the given number of days."""
    if not date_str:
        return True  # If no date, include it
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    try:
        # Try various date formats
        for fmt in ["%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d", "%b %d, %Y", "%B %d, %Y"]:
            try:
                dt = datetime.strptime(date_str, fmt).replace(tzinfo=timezone.utc)
                return dt >= cutoff
            except ValueError:
                continue
        return True  # If we can't parse, include it
    except Exception:
        return True

# ---- Routes ----

@api_router.get("/")
async def root():
    return {"message": "LinkedIn Intelligence Dashboard API"}

@api_router.get("/health")
async def health_check():
    """Check if API keys are configured."""
    return {
        "status": "ok",
        "serper_key_set": bool(SERPER_API_KEY),
        "apify_token_set": bool(APIFY_API_TOKEN),
    }

@api_router.post("/search", response_model=SearchResponse)
async def search_linkedin(request: SearchRequest):
    """Main agent pipeline: parse keywords -> Serper search -> Apify scrape -> normalize."""

    if not SERPER_API_KEY:
        raise HTTPException(status_code=500, detail="SERPER_API_KEY is not configured")
    if not APIFY_API_TOKEN:
        raise HTTPException(status_code=500, detail="APIFY_API_TOKEN is not configured")

    keywords = request.keywords
    if not keywords:
        raise HTTPException(status_code=400, detail="No keywords provided")

    time_range = request.timeRange if request.timeRange in TIME_RANGE_MAP else "6m"
    tr = TIME_RANGE_MAP[time_range]
    logger.info(f"Starting search for keywords: {keywords}, timeRange: {time_range} ({tr['label']})")

    # Step A: Classify keywords
    classified = [classify_keyword(kw) for kw in keywords]
    logger.info(f"Classified keywords: {classified}")

    # Step B: Serper API search for each keyword
    all_results = []
    seen_urls = set()
    for kw_info in classified:
        query = build_serper_query(kw_info)
        results = await search_serper(query, tbs=tr["tbs"])
        for r in results:
            url = r["url"]
            if url not in seen_urls:
                all_results.append(r)
                seen_urls.add(url)

    logger.info(f"Total unique URLs from Serper: {len(all_results)}")

    if not all_results:
        return SearchResponse(
            posts=[],
            totalPosts=0,
            searchKeywords=keywords,
            error="No public posts found for these keywords in the last 6 months."
        )

    # We only need the URLs for Apify
    all_urls = [r["url"] for r in all_results]

    # Step C: Apify scraping
    raw_posts = await scrape_with_apify(all_urls)

    # Step D: Normalize, filter & deduplicate
    posts = []
    seen_scraped_urls = set()
    
    if raw_posts:
        for raw in raw_posts:
            post = normalize_post(raw)
            # Deduplicate by postUrl
            if post.postUrl and post.postUrl in seen_scraped_urls:
                continue
            if post.postUrl:
                seen_scraped_urls.add(post.postUrl)
            # Filter by selected time range
            if is_within_time_range(post.postedDate, days=tr["days"]):
                posts.append(post)

    # Add any missing posts from Serper results that Apify failed to scrape
    for r in all_results:
        url = r["url"]
        if url not in seen_scraped_urls:
            title = r["title"]
            author = "LinkedIn User"
            if " on LinkedIn:" in title:
                author = title.split(" on LinkedIn:")[0].strip()
            elif " - LinkedIn" in title:
                author = title.split(" - LinkedIn")[0].strip()
            elif " | LinkedIn" in title:
                author = title.split(" | LinkedIn")[0].strip()
            
            # Use snippet as fallback post text
            fallback_text = r["snippet"] or "Post content could not be scraped. Click to view on LinkedIn."
            
            fallback_post = PostData(
                postUrl=url,
                postText=fallback_text,
                authorName=author,
                postedDate=datetime.now(timezone.utc).isoformat()  # Adding date so it doesn't crash sorted
            )
            posts.append(fallback_post)
            seen_scraped_urls.add(url)

    # Sort by postedDate descending
    posts.sort(key=lambda p: p.postedDate or "", reverse=True)

    logger.info(f"Returning {len(posts)} processed posts")

    return SearchResponse(
        posts=posts,
        totalPosts=len(posts),
        searchKeywords=keywords,
        error="Scraping partially failed. Showing preview from search results." if not raw_posts else None
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    pass

# Serve React frontend static files
FRONTEND_BUILD = ROOT_DIR.parent / "frontend" / "build"
if FRONTEND_BUILD.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_BUILD / "static")), name="static")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        index = FRONTEND_BUILD / "index.html"
        return FileResponse(str(index))
