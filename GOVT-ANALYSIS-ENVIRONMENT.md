# 🌿 GOVT-ANALYSIS-ENVIRONMENT — State Pollution Control Board / Forest Department Review

> **Reviewer Perspective**: Senior Environmental Officer, State PCB & Forest Department  
> **Subject**: Project Arjun — God's Eye Geospatial Intelligence Platform  
> **Date**: 2026-04-23  
> **Classification**: Recommendations for Environmental Monitoring Integration

---

## 1. Environmental Monitoring Needs — What We Actually Need

### 1.1 Air Quality Monitoring (CPCB Network)

**Current State**: CPCB operates ~900+ monitoring stations across India (NAMP — National Air Quality Monitoring Programme). Maharashtra alone has ~80+ stations across MPCB (Maharashtra Pollution Control Board). Data exists but is fragmented.

**What we need on a map:**
- **Real-time AQI at every CPCB/MPCB station** — PM2.5, PM10, NO₂, SO₂, CO, O₃, NH₃, Pb
- **Station coverage gap visualization** — show where monitoring stations DON'T exist (vast rural Maharashtra has zero ground monitoring)
- **AQI trend overlays** — 24-hour rolling averages, 7-day trends, seasonal patterns
- **Hotspot identification** — cluster analysis of chronically "Very Poor" / "Severe" zones
- **Industrial emission source mapping** — match CPCB Consent to Operate (CTO) database with actual monitoring data
- **Vehicular pollution corridors** — correlate NHAI traffic data with roadside AQI

**Specific stations that matter**: MIDC industrial zones (Chakan, Ranjangaon, Butibori, Waluj), thermal power plant surroundings (Chandrapur, Paras, Bhusawal), urban traffic junctions (Mumbai, Pune, Nagpur)

### 1.2 Water Quality Monitoring (CPCB + CGWB + State Board)

**Current State**: CPCB monitors water quality at ~3,400+ locations across rivers, lakes, and groundwater. CGWB maintains groundwater observation wells. State boards do independent monitoring.

**What we need on a map:**
- **River water quality at every monitoring point** — BOD, DO, pH, coliform, heavy metals, conductivity
- **Groundwater quality contour maps** — fluoride, arsenic, nitrate, iron, TDS from CGWB wells
- **Pollution hotspots on rivers** — clearly marked CRZ (Coastal Regulation Zone) violations
- **Drinking water source quality** — overlay with Jal Jeevan Mission supply points
- **Industrial effluent discharge points** — mapped against consented discharge limits
- **Upstream vs downstream comparisons** — show pollution loading at each river stretch

**Critical rivers**: Godavari (Nashik industrial zone), Mula-Mutha (Pune — perennially polluted), Wardha-Wainganga (Chandrapur thermal), Ulhas River (Raigad industrial), Tapi (industrial runoff)

### 1.3 Forest Cover Monitoring (FSI + Satellite)

**Current State**: Forest Survey of India (FSI) publishes biennial "India State of Forest Report" (ISFR). Latest ISFR 2023 shows forest cover changes at district level. But biennial is too slow for enforcement.

**What we need on a map:**
- **Annual forest cover change** — gain/loss at 250m resolution (FSI ISFR data) overlaid on admin boundaries
- **Near-real-time deforestation alerts** — GLAD (Global Land Analysis & Discovery) alerts from University of Maryland / Global Forest Watch
- **Very Dense Forest / Moderately Dense Forest / Open Forest / Scrub** classification per FSI categories
- **Forest fire hotspots** — FIRMS (NASA) active fire detections overlaid on forest boundaries
- **Compensatory afforestation tracking** — CAMPA (Compensatory Afforestation Fund Management and Planning Authority) fund utilization vs. actual planting
- **Protected Area boundaries** — National Parks, Wildlife Sanctuaries, Tiger Reserves, Conservation Reserves

### 1.4 Wildlife Monitoring

**What we need on a map:**
- **Tiger corridor connectivity** — NTCA (National Tiger Conservation Authority) corridor maps
- **Human-wildlife conflict zones** — conflict incidents from Forest Department records
- **Elephant corridors** — Project Elephant corridor identification
- **Migratory bird routes** — Important Bird Area (IBA) network data from BNHS
- **Mangrove cover** — especially Mumbai/Raigad/Konkan coastal strip
- **Biosphere Reserve boundaries** with buffer zone monitoring

