# 🔍 News Verification Pipeline — Project Arjun

> A systematic methodology for verifying news claims against government data, satellite imagery, and cross-source corroboration.

**Last Updated:** April 2026

---

## Overview

India's information ecosystem is dense and noisy. A single event — a drought, a bridge collapse, a scheme failure — can generate hundreds of news articles across languages, many with conflicting claims, outdated statistics, or outright misinformation.

**Project Arjun's verification pipeline** cross-references incoming news against authoritative government data sources, satellite imagery, and multi-source corroboration to assign a **confidence score** and **verification status** to each claim.

### Verification Statuses

| Status | Meaning | Color Code |
|--------|---------|------------|
| ✅ **VERIFIED** | Claim matches official data + corroborated | Green |
| ⚠️ **PARTIALLY VERIFIED** | Some aspects confirmed, some unverifiable | Yellow |
| ❓ **UNVERIFIABLE** | Insufficient data to confirm or deny | Gray |
| ⚠️ **DISCREPANT** | Claim contradicts official data | Orange |
| ❌ **DEBUNKED** | Claim proven false by multiple authoritative sources | Red |

---

## Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    NEWS INGESTION LAYER                           │
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│  GDELT   │  RSS     │  Social  │  Manual  │  Government          │
│  2.0 API │  Feeds   │  Media   │  Input   │  Press Releases      │
│  (auto)  │ (auto)   │ (auto)   │ (manual) │ (auto)               │
└────┬─────┴────┬─────┴────┬─────┴────┬─────┴──────┬──────────────┘
     │          │          │          │             │
     ▼          ▼          ▼          ▼             ▼
┌──────────────────────────────────────────────────────────────────┐
│               EXTRACTION & NORMALIZATION                         │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────┐   │
│  │ NLP Entity  │ │ Geographic   │ │ Claim Extraction        │   │
│  │ Extraction  │ │ Geocoding    │ │ (what happened, where,  │   │
│  │ (WHO, WHAT) │ │ (WHERE)      │ │  when, what's the       │   │
│  │             │ │              │ │  specific claim?)        │   │
│  └─────────────┘ └──────────────┘ └─────────────────────────┘   │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────┐   │
│  │ Date/Time   │ │ Statistic    │ │ Scheme/Policy           │   │
│  │ Parsing     │ │ Extraction   │ │ Identification          │   │
│  │ (WHEN)      │ │ (numbers,    │ │ (which gov program      │   │
│  │             │ │  percentages)│ │  is referenced?)        │   │
│  └─────────────┘ └──────────────┘ └─────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                   VERIFICATION ENGINE                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ LAYER 1: Data Cross-Reference                               │ │
│  │ Compare extracted claims against official databases          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ LAYER 2: Satellite Verification                             │ │
│  │ Check physical/geographic claims against imagery             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ LAYER 3: Multi-Source Corroboration                         │ │
│  │ Cross-check across multiple independent news sources         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ LAYER 4: Temporal Consistency                               │ │
│  │ Verify timeline of claims against known event sequences      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ LAYER 5: Source Credibility Assessment                      │ │
│  │ Evaluate the reliability of the reporting source             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SCORING & OUTPUT                               │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────┐   │
│  │ Confidence  │ │ Verification │ │ Evidence Package        │   │
│  │ Score       │ │ Status       │ │ (sources, data links,   │   │
│  │ (0-100)     │ │ (✅⚠️❓❌)  │ │  contradictions)        │   │
│  └─────────────┘ └──────────────┘ └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Data Cross-Reference

The primary verification method. Match claims against official government databases.

### Claim Categories & Data Sources

#### A. Statistical Claims
> *Example: "Farmer suicides in Vidarbha increased by 40% in 2025"*

```
Verification Sources:
1. NCRB Accidental Deaths & Suicides in India (annual report)
2. State crime records bureau data
3. data.gov.in datasets on agricultural distress
4. NITI Aayog indicators

Process:
1. Extract the statistic: "40% increase", "Vidarbha", "farmer suicides", "2025"
2. Query NCRB data for the same geography & time period
3. Calculate actual percentage change
4. If actual is within ±15% of claimed → PARTIALLY VERIFIED
5. If actual matches exactly → VERIFIED
6. If actual contradicts by >30% → DISCREPANT
7. If no data available → UNVERIFIABLE
```

