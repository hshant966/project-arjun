# 🇮🇳 Indian Government Open Data — Live API Sources & Endpoints

> Comprehensive catalog of available Indian government open data APIs, endpoints, formats, and integration notes for Project Arjun.

**Last Updated:** April 2026

---

## Quick Reference Table

| Source | Domain | Auth | Format | Free? | Live? |
|--------|--------|------|--------|-------|-------|
| data.gov.in | Open Data | API Key | JSON/XML/CSV | ✅ | ✅ |
| Census 2011 | Demographics | None/Download | CSV/Excel | ✅ | ⚠️ Static |
| Election Commission | Electoral | None | PDF/CSV | ✅ | ⚠️ Periodic |
| OpenBudgetsIndia | Budget | None | JSON/CSV | ✅ | ✅ |
| IMD | Weather | API Key | JSON/XML | ✅ | ✅ |
| ISRO Bhuvan | Satellite | API Key | WMS/WMTS/Tiles | ✅ | ✅ |
| NASA FIRMS | Fire/Thermal | API Key | JSON/CSV/KML | ✅ | ✅ |
| GDELT | News | None | JSON/CSV | ✅ | ✅ |
| CGWB | Groundwater | Download | PDF/CSV | ✅ | ⚠️ Periodic |
| NHM/NHRC | Health | Download | CSV/Excel | ✅ | ⚠️ Periodic |
| MGNREGA | Employment | None | CSV | ✅ | ⚠️ Periodic |
| PM-KISAN | Farmer Benefits | None | CSV/Reports | ✅ | ⚠️ Periodic |
| eCourts | Judiciary | None | JSON | ✅ | ✅ |
| NCRB | Crime | Download | PDF/Excel | ✅ | ⚠️ Annual |
| TRAI | Telecom | Download | CSV/PDF | ✅ | ⚠️ Periodic |

---

## 1. 🌐 data.gov.in — India's Open Government Data Platform

**The primary source.** India's official open data portal managed by the Ministry of Electronics & IT.

### Base URL
```
https://data.gov.in
https://api.data.gov.in
```

### API Registration
- Register at: https://data.gov.in (free)
- Get API key from your profile after registration
- API key passed as `api-key` parameter

### Core Endpoints

#### Search Datasets
```
GET https://api.data.gov.in/resource/{resource-id}?api-key={YOUR_KEY}&format=json&limit=100&offset=0
```

#### Key Resources (by resource ID)

| Resource | Resource ID (example) | Description |
|----------|----------------------|-------------|
| Village/Town directory | Varies (search "village directory") | Census village-level data |
| District-wise population | Varies | Population by district |
| State-wise GDP | Varies | Economic indicators |
| Agricultural production | Varies | Crop production data |
| Health statistics | Varies | Hospital, health center data |
| Education statistics | Varies | School enrollment, literacy |
| Road infrastructure | Varies | National/state highway data |
| Water quality | Varies | Groundwater levels |

#### API Response Format
```json
{
  "total": 54321,
  "count": 100,
  "offset": 0,
  "limit": 100,
  "records": [
    {
      "state": "Maharashtra",
      "district": "Pune",
      "population": "3124458",
      "literacy_rate": "89.56",
      "sex_ratio": "910"
    }
  ]
}
```

#### Common Parameters
```
api-key=YOUR_KEY          # Required
format=json|xml|csv       # Response format
limit=100                 # Records per page (max 500)
offset=0                  # Pagination offset
filters[state]=Maharashtra # Filter by field
fields=state,district,population # Select specific fields
```

### Important Notes
- **~70,000+ datasets** available across sectors
- Data quality varies — some datasets are outdated
- Rate limits: reasonable usage (no published limit, ~100 req/min safe)
- **CORS: Limited** — may need server-side proxy for browser apps
- Many datasets link to external CSV/Excel files for download

### Maharashtra-Specific Datasets to Search
```
- "Maharashtra district wise population"
- "Maharashtra agriculture production"
- "Maharashtra MGNREGA"
- "Maharashtra health infrastructure"
- "Maharashtra road network"
- "Maharashtra rainfall"
- "Maharashtra school education"
```