### 1.5 Tree Census / Urban Green Cover

**What we need on a map:**
- **Municipal tree census data** — cities like Mumbai (2020 census ~29 lakh trees), Pune, Nagpur have conducted tree censuses
- **Heritage tree locations** — protected trees under Maharashtra felling regulations
- **Tree felling permissions** — overlay Section 8 (Maharashtra Felling of Trees Act) permits granted
- **Green cover per capita** by municipal ward
- **Urban heat island correlation** — tree density vs. surface temperature from Landsat thermal bands

---

## 2. Real Challenges — What's Actually Happening on the Ground

### 2.1 Illegal Mining

**The Problem**: Maharashtra has 1,700+ active mining leases and hundreds of illegal operations. The Bombay High Court and NGT have repeatedly flagged illegal sand mining, laterite quarrying, and stone crushing in Konkan and Western Ghats.

**What a geo-platform should do:**
- **Overlay mining lease boundaries** (DMG — Directorate of Geology & Mining, Maharashtra) with satellite imagery to detect unauthorized excavation
- **Sentinel-2 change detection** on known mining zones — compare quarterly imagery to catch expansion beyond lease boundaries
- **Stockpile monitoring** — volumetric analysis of mining stockpiles using DEM (Digital Elevation Model) comparison
- **Transport route tracking** — weighbridge data correlation with production records
- **Red-flag zones**: Ratnagiri (chromite, illegal laterite), Raigad (stone quarrying), Pune district (basalt quarrying in eco-sensitive zones), Sindhudurg (sand mining in rivers)

### 2.2 River Pollution

**The Problem**: Maharashtra's rivers are in crisis. Mula-Mutha in Pune consistently exceeds BOD limits 3-5x. Godavari at Nashik shows coliform counts 10,000x safe limits. The "Zero Pollution" claim of many STPs (Sewage Treatment Plants) is fiction — actual capacity vs. installed capacity gap is massive.

**What a geo-platform should do:**
- **Real-time river quality gauging** — if CPCB/BIS stations provide API access, show live readings
- **STP performance monitoring** — overlay STP locations with downstream water quality
- **Drain mapping** — show nullah/drains discharging into rivers (PMC has some of this data)
- **Industrial discharge corridor** — map every consented industrial unit along river stretches with their discharge parameters
- **Sewage load calculation per river stretch** — population served vs. treatment capacity

### 2.3 Deforestation Tracking

**The Problem**: Western Ghats (Sahyadri) is a UNESCO World Heritage Site. The Kasturirangan Committee and Gadgil Committee reports identified Ecologically Sensitive Areas (ESA). Maharashtra delayed ESA notification for years. Meanwhile, forest diversion approvals under Forest Conservation Act continue.

**What a geo-platform should do:**
- **Track Forest Clearance (FC) proposals** — MoEFCC PARIVESH portal data with geo-tagged diversion areas
- **ESA boundary visualization** — Kasturirangan Committee recommended ESA boundaries vs. actual ground status
- **Road/rail project impact assessment** — overlay linear infrastructure projects (Samruddhi Expressway, Mumbai-Nagpur corridor) with forest diversion zones
- **Net Present Value (NPV) tracking** — has the state deposited NPV for diverted forests? (Often delayed)
- **Community Forest Rights (CFR)** — overlay FRA (Forest Rights Act) claim status with forest management maps

### 2.4 Encroachment on Forest Land

**The Problem**: Encroachment on forest land is chronic. Maharashtra has ~55,000 hectares under reported encroachment. Resort/hotel construction in hill stations (Matheran, Lonavala, Mahabaleshwar) frequently violates forest boundary laws.

**What a geo-platform should do:**
- **Forest boundary overlay** with recent high-resolution satellite imagery
- **Building/structure detection** — automated or semi-automated detection of new construction within forest boundaries
- **Revenue vs. Forest land boundary disputes** — show conflicting land records (Revenue department says "revenue land", Forest department says "forest land")
- **Encroachment timeline** — compare imagery from 2010, 2015, 2020, 2025 to show encroachment progression

---

## 3. Missing Environmental Layers — The Gap Analysis

