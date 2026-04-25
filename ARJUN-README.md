# 🏹 Project Arjun — God's Eye Geospatial Intelligence Platform

> *"The one who sees everything, misses nothing."*

**Arjun** is an indigenous, India-wide geospatial intelligence platform named after the legendary archer of the Mahabharata — the warrior gifted with **divine vision** (*Divya Drishti*) by Lord Krishna, enabling him to see the entire battlefield at once. Like its namesake, this platform aims to give its users omnipresent awareness of India's landscape — from infrastructure to crises, from governance to ground truth.

---

## 🔭 Vision

India generates enormous volumes of public data — census records, government schemes, satellite imagery, weather feeds, election data, budget allocations, news reports — but this data sits fragmented across hundreds of portals, formats, and agencies. Connecting the dots requires enormous manual effort.

**Project Arjun** fuses these data streams into a single, real-time, map-based intelligence platform. Two dashboards, one mission: **make India visible to its citizens.**

| Dashboard | Scope | Focus |
|-----------|-------|-------|
| **🎯 Maharashtra Focus** | Deep-dive into one state | Village-level schemes, district budgets, ground-level failures, local news verification |
| **🌏 India-Wide** | Panorational view | National trends, inter-state comparisons, crisis monitoring, macro patterns |

---

## ⚡ Capabilities

### 1. Real-Time Data Fusion
- Live satellite imagery overlays (ISRO Bhuvan, NASA FIRMS, Sentinel)
- Weather feeds from IMD (India Meteorological Department)
- Flight tracking (OpenSky Network)
- Seismic event monitoring

### 2. News Verification Engine
- Ingest news from GDELT, Indian media RSS, and social feeds
- Cross-reference claims against government data sources
- Detect discrepancies between reported events and official records
- Flag potential misinformation with confidence scores

### 3. Government Scheme Tracking
- Track implementation status of central & state schemes (PM-KISAN, MGNREGA, Jal Jeevan, etc.)
- Budget allocation vs. actual expenditure comparison
- Geographic distribution analysis — which districts receive what
- Timeline tracking of scheme rollouts and delays

### 4. Failure Detection & Alerts
- Identify districts/villages falling behind on scheme targets
- Detect anomalies in budget utilization (sudden drops, stalled projects)
- Correlate news reports of distress with on-ground data gaps
- Monitor infrastructure projects via satellite change detection

### 5. Demographic & Census Intelligence
- Census 2011 baseline data at district/village level
- Population density heatmaps
- Literacy, sex ratio, and development indices overlay
- Electoral data from Election Commission for political geography

---

## 🛠 Tech Stack

### Frontend
| Component | Technology | Why |
|-----------|-----------|-----|
| 3D Globe Engine | **CesiumJS** | Industry-standard 3D geospatial rendering, Apache 2.0, terrain + imagery support |
| 2D Map Fallback | **MapLibre GL JS** | Open-source Mapbox alternative, globe projection mode, fast vector tiles |
| UI Framework | **React 18+** | Component ecosystem, state management |
| State Management | **Zustand** | Lightweight, minimal boilerplate |
| Styling | **Tailwind CSS** | Rapid prototyping, utility-first |
| Charts | **Recharts** / **D3.js** | Data visualization for dashboards |
| Timeline | **vis-timeline** | Interactive timeline playback |

### Backend & Data
| Component | Technology | Why |
|-----------|-----------|-----|
| API Gateway | **Node.js + Express** | Lightweight, async I/O for API aggregation |
| Data Ingestion | **Python (scrapy + celery)** | Scraping pipelines for gov data portals |
| Database | **PostgreSQL + PostGIS** | Geospatial queries, mature ecosystem |
| Cache | **Redis** | API response caching, rate limit management |
| Queue | **Bull (Redis-based)** | Job scheduling for data scrapers |
| Search | **Meilisearch** | Fast full-text search across news & schemes |

### Data Sources (see [research-live-data-sources.md](./research-live-data-sources.md))
- **data.gov.in** — India's open government data portal
- **Census 2011** — Demographic baseline
- **Election Commission** — Electoral data
- **OpenBudgetsIndia** — Budget & expenditure
- **IMD** — Weather & climate
- **ISRO Bhuvan / NASA FIRMS** — Satellite imagery
- **GDELT** — Global news event database
- **CGWB** — Groundwater & water quality
- **NHM (NHRC)** — Health data
- **MGNREGA/PM-KISAN portals** — Scheme implementation

### Infrastructure
| Component | Technology | Why |
|-----------|-----------|-----|
| Hosting | **Vercel** (frontend) + **Railway/Fly.io** (backend) | Generous free tiers, easy deployment |
| CDN | **Cloudflare** | Caching, DDoS protection |
| CI/CD | **GitHub Actions** | Automated testing & deployment |
| Monitoring | **UptimeRobot** (free) | Uptime checks |

---

## 📁 Project Structure