---

## 2. 📊 Census 2011 — Demographic Data

**Source:** Office of the Registrar General & Census Commissioner, India
**URL:** https://censusindia.gov.in

### Available Data
- Population (total, male, female, rural, urban)
- Literacy rates by sex, age group
- SC/ST population
- Workers by industry/occupation
- Household amenities (water, electricity, toilets)
- Housing conditions
- Migration data
- Religion-wise demographics

### Access Methods

#### Primary Portal
```
https://censusindia.gov.in/census.website/data/data-visualiZation
```
- Interactive visualization tool
- Data downloadable as CSV/Excel
- State → District → Sub-district → Town/Village hierarchy

#### C-DAC Data Tables
```
http://www.censusindia.gov.in/2011census/population_enumeration.html
```
- Series of PDF reports with tabular data
- Can be parsed/scraped for structured extraction

#### Datasets Available as Download
```
Primary Census Abstract (PCA)     — Village/Town level summary
HH Level Tables                   — Household amenity data
Education Tables                  — Literacy, educational attainment
Worker Tables                     — Employment classification
Religion Tables                   — Religion-wise population
SC/ST Tables                      — Scheduled Caste/Tribe demographics
Migration Tables                  — Intra/inter-state migration
```

### Integration Strategy for Arjun
```
1. Download PCA (Primary Census Abstract) — the master dataset
   - Contains: State, District, Sub-district, Town/Village, 
     Total Population, Male, Female, SC Population, ST Population,
     Literates, Illiterates, Workers, Non-workers

2. Index into PostgreSQL/PostGIS with geographic codes
   - Link to administrative boundary shapefiles (see below)

3. Create heatmap layers:
   - Population density
   - Literacy rate
   - Sex ratio
   - SC/ST percentage
   - Worker participation rate
```

### Administrative Boundaries (Shapefiles)
```
Survey of India / Census GIS:
https://censusindia.gov.in/census.website/data/shapefiles

Natural Earth (coarser but easier):
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/

GADM (detailed admin boundaries):
https://gadm.org/download_country.html → India
- Level 0: Country
- Level 1: States
- Level 2: Districts
- Level 3: Sub-districts (Tehsils)
```

### Limitations
- **Census is from 2011** — data is 15 years old
- 2021 Census was delayed (COVID); may be released in 2026-2027
- Village-level data is massive (~640,000 villages) — needs efficient indexing
- Some PDFs require OCR/parsing for extraction

---

## 3. 🗳️ Election Commission of India (ECI)

**URL:** https://results.eci.gov.in / https://eci.gov.in

### Available Data

#### Election Results (Live & Historical)
```
https://results.eci.gov.in
```
- Lok Sabha results (2014, 2019, 2024)
- State Assembly results
- By-election results
- Constituency-level detail (candidate, votes, party, margin)

#### Electoral Rolls
```
https://electoralsearch.eci.gov.in/
```
- Voter search (by name, EPIC number, constituency)
- **Not bulk downloadable** — individual lookups only

#### Candidate Affidavits
```
https://affidavit.eci.gov.in
```
- Criminal records, assets, liabilities, education of candidates
- Downloadable as PDF per candidate

### API / Data Access
- **No formal public API** for bulk data
- Results portal can be scraped for structured data
- Some state election commissions have better data portals

### Data Worth Extracting
```
Constituency-wise:
  - Winner, runner-up, margin
  - Total votes polled, NOTA votes
  - Turnout percentage
  - Reserved constituency (SC/ST/General)

Correlate with Census:
  - Does literacy correlate with turnout?
  - Does SC/ST population % predict reserved constituency patterns?
```

---

## 4. 💰 OpenBudgetsIndia

**URL:** https://openbudgetsindia.org

### About
Open-source platform for Indian government budget data at multiple levels — Union, State, District, Panchayat.

### API
```
Base URL: https://api.openbudgetsindia.org
```