| Layer | Priority | Current Status | Data Source | Feasibility |
|-------|----------|---------------|-------------|-------------|
| **Real-time CPCB AQI Feed** | 🔴 Critical | data.gov.in has it but stations are sparse | CPCB via data.gov.in API | ✅ Achievable — API exists |
| **Forest Cover Change Detection** | 🔴 Critical | FSI biennial reports only | Global Forest Watch GLAD alerts + FSI ISFR | ✅ Achievable — GFW API open |
| **Mining Activity Monitoring** | 🟡 High | Fragmented DMG records | Satellite imagery + DMG lease database | ⚠️ Needs image processing pipeline |
| **Tree Census / Urban Green** | 🟡 High | Municipal data siloed | Municipal corporation datasets + Landsat | ⚠️ Data access varies by city |
| **Wildlife Corridor Mapping** | 🟡 High | NTCA has maps, not APIs | NTCA corridor shapefiles + MoEFCC | ✅ Achievable — shapefiles available |
| **Wetland Mapping** | 🟢 Medium | National Wetland Atlas exists | ISRO/NRSC Wetland Atlas + WII data | ✅ Achievable — downloadable |
| **River Health Index** | 🔴 Critical | CPCB data exists but no composite index | CPCB water quality + CGWB + India-WRIS | ⚠️ Needs index calculation logic |
| **Coastal Zone (CRZ) Monitoring** | 🟡 High | NCCR has maps | NCCR CRZ maps + satellite change detection | ⚠️ Regulatory sensitive |
| **Compensatory Afforestation Tracker** | 🟢 Medium | CAMPA fund data available | CAMPA state records + FSI planting data | ⚠️ Manual data entry likely |
| **Environmental Violations Map** | 🟡 High | NGT orders exist, not spatially mapped | NGT judgments + CPCB/MPCB inspection reports | ⚠️ NLP extraction needed |

### Priority Tiers Explained:

**🔴 Critical — Deploy First:**
These directly support statutory compliance and have the strongest data foundations.

**🟡 High — Phase 2:**
These require moderate data pipeline work but would be unique differentiators.

**🟢 Medium — Phase 3:**
Valuable but either data access is harder or the audience is narrower.

---

## 4. How Would This Help NGT (National Green Tribunal) Compliance?

The NGT (est. 2010 under the National Green Tribunal Act) handles civil cases related to environmental issues. Project Arjun could transform NGT compliance from reactive to proactive:

### 4.1 Proactive Evidence Generation
- **Satellite-based encroachment detection** → File suo motu evidence for NGT cases
- **River quality time-series** → Prove pollution trends beyond consented limits for NGT directives
- **Mining violation documentation** → Satellite before/after evidence for illegal mining cases

### 4.2 Compliance Monitoring Dashboard
- **NGT order compliance tracker** — Map every NGT order with geographic scope; overlay with current ground status
- **Deadline monitoring** — Track whether CPCB/MPCB/complying authority met NGT-mandated timelines
- **Penalty visualization** — Show NGT-imposed environmental compensation amounts by district
- **Direction-wise mapping** — Air quality directions, mining directions, forest diversion directions — all geotagged

### 4.3 Specific NGT Case Categories This Addresses:

| NGT Category | Arjun Layer | How It Helps |
|--------------|------------|--------------|
| Illegal mining | Mining monitoring + satellite change detection | Automated evidence of unauthorized excavation |
| River pollution | River Health Index + STP overlay | Prove discharge violations beyond NGT limits |
| Forest encroachment | Forest boundary + building detection | Document construction within protected zones |
| Air pollution | Real-time AQI + hotspot analysis | Prove non-attainment areas exceeding NAAQS |
| Wetland destruction | Wetland mapping + change detection | Show reclamation/filling of notified wetlands |
| Coastal zone violations | CRZ boundary + construction overlay | Detect unauthorized construction in CRZ-I/II |

### 4.4 Transparency & Public Accountability
- **Publish CPCB/MPCB compliance data on the platform** — Make it harder for state boards to hide failures
- **Citizen complaint geotagging** — Allow public to file environmental complaints with geolocation
- **Show Cause Notice tracking** — Map where SCNs have been issued vs. where violations persist

---

## 5. Integration Needs — APIs & Data Sources

### 5.1 CPCB (Central Pollution Control Board)

