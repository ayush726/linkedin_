# LinkedIn Public Post Intelligence Dashboard

A web app that searches and analyzes publicly visible LinkedIn posts based on hashtags, @mentions of people, and companies — no LinkedIn login required.

## Stack

- Frontend: React + Tailwind CSS + Shadcn UI + Recharts
- Backend: Python (FastAPI)
- APIs: Serper.dev (Google search), Apify (post scraping)
- PDF Export: jsPDF + html2canvas

## How to Run

```bash
./start.bat
```

That's it. The script starts both the backend and frontend automatically.

## Setup (first time only)

### 1. Get API Keys

- Serper.dev: Sign up at [serper.dev](https://serper.dev) — free tier includes 2,500 credits
- Apify: Sign up at [apify.com](https://apify.com), go to Settings > Integrations for your token

### 2. Configure Environment

Create `backend/.env` and add your keys:

```
SERPER_API_KEY=your_serper_key
APIFY_API_TOKEN=your_apify_token
```

### 3. Install Dependencies

Backend:
```bash
cd backend
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

## Features

- Keyword input with hashtags, people, and company mentions
- 3-step loading indicator
- Summary stats: total posts, date range, top hashtags, top mentioned
- Charts: posts per month, top hashtags, most liked
- Filterable and sortable post cards
- PDF export