### Key Endpoints

#### Datasets
```
GET /datasets/
→ List all available budget datasets
```

#### Budget Documents
```
GET /datasets/{id}/
→ Individual budget dataset with line items
```

#### Search
```
GET /search/?q=maharashtra+education+budget
```

### Data Available
- Union Budget (since 2017)
- State budgets (multiple states)
- District budget data
- Panchayat/Municipal budgets (limited)
- Expenditure data (where available)

### Format
- JSON-LD (linked data)
- CSV exports available
- CKAN-based platform

### Integration for Arjun
```
1. Pull Maharashtra state budget → department-wise allocation
2. Pull district-wise expenditure → map to geography
3. Compare allocation vs. actual spending
4. Track year-over-year changes
5. Identify underfunded sectors by district
```

---

## 5. 🌦️ IMD — India Meteorological Department

**URL:** https://mausam.imd.gov.in / https://imd.gov.in

### APIs & Data Feeds

#### Current Weather
```
IMD does NOT have a formal public API.
Data available via:
1. RSS/XML feeds at imd.gov.in
2. Mobile app API (reverse-engineerable)
3. Downloadable bulletins (PDF/XML)
```

#### Open-Meteo (Recommended Alternative — Free, No Key)
```
https://open-meteo.com/en/docs

GET https://api.open-meteo.com/v1/forecast?
  latitude=19.076&longitude=72.877&     # Mumbai
  hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&
  daily=temperature_2m_max,temperature_2m_min,precipitation_sum&
  timezone=Asia/Kolkata

→ Free, no API key, CORS-enabled, global coverage
→ Includes IMD model data
```

#### Rainfall Data (IMD Specific)
```
IMD District Rainfall Data:
https://mausam.imd.gov.in/imd_latest/contents/districtwise_rainfall.php

All India Rainfall Summary:
https://mausam.imd.gov.in/imd_latest/contents/all_india_rainfall.php

Monsoon Progress Maps:
https://mausam.imd.gov.in/imd_latest/contents/monsoon_onset.php
```

#### Weather Warnings
```
https://mausam.imd.gov.in/imd_latest/contents/all_india_warning_bulletin.php
→ Severe weather warnings by state/district
→ Can be scraped/parsed
```

#### Historical Data
```
IMD Gridded Data (0.25° × 0.25°):
Available via IITM Pune — requires academic/research request
Daily gridded rainfall & temperature since 1901
```

### Integration for Arjun
```
Layers to build:
1. Real-time temperature heatmap (Open-Meteo)
2. Rainfall overlay (IMD district data)
3. Monsoon progress tracker
4. Severe weather warning overlay
5. Historical anomaly detection (drought/flood prone areas)
```

---

## 6. 🛰️ ISRO Bhuvan — Indian Satellite Imagery

**URL:** https://bhuvan-app1.nrsc.gov.in / https://bhuvan.nrsc.gov.in

### APIs

#### WMS/WMTS Services
```
WMS Endpoint:
https://bhuvan-app1.nrsc.gov.in/bhuvan/wms?
  service=WMS&
  version=1.1.1&
  request=GetMap&
  layers=layer_name&
  bbox={minx,miny,maxx,maxy}&
  width=256&height=256&
  srs=EPSG:4326&
  format=image/png
```

#### Available Layers
```
bhuvan:gaul_india_district_2011    — District boundaries
bhuvan:india_state_boundary        — State boundaries
bhuvan:india34_river              — River network
bhuvan:india_rail                 — Railway network
bhuvan:india_highway              — Highway network
bhuvan:lii34                     — Satellite imagery mosaic
bhuvan:mosaic_34                  — Cartosat imagery
```

#### Bhuvan API (Requires Registration)
```
API Key: Register at https://bhuvan.nrsc.gov.in

Thematic Services:
- Land use / Land cover
- Water body mapping
- Forest cover change
- Urban sprawl detection
- Agricultural drought monitoring
```