#### B. Infrastructure / Development Claims
> *Example: "Only 60% of Jal Jeevan Mission tap connections in Maharashtra are functional"*

```
Verification Sources:
1. Jal Jeevan Mission dashboard (jaljeevanmission.gov.in)
2. data.gov.in water supply datasets
3. State PWD reports
4. CGWB water quality data

Process:
1. Extract: scheme name, geography, percentage claimed
2. Pull official JJM dashboard data for same district/state
3. Compare functional connection percentage
4. Flag discrepancies >10 percentage points
```

#### C. Budget / Financial Claims
> *Example: "Maharashtra allocated ₹500 crore for drought relief but spent only ₹120 crore"*

```
Verification Sources:
1. OpenBudgetsIndia — state budget documents
2. data.gov.in expenditure data
3. CAG (Comptroller & Auditor General) reports
4. State finance department annual reports

Process:
1. Extract: amount, purpose, state, allocation vs. expenditure
2. Pull budget documents for the relevant fiscal year
3. Verify allocation figure against budget document
4. Verify expenditure figure against actual expenditure reports
5. If allocation matches ±5% and expenditure matches ±10% → VERIFIED
```

#### D. Scheme Beneficiary Claims
> *Example: "10 lakh farmers in Marathwada didn't receive PM-KISAN installments"*

```
Verification Sources:
1. PM-KISAN portal (pmkisan.gov.in) — beneficiary data
2. State agriculture department records
3. data.gov.in PM-KISAN datasets

Process:
1. Extract: scheme name, geography, beneficiary count claimed
2. Pull official beneficiary counts from PM-KISAN portal
3. Cross-reference with Aadhaar-linked payment data if available
4. Compare claimed non-receipt with actual disbursement data
```

#### E. Weather / Climate Claims
> *Example: "Maharashtra received 40% below normal rainfall this monsoon"*

```
Verification Sources:
1. IMD (India Meteorological Department) rainfall data
2. Open-Meteo historical weather API
3. IMD district-wise rainfall reports

Process:
1. Extract: geography, metric (rainfall), time period, deviation claimed
2. Pull IMD actual rainfall data for the period
3. Calculate actual deviation from Long Period Average (LPA)
4. If within ±5% of claimed → VERIFIED
```

---

## Layer 2: Satellite Verification

Cross-reference physical/geographic claims against satellite imagery.

### What Satellites Can Verify

| Claim Type | Satellite Source | Method |
|-----------|-----------------|--------|
| Flood extent | Sentinel-1 SAR, MODIS | Water body detection |
| Drought conditions | Sentinel-2, Landsat | NDVI vegetation index |
| Deforestation | Sentinel-2, Landsat | Change detection |
| Urban expansion | Sentinel-2, Google Earth | Time-series comparison |
| Crop burning | NASA FIRMS, Sentinel-2 | Active fire + burn scars |
| Dam/reservoir levels | Sentinel-2, Landsat | Water surface area |
| Road/bridge construction | Sentinel-2, Google Earth | Before/after comparison |
| Mining activity | Sentinel-2, Landsat | Spectral analysis |

### Verification Process

```python
# Pseudocode for satellite verification

def verify_with_satellite(claim):
    """
    Example claim: "Massive flooding in Kolhapur district displaced 50,000 people"
    """
    
    # Step 1: Extract geospatial parameters
    location = geocode("Kolhapur district, Maharashtra")  # → bbox
    date_range = parse_date(claim.date)  # → start_date, end_date
    event_type = "flood"
    
    # Step 2: Pull satellite data
    if event_type == "flood":
        # Sentinel-1 SAR for flood extent (works through clouds)
        imagery = fetch_sentinel1(bbox=location, dates=date_range)
        water_extent = detect_water_bodies(imagery)  # in sq km
        
        # Compare with normal water extent
        baseline = fetch_baseline_water_extent(location, month=date_range.month)
        anomaly = water_extent / baseline  # ratio
    
    # Step 3: Assess claim plausibility
    if event_type == "flood":
        # If water extent is significantly above baseline
        if anomaly > 2.0:  # 2x normal
            verification = "Satellite confirms extensive flooding"
            score_adjustment = +20
        elif anomaly > 1.3:
            verification = "Satellite shows above-normal water extent"
            score_adjustment = +10
        else:
            verification = "Satellite does not confirm flooding"
            score_adjustment = -30
    
    return verification, score_adjustment
```

