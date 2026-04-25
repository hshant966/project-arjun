# 🏗️ Backend Pipeline Architecture — Project Arjun

> *Practical implementation guide for India-wide geospatial intelligence platform*

---

## Table of Contents

1. [Backend Architecture for Free-Tier Deployment](#1-backend-architecture-for-free-tier-deployment)
2. [Data Ingestion Pipeline Design](#2-data-ingestion-pipeline-design)
3. [PostgreSQL + PostGIS Schema Design](#3-postgresql--postgis-schema-design)
4. [Redis Caching Strategy](#4-redis-caching-strategy)
5. [API Gateway Design (Node.js + Express)](#5-api-gateway-design-nodejs--express)
6. [GitHub Actions CI/CD](#6-github-actions-cicd)

---

## 1. Backend Architecture for Free-Tier Deployment

### Recommended Architecture (Zero-Cost Stack)

```
┌─────────────────────────────────────────────────────────┐
│                    FREE TIER STACK                       │
├──────────────┬──────────────┬───────────────────────────┤
│   DATABASE   │   BACKEND    │      DATA PIPELINE        │
│              │              │                           │
│  Supabase    │   Railway    │  GitHub Actions           │
│  (PostgreSQL │  (Node.js    │  (Scheduled scrapers      │
│  + PostGIS)  │  + Express)  │   + Celery workers)       │
│              │              │                           │
├──────────────┼──────────────┼───────────────────────────┤
│   CACHE      │   SEARCH     │      MONITORING           │
│              │              │                           │
│  Upstash     │  Meilisearch │  UptimeRobot              │
│  Redis       │  (Railway)   │  (Free tier)              │
│  (free)      │              │                           │
└──────────────┴──────────────┴───────────────────────────┘
```

### 1.1 Supabase ⭐ PRIMARY DATABASE

| Feature | Free Tier Limits |
|---------|-----------------|
| **Database** | 500 MB storage |
| **PostGIS** | ✅ Fully supported (extension pre-installed) |
| **Auth** | 50,000 monthly active users |
| **Storage** | 1 GB file storage |
| **API Requests** | Unlimited (auto-generated REST + GraphQL) |
| **Egress** | 5 GB |
| **Compute** | Shared CPU, 500 MB RAM |
| **Projects** | 2 free projects |

**Connection String:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
```

**Enable PostGIS:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

**Best Use Case:** Primary database for Arjun. PostGIS works out of the box. Auto-generated REST API via PostgREST can supplement the Express gateway for quick prototyping.

**Limitation:** 500 MB is tight for India-wide data. Mitigation: store only structured data + metadata; reference external imagery. Needs careful indexing and data pruning.

**Upgrade Path:** Pro plan at $25/month gives 8 GB database + dedicated CPU.

---

### 1.2 Neon ⭐ BACKUP/BRANCH DATABASE

| Feature | Free Tier Limits |
|---------|-----------------|
| **Database** | 0.5 GB per project |
| **Projects** | 100 |
| **PostGIS** | ✅ Supported (extension available) |
| **Compute** | 100 CU-hours per project |
| **Autoscaling** | Up to 2 CU (8 GB RAM) |
| **Scale to Zero** | After 5 min inactivity |
| **Branches** | 10 per project |
| **Egress** | 5 GB |
| **Auth (MAU)** | Up to 60,000 |

**Connection String:**
```
postgresql://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
```

**Best Use Case:** Development/staging database. Neon's branching feature is killer for testing data pipeline changes — create a branch, run migration, test, delete. Use for scraper development without touching production.

**Why Secondary:** No built-in auth, storage, or auto-generated APIs like Supabase. But raw Postgres is faster for pure data workloads.

---

### 1.3 Railway ⭐ PRIMARY BACKEND HOSTING

| Feature | Free Tier Limits |
|---------|-----------------|
| **Trial Credits** | $5 one-time trial credits |
| **After Credits** | Pay-as-you-go (very cheap for low traffic) |
| **Deployments** | Unlimited |
| **RAM** | Up to 8 GB |
| **Build Minutes** | Included |
| **PostgreSQL** | Available as add-on (5 GB free) |
| **Redis** | Available as add-on |

**Deployment Config (`railway.toml`):**
```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Best Use Case:** Host the Express API gateway + Meilisearch. Railway auto-detects Node.js and deploys from GitHub. Better than Fly.io for Node.js apps because zero config needed.

**Cost Reality:** $5 trial runs out in ~2-4 weeks of moderate usage. After that, ~$3-5/month for a lightweight API. Budget accordingly.

---

### 1.4 Fly.io ⭐ DOCKER-BASED DEPLOYMENT

| Feature | Free Tier Limits |
|---------|-----------------|
| **Machines** | 3 shared-cpu-1x (256 MB RAM) free |
| **Stopped Machines** | Charges only for rootfs storage |
| **Networking** | Free Anycast, private networking |
| **Persistent Storage** | 3 GB free (volumes) |
| **PostgreSQL** | Fly Postgres available (not free) |

**Fly Machine Cost (shared-cpu-1x, 256 MB):** ~$1.94/month if always running. Free allowance covers this.

**Dockerfile for Express API:**
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
```

**`fly.toml`:**
```toml
app = "arjun-api"
primary_region = "sin"  # Singapore (closest to India)

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[services.ports]]
  handlers = ["http"]
  port = 80

[[services.ports]]
  handlers = ["tls", "http"]
  port = 443
```

**Best Use Case:** Docker-based workers (scrapers, OCR pipelines). Spin up machines on schedule, process, stop. Pay only for running time. Region `sin` (Singapore) has lowest latency to India.

**Advantage over Railway:** Scale-to-zero truly means zero cost when idle. Better for burst workloads like nightly scrapers.

---

### 1.5 Vercel Serverless Functions

| Feature | Free Tier Limits |
|---------|-----------------|
| **Serverless Exec Time** | 100 GB-hours/month |
| **Function Duration** | 10s (Hobby), 60s (Pro) |
| **Bandwidth** | 100 GB/month |
| **Deployments** | Unlimited |
| **Cron Jobs** | Not available on free tier |

**Example Serverless Function (`api/districts.js`):**
```javascript
export default async function handler(req, res) {
  const { lat, lng, radius = 50 } = req.query;

  // Query PostGIS via Supabase client
  const { data, error } = await supabase
    .rpc('districts_within_radius', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_km: parseInt(radius)
    });

  if (error) return res.status(500).json({ error: error.message });

  res.setHeader('Cache-Control', 's-maxage=3600'); // CDN cache 1hr
  return res.json(data);
}
```

**Best Use Case:** Lightweight API endpoints that proxy to Supabase. Not suitable for the main API gateway (10s timeout kills complex spatial queries). Use for:
- Health checks
- Simple data fetches
- Webhook receivers
- GeoJSON tile serving

**Limitation:** 10-second execution limit on free tier. PostGIS queries can easily exceed this. Not recommended as primary backend.

---

### 1.6 PlanetScale ❌ SKIP

| Feature | Status |
|---------|--------|
| **Free Tier** | Discontinued (Hobby plan starts at $39/month) |
| **PostGIS** | ❌ MySQL — no PostGIS support |
| **Spatial** | Basic spatial functions only |

**Verdict:** Not viable. No free tier + no PostGIS = not for Arjun.

---

### 1.7 Recommended Free-Tier Stack

| Component | Service | Why |
|-----------|---------|-----|
| **Primary DB** | Supabase | PostGIS + Auth + Storage + REST API |
| **Dev/Staging DB** | Neon | Branching for safe migrations |
| **API Gateway** | Railway | Easy Node.js deploy, good DX |
| **Worker/Scheduler** | Fly.io | Scale-to-zero for scrapers |
| **Redis Cache** | Upstash | Free tier: 10K commands/day, 256 MB |
| **CDN/Proxy** | Cloudflare | Free DNS + CDN + DDoS protection |
| **Search** | Meilisearch (Railway) | Full-text search for news/schemes |

---

## 2. Data Ingestion Pipeline Design

### 2.1 Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────┐
│  DATA SOURCES│───▶│  SCHEDULER   │───▶│  PROCESSORS   │───▶│ DATABASE │
│              │    │              │    │               │    │          │
│ data.gov.in  │    │ GitHub Actions│    │ Python/Celery │    │ Supabase │
│ MGNREGA MIS  │    │ (cron jobs)  │    │ + OCR pipeline│    │ (PostGIS)│
│ eCourts      │    │              │    │               │    │          │
│ IMD Weather  │    │ Bull Queue   │    │ Node.js workers│   │ Redis    │
│ NASA FIRMS   │    │ (Redis)      │    │ (Bull tasks)  │    │ (cache)  │
│ GDELT        │    │              │    │               │    │          │
└─────────────┘    └──────────────┘    └───────────────┘    └──────────┘
```

### 2.2 Python + Celery for Scheduled Scrapers

**Why Python for Scraping:** Rich ecosystem (Scrapy, BeautifulSoup, Selenium), better PDF/OCR tools, pandas for data transformation.

**`requirements.txt`:**
```
celery[redis]==5.3.6
redis==5.0.1
scrapy==2.11.0
beautifulsoup4==4.12.2
requests==2.31.0
pandas==2.1.4
psycopg2-binary==2.9.9
pdfplumber==0.10.3
pytesseract==0.3.10
Pillow==10.1.0
schedule==1.2.1
```

**Celery Configuration (`celery_config.py`):**
```python
from celery import Celery
from celery.schedules import crontab

app = Celery('arjun-scrapers',
             broker='redis://default:[password]@[upstash-host]:6380',
             backend='redis://default:[password]@[upstash-host]:6380')

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',
    enable_utc=True,
    
    # Beat schedule — periodic tasks
    beat_schedule={
        'scrape-weather-imd': {
            'task': 'scrapers.weather.scrape_imd',
            'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours
        },
        'scrape-fire-hotspots': {
            'task': 'scrapers.nasa.scrape_firms',
            'schedule': crontab(minute=30, hour='*/3'),  # Every 3 hours
        },
        'scrape-news-gdelt': {
            'task': 'scrapers.news.scrape_gdelt',
            'schedule': crontab(minute='*/15'),  # Every 15 minutes
        },
        'scrape-flights-opensky': {
            'task': 'scrapers.flights.scrape_opensky',
            'schedule': crontab(minute='*/5'),  # Every 5 minutes
        },
        'scrape-budget-data': {
            'task': 'scrapers.budget.scrape_openbudgets',
            'schedule': crontab(minute=0, hour=2, day_of_week='mon'),  # Weekly Monday 2AM
        },
        'scrape-mgnrega': {
            'task': 'scrapers.schemes.scrape_mgnrega',
            'schedule': crontab(minute=0, hour=3),  # Daily 3 AM
        },
    }
)
```

### 2.3 Data Source Scrapers

#### 2.3.1 data.gov.in (India Open Government Data)

**API Base URL:** `https://data.gov.in/backend/dmservice/`
**Auth:** API key required (free registration at data.gov.in)

```python
# scrapers/govt_data.py
import requests
import pandas as pd
from celery_config import app

DATA_GOV_IN_API_KEY = os.environ.get('DATA_GOV_IN_API_KEY')

@app.task(name='scrapers.govt_data.fetch_resource')
def fetch_resource(resource_id, format='json', limit=1000, offset=0):
    """
    Fetch data from data.gov.in API.
    
    Example resource IDs:
    - Village/Town directory: 70ac2966-8181-4324-a98a-f72b01e49954
    - Census demographics: varies by dataset
    - Budget data: check catalog
    
    API Docs: https://data.gov.in/apis
    """
    url = f"https://data.gov.in/backend/dmservice/resource/{resource_id}"
    params = {
        'api-key': DATA_GOV_IN_API_KEY,
        'format': format,
        'limit': limit,
        'offset': offset,
    }
    
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()
    
    records = data.get('records', [])
    df = pd.DataFrame(records)
    return df.to_dict('records')
```

**Known data.gov.in Resource IDs (verify these — they change periodically):**

| Dataset | Resource ID | Description |
|---------|------------|-------------|
| Village Directory (Census 2011) | Search catalog | Population, literacy, amenities |
| District-wise Budget | Search catalog | State budget allocations |
| MGNREGA Performance | Search catalog | Employment guarantee data |

> ⚠️ **data.gov.in is notoriously unreliable.** The API often returns 500s, changes resource IDs without notice, and has inconsistent schemas. Build robust error handling with retries and fallback to cached data.

#### 2.3.2 MGNREGA MIS (Management Information System)

**URL:** `https://nrega.nic.in/MGNREGA_new/Nrega_home.aspx`
**Challenge:** Heavy ASP.NET site, session-based, no official API.

```python
# scrapers/schemes/mgnrega.py
import requests
from bs4 import BeautifulSoup
from celery_config import app

@app.task(name='scrapers.schemes.scrape_mgnrega')
def scrape_mgnrega():
    """
    Scrape MGNREGA MIS for district-wise employment data.
    
    Strategy:
    1. Hit the State-wise reports page
    2. Parse HTML tables (not ideal but no API exists)
    3. Extract district-level employment data
    
    NOTE: This site uses ASP.NET viewstate — need to handle form submissions.
    Consider using Selenium/Playwright for JavaScript-heavy pages.
    """
    session = requests.Session()
    
    # Step 1: Get the state reports page
    url = "https://nrega.nic.in/MGNREGA_new/Nrega_home.aspx"
    resp = session.get(url, timeout=30)
    
    # Step 2: Parse state list and iterate
    soup = BeautifulSoup(resp.text, 'html.parser')
    # ... parse tables, extract data
    
    # Step 3: Store in database
    return {"status": "success", "records": len(data)}
```

> ⚠️ **MGNREGA MIS is extremely fragile.** The site frequently goes down, changes HTML structure, and blocks automated access. Consider:
> - Using Wayback Machine as fallback
> - Manual CSV downloads from the site
> - Third-party data aggregators that already normalize this data

#### 2.3.3 eCourts (Indian Judiciary Data)

**URL:** `https://ecourts.gov.in/ecourts_home/`
**API:** No official API. Public judgments available via search.

```python
# scrapers/courts/ecourts.py
import requests
from celery_config import app

@app.task(name='scrapers.courts.scrape_ecourts')
def scrape_ecourts_district(district_code, state_code):
    """
    Scrape eCourts for case status data.
    
    Known endpoints (unofficial, may change):
    - Case search: /ecourts_main/case_status_search.php
    - Orders: /ecourts_main/case_orders.php
    
    Strategy: Query by district → extract pending/resolved counts
    """
    # eCourts has CAPTCHAs and rate limits
    # Best approach: use courtlistener.com or IndiaKanoon APIs as proxies
    pass
```

> **Better Alternative:** Use [IndiaKanoon](https://indiankanoon.org) or [CourtListener](https://courtlistener.com) APIs for court data instead of scraping eCourts directly.

#### 2.3.4 NASA FIRMS (Fire Hotspots)

**API:** `https://firms.modaps.eosdis.nasa.gov/api/area/`
**Auth:** Free API key from NASA LAADS

```python
# scrapers/nasa/firms.py
import requests
from celery_config import app

NASA_FIRMS_KEY = os.environ.get('NASA_FIRMS_KEY')

@app.task(name='scrapers.nasa.scrape_firms')
def scrape_firms():
    """
    Fetch active fire hotspots over India from NASA FIRMS.
    India bounding box: 6.5°N to 35.5°N, 68°E to 97.5°E
    """
    url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/VIIRS_SNPP_NRT/68,6.5,97.5,35.5/1"
    # VIIRS provides better resolution than MODIS
    # '1' = last 24 hours
    
    resp = requests.get(url.format(key=NASA_FIRMS_KEY), timeout=30)
    resp.raise_for_status()
    
    # Parse CSV → PostGIS POINT geometry
    # INSERT INTO fire_hotspots (latitude, longitude, brightness, acq_date, geom)
    # VALUES (%s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326))
    
    return {"hotspots": resp.text.count('\n') - 1}  # rough count
```

---

### 2.4 Bull (Node.js + Redis) for Job Scheduling

**Use Bull for:** API-triggered jobs, real-time data updates, event-driven tasks.
**Use Celery for:** Scheduled heavy scrapers, batch processing.

```javascript
// src/queue/bull-setup.js
const Queue = require('bull');

const REDIS_URL = process.env.REDIS_URL; // Upstash Redis URL

// Define queues
const queues = {
  geojsonGenerator: new Queue('geojson-generator', REDIS_URL),
  cacheWarmer: new Queue('cache-warmer', REDIS_URL),
  newsIngestion: new Queue('news-ingestion', REDIS_URL),
  alertEngine: new Queue('alert-engine', REDIS_URL),
};

// GeoJSON tile generation
queues.geojsonGenerator.process(async (job) => {
  const { layer, bounds, zoom } = job.data;
  // Generate GeoJSON from PostGIS query
  // Cache result in Redis with TTL
  const geojson = await generateGeoJSON(layer, bounds, zoom);
  await redis.setex(`geojson:${layer}:${zoom}:${bounds.hash}`, 3600, JSON.stringify(geojson));
  return geojson;
});

// Cron-like repeatable jobs
queues.cacheWarmer.add({}, {
  repeat: { cron: '0 */6 * * *' }, // Every 6 hours
});

// Event-driven: new fire hotspot detected → trigger alert
queues.alertEngine.process(async (job) => {
  const { hotspot } = job.data;
  const affectedDistricts = await findAffectedDistricts(hotspot);
  // Send notifications
});
```

---

### 2.5 PDF Processing Pipeline (OCR)

**Problem:** Indian government reports (budgets, scheme evaluations) are published as PDFs — often scanned images, not text.

**Pipeline:**

```
PDF Download → pdfplumber (text extraction) → if fails → Tesseract OCR → 
pandas normalization → PostgreSQL INSERT
```

```python
# scrapers/pdf_processor.py
import pdfplumber
import pytesseract
from PIL import Image
import io
import pandas as pd

def process_pdf(pdf_path):
    """
    Extract tabular data from government PDFs.
    Try text extraction first, fall back to OCR.
    """
    results = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Try native text extraction first
            tables = page.extract_tables()
            
            if tables and len(tables[0]) > 1:
                # Text-based PDF — tables extracted directly
                for table in tables:
                    df = pd.DataFrame(table[1:], columns=table[0])
                    results.append(df)
            else:
                # Scanned PDF — need OCR
                img = page.to_image(resolution=300)
                text = pytesseract.image_to_string(img.original, lang='eng')
                
                # Parse OCR text into structured data
                # This is the hard part — government PDFs have inconsistent formats
                parsed = parse_ocr_text(text)
                results.append(parsed)
    
    return pd.concat(results, ignore_index=True) if results else pd.DataFrame()

def parse_ocr_text(text):
    """
    Parse OCR output from government PDFs.
    This needs custom logic per document type.
    Common patterns:
    - Budget tables: State → District → Scheme → Allocation
    - Census: District → Population → Literacy rate → etc.
    """
    # Use regex patterns, heuristics, or LLM-assisted extraction
    pass
```

**OCR Pipeline Options Compared:**

| Tool | Quality | Speed | Cost | Best For |
|------|---------|-------|------|----------|
| **Tesseract** | Good | Fast | Free | Simple documents, typed text |
| **EasyOCR** | Better | Medium | Free | Multi-language (Hindi support) |
| **PaddleOCR** | Best | Medium | Free | Complex tables, handwriting |
| **AWS Textract** | Excellent | Fast | $$ | Production-grade (not free) |
| **Google Document AI** | Excellent | Fast | $$ | Production-grade (not free) |

**Recommendation:** Start with Tesseract + EasyOCR for Hindi documents. Upgrade to cloud OCR only if quality is insufficient.

---

## 3. PostgreSQL + PostGIS Schema Design

### 3.1 Core Tables

```sql
-- ============================================================
-- PROJECT ARJUN — DATABASE SCHEMA
-- PostgreSQL 15 + PostGIS 3.3
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search

-- ============================================================
-- GEOGRAPHIC ENTITIES
-- ============================================================

CREATE TABLE states (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(5) UNIQUE NOT NULL,        -- Census state code (e.g., '27' for Maharashtra)
    name            VARCHAR(100) NOT NULL,
    name_hindi      VARCHAR(200),
    abbreviation    VARCHAR(10),
    geom            GEOMETRY(MultiPolygon, 4326),      -- State boundary
    area_sq_km      DECIMAL(12, 2),
    population      BIGINT,                            -- Census 2011
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE districts (
    id              SERIAL PRIMARY KEY,
    state_id        INTEGER REFERENCES states(id) ON DELETE CASCADE,
    code            VARCHAR(10) UNIQUE NOT NULL,       -- Census district code
    name            VARCHAR(100) NOT NULL,
    name_hindi      VARCHAR(200),
    geom            GEOMETRY(MultiPolygon, 4326),      -- District boundary
    centroid        GEOMETRY(Point, 4326),              -- Computed centroid
    area_sq_km      DECIMAL(12, 2),
    population      BIGINT,
    literacy_rate   DECIMAL(5, 2),
    sex_ratio       INTEGER,                           -- Females per 1000 males
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE villages (
    id              SERIAL PRIMARY KEY,
    district_id     INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    code            VARCHAR(15) UNIQUE NOT NULL,       -- Census village code
    name            VARCHAR(200) NOT NULL,
    name_hindi      VARCHAR(300),
    geom            GEOMETRY(Point, 4326),              -- Village centroid
    population      INTEGER,
    total_households INTEGER,
    has_electricity BOOLEAN DEFAULT FALSE,
    has_drinking_water BOOLEAN DEFAULT FALSE,
    primary_school_distance_km DECIMAL(5, 2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOVERNMENT SCHEMES
-- ============================================================

CREATE TABLE schemes (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,       -- e.g., 'PM_KISAN', 'MGNREGA', 'JAL_JEEVAN'
    name            VARCHAR(300) NOT NULL,
    ministry        VARCHAR(200),
    launch_date     DATE,
    description     TEXT,
    target_beneficiaries TEXT,
    url             TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scheme_implementations (
    id              SERIAL PRIMARY KEY,
    scheme_id       INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    district_id     INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    financial_year  VARCHAR(10),                       -- e.g., '2023-24'
    allocated       DECIMAL(15, 2),                    -- Budget allocated (₹)
    spent           DECIMAL(15, 2),                    -- Actual expenditure (₹)
    beneficiaries   INTEGER,                           -- Number of beneficiaries
    target          INTEGER,                           -- Scheme target
    achieved        INTEGER,                           -- Actual achievement
    status          VARCHAR(50),                       -- 'on_track', 'delayed', 'completed', 'stalled'
    last_updated    TIMESTAMPTZ,
    source_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUDGET & FINANCE
-- ============================================================

CREATE TABLE budgets (
    id              SERIAL PRIMARY KEY,
    district_id     INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    financial_year  VARCHAR(10) NOT NULL,              -- '2023-24'
    category        VARCHAR(100),                      -- 'education', 'health', 'infrastructure', 'welfare'
    subcategory     VARCHAR(100),
    allocated       DECIMAL(15, 2),
    spent           DECIMAL(15, 2),
    utilization_pct DECIMAL(5, 2),                     -- (spent/allocated) * 100
    source          VARCHAR(100),                      -- 'OpenBudgetsIndia', 'data.gov.in', etc.
    source_url      TEXT,
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NEWS & EVENTS
-- ============================================================

CREATE TABLE news_events (
    id              SERIAL PRIMARY KEY,
    external_id     VARCHAR(100) UNIQUE,               -- GDELT global event ID or article URL hash
    source          VARCHAR(50) NOT NULL,              -- 'gdelt', 'rss_ndtv', 'rss_toi', etc.
    title           TEXT NOT NULL,
    description     TEXT,
    url             TEXT,
    published_at    TIMESTAMPTZ,
    event_date      DATE,
    location_name   VARCHAR(200),
    geom            GEOMETRY(Point, 4326),              -- Event location
    district_id     INTEGER REFERENCES districts(id),  -- Resolved district
    sentiment       DECIMAL(3, 2),                     -- -1.0 (negative) to +1.0 (positive)
    category        VARCHAR(50),                       -- 'politics', 'disaster', 'development', 'crime', etc.
    keywords        TEXT[],
    relevance_score DECIMAL(3, 2),                     -- 0.0 to 1.0
    verified        BOOLEAN DEFAULT FALSE,
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WEATHER
-- ============================================================

CREATE TABLE weather_stations (
    id              SERIAL PRIMARY KEY,
    station_id      VARCHAR(20) UNIQUE NOT NULL,       -- IMD station code
    name            VARCHAR(200),
    geom            GEOMETRY(Point, 4326),
    district_id     INTEGER REFERENCES districts(id),
    elevation_m     DECIMAL(7, 2)
);

CREATE TABLE weather_readings (
    id              BIGSERIAL PRIMARY KEY,
    station_id      INTEGER REFERENCES weather_stations(id),
    recorded_at     TIMESTAMPTZ NOT NULL,
    temperature_c   DECIMAL(4, 1),
    humidity_pct    DECIMAL(5, 2),
    rainfall_mm     DECIMAL(6, 2),
    wind_speed_kmh  DECIMAL(5, 2),
    wind_direction  VARCHAR(10),
    pressure_hpa    DECIMAL(7, 2),
    weather_desc    VARCHAR(100),
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance
-- CREATE INDEX idx_weather_recorded ON weather_readings USING BRIN(recorded_at);

-- ============================================================
-- FIRE HOTSPOTS (NASA FIRMS)
-- ============================================================

CREATE TABLE fire_hotspots (
    id              BIGSERIAL PRIMARY KEY,
    latitude        DECIMAL(8, 5) NOT NULL,
    longitude       DECIMAL(8, 5) NOT NULL,
    geom            GEOMETRY(Point, 4326) NOT NULL,
    brightness      DECIMAL(6, 2),
    frp             DECIMAL(8, 2),                     -- Fire Radiative Power (MW)
    confidence      VARCHAR(10),                       -- 'low', 'nominal', 'high'
    satellite       VARCHAR(20),                       -- 'VIIRS_SNPP', 'VIIRS_NOAA', 'MODIS'
    acq_date        DATE NOT NULL,
    acq_time        TIME,
    daynight        CHAR(1),                           -- 'D' or 'N'
    district_id     INTEGER REFERENCES districts(id),
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FLIGHTS (OpenSky Network)
-- ============================================================

CREATE TABLE flights (
    id              BIGSERIAL PRIMARY KEY,
    icao24          VARCHAR(10) NOT NULL,              -- Aircraft hex code
    callsign        VARCHAR(20),
    origin_country  VARCHAR(100),
    time_position   TIMESTAMPTZ,
    last_contact    TIMESTAMPTZ,
    longitude       DECIMAL(8, 5),
    latitude        DECIMAL(8, 5),
    baro_altitude   DECIMAL(8, 2),                    -- meters
    on_ground       BOOLEAN,
    velocity        DECIMAL(7, 2),                     -- m/s
    true_track      DECIMAL(5, 2),                     -- degrees
    vertical_rate   DECIMAL(6, 2),                     -- m/s
    geom            GEOMETRY(PointZ, 4326),            -- 3D position
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WATER QUALITY
-- ============================================================

CREATE TABLE water_quality (
    id              SERIAL PRIMARY KEY,
    source_name     VARCHAR(200),
    source_type     VARCHAR(50),                       -- 'river', 'lake', 'groundwater', 'reservoir'
    geom            GEOMETRY(Point, 4326),
    district_id     INTEGER REFERENCES districts(id),
    state_id        INTEGER REFERENCES states(id),
    recorded_date   DATE,
    ph              DECIMAL(4, 2),
    dissolved_oxygen DECIMAL(5, 2),                    -- mg/L
    bod             DECIMAL(5, 2),                     -- Biochemical Oxygen Demand
    fecal_coliform  BIGGER,                            -- MPN/100mL
    nitrate         DECIMAL(6, 2),                     -- mg/L
    fluoride        DECIMAL(4, 2),                     -- mg/L
    total_coliform  BIGINT,                            -- MPN/100mL
    quality_grade   VARCHAR(20),                       -- 'A', 'B', 'C', 'D' (CPCB grading)
    source          VARCHAR(100),
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AIR QUALITY
-- ============================================================

CREATE TABLE air_quality_stations (
    id              SERIAL PRIMARY KEY,
    station_name    VARCHAR(200),
    city            VARCHAR(100),
    state           VARCHAR(100),
    geom            GEOMETRY(Point, 4326),
    station_type    VARCHAR(50)                        -- 'manual', 'cems', 'ambient'
);

CREATE TABLE air_quality_readings (
    id              BIGSERIAL PRIMARY KEY,
    station_id      INTEGER REFERENCES air_quality_stations(id),
    recorded_at     TIMESTAMPTZ NOT NULL,
    pm25            DECIMAL(7, 2),                     -- µg/m³
    pm10            DECIMAL(7, 2),
    no2             DECIMAL(7, 2),
    so2             DECIMAL(7, 2),
    co              DECIMAL(7, 2),
    o3              DECIMAL(7, 2),
    nh3             DECIMAL(7, 2),
    aqi             INTEGER,                           -- Air Quality Index
    aqi_category    VARCHAR(50),                       -- 'Good', 'Satisfactory', 'Moderate', etc.
    fetched_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CENSUS DEMOGRAPHICS (denormalized for fast queries)
-- ============================================================

CREATE TABLE census_data (
    id              SERIAL PRIMARY KEY,
    district_id     INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    census_year     INTEGER DEFAULT 2011,
    total_population BIGINT,
    male_population  BIGINT,
    female_population BIGINT,
    child_population_0_6 BIGINT,
    literacy_rate   DECIMAL(5, 2),
    male_literacy   DECIMAL(5, 2),
    female_literacy DECIMAL(5, 2),
    sex_ratio       INTEGER,                           -- females per 1000 males
    child_sex_ratio INTEGER,
    sc_population   BIGINT,
    st_population   BIGINT,
    urban_pct       DECIMAL(5, 2),
    workers_total   BIGINT,
    workers_main   BIGINT,
    workers_marginal BIGINT,
    source          VARCHAR(50) DEFAULT 'census_2011'
);
```

### 3.2 Spatial Indexes (Critical for Performance)

```sql
-- ============================================================
-- SPATIAL INDEXES (GiST — best for geometry queries)
-- ============================================================

CREATE INDEX idx_states_geom ON states USING GIST(geom);
CREATE INDEX idx_districts_geom ON districts USING GIST(geom);
CREATE INDEX idx_districts_centroid ON districts USING GIST(centroid);
CREATE INDEX idx_villages_geom ON villages USING GIST(geom);
CREATE INDEX idx_fire_hotspots_geom ON fire_hotspots USING GIST(geom);
CREATE INDEX idx_flights_geom ON flights USING GIST(geom);
CREATE INDEX idx_news_events_geom ON news_events USING GIST(geom);
CREATE INDEX idx_water_quality_geom ON water_quality USING GIST(geom);
CREATE INDEX idx_air_quality_stations_geom ON air_quality_stations USING GIST(geom);

-- ============================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================

-- Fire hotspots by date (most queries are time-bounded)
CREATE INDEX idx_fire_hotspots_date_geom ON fire_hotspots (acq_date, geom);
CREATE INDEX idx_fire_hotspots_district ON fire_hotspots (district_id, acq_date);

-- Weather by station + time
CREATE INDEX idx_weather_station_time ON weather_readings (station_id, recorded_at DESC);

-- Air quality by station + time
CREATE INDEX idx_air_quality_station_time ON air_quality_readings (station_id, recorded_at DESC);

-- Scheme implementations by district + year
CREATE INDEX idx_scheme_impl_district_year ON scheme_implementations (district_id, financial_year);

-- Budget by district + year + category
CREATE INDEX idx_budget_district_year_cat ON budgets (district_id, financial_year, category);

-- News by date + category
CREATE INDEX idx_news_date_cat ON news_events (published_at DESC, category);

-- Text search on news titles (trigram index for fuzzy search)
CREATE INDEX idx_news_title_trgm ON news_events USING GIN(title gin_trgm_ops);

-- BRIN index for time-series data (much smaller than B-tree)
CREATE INDEX idx_weather_recorded_brin ON weather_readings USING BRIN(recorded_at);
CREATE INDEX idx_flights_time_brin ON flights USING BRIN(fetched_at);
CREATE INDEX idx_fire_date_brin ON fire_hotspots USING BRIN(acq_date);
```

### 3.3 Example Spatial Queries

```sql
-- ============================================================
-- QUERY 1: Find all districts within 50km of a fire hotspot
-- ============================================================
SELECT DISTINCT d.id, d.name, d.code, s.name AS state_name,
       ST_Distance(
           d.centroid::geography,
           ST_SetSRID(ST_MakePoint(78.9629, 20.5937), 4326)::geography
       ) / 1000 AS distance_km
FROM districts d
JOIN states s ON d.state_id = s.id
WHERE ST_DWithin(
    d.centroid::geography,
    ST_SetSRID(ST_MakePoint(78.9629, 20.5937), 4326)::geography,
    50000  -- 50km in meters
)
ORDER BY distance_km;

-- ============================================================
-- QUERY 2: Fire hotspots in a specific district (last 30 days)
-- ============================================================
SELECT f.id, f.latitude, f.longitude, f.brightness, f.confidence,
       f.acq_date, f.satellite, d.name AS district_name
FROM fire_hotspots f
JOIN districts d ON f.district_id = d.id
WHERE d.code = '2704'  -- Nagpur
  AND f.acq_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY f.acq_date DESC;

-- ============================================================
-- QUERY 3: Scheme budget utilization by district
-- (Find underperforming districts)
-- ============================================================
SELECT d.name AS district, s.name AS scheme,
       si.allocated, si.spent,
       ROUND(si.spent / NULLIF(si.allocated, 0) * 100, 2) AS utilization_pct,
       si.beneficiaries, si.target,
       ROUND(si.achieved / NULLIF(si.target, 0) * 100, 2) AS achievement_pct
FROM scheme_implementations si
JOIN districts d ON si.district_id = d.id
JOIN schemes s ON si.scheme_id = s.id
WHERE si.financial_year = '2023-24'
  AND si.allocated > 0
ORDER BY utilization_pct ASC
LIMIT 20;

-- ============================================================
-- QUERY 4: Correlate air quality with districts
-- (Find most polluted districts)
-- ============================================================
SELECT d.name, d.code, s.name AS state,
       AVG(aq.aqi) AS avg_aqi,
       MAX(aq.pm25) AS max_pm25,
       COUNT(aq.id) AS reading_count
FROM air_quality_readings aq
JOIN air_quality_stations aqs ON aq.station_id = aqs.id
JOIN districts d ON ST_Contains(d.geom, aqs.geom)
JOIN states s ON d.state_id = s.id
WHERE aq.recorded_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY d.id, d.name, d.code, s.name
HAVING COUNT(aq.id) >= 10
ORDER BY avg_aqi DESC
LIMIT 20;

-- ============================================================
-- QUERY 5: News events near a fire hotspot (verification)
-- ============================================================
SELECT n.title, n.url, n.published_at, n.sentiment, n.category,
       ST_Distance(
           n.geom::geography,
           fh.geom::geography
       ) / 1000 AS distance_km
FROM news_events n
CROSS JOIN fire_hotspots fh
WHERE fh.id = 12345  -- specific hotspot
  AND ST_DWithin(n.geom::geography, fh.geom::geography, 100000)  -- 100km radius
  AND n.published_at >= fh.acq_date - INTERVAL '3 days'
  AND n.published_at <= fh.acq_date + INTERVAL '3 days'
ORDER BY distance_km, n.published_at DESC;

-- ============================================================
-- QUERY 6: Generate GeoJSON for map layer
-- ============================================================
SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', jsonb_agg(
        jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(f.geom)::jsonb,
            'properties', jsonb_build_object(
                'id', f.id,
                'brightness', f.brightness,
                'confidence', f.confidence,
                'date', f.acq_date,
                'satellite', f.satellite,
                'district', d.name
            )
        )
    )
) AS geojson
FROM fire_hotspots f
LEFT JOIN districts d ON f.district_id = d.id
WHERE f.acq_date = CURRENT_DATE;
```

---

## 4. Redis Caching Strategy

### 4.1 Recommended: Upstash Redis (Serverless)

| Feature | Free Tier |
|---------|-----------|
| **Commands** | 10,000/day |
| **Storage** | 256 MB |
| **Connections** | 1,000 concurrent |
| **Regions** | Global (edge) |
| **Protocol** | Redis-compatible |

**Connection String:**
```
rediss://default:[password]@[endpoint].upstash.io:6380
```

### 4.2 Cache Key Architecture

```
Prefix Pattern: arjun:{layer}:{scope}:{params}:{hash}

Examples:
  arjun:weather:district:2704:latest     → Latest weather for Nagpur
  arjun:fire:india:2024-01-15:daily      → Fire hotspots for Jan 15
  arjun:geojson:districts:zoom:5:tile:32 → GeoJSON tile
  arjun:scheme:MGNREGA:27:2023-24       → MGNREGA data for Maharashtra, FY23-24
  arjun:api:search:query:hash           → Cached API search results
```

### 4.3 TTL Strategy

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| **Weather (current)** | 1 hour | IMD updates every 3-6 hours |
| **Weather (forecast)** | 6 hours | Forecast models update twice daily |
| **News/GDELT** | 15 minutes | Near-real-time event feed |
| **Fire hotspots** | 3 hours | FIRMS updates every 3 hours |
| **Flight positions** | 5 minutes | OpenSky updates every ~5 seconds but we sample |
| **Air quality** | 1 hour | CPCB updates hourly |
| **Water quality** | 24 hours | Changes slowly |
| **Census data** | 24 hours (tagged) | Static, invalidate on update |
| **Scheme data** | 12 hours | Updated daily by scrapers |
| **Budget data** | 24 hours | Updated weekly |
| **GeoJSON tiles** | 1 hour | Derived from above data |
| **API search results** | 30 minutes | Moderate freshness needs |
| **Static config** | 7 days | State/district lists rarely change |
| **Full-page responses** | 5 minutes | API gateway level cache |

### 4.4 Cache Implementation

```javascript
// src/cache/redis.js
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
  tls: {}, // Required for Upstash
});

// TTL constants (seconds)
const TTL = {
  WEATHER_CURRENT: 3600,          // 1 hour
  WEATHER_FORECAST: 21600,        // 6 hours
  NEWS: 900,                      // 15 minutes
  FIRE_HOTSPOTS: 10800,           // 3 hours
  FLIGHTS: 300,                   // 5 minutes
  AIR_QUALITY: 3600,              // 1 hour
  WATER_QUALITY: 86400,           // 24 hours
  CENSUS: 86400,                  // 24 hours
  SCHEME: 43200,                  // 12 hours
  BUDGET: 86400,                  // 24 hours
  GEOJSON: 3600,                  // 1 hour
  SEARCH: 1800,                   // 30 minutes
  STATIC: 604800,                 // 7 days
};

// Generic cache wrapper
async function cached(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Cache with stale-while-revalidate pattern
async function cachedSWR(key, ttl, fetchFn) {
  const cached = await redis.get(key);
  const meta = await redis.get(`${key}:meta`);

  if (cached) {
    const { staleAt } = JSON.parse(meta || '{}');
    // Return cached data immediately
    // If stale, trigger background refresh
    if (staleAt && Date.now() > staleAt) {
      // Fire and forget — don't await
      fetchFn().then(data => {
        redis.setex(key, ttl, JSON.stringify(data));
        redis.setex(`${key}:meta`, ttl, JSON.stringify({
          staleAt: Date.now() + (ttl * 1000 * 0.8), // Stale at 80% of TTL
        }));
      }).catch(console.error);
    }
    return JSON.parse(cached);
  }

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  await redis.setex(`${key}:meta`, ttl, JSON.stringify({
    staleAt: Date.now() + (ttl * 1000 * 0.8),
  }));
  return data;
}

// Pattern-based invalidation
async function invalidatePattern(pattern) {
  const keys = await redis.keys(`arjun:${pattern}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Tag-based invalidation (using sets)
async function cacheWithTags(key, ttl, tags, fetchFn) {
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));

  // Add key to each tag set
  for (const tag of tags) {
    await redis.sadd(`tag:${tag}`, key);
    await redis.expire(`tag:${tag}`, ttl + 60); // Slightly longer TTL for tag set
  }
  return data;
}

async function invalidateTag(tag) {
  const keys = await redis.smembers(`tag:${tag}`);
  if (keys.length > 0) {
    await redis.del(...keys);
    await redis.del(`tag:${tag}`);
  }
}

module.exports = { redis, TTL, cached, cachedSWR, invalidatePattern, cacheWithTags, invalidateTag };
```

### 4.5 GeoJSON Tile Caching

```javascript
// Cache pre-computed GeoJSON tiles for map rendering
async function getGeoJSONTile(layer, z, x, y) {
  const key = `arjun:geojson:${layer}:${z}:${x}:${y}`;

  return cached(key, TTL.GEOJSON, async () => {
    // Compute bounding box from tile coordinates
    const bbox = tileToBBox(z, x, y);

    const { rows } = await db.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', props
          )
        ), '[]'::jsonb)
      ) AS geojson
      FROM ${layer}
      WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
    `, [bbox.west, bbox.south, bbox.east, bbox.north]);

    return rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  });
}
```

---

## 5. API Gateway Design (Node.js + Express)

### 5.1 Route Structure

```
/api/v1/
├── /health                          # Health check
├── /geo/
│   ├── /states                      # All states (GeoJSON)
│   ├── /states/:code                # Single state
│   ├── /districts                   # All districts (GeoJSON)
│   ├── /districts/:code             # Single district
│   ├── /districts/:code/villages    # Villages in district
│   └── /search?q=                   # Geographic search
├── /schemes/
│   ├── /                            # List all schemes
│   ├── /:code                       # Scheme details
│   ├── /:code/implementation        # Implementation data
│   └── /district/:districtCode      # Schemes for district
├── /budget/
│   ├── /district/:code              # Budget for district
│   ├── /state/:code                 # Budget for state
│   └── /national                    # National aggregates
├── /weather/
│   ├── /current/:districtCode       # Current weather
│   ├── /forecast/:districtCode      # 7-day forecast
│   └── /stations                    # All weather stations
├── /fires/
│   ├── /active                      # Active fire hotspots
│   ├── /history                     # Historical fire data
│   └── /nearby?lat=&lng=&radius=    # Fires near point
├── /flights/
│   ├── /live                        # Live flight positions
│   └── /history/:icao24             # Flight history
├── /water/
│   ├── /quality/:districtCode       # Water quality for district
│   └── /sources                     # All water sources
├── /air/
│   ├── /quality/:city               # Air quality for city
│   ├── /stations                    # All monitoring stations
│   └── /aqi-map                     # AQI map data
├── /news/
│   ├── /latest                      # Latest news
│   ├── /district/:code              # News for district
│   ├── /search?q=                   # Search news
│   └── /verify                      # News verification
├── /census/
│   ├── /district/:code              # Census data for district
│   ├── /state/:code                 # Census data for state
│   └── /national                    # National aggregates
└── /tiles/
    └── /:layer/:z/:x/:y.geojson     # GeoJSON vector tiles
```

### 5.2 Express Server Setup

```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

// Security
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',                    // Vite dev
    'https://your-org.github.io',              // GitHub Pages
    'https://arjun.yourdomain.com',            // Production
  ],
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// JSON parsing (for POST/webhook endpoints)
app.use(express.json({ limit: '1mb' }));

// ============================================================
// RATE LIMITING
// ============================================================

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                     // Expensive spatial queries
  message: { error: 'Rate limit exceeded for spatial queries.' },
});

app.use('/api/', globalLimiter);
app.use('/api/v1/tiles/', strictLimiter);
app.use('/api/v1/fires/', strictLimiter);

// ============================================================
// ROUTES
// ============================================================

app.use('/api/v1/health', require('./routes/health'));
app.use('/api/v1/geo', require('./routes/geo'));
app.use('/api/v1/schemes', require('./routes/schemes'));
app.use('/api/v1/budget', require('./routes/budget'));
app.use('/api/v1/weather', require('./routes/weather'));
app.use('/api/v1/fires', require('./routes/fires'));
app.use('/api/v1/flights', require('./routes/flights'));
app.use('/api/v1/water', require('./routes/water'));
app.use('/api/v1/air', require('./routes/air'));
app.use('/api/v1/news', require('./routes/news'));
app.use('/api/v1/census', require('./routes/census'));
app.use('/api/v1/tiles', require('./routes/tiles'));

// ============================================================
// ERROR HANDLING
// ============================================================

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
    docs: 'https://github.com/your-org/project-arjun/wiki/API',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err);

  // PostGIS geometry errors
  if (err.message?.includes('geometry')) {
    return res.status(400).json({
      error: 'Invalid Geometry',
      message: 'The provided coordinates or geometry is invalid',
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed. Please try again later.',
    });
  }

  // Default
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
  });
});

// ============================================================
// START
// ============================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏹 Arjun API Gateway running on port ${PORT}`);
});
```

### 5.3 Example Route: Fire Hotspots

```javascript
// src/routes/fires.js
const router = require('express').Router();
const { cached, TTL } = require('../cache/redis');
const db = require('../db/pool');