#### 3D Terrain
```
Bhuvan supports CesiumJS integration:
https://bhuvan-app1.nrsc.gov.in/bhuvan/terrain/
→ Can be used directly in CesiumJS viewer
```

---

## 7. 🔥 NASA FIRMS — Fire Information for Resource Management

**URL:** https://firms.modaps.eosdis.nasa.gov

### API

#### Active Fire Data
```
GET https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/VIIRS_SNPP_NRT/IND/1

Parameters:
- MAP_KEY: Free registration key
- Sensor: VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT, MODIS_NRT
- Country: IND (India)
- Day range: 1-10
```

#### Registration
```
https://firms.modaps.eosdis.nasa.gov/api/area
→ Free account → get MAP_KEY
→ 1000 requests/day
```

#### Data Fields
```
latitude, longitude, bright_ti4, bright_ti5, frp, 
daynight, confidence, scan, track, acq_date, acq_time
```

#### GeoJSON Output
```
GET https://firms.modaps.eosdis.nasa.gov/api/country/geojson/{MAP_KEY}/VIIRS_SNPP_NRT/IND/1
```

### Integration for Arjun
```
1. Overlay active fire detections on Maharashtra map
2. Correlate with crop burning seasons (Oct-Nov Punjab, post-harvest)
3. Forest fire monitoring near wildlife sanctuaries
4. Burnt area estimation
5. Cross-reference with IMD wind patterns for smoke spread
```

---

## 8. 📰 GDELT — Global Database of Events, Language, and Tone

**URL:** https://www.gdeltproject.org

### About
GDELT monitors news in 100+ languages from every country, creating a database of events, emotions, themes, and images. Updated every 15 minutes.

### APIs & Feeds

#### GDELT 2.0 Doc API
```
Base: https://api.gdeltproject.org/api/v2/doc/doc

Search articles:
GET https://api.gdeltproject.org/api/v2/doc/doc?
  query=india+maharashtra+drought&
  mode=artlist&
  maxrecords=25&
  format=json&
  timespan=24h

Modes:
- artlist  — article list with metadata
- tonechart — tone analysis
- timeline — volume timeline
- timelinevol — timeline with article volume
- timelinei — interactive timeline
```

#### GKG (Global Knowledge Graph)
```
Download: http://data.gdeltproject.org/gdeltv2/
Updated every 15 minutes

Files:
- {date}.{time}.gkg.csv.zip — Global Knowledge Graph
- {date}.{time}.export.CSV.zip — Event database

Event schema:
  GlobalEventID, Day, MonthYear, Year, FractionDate,
  Actor1Code, Actor1Name, Actor1CountryCode, ...
  EventCode, EventBaseCode, EventRootCode,
  NumMentions, NumSources, NumArticles,
  AvgTone, Actor1Geo_Lat, Actor1Geo_Long, ...
```

#### BigQuery (Historical)
```
Google BigQuery public dataset:
gdelt-bq.gdeltv2.events
gdelt-bq.gdeltv2.gkg

SQL queries on full historical archive:
SELECT * FROM `gdelt-bq.gdeltv2.events`
WHERE Actor1CountryCode = 'IND' 
  AND SQLDATE >= '20240101'
  AND EventRootCode = '14'  -- Protest events
LIMIT 1000
```

### Integration for Arjun
```
News Ingestion Pipeline:
1. Pull GDELT articles mentioning India/states/districts
2. Extract event types: protests, disasters, policy, economic
3. Map events to geographic coordinates
4. Cross-reference with government data for verification
5. Detect information gaps (events reported but no official data)
6. Track narrative shifts over time
```

### India-Specific GDELT Queries
```
# Drought/flood events in Maharashtra
query="maharashtra drought OR flood" AND sourcelang:english

# Farmer protests
Actor1CountryCode=IND AND EventRootCode=14 AND Actor1Type1Code=FSR

# Infrastructure development
Actor2CountryCode=IND AND EventRootCode=5 AND Actor2Type1Code=GOV

# Health emergencies
theme:HEALTH AND country:IN
```

---

## 9. 💧 CGWB — Central Ground Water Board