### Tools for Satellite Verification
```
Sentinel Hub Playground (free):
https://apps.sentinel-hub.com/playground/
→ Visual inspection of Sentinel-2 imagery
→ Custom scripts for NDVI, water detection

Google Earth Engine (free for research):
https://earthengine.google.com
→ Historical imagery archive since 1972
→ Pre-built flood/drought/deforestation tools

NASA Worldview (free):
https://worldview.earthdata.nasa.gov
→ Daily global imagery
→ Fire, flood, dust storm overlays

Sentinel EO Browser (free):
https://apps.sentinel-hub.com/eo-browser/
→ Multi-spectral analysis
→ Before/after comparisons
```

---

## Layer 3: Multi-Source Corroboration

A claim reported by only one source is less reliable than one reported by many independent sources.

### Corroboration Scoring

```
Source Count → Score Adjustment:
  1 source only         → 0 (no corroboration bonus)
  2 independent sources → +10
  3-4 independent       → +15
  5+ independent        → +20

Source Diversity Bonus:
  If sources include mix of:
    - National media (TOI, Hindu, IE, NDTV)
    - Regional media (Loksatta, Maharashtra Times)
    - Wire services (PTI, ANI, Reuters)
    - Government press releases
  → Additional +5 for diversity
```

### Independence Detection
```
Sources are NOT independent if:
- Same parent company (e.g., Times of India + Economic Times)
- One is clearly citing the other
- Same byline / same reporter
- Published within minutes of each other (syndicated feed)

Sources ARE independent if:
- Different parent organizations
- Different reporters with different interviews/sources
- Published on different dates with additional reporting
- Include original data or quotes not in other reports
```

### GDELT Corroboration
```
Using GDELT to assess multi-source coverage:

query = "maharashtra drought 2025"
results = gdelt_search(query, timespan="30d")

num_articles = results.total_articles
num_sources = results.unique_sources
avg_tone = results.avg_tone  # -100 to +100

If num_sources >= 5 AND from distinct outlets:
    corroboration_bonus = +20
```

---

## Layer 4: Temporal Consistency

Verify that claimed events fit within a logical timeline.

### Temporal Checks

```
1. PUBLICATION RECENCY
   - Is the article actually about current events or resurfacing old news?
   - Check: article date vs. event date
   - If article date is 30+ days after event date, flag as "delayed reporting"

2. CAUSAL SEQUENCING
   - Do the events described follow a logical sequence?
   - Example: "Government announced drought relief after poor monsoon"
     → Verify: was monsoon actually poor (IMD data)?
     → Verify: was relief announced (government gazette/press release)?
   
3. STATISTICAL TIMING
   - If a claim says "last year", "this quarter", verify the time period matches
   - Census data is from 2011 — if someone cites "latest census figures", 
     they're citing 15-year-old data unless they specify NFHS

4. EVENT CHAIN VALIDATION
   - "Heavy rains → floods → displacement → relief camps"
   - Each link in the chain should be independently verifiable
   - IMD data → satellite imagery → GDELT reports → gov relief order
```

---

## Layer 5: Source Credibility Assessment

Not all sources are equal. Assign a baseline credibility score to reporting outlets.

### Source Credibility Tiers

| Tier | Sources | Base Credibility |
|------|---------|-----------------|
| **T1: Wire Services** | PTI, ANI, Reuters, AP | 90-95 |
| **T2: National Dailies** | The Hindu, Indian Express, TOI, HT | 80-90 |
| **T3: Regional Dailies** | Loksatta, Eenadu, Dinamalar, etc. | 70-85 |
| **T4: TV News** | NDTV, India Today, CNN-News18 | 65-80 |
| **T5: Digital Native** | The Wire, Scroll, Print, Quint | 60-80 |
| **T6: Government Sources** | PIB, ministry websites | 85-95 (official data) |
| **T7: Blogs / Social Media** | Individual accounts, WhatsApp forwards | 20-50 |
| **T8: Known Misinfo Outlets** | Flagged sources | 10-30 |

### Credibility Modifiers
```
+10  if source has a corrections/retractions policy
+10  if source cites specific data/documents
+5   if source includes named officials with verifiable positions
-10  if headline is sensationalized (ALL CAPS, excessive punctuation)
-15  if source has history of corrections on similar topics
-20  if no byline or anonymous reporting
-25  if source is a WhatsApp forward / social media rumor
```