| Data | Source | Format | Access |
|------|--------|--------|--------|
| Real-time AQI | data.gov.in API (CPCB real-time air quality) | JSON | API key required, free |
| Water quality | CPCB water quality data portal | CSV/PDF | Download |
| Industrial CTO database | CPCB Consent Management | Internal | ⚠️ Not publicly available |
| CRZ monitoring | CPCB coastal monitoring | CSV | Periodic download |

**API Endpoint**: `https://api.data.gov.in/resource/...` (search "air quality" in data.gov.in catalog)  
**Challenge**: CPCB data.gov.in API sometimes has stale data (last updated months ago). Real-time feed reliability is inconsistent.

### 5.2 Forest Survey of India (FSI)

| Data | Source | Format | Access |
|------|--------|--------|--------|
| ISFR forest cover | FSI biennial reports | PDF + district-level CSV | Download from fsi.nic.in |
| Forest cover change | ISFR change matrices | CSV by state/district | Download |
| Fire alerts | FIRMS (NASA) | CSV/KML | Near real-time, free API |

**Challenge**: FSI does not provide granular (village-level) forest cover data publicly. Only state/district aggregates.

### 5.3 Satellite Imagery

| Source | Resolution | Revisit | Cost | Best For |
|--------|-----------|---------|------|----------|
| **Sentinel-2 (ESA Copernicus)** | 10m | 5 days | Free | Forest cover change, mining, land use |
| **Landsat 8/9 (USGS)** | 30m | 16 days | Free | Long-term land use change, thermal |
| **ISRO Bhuvan** | Varies (Cartosat: 2.5m) | Variable | Free (limited) | Indian admin boundaries, LULC |
| **Planet Labs** | 3-5m | Daily | 💰 Commercial | High-frequency change detection |
| **Google Earth Engine** | Multiple | — | Free (research) | Analysis at scale, preprocessed indices |

**Recommendation**: **Sentinel-2 via Copernicus Open Access Hub** is the sweet spot — 10m resolution, 5-day revisit, completely free, excellent for forest/mining change detection. Use Google Earth Engine for pre-built analysis pipelines (NDVI, NDMI, forest loss algorithms).

### 5.4 Other Sources

| Source | Data | URL | Format |
|--------|------|-----|--------|
| **Global Forest Watch** | GLAD deforestation alerts, tree cover | globalforestwatch.org | API (free) |
| **CGWB** | Groundwater levels + quality | cgwb.gov.in | PDF/CSV |
| **India-WRIS** | River basins, water bodies, dams | indiawris.gov.in | GeoJSON/Shapefile |
| **NTCA** | Tiger corridors, reserves | ntca.gov.in | Shapefiles (limited) |
| **MoEFCC PARIVESH** | Forest clearance proposals | parivesh.nic.in | Web portal |
| **NRSC/ISRO** | Wetland atlas, LULC maps | bhuvan.nrsc.gov.in | WMS/Download |
| **DMG Maharashtra** | Mining lease boundaries | dmgm.maha.gov.in | Shapefile/PDF |
| **MPCB** | State-level pollution data | mpcb.gov.in | Reports/PDF |

---

## 6. What Would Environmentalists Actually Use?

Let's be honest — environmentalists, activists, and NGO researchers don't need fancy 3D globes. They need:

### 6.1 Quick Evidence for Complaints/RTIs
- **"Show me forest cover change in Taluka X between 2019-2025"** — slider comparison of satellite imagery
- **"What's the AQI trend near MIDC Chakan for the last 3 years?"** — time-series chart exportable as evidence
- **"Where are illegal mining operations in Ratnagiri district?"** — overlay mining leases with satellite change detection

### 6.2 Data They Can't Get Elsewhere
- **Consolidated river quality** — CPCB + CGWB + state board data merged into one view (currently requires visiting 3 different portals)
- **Forest clearance overlay** — MoEFCC PARIVESH approvals geotagged on the map (currently buried in PDFs)
- **NGT order compliance status** — spatially mapped (nobody does this currently)

### 6.3 Shareable Maps for Advocacy
- **Export maps as PNG/PDF** for court submissions, media, social media
- **Embeddable widgets** for NGO websites
- **Before/after comparison sliders** for deforestation/mining stories

### 6.4 Alert System
- **Subscribe to alerts for a specific area** — "Notify me if deforestation alerts appear within 5km of Bhimashankar Wildlife Sanctuary"
- **Track specific river stretch** — "Alert me if BOD at monitoring point Y exceeds 30 mg/L"
- **Mining activity alerts** — "Show me new excavation detected in ESA Zone 3"