**URL:** https://cgwb.gov.in

### Data Available
- Ground water level monitoring (piezometer data)
- Ground water quality parameters
- Aquifer mapping data
- Dynamic and static ground water resources
- District-wise ground water estimation

### Access
```
No formal API. Data available via:
1. Annual reports (PDF)
2. Published data tables (can be scraped)
3. GIS portal: https://cgwb.gov.in/gis-portal
```

#### GIS Portal Layers
```
- Ground Water Level (seasonal)
- Ground Water Quality (Fluoride, Arsenic, Nitrate, Iron)
- Aquifer Map layers
- Ground Water Management Zones
```

### Data Worth Extracting
```
District-wise:
- Annual recharge (ham)
- Extractable resources (ham)
- Ground water extraction (ham)
- Stage of extraction (%) — CRITICAL: >100% = over-exploited
- Category: Safe/Semi-Critical/Critical/Over-Exploited

Map categories:
  🟢 Safe: <70%
  🟡 Semi-Critical: 70-90%
  🟠 Critical: 90-100%
  🔴 Over-Exploited: >100%
```

### Integration for Arjun
```
1. Color-code districts by groundwater status
2. Overlay with rainfall data (IMD) — does low rain = depleted GW?
3. Correlate with agricultural production — does GW stress affect crops?
4. Track year-over-year changes in extraction stage
```

---

## 10. 🏥 Health Data — NHM / MoHFW

**URL:** https://nhm.gov.in / https://mohfw.gov.in

### Data Sources

#### National Health Mission (NHM)
```
https://nhm.gov.in/index1.php?lang=1&level=4&sublinkid=186&lid=316
→ State-wise health indicators
→ Facility-level data
→ Program performance (immunization, maternal health, etc.)
```

#### NFHS — National Family Health Survey
```
https://nfhs.gov.in
→ Most comprehensive health & nutrition survey
→ State & district level data
→ Key indicators:
  - Infant Mortality Rate (IMR)
  - Under-5 Mortality Rate
  - Maternal Mortality Ratio
  - Stunting/Wasting/Underweight (children <5)
  - Anemia prevalence (women, children)
  - Contraceptive prevalence
  - Institutional deliveries
  - Full immunization coverage
```

#### COVID-19 Data (Legacy but Useful)
```
https://data.covid19india.org (archived)
→ District-wise confirmed, recovered, deceased
→ Vaccination data by district
→ Testing data
```

#### ICMR — Indian Council of Medical Research
```
https://icmr.gov.in
→ Disease surveillance data
→ Research publications
→ Testing lab directory
```

### Data Access
- **No formal public API** for most health data
- NFHS reports downloadable as PDFs with data tables
- Some state health departments have better data portals
- OpenCity (opencity.in) has digitized some health data

### Integration for Arjun
```
1. Health facility density map (hospitals/PHC/SC per population)
2. IMR/MMR heatmaps by district
3. Immunization coverage overlay
4. Disease outbreak tracking (when available)
5. Correlate with poverty, literacy, sanitation data
```

---

## 11. 🗺️ Additional Sources

### eCourts — Indian Judiciary
```
https://ecourts.gov.in/ecourts_home/
API-like access: https://ecourts.ecourts.gov.in/ecourts/

District court case data:
- Case status, next hearing date
- Orders/judgments
- Case types, acts, sections

No formal API — scraping possible but rate-limited
```

### NCRB — National Crime Records Bureau
```
https://ncrb.gov.in
Crime in India annual reports (PDF)
State/district wise crime statistics
→ Murder, theft, cybercrime, crimes against women
→ Downloadable as Excel from newer reports
```

### Ministry of Rural Development
```
https://rural.nic.in

MGNREGA:
https://nregade4.nic.in/netnrega/home.aspx
→ State/district/panchayat level data
→ Job cards issued, days employed, expenditure
→ Can be scraped from MIS reports

PMGSY (Roads):
https://omms.nic.net.in
→ Rural road connectivity status
→ Project-wise completion data
```