---

## Confidence Score Calculation

### Formula

```
CONFIDENCE SCORE = BASE_SCORE + LAYER_SCORES + ADJUSTMENTS

Where:
  BASE_SCORE = 50 (neutral starting point)
  
  LAYER_SCORES:
    Data Cross-Reference    : +20 (confirmed) / 0 (unverifiable) / -20 (contradicted)
    Satellite Verification  : +15 (confirmed) / 0 (n/a)         / -15 (contradicted)
    Multi-Source            : +20 (5+ sources) / +10 (2-4) / 0 (1 source)
    Temporal Consistency    : +10 (consistent) / 0 (unclear) / -15 (inconsistent)
    Source Credibility      : +10 (T1-T2) / +5 (T3-T4) / 0 (T5-T6) / -10 (T7-T8)
  
  ADJUSTMENTS:
    Specificity Bonus       : +5 if claim includes specific data points
    Official Confirmation   : +10 if government confirms
    Historical Pattern      : +5 if consistent with known patterns
    Extraordinary Claim     : -10 if claim is unusual (extraordinary claims 
                              require extraordinary evidence)

SCORE RANGE: 0-100

VERIFICATION STATUS:
  85-100 → ✅ VERIFIED
  65-84  → ⚠️ PARTIALLY VERIFIED  
  40-64  → ❓ UNVERIFIABLE
  20-39  → ⚠️ DISCREPANT
  0-19   → ❌ DEBUNKED
```

### Example Calculation

```
CLAIM: "Floods in Kolhapur displaced 50,000 people in August 2025"
SOURCE: Loksatta (regional daily)

Base Score:                                          50

Data Cross-Reference:
  - IMD shows 280mm rainfall in 48hrs (verified)    
  - District admin report says 48,000 displaced      +20 (close match)

Satellite Verification:
  - Sentinel-1 shows 340 sq km flood extent
  - Normal river extent: 80 sq km
  - Anomaly: 4.25x → extensive flooding confirmed    +15

Multi-Source:
  - GDELT: 12 articles from 8 unique sources         +15

Temporal Consistency:
  - IMD data matches article timeline                +10

Source Credibility:
  - Loksatta (T3) = +75 base → adjusted              +5

Adjustments:
  - Specific number cited (+5)
  - Consistent with known flood patterns (+5)
  - Not an extraordinary claim (0)

TOTAL: 50 + 20 + 15 + 15 + 10 + 5 + 5 + 5 = 125 → capped at 100

RESULT: ✅ VERIFIED (score: 100)
Evidence: IMD rainfall data, Sentinel-1 flood extent, 
          8 independent news sources, district admin report
```

---

## Implementation: Verification Claim Schema

```json
{
  "claim_id": "arjun-2025-08-15-001",
  "headline": "Floods in Kolhapur displaced 50,000 people",
  "source": {
    "name": "Loksatta",
    "url": "https://www.loksatta.com/...",
    "tier": 3,
    "credibility_base": 75,
    "publish_date": "2025-08-15T08:30:00+05:30",
    "byline": "Rahul Patil"
  },
  "extracted_claims": [
    {
      "type": "displacement",
      "metric": "people_displaced",
      "value": 50000,
      "unit": "people",
      "geography": {
        "state": "Maharashtra",
        "district": "Kolhapur",
        "coordinates": [16.705, 74.243]
      },
      "time_period": {
        "start": "2025-08-13",
        "end": "2025-08-15"
      }
    }
  ],
  "verification_layers": {
    "data_cross_reference": {
      "status": "confirmed",
      "score": 20,
      "evidence": [
        {
          "source": "IMD District Rainfall",
          "finding": "280mm rainfall in 48hrs at Kolhapur",
          "url": "https://mausam.imd.gov.in/...",
          "match_quality": "strong"
        },
        {
          "source": "District Administration Report",
          "finding": "48,000 displaced per official count",
          "url": "...",
          "match_quality": "close",
          "deviation": "-4% from claimed"
        }
      ]
    },
    "satellite_verification": {
      "status": "confirmed",
      "score": 15,
      "evidence": [
        {
          "source": "Sentinel-1 SAR",
          "finding": "340 sq km flood extent vs 80 sq km baseline",
          "anomaly_ratio": 4.25,
          "imagery_date": "2025-08-14",
          "url": "https://apps.sentinel-hub.com/..."
        }
      ]
    },
    "multi_source": {
      "status": "confirmed",
      "score": 15,
      "total_articles": 12,
      "unique_sources": 8,
      "source_list": ["Loksatta", "TOI", "Hindu", "NDTV", "PTI", "ANI", "IE", "DD"]
    },
    "temporal_consistency": {
      "status": "consistent",
      "score": 10,
      "notes": "IMD data, satellite imagery, and article timeline align"
    },
    "source_credibility": {
      "status": "reliable",
      "score": 5,
      "tier": 3,
      "modifiers": ["specific_data_cited", "named_reporter"]
    }
  },
  "adjustments": {
    "specificity_bonus": 5,
    "official_confirmation": 0,
    "historical_pattern": 5,
    "extraordinary_claim": 0
  },
  "final_score": 125,
  "capped_score": 100,
  "verification_status": "VERIFIED",
  "verified_at": "2025-08-15T10:00:00+05:30",
  "verified_by": "arjun-pipeline-v1"
}
```