### 6.5 Community Data Contribution
- **Upload geotagged field photos** — ground-truth satellite detections
- **Citizen water quality testing** — contribute simple pH/turbidity readings
- **Document violations** — geotagged reports with photo evidence

### What They WON'T Use:
- Complex GIS tools requiring training
- Raw data dumps without spatial context
- Anything requiring account creation before seeing data
- Platforms that don't work on mobile (many field workers use phones)

---

## 7. Climate Action Planning — Making Arjun Useful

### 7.1 Urban Heat Island Analysis
- **Landsat thermal band data** → surface temperature maps
- **Correlate with green cover** → tree density vs. temperature
- **Identify priority cooling zones** → where to plant trees for maximum heat reduction
- **Building material analysis** → concrete/asphalt vs. vegetation surface temperature differential

### 7.2 Carbon Stock Estimation
- **Forest biomass mapping** → use FSI growing stock data + satellite-derived canopy density
- **Urban tree carbon** → tree census data with species-specific carbon sequestration rates
- **Blue carbon** → mangrove and wetland carbon stock mapping (critical for Maharashtra's 720km coastline)
- **Emissions overlay** → CPCB industrial emission data as carbon proxy (Scope 1 from point sources)

### 7.3 Climate Vulnerability Mapping
- **Flood risk zones** → overlay flood-prone areas (CWC flood atlas) with population density
- **Drought vulnerability** → IMD rainfall deviation + groundwater depletion + crop dependency
- **Coastal erosion** → compare shoreline positions from multi-temporal satellite imagery
- **Landslide susceptibility** → Western Ghats slope analysis + rainfall triggers
- **Cyclone impact zones** → IMD cyclone track history + vulnerable infrastructure

### 7.4 Renewable Energy Siting
- **Solar irradiance maps** → IMD solar radiation data + land availability
- **Wind potential zones** → MNRE wind atlas overlay with forest/building constraints
- **Biomass availability** → district-wise agricultural residue data for bioenergy
- **Avoid ecologically sensitive zones** → automatically exclude forest, wetland, ESA from RE siting

### 7.5 SDG Monitoring (Environmental Goals)
- **SDG 13 (Climate Action)** → Track state-level emissions, adaptation measures
- **SDG 15 (Life on Land)** → Forest cover trends, protected area management effectiveness
- **SDG 6 (Clean Water)** → Water quality compliance rates, safe drinking water coverage
- **SDG 11 (Sustainable Cities)** → Urban green cover, air quality, waste management
- **SDG 14 (Life Below Water)** → Coastal/marine ecosystem health (for coastal Maharashtra)

### 7.6 State Action Plan on Climate Change (SAPCC) Support
- Maharashtra's SAPCC identifies 8 missions. Arjun can track:
  - **Green Maharashtra Mission** → afforestation targets vs. actual planting (satellite verification)
  - **Water Security Mission** → groundwater recharge tracking, watershed health
  - **Sustainable Agriculture Mission** → crop pattern changes, soil health trends
  - **Solar Mission** → rooftop solar adoption mapping

---

## 8. Specific Environmental Monitoring Recommendations

### Phase 1: Quick Wins (0-3 months)

| # | Feature | Data Source | Implementation |
|---|---------|------------|----------------|
| 1 | **CPCB AQI Layer** | data.gov.in API | Poll API, show stations with color-coded AQI on map |
| 2 | **Forest Cover (ISFR)** | FSI ISFR 2023 CSV | District-level choropleth, change from previous ISFR |
| 3 | **NASA FIRMS Fire Alerts** | FIRMS API (free) | Last 24h/7d/30d active fire detections |
| 4 | **River Monitoring Points** | CPCB water quality CSV | Static layer showing monitoring station locations + latest readings |
| 5 | **Protected Area Boundaries** | WII/ENVIS shapefiles | National Parks, Wildlife Sanctuaries, Tiger Reserves |

### Phase 2: Differentiators (3-6 months)

| # | Feature | Data Source | Implementation |
|---|---------|------------|----------------|
| 6 | **Sentinel-2 Change Detection** | Copernicus / Google Earth Engine | Quarterly forest cover change for Western Ghats |
| 7 | **Mining Lease Overlay** | DMG Maharashtra | Active lease boundaries + satellite verification |
| 8 | **River Health Index** | CPCB + CGWB composite | Custom index: BOD, DO, coliform, heavy metals weighted score |
| 9 | **Wetland Mapping** | NRSC Wetland Atlas | Wetland boundaries + change detection |
| 10 | **GLAD Deforestation Alerts** | Global Forest Watch API | Weekly deforestation alerts within forest boundaries |

### Phase 3: Advanced (6-12 months)

| # | Feature | Data Source | Implementation |
|---|---------|------------|----------------|
| 11 | **NGT Compliance Tracker** | NGT orders + geo-extraction | Map NGT orders to geographic areas, track compliance |
| 12 | **Urban Heat Island Analysis** | Landsat thermal bands | Surface temperature maps for major cities |
| 13 | **Automated Encroachment Detection** | Sentinel-2 + ML | New structure detection within forest boundaries |
| 14 | **Wildlife Corridor Connectivity** | NTCA + forest cover data | Corridor integrity assessment |
| 15 | **Climate Vulnerability Index** | Multi-source composite | Flood + drought + heat + coastal erosion composite |

### Data Pipeline Architecture (Environmental)

```
┌─────────────────────────────────────────────────┐
│              Environmental Data Pipeline         │
├─────────────────┬───────────────────────────────┤
│  Real-time      │  CPCB AQI API (hourly)        │
│                 │  FIRMS Fire Alerts (daily)      │
│                 │  GFW GLAD Alerts (weekly)        │
├─────────────────┼───────────────────────────────┤
│  Periodic       │  CGWB Groundwater (quarterly)  │
│                 │  CPCB Water Quality (monthly)   │
│                 │  FSI Forest Cover (biennial)    │
├─────────────────┼───────────────────────────────┤
│  Satellite      │  Sentinel-2 (5-day revisit)    │
│                 │  Landsat (16-day revisit)       │
│                 │  GEE Analysis Pipelines         │
├─────────────────┼───────────────────────────────┤
│  Static         │  Protected Area boundaries      │
│                 │  Mining lease boundaries         │
│                 │  River networks (India-WRIS)    │
│                 │  Wetland boundaries (NRSC)      │
└─────────────────┴───────────────────────────────┘
```

---

## 9. Ground Truth — What Would Make Me (as an Environmental Officer) Actually Use This

### Things I'm tired of:
1. **Checking 6 different portals** to get a complete environmental picture of one district
2. **Manually comparing PDFs** from ISFR 2021 and ISFR 2023 to identify forest cover changes
3. **Filing RTIs** to get CPCB inspection reports that should be public anyway
4. **No spatial context** for NGT orders — I know there's a violation somewhere in Ratnagiri but can't see it on a map
5. **Delayed data** — CPCB AQI data on data.gov.in is sometimes 6 months stale

### What would make me a daily user:
- **One-click district environmental profile** — Air, water, forest, mining status for any district in one view
- **Time-lapse satellite imagery** — Watch 10 years of change in a forest/mining area with a slider
- **Automated violation detection** — "Something changed in forest cover in this area" alert without me monitoring manually
- **Evidence export** — Download any map view as a court-ready image with timestamp, source attribution, and coordinates
- **Mobile-friendly** — I'm often in the field; I need to check data on my phone at the site

---

## 10. Summary — Environmental Monitoring Priority Matrix

```
                    HIGH IMPACT
                        │
    CPCB AQI ──────────┼────────── Forest Change Detection
    River Health Index ─┼────────── Mining Monitoring
                        │
    NGT Compliance ─────┼────────── Wildlife Corridors
                        │
    Wetland Mapping ────┼────────── Urban Heat Island
                        │
                    LOW IMPACT

   EASY TO IMPLEMENT ─────────── HARD TO IMPLEMENT
```

**Bottom line**: Start with CPCB AQI and forest change detection. These have the best data availability, solve real enforcement pain points, and would immediately differentiate Arjun from every other Indian geospatial platform. River Health Index is the third priority — it's composite but the data exists.

The environmental story is compelling: **India has the data to monitor its environment. What it lacks is the platform to fuse it into actionable intelligence.** Arjun can be that platform.

---

*Prepared by: State Pollution Control Board / Forest Department Review Officer*  
*For: Project Arjun — God's Eye Geospatial Intelligence Platform*  
*Date: 2026-04-23*
