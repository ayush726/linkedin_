# LinkedIn Public Post Intelligence Dashboard

A web application that acts as an agent to search and analyze publicly visible LinkedIn posts based on hashtags, @mentions of people, and @mentions of companies. No LinkedIn login is required.

## Stack

- **Frontend**: React + Tailwind CSS + Shadcn UI + Recharts
- **Backend**: Python (FastAPI)
- **APIs**: Serper.dev (Google search), Apify (post scraping)
- **PDF Export**: jsPDF + html2canvas

## Setup

### 1. Get API Keys

- **Serper.dev**: Sign up at [serper.dev](https://serper.dev) to get your API key. Free tier includes 2,500 credits.
- **Apify**: Sign up at [apify.com](https://apify.com), go to Settings > Integrations to get your API token.

### 2. Configure Environment

Copy the example env file and add your API keys:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your actual API keys.

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies

```bash
cd frontend
yarn install
```

### 5. Start the Application

Backend:
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001
```

Frontend:
```bash
cd frontend
yarn start
```

## How It Works

1. **Enter Keywords**: Add hashtags (#AIIndia), people (@SatyaNadella), or companies (@Google)
2. **Agent Pipeline**: 
   - Keywords are classified (hashtag/person/company)
   - Serper API searches Google for LinkedIn posts matching each keyword
   - Apify scraper extracts detailed post data from found URLs
   - Results are filtered (6 months), deduplicated, and normalized
3. **Dashboard**: View summary stats, charts, and filterable post cards
4. **Export**: Download results as a PDF report

## Features

- Keyword input with chips/tags
- 3-step loading indicator
- Summary stats (total posts, date range, top hashtags, top mentioned)
- Charts: posts per month, top hashtags, most liked
- Filterable post cards (by tag, date range, min likes)
- Sortable (by date, likes, comments)
- PDF export with all visible data