---

## Specific Verification Playbooks

### Playbook 1: Drought/Flood Claims

```
CLAIM: "X district faces severe drought/flood"

VERIFICATION STEPS:
1. IMD rainfall data    → Is rainfall deficient/excessive?
2. Sentinel-2 imagery   → Vegetation index (NDVI) for drought / water extent for flood
3. Reservoir levels     → CWC (Central Water Commission) data
4. District admin reports → Official disaster declarations
5. GDELT news corroboration → Other outlets reporting same?
6. Historical comparison → Is this unusual for this district?

DATA SOURCES:
- IMD: mausam.imd.gov.in
- CWC: indiawris.gov.in (reservoir storage)
- Sentinel-2: EO Browser
- NDVI: Copernicus Global Land Service
- GDELT: api.gdeltproject.org

THRESHOLDS:
- Drought: IMD shows >25% rainfall deficit AND NDVI shows vegetation stress
- Flood: Satellite shows >2x normal water extent AND IMD shows heavy rainfall alert
```

### Playbook 2: Scheme Implementation Claims

```
CLAIM: "Only X% of beneficiaries received Y scheme benefits"

VERIFICATION STEPS:
1. Identify the scheme → PM-KISAN, MGNREGA, Jal Jeevan, etc.
2. Pull official beneficiary data from scheme portal
3. Pull disbursement/payment data
4. Calculate actual coverage percentage
5. Compare with claimed percentage
6. Check state-wise breakdown for the specific geography

DATA SOURCES:
- PM-KISAN: pmkisan.gov.in
- MGNREGA: nregade4.nic.in
- Jal Jeevan: jaljeevanmission.gov.in
- data.gov.in: scheme-specific datasets
- OpenBudgetsIndia: expenditure data

COMMON DISCREPANCIES:
- Claim cites old data (pre-COVID vs post-COVID coverage)
- Claim confuses "registered" with "benefited"
- Claim uses different denominator (total population vs eligible)
```

### Playbook 3: Infrastructure Completion Claims

```
CLAIM: "X highway/bridge/building completed/opened"

VERIFICATION STEPS:
1. Check if project exists in NHAI/State PWD records
2. Pull satellite imagery for the location
3. Compare before/after images (time series)
4. Check if completion date matches announcement
5. Cross-reference with official inauguration news

DATA SOURCES:
- NHAI: nhai.gov.in (project status)
- PMGSY: omms.nic.net.in (rural roads)
- Google Earth Pro: historical imagery comparison
- Sentinel-2: EO Browser time series
- PIB: pib.gov.in (press releases)

SATELLITE DETECTION:
- Road/rail: linear feature visible in imagery
- Bridge: structure spanning water body
- Building: structure change between dates
- Dam: water body formation behind structure
```

### Playbook 4: Crime/Social Unrest Claims

```
CLAIM: "X number of incidents/victims in Y area"

VERIFICATION STEPS:
1. Check NCRB data (annual, so usually not current)
2. Check state police data if available
3. Check GDELT for protest/unrest event codes
4. Multi-source corroboration critical here
5. Social media verification (geolocated photos/videos)

CAUTIONS:
- Crime data is always delayed (NCRB publishes annually)
- Current incidents rely heavily on news corroboration
- Numbers in breaking news are often revised
- Political motivation may affect reporting

CONFIDENCE ADJUSTMENT:
- For crime claims: max confidence = 80 (unless official FIR data)
- For social unrest: rely on satellite + multiple visual confirmations
```