```
gods-eye/
├── ARJUN-README.md              # This file — master documentation
├── research-live-data-sources.md    # All Indian gov data APIs & endpoints
├── research-verification-pipeline.md # News verification methodology
├── research-free-data-sources.md    # Global free data APIs (existing)
├── research-tech-stacks.md          # Tech stack comparison (existing)
├── research-india-govt-schemes.md   # Government scheme details
├── research-maharashtra-data.md     # Maharashtra-specific data
├── research-satellite-imagery.md    # Satellite imagery options
├── research-globe-projects.md       # Globe visualization references
│
├── gods-eye-maharashtra/            # Maharashtra dashboard (primary)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── gods-eye-india/                  # India-wide dashboard (planned)
│   ├── src/
│   ├── public/
│   └── package.json
│
└── shared/                          # Shared components & data utils
    ├── data-fetchers/
    ├── map-layers/
    └── verification-engine/
```

---

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+
- Python 3.10+ (for data scrapers)
- PostgreSQL 15+ with PostGIS extension
- Redis 7+

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/project-arjun.git
cd project-arjun

# Install dependencies
cd gods-eye-maharashtra && npm install
cd ../shared && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see data sources doc)

# Start development server
npm run dev

# Build for production
npm run build
```

### Data Pipeline Setup

```bash
# Set up PostgreSQL + PostGIS
docker run -d --name arjun-db \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Run initial data ingestion
cd shared/data-fetchers
python -m pip install -r requirements.txt
python ingest_census.py
python ingest_schemes.py
python ingest_budget.py

# Start the scraper scheduler
celery -A scrapers worker --loglevel=info
```

### Deployment (Free Tier)

```bash
# Frontend → Vercel
vercel --prod

# Backend → Railway
railway up

# Database → Supabase (free PostgreSQL + PostGIS)
# Or self-host on Fly.io
```

---

## 📊 Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                             │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ data.gov │  IMD     │ ISRO     │ GDELT    │ Election        │
│ .in      │ Weather  │ Bhuvan   │ News     │ Commission      │
│ Census   │ CGWB     │ NASA     │ RSS      │ Budget          │
│ NHM      │ Seismic  │ FIRMS    │ Feeds    │ MGNREGA         │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴───────┬─────────┘
     │          │          │          │             │
     ▼          ▼          ▼          ▼             ▼
┌──────────────────────────────────────────────────────────────┐
│               INGESTION LAYER (Python + Celery)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ REST API  │ │ Scraper  │ │ RSS      │ │ Scheduled    │    │
│  │ Fetcher   │ │ Engine   │ │ Parser   │ │ Cron Jobs    │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              PROCESSING & STORAGE LAYER                      │
│  ┌──────────────────┐  ┌──────────────────────────────┐      │
│  │   PostgreSQL +    │  │  Verification Engine         │      │
│  │   PostGIS         │  │  (cross-reference claims     │      │
│  │   (geospatial     │  │   against gov data)          │      │
│  │    queries)       │  │                              │      │
│  └──────────────────┘  └──────────────────────────────┘      │
│  ┌──────────────────┐  ┌──────────────────────────────┐      │
│  │   Redis Cache     │  │  Meilisearch Index           │      │
│  └──────────────────┘  └──────────────────────────────┘      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    API LAYER (Node.js + Express)              │
│  /api/schemes  /api/news  /api/weather  /api/satellite       │
│  /api/census   /api/budget  /api/verify  /api/alerts         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + CesiumJS)                │
│  ┌─────────────────────┐    ┌─────────────────────────────┐  │
│  │  🎯 Maharashtra     │    │  🌏 India-Wide              │  │
│  │  Dashboard          │    │  Dashboard                  │  │
│  │  - Village detail   │    │  - State comparisons        │  │
│  │  - Scheme status    │    │  - Macro trends             │  │
│  │  - Local news       │    │  - Crisis monitoring        │  │
│  │  - Budget tracking  │    │  - Demographic overlays     │  │
│  └─────────────────────┘    └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 Roadmap

### Phase 1: Foundation (Current)
- [x] Research data sources & tech stack
- [x] Build Maharashtra prototype with CesiumJS globe
- [ ] Integrate Census 2011 data layer
- [ ] Add IMD weather overlay
- [ ] Basic scheme tracking (MGNREGA, PM-KISAN)

### Phase 2: Intelligence
- [ ] News verification pipeline (GDELT + RSS ingestion)
- [ ] Budget allocation vs. expenditure analysis
- [ ] Failure detection algorithms
- [ ] Alert system for anomalous patterns

### Phase 3: Scale
- [ ] Expand to India-wide dashboard
- [ ] Real-time satellite change detection
- [ ] ML-based trend prediction
- [ ] Public API for researchers & journalists

### Phase 4: Ecosystem
- [ ] Mobile companion app
- [ ] WhatsApp/Telegram alert bots
- [ ] Community data contribution portal
- [ ] Academic partnership program

---

## 🤝 Contributing

This is an open-source project. Contributions welcome in:
- **Data engineering** — new scrapers, API integrators
- **Frontend** — map layers, dashboard components, UX
- **Verification** — fact-checking algorithms, NLP models
- **Documentation** — guides, translations, tutorials

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- Named after **Arjun** (अर्जुन) — the Pandava prince whose divine sight (*Divya Drishti*) granted by Krishna let him see all of creation. This platform aspires to bring even a fraction of that clarity to understanding India.
- Inspired by the need for transparent, data-driven governance in the world's largest democracy.
- Built on the shoulders of India's open data movement and the global open-source community.

---

*"What Arjun saw with divine eyes, we build with data."*