// GET /api/v1/fires/active
router.get('/active', async (req, res, next) => {
  try {
    const { days = 7, satellite, confidence } = req.query;
    const cacheKey = `arjun:fire:active:${days}:${satellite || 'all'}:${confidence || 'all'}`;

    const data = await cached(cacheKey, TTL.FIRE_HOTSPOTS, async () => {
      let query = `
        SELECT f.id, f.latitude, f.longitude, f.brightness, f.frp,
               f.confidence, f.satellite, f.acq_date, f.acq_time,
               d.name AS district_name, d.code AS district_code,
               s.name AS state_name
        FROM fire_hotspots f
        LEFT JOIN districts d ON f.district_id = d.id
        LEFT JOIN states s ON d.state_id = s.id
        WHERE f.acq_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      `;
      const params = [];
      if (satellite) { query += ` AND f.satellite = $${params.length + 1}`; params.push(satellite); }
      if (confidence) { query += ` AND f.confidence = $${params.length + 1}`; params.push(confidence); }
      query += ' ORDER BY f.acq_date DESC, f.acq_time DESC LIMIT 5000';

      const { rows } = await db.query(query, params);
      return rows;
    });

    res.json({
      count: data.length,
      data,
      _meta: { days: parseInt(days), satellite, confidence },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/fires/nearby?lat=19.076&lng=72.877&radius=50
router.get('/nearby', async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const cacheKey = `arjun:fire:nearby:${lat}:${lng}:${radius}`;

    const data = await cached(cacheKey, TTL.FIRE_HOTSPOTS, async () => {
      const { rows } = await db.query(`
        SELECT f.id, f.latitude, f.longitude, f.brightness, f.confidence,
               f.acq_date, f.satellite,
               d.name AS district_name,
               ST_Distance(
                 f.geom::geography,
                 ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
               ) / 1000 AS distance_km
        FROM fire_hotspots f
        LEFT JOIN districts d ON f.district_id = d.id
        WHERE ST_DWithin(
          f.geom::geography,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3 * 1000  -- radius in meters
        )
        AND f.acq_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY distance_km
        LIMIT 500
      `, [lat, lng, radius]);
      return rows;
    });

    res.json({ count: data.length, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### 5.4 Health Check Endpoint

```javascript
// src/routes/health.js
const router = require('express').Router();
const db = require('../db/pool');
const { redis } = require('../cache/redis');

router.get('/', async (req, res) => {
  const checks = {};

  // Database check
  try {
    const { rows } = await db.query('SELECT NOW() AS time, PostGIS_Version() AS postgis');
    checks.database = { status: 'ok', time: rows[0].time, postgis: rows[0].postgis };
  } catch (err) {
    checks.database = { status: 'error', message: err.message };
  }

  // Redis check
  try {
    await redis.ping();
    checks.redis = { status: 'ok' };
  } catch (err) {
    checks.redis = { status: 'error', message: err.message };
  }

  // Data freshness
  try {
    const { rows } = await db.query(`
      SELECT 'fire_hotspots' AS source, MAX(fetched_at) AS last_fetched
      FROM fire_hotspots
      UNION ALL
      SELECT 'weather', MAX(fetched_at) FROM weather_readings
      UNION ALL
      SELECT 'news', MAX(fetched_at) FROM news_events
    `);
    checks.data_freshness = Object.fromEntries(
      rows.map(r => [r.source, r.last_fetched])
    );
  } catch (err) {
    checks.data_freshness = { status: 'error', message: err.message };
  }

  const healthy = Object.values(checks).every(c => c.status !== 'error');
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

---

## 6. GitHub Actions CI/CD

### 6.1 Frontend Deploy (GitHub Pages)

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'gods-eye-maharashtra/**'
      - 'shared/**'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: gods-eye-maharashtra/package-lock.json

      - name: Install dependencies
        working-directory: gods-eye-maharashtra
        run: npm ci

      - name: Build
        working-directory: gods-eye-maharashtra
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: gods-eye-maharashtra/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 6.2 Backend Deploy (Railway)

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend to Railway

on:
  push:
    branches: [main]
    paths:
      - 'api/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy to Railway
        run: railway up --service=arjun-api
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Run database migrations
        run: railway run --service=arjun-api "npm run migrate"
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 6.3 Data Pipeline (Scheduled Scrapers)

```yaml
# .github/workflows/scrapers.yml
name: Data Scrapers

on:
  schedule:
    # Weather — every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:  # Manual trigger

jobs:
  weather:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r scrapers/requirements.txt

      - name: Run IMD weather scraper
        run: python scrapers/weather/imd_scraper.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DATA_GOV_IN_KEY: ${{ secrets.DATA_GOV_IN_KEY }}

  fires:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 */6 * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - name: Install dependencies
        run: pip install -r scrapers/requirements.txt
      - name: Run NASA FIRMS scraper
        run: python scrapers/nasa/firms_scraper.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NASA_FIRMS_KEY: ${{ secrets.NASA_FIRMS_KEY }}

  news:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 */6 * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - name: Install dependencies
        run: pip install -r scrapers/requirements.txt
      - name: Run GDELT news scraper
        run: python scrapers/news/gdelt_scraper.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 6.4 More Granular Schedule (Separate Workflows)

```yaml
# .github/workflows/scraper-fires.yml (every 3 hours)
name: Scrape Fire Hotspots
on:
  schedule:
    - cron: '30 */3 * * *'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r scrapers/requirements.txt
      - run: python scrapers/nasa/firms_scraper.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NASA_FIRMS_KEY: ${{ secrets.NASA_FIRMS_KEY }}
```

```yaml
# .github/workflows/scraper-news.yml (every 15 minutes)
name: Scrape News (GDELT)
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r scrapers/requirements.txt
      - run: python scrapers/news/gdelt_scraper.py
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 6.5 Database Migrations

```yaml
# .github/workflows/migrate.yml
name: Database Migrations
on:
  push:
    branches: [main]
    paths:
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Seed PostGIS extensions
        run: |
          psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
          psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## 7. GitHub Secrets Reference

Required secrets for CI/CD:

| Secret | Where to Get | Used In |
|--------|-------------|---------|
| `DATABASE_URL` | Supabase dashboard → Settings → Database | All workflows |
| `REDIS_URL` | Upstash dashboard | Backend deploy |
| `RAILWAY_TOKEN` | Railway dashboard → Tokens | Backend deploy |
| `NASA_FIRMS_KEY` | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/area/) | Fire scraper |
| `DATA_GOV_IN_KEY` | [data.gov.in/apis](https://www.data.gov.in/apis) | Government data scraper |
| `GDELT_API_KEY` | Not needed (public API) | News scraper |
| `API_URL` | Railway app URL (e.g., `https://arjun-api.up.railway.app`) | Frontend build |

---

## 8. Cost Estimation (Free Tier)

| Service | Free Tier | Estimated Monthly Usage | Cost |
|---------|-----------|------------------------|------|
| Supabase (DB) | 500 MB storage | ~200 MB (India data) | $0 |
| Railway (API) | $5 trial credits | ~$3-5/month | $0-5 |
| Upstash (Redis) | 10K cmds/day | ~5K/day | $0 |
| GitHub Actions | 2,000 min/month | ~500 min | $0 |
| Cloudflare (CDN) | Unlimited free | N/A | $0 |
| GitHub Pages | 1 GB, 100 GB BW | ~50 MB | $0 |
| UptimeRobot | 50 monitors | 2 monitors | $0 |
| **Total** | | | **$0-5/month** |

> **After Railway trial credits expire:** Switch API hosting to Fly.io (3 free machines) or self-host on a $5/month VPS. Supabase + Upstash remain free.

---

## 9. Next Steps

1. **Set up Supabase project** — Enable PostGIS, create schema from Section 3
2. **Register data.gov.in API key** — Takes 1-2 days for approval
3. **Get NASA FIRMS API key** — Instant approval
4. **Deploy Express API to Railway** — Use config from Section 5
5. **Set up Upstash Redis** — Copy connection string
6. **Configure GitHub Secrets** — All secrets from Section 7
7. **Run initial data ingestion** — Census, districts, schemes
8. **Test spatial queries** — Verify PostGIS performance
9. **Set up scrapers** — Start with weather + fires (easiest, most reliable)
10. **Connect frontend** — Update API_URL in frontend environment

---

*Document created: 2026-04-23*
*Project Arjun — God's Eye Geospatial Intelligence Platform*