### Playbook 5: Health/Epidemic Claims

```
CLAIM: "Epidemic outbreak in X area with Y cases"

VERIFICATION STEPS:
1. Check IDSP (Integrated Disease Surveillance Programme) alerts
2. Check state health department bulletins
3. Check WHO/NCDC India data
4. Hospital bed availability (if claimed overwhelmed)
5. Medicine/vaccine availability data

DATA SOURCES:
- IDSP: idsp.nic.in (weekly outbreak reports)
- MoHFW: mohfw.gov.in (official bulletins)
- ICMR: icmr.gov.in (testing data)
- NFHS: nfhs.gov.in (baseline health indicators)
- State health departments

THRESHOLDS:
- Official declared outbreak: HIGH confidence
- GDELT shows 10+ independent reports: corroborated
- Hospital data shows surge: additional confirmation
- Government denies despite evidence: flag discrepancy
```

---

## Automation Strategy

### Phase 1: Semi-Automated
```
Human selects claim to verify → Pipeline runs all layers → 
Human reviews evidence package → Human makes final call

Benefits: High accuracy, human judgment for ambiguous cases
Cost: Labor-intensive
```

### Phase 2: Fully Automated with Human Review
```
GDELT auto-ingest → Claim extraction (NLP) → 
All layers run automatically → Score calculated → 
Flag high-impact or low-confidence claims for human review

Benefits: Scales to hundreds of claims/day
Cost: Requires robust NLP pipeline
```

### Phase 3: ML-Enhanced
```
Train classifier on verified/debunked claims from Phase 1-2:
- Features: source tier, claim type, geography, statistics presence,
  source count, historical pattern match, satellite confirmation
- Output: verification probability

Use ML prediction as additional layer in scoring.
Human review for edge cases only.
```

---

## Known Limitations & Mitigations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Census data is from 2011 | Can't verify current demographics | Use NFHS-5 (2019-21) as interim; note data age |
| No real-time crime data | Can't verify specific incident counts quickly | Rely on multi-source corroboration; cap confidence at 80 |
| Government data may be incomplete | Official data might not capture reality | Combine multiple official sources; flag gaps |
| Satellite can't see everything | Under-canopy, indoor events invisible | Accept limitations; don't claim verification for non-observable events |
| Regional language news | GDELT works best for English/Hindi | Use GDELT's 100+ language support; add regional RSS feeds |
| Lag in data publication | Gov data often months/years behind | Track publication dates; warn when comparing stale data to fresh claims |

---

## Dashboard Integration

### Verification Card UI
```
┌─────────────────────────────────────────────┐
│ 🔍 CLAIM VERIFICATION                       │
├─────────────────────────────────────────────┤
│ "Floods in Kolhapur displaced 50,000"       │
│ Source: Loksatta | Aug 15, 2025             │
├─────────────────────────────────────────────┤
│                                             │
│  ✅ VERIFIED — Score: 100/100               │
│                                             │
│  Layers:                                    │
│  ████████████████  Data Match         ✅    │
│  ████████████████  Satellite Confirms ✅    │
│  ████████████████  8 Sources          ✅    │
│  ████████████████  Timeline OK        ✅    │
│  ████████████░░░░  Source Reliable    ⚠️    │
│                                             │
│  Evidence:                                  │
│  • IMD: 280mm in 48hrs                     │
│  • Sentinel-1: 340 sq km flooded           │
│  • District Admin: 48,000 displaced        │
│  • 8 independent news sources              │
│                                             │
│  [View on Map] [View Satellite] [Full Report]│
└─────────────────────────────────────────────┘
```

### Map Overlay
```
Claims plotted on map with:
  🟢 Green pins = Verified
  🟡 Yellow pins = Partially verified
  ⚪ Gray pins = Unverifiable
  🟠 Orange pins = Discrepant
  🔴 Red pins = Debunked

Click pin → Verification card with evidence
Filter by: claim type, date range, confidence score, geography
```

---

*This verification pipeline is the intellectual core of Project Arjun. It transforms raw news into verified intelligence — the difference between information and knowledge.*