### Ministry of Education
```
https://udiseplus.gov.in
UDISE+ — Unified District Information System for Education
→ School-level data: enrollment, teachers, infrastructure
→ District-wise educational statistics
```

### Forest Survey of India
```
https://fsi.nic.in
India State of Forest Report (biennial)
→ Forest cover by state/district
→ Tree cover estimates
→ Carbon stock data
```

### Survey of India
```
https://surveyofindia.gov.in
Topographic maps (1:50,000 and 1:250,000)
→ Requires approval for detailed maps
→ Some open data available
```

---

## 🔧 Integration Architecture

### Recommended Data Pipeline
```
┌─────────────────────────────────────────────────────────┐
│                    SCHEDULER (Celery Beat)               │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐  │
│  │ Real-time    │ │ Hourly      │ │ Daily/Weekly     │  │
│  │ (weather,    │ │ (GDELT,     │ │ (Census, budget, │  │
│  │  fire, news) │ │  FIRMS)     │ │  health, crime)  │  │
│  └──────┬──────┘ └──────┬──────┘ └────────┬─────────┘  │
└─────────┼───────────────┼─────────────────┼─────────────┘
          │               │                 │
          ▼               ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                 FETCHER LAYER                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ REST     │ │ WMS/WMTS │ │ Scraper  │ │ CSV/JSON │   │
│  │ API      │ │ Tile     │ │ Engine   │ │ Parser   │   │
│  │ Client   │ │ Client   │ │ (BS4)    │ │          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              NORMALIZE & VALIDATE                        │
│  • Standardize geographic codes (state/district/village) │
│  • Convert to consistent CRS (EPSG:4326)                 │
│  • Schema validation                                      │
│  • Deduplication                                          │
│  • Timestamp normalization                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL + PostGIS                         │
│  • Geospatial index on all location data                  │
│  • Temporal index on time-series data                     │
│  • Materialized views for common queries                  │
└─────────────────────────────────────────────────────────┘
```

### Authentication Summary
| Source | Auth Type | How to Get |
|--------|----------|------------|
| data.gov.in | API Key | Register at data.gov.in |
| Open-Meteo | None | Direct use |
| ISRO Bhuvan | API Key | Register at bhuvan.nrsc.gov.in |
| NASA FIRMS | MAP_KEY | Register at firms.modaps.eosdis.nasa.gov |
| GDELT | None | Direct use |
| Census | None | Download |
| OpenBudgets | None | Direct use |
| eCourts | None | Scraping |

### CORS & Proxying
```
Most Indian gov APIs do NOT support CORS.
Solution: Route through backend proxy.

Frontend → Your Backend → Government API
                          (server-side fetch, no CORS issue)

For CORS-enabled sources (safe for direct browser fetch):
✅ Open-Meteo
✅ GDELT 2.0 Doc API
✅ OpenSky Network
✅ NASA FIRMS (with key in header)
```

---

## 📋 Priority Integration Checklist

### Phase 1 — Core Layers
- [ ] Census 2011 PCA data → PostgreSQL
- [ ] GADM administrative boundaries → PostGIS
- [ ] Open-Meteo weather → Redis cache (live)
- [ ] GDELT India news → Elasticsearch/Meilisearch
- [ ] NASA FIRMS fire data → PostGIS (daily)

### Phase 2 — Government Schemes
- [ ] data.gov.in scheme datasets → PostgreSQL
- [ ] MGNREGA MIS data scraper → PostgreSQL
- [ ] PM-KISAN data extraction → PostgreSQL
- [ ] OpenBudgetsIndia state budgets → PostgreSQL

### Phase 3 — Advanced Intelligence
- [ ] Bhuvan WMS integration in CesiumJS
- [ ] CGWB groundwater data → PostGIS
- [ ] NFHS health indicators → PostgreSQL
- [ ] NCRB crime data → PostgreSQL
- [ ] eCourts case data scraper → PostgreSQL

---

*This document is a living reference. As new APIs are discovered or existing ones change, update accordingly.*
