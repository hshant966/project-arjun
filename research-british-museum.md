# 🌍 "God's Eye: The Colonial Cartography" — Research Document
## Mapping the Origins of the British Museum's Collection

> *"The largest collection of stolen goods in history — now visible from space."*

---

## 1. DATA SOURCES

### 1.1 British Museum Collection Online

**URL:** https://www.britishmuseum.org/collection

**Current State (as of 2026):**
- The British Museum claims **~8 million objects** in its total collection
- Approximately **half were never fully catalogued** (revealed after the 2023 theft scandal — ~2,000 artefacts stolen due to poor record-keeping)
- **Collection Online** provides search access to a subset of the collection via their web interface
- **SPARQL endpoint: NO LONGER ACTIVE** — The BM previously offered a Linked Open Data SPARQL endpoint for programmatic access, but Harvard researchers confirmed it is currently offline (as of 2024-2025)
- No public API, no bulk download, no CSV export currently available

**Data Access Strategy:**
1. **Web scraping** of Collection Online search results (rate-limit carefully, respect robots.txt)
2. **Structured search queries** — the online search allows filtering by:
   - Country/region of origin
   - Culture/period
   - Material
   - Object type
   - Date range
3. **Alternative:** Try the Wayback Machine for historical SPARQL data dumps
4. **Fallback:** Use the existing Brilliant Maps dataset (~5,000 mapped objects) as the seed dataset

### 1.2 Brilliant Maps Analysis (The Seed Dataset)

**Source:** https://brilliantmaps.com/british-museums-collection/

This is the **primary existing dataset** — a mapping of ~5,000 British Museum objects to their countries of origin. Originally sourced from Al Jazeera's analysis of BM collection data (credited as "credit: Al Jazeera / globalsouthworld").

**What we know about this dataset:**
- Maps objects by country of origin
- Ranks countries by number of items "contributed"
- Covers the most significant/categorised items (not the full 8 million)
- The data went viral on Instagram, Facebook, and Reddit
- Reddit discussion confirmed ~5,000 objects were mapped in the original analysis

**Data acquisition options:**
- Scrape the brilliantmaps.com page (Cloudflare-protected — may need browser automation)
- Contact the creators directly
- Reverse-engineer from the Al Jazeera source
- Reproduce by scraping BM Collection Online with country filters

### 1.3 Other Museum Databases (Expansion Targets)

#### 🏛️ Metropolitan Museum of Art (Met) — **BEST OPEN DATA**
- **470,000+ objects** with full metadata
- **REST API:** `https://collectionapi.metmuseum.org/public/collection/v1/`
  - No API key required
  - Rate limit: 80 requests/second
  - Returns JSON with: title, artist, date, culture, country, department, medium, dimensions, images
- **CSV Download:** `https://github.com/metmuseum/openaccess` (Git LFS)
- **License:** CC0 (Creative Commons Zero) — fully open
- **Fields available:** Object ID, Department, Culture, Country, Period, Dynasty, Reign, Portfolio, Artist Display Name, Artist Nationality, Object Date, Object Begin Date, Object End Date, Medium, Classification, Credit Line, Gallery Number

#### 🏛️ Smithsonian Institution — **MASSIVE BUT NEEDS KEY**
- **~15.5 million objects** across 19 museums
- **API:** `https://api.si.edu/openaccess/api/v1.0/`
  - Requires free API key (register at https://api.si.edu)
  - Search, images, metadata in JSON
- **Open Access:** CC0 for images, structured metadata available
- **Rich cultural/geographic metadata** across anthropology, natural history, art

#### 🏛️ Rijksmuseum (Amsterdam) — **WELL-STRUCTURED**
- **70,000+ objects** with high-quality metadata
- **API:** `https://data.rijksmuseum.nl/`
  - Free, well-documented
  - Includes: title, maker, dating, materials, techniques, dimensions, geographic origin
- **Excellent for Dutch colonial history** — Indonesian, Surinamese, Caribbean artifacts

#### 🏛️ Louvre — **LIMITED OPEN DATA**
- Partial online collection at https://collections.louvre.fr/
- No public API confirmed
- May require scraping

#### 🏛️ Europeana — **AGGREGATOR**
- Aggregates data from 3,000+ European institutions
- **API:** `https://www.europeana.eu/api`
- Good for cross-institutional queries
- Metadata varies by source institution

#### 🏛️ V&A, British Library, Natural History Museum
- UK institutions with varying levels of open data
- Could expand "British institutions holding looted goods" narrative

---

## 2. DATA STRUCTURE

### 2.1 British Museum Object Fields (from Collection Online)

Based on observed search interface and historical data:

| Field | Description | Geocoding Value |
|-------|-------------|-----------------|
| **Country** | Country of origin/making | PRIMARY — direct geocoding |
| **Culture** | Cultural group (e.g., "Benin", "Asante") | Secondary — needs mapping |
| **Period/Date** | When made (e.g., "17th century") | Timeline filter |
| **Material** | What it's made of (bronze, gold, ceramic) | Category filter |
| **Object type** | Classification (sculpture, vessel, textile) | Category filter |
| **Acquisition date** | When BM acquired it | KEY for colonial timeline |
| **Acquisition method** | How obtained (excavation, purchase, gift, etc.) | Narrates the "how" |
| **Registration number** | BM inventory ID | Unique identifier |
| **Title/Description** | What the object is | Display info |

### 2.2 Met Museum Object Fields (Confirmed)

```json
{
  "objectID": 437133,
  "title": "Title of Artwork",
  "culture": "Egyptian",
  "period": "New Kingdom, Dynasty 18",
  "objectDate": "-1353 to -1336",
  "objectBeginDate": -1353,
  "objectEndDate": -1336,
  "country": "Egypt",
  "region": "Upper Egypt",
  "classification": "Sculpture",
  "medium": "Limestone",
  "department": "Egyptian Art",
  "creditLine": "Gift of John D. Rockefeller Jr., 1933",
  "GalleryNumber": "135"
}
```

### 2.3 Geocoding Strategy

**Country-level geocoding** (primary approach):
- Use a **country centroid database** (Natural Earth, GeoNames)
- Map country names → lat/lon centroids
- ~200 countries = trivial lookup

**Region/culture-level geocoding** (secondary):
- Map cultural groups to approximate regions:
  - "Benin" → Benin City, Nigeria (6.33°N, 5.63°E)
  - "Asante" → Kumasi, Ghana (6.69°N, 1.62°W)
  - "Khmer" → Angkor, Cambodia (13.41°N, 103.87°E)
  - "Mughal" → Agra/Delhi, India
- Build a **cultural geography lookup table** (~100-200 entries)

**City/site-level geocoding** (for notable objects):
- Rosetta Stone → Rashid, Egypt (31.40°N, 30.42°E)
- Parthenon Marbles → Athens, Greece (37.97°N, 23.73°E)
- Benin Bronzes → Benin City, Nigeria
- Moai → Rapa Nui (Easter Island)

### 2.4 Handling Disputed Origins

**Approach: Transparency, not adjudication**
- Label disputed items clearly
- Show both the BM's stated origin AND the claiming nation's position
- Examples:
  - Parthenon Marbles: BM says "Greece, acquired legally"; Greece says "looted by Elgin"
  - Benin Bronzes: BM says "Nigeria, punitive expedition"; Nigeria says "stolen in 1897"
  - Rosetta Stone: BM says "Egypt, spoils of war"; Egypt says "stolen after French defeat"
- **Visual treatment:** Use distinct markers/colors for contested items
- **Link to repatriation status:** Has the item been requested? By whom? What was the response?

### 2.5 Categorisation Framework

**By Era:**
| Era | Period | Color Code |
|-----|--------|------------|
| Ancient | Pre-500 CE | 🟤 Amber/Gold |
| Medieval | 500-1500 CE | 🔵 Deep Blue |
| Early Colonial | 1500-1750 | 🟠 Burnt Orange |
| High Colonial | 1750-1900 | 🔴 Crimson Red |
| Late Colonial | 1900-1960 | 🟣 Deep Purple |
| Modern | 1960+ | 🟢 Teal |

**By Type:**
- Sculpture & Statuary
- Metalwork (bronzes, gold, silver)
- Ceramics & Pottery
- Textiles & Clothing
- Manuscripts & Documents
- Jewelry & Ornaments
- Paintings & Drawings
- Natural History
- Human Remains (controversial category)
- Religious Objects

**By Region (for filtering):**
- Africa (North, West, East, Southern, Central)
- Asia (East, South, Southeast, Central, West)
- Americas (North, Central, South, Caribbean)
- Europe (Mediterranean, Northern, Eastern)
- Oceania (Pacific Islands, Australia, New Zealand)
- Middle East

---

## 3. VISUALISATION DESIGN

### 3.1 Core Concept: The Globe

**Technology:** CesiumJS (same as Project Arjun)
- Full 3D globe with zoom, rotate, tilt
- Atmospheric rendering, star field background
- Day/night cycle for dramatic effect
- Custom terrain and imagery layers

**Center point:** London (51.5074°N, 0.1278°W) — the "hub" from which all arcs radiate

### 3.2 Visual Elements

#### Origin Markers
- **Pulsing dots** at each country/region of origin
- **Size** proportional to number of artifacts from that origin
- **Color** by dominant era of collection
- **Glow effect** for high-volume origins
- Hover/click to expand and show details

#### Collection Arcs
- **Animated arcs** from origin → London
- **Curved lines** using CesiumJS polyline geometry with height
- **Color gradient** along the arc (origin color → white)
- **Width** proportional to number of items
- **Animation:** arcs "flow" like rivers, particles moving from origin to London
- Option to show ALL arcs simultaneously (dramatic but performance-heavy) or filter by region/era

#### Heatmap Layer
- **Density heatmap** showing concentration of looted artifacts
- Red = high density, blue = low density
- Particularly dramatic for Africa, South Asia, Middle East
- Toggle on/off

#### Timeline Component
- **Slider** spanning 1600-2024 (or broader)
- **Play button** for animated timeline
- As you advance through time:
  - New arcs appear (when artifacts were collected/acquired)
  - Markers grow in size
  - Cumulative total counter increases
- **Year markers** for key events:
  - 1600: East India Company founded
  - 1753: British Museum established
  - 1868: Meiji era — Japan collection surge
  - 1897: British punitive expedition to Benin
  - 1903: British expedition to Ethiopia (Maqdala)
  - 1947: Indian Independence
  - 2023: BM theft scandal
  - 2024-2026: Repatriation movements

#### Filter Panel
- By era (checkboxes)
- By region (dropdown/checkboxes)
- By object type
- By material
- By acquisition method (excavation, purchase, gift, punitive expedition, war loot)
- Search by country name

### 3.3 UI/UX Design

**Landing experience:**
1. Globe loads slowly rotating, London subtly highlighted
2. Title fades in: *"8 Million Objects. 190 Countries. One Museum."*
3. Subtitle: *"Where did the British Museum's collection really come from?"*
4. Click to explore → arcs begin animating

**Sidebar / Info Panel:**
- Country statistics (when selected)
- Notable objects from that country
- Historical context (how/when artifacts were taken)
- Repatriation status

**Stats Dashboard (overlay):**
- Total objects by region (animated counters)
- Top 10 "source" countries
- Timeline histogram of acquisition dates
- Percentage of collection from former colonies

### 3.4 Mobile Optimisation
- Simplified globe (2D fallback option for low-end devices)
- Touch-optimised controls
- Reduced arc count for performance
- Shareable country cards (pre-rendered screenshots)

---

## 4. SIMILAR PROJECTS & INSPIRATION

### 4.1 Brilliant Maps — British Museum Origins Map
- Static map showing country-level origin data
- Viral on social media (~5,000 objects mapped)
- **Our advantage:** Interactive 3D globe with timeline, filtering, storytelling
- Source data from Al Jazeera / globalsouthworld analysis

### 4.2 Looty (Nigerian Art Collective)
- **Founded:** 2021 by Chidi Nwaubani and Ahmed Abokor
- **Concept:** "Digital heists" — 3D scan stolen artifacts in museums, create NFTs and Geo AR experiences
- **Key actions:**
  - Scanned Rosetta Stone at British Museum using iPad LiDAR
  - Created location-based AR so people in Rashid, Egypt can "see" the Rosetta Stone
  - Scanned Benin Bronzes
  - Exhibited at Venice Architecture Biennale 2023, NFT Paris 2024
- **Relevant stat:** 90-95% of Africa's cultural heritage is held outside Africa
- **Quote:** "Can you steal back something that's already stolen?"
- **Our synergy:** Their ethos of digital repatriation + our data visualisation = powerful combination
- **Contact possibility:** Chidi Nwaubani could be an advisor/collaborator

### 4.3 Native-Land.ca
- Interactive map of Indigenous territories, treaties, and languages
- Beautiful, respectful design
- Shows how to handle sensitive, political geographic data
- **Design lessons:** Layered information, educational tone, community-centered

### 4.4 Google Arts & Culture
- High-resolution museum collections online
- "Pocket Gallery" AR features
- Well-designed but **not politically aware** — presents objects without context of how they were acquired
- **Our differentiator:** We tell the story Google won't

### 4.5 Decolonising the Museum — Digital Projects
- "Decolonising the Museum" (2020) — multiple university-led projects
- Provenance research databases
- "Digital Benin" — comprehensive database of Benin Bronzes worldwide
- "Open Restitution" — crowdsourced repatriation tracking

### 4.6 Other Inspirations
- **"If Buildings Could Talk"** — interactive storytelling with architecture
- **"Wind Map"** (hint.fm) — beautiful data visualisation with flowing lines
- **"Flight Radar 24"** — real-time arcs on a globe
- **"World Population Cartogram"** — distorted maps showing data
- **"The Pudding"** — data journalism with interactive visuals

---

## 5. TECHNICAL APPROACH

### 5.1 Data Pipeline

```
[1. INGEST]          [2. CLEAN]           [3. GEOCODE]         [4. ENRICH]          [5. OUTPUT]
─────────────────────────────────────────────────────────────────────────────────────────────────
BM Collection     →  Standardise      →   Country/City     →   Era mapping     →   GeoJSON
  Online scrape      field names          lat/lon lookup        Type mapping        ↓
                                                                                   CesiumJS
Met API data      →  Deduplicate      →   Region coords     →   Timeline data      ↓
  (CSV + JSON)       Handle nulls         Cultural lookup       Colonial context    Static JSON
                                                                                   files
Smithsonian API   →  Validate dates   →   Site-level for    →   Images (where     ↓
  (with key)         Fix encoding         notable objects        available)        CDN
                                                                                   
Manual seed data  →  Normalize        →   Handle disputed   →   Narrative         ↓
  (Brilliant Maps)   categories           origins flag           snippets           Social
                                                                                   cards
```

### 5.2 Handling Scale: 8 Million Objects

**Challenge:** The BM claims ~8M items, but only a fraction are catalogued online.

**Strategy: Tiered Approach**

**Tier 1: Fully documented objects (~2M)**
- Objects with country, date, type, material all specified
- Direct geocoding possible
- Full interactive features

**Tier 2: Partially documented (~3M)**
- Some fields missing (e.g., country but no date)
- Geocode to country level, mark as "undated"

**Tier 3: Uncatalogued (~3M)**
- Only department/classification known
- Show as aggregate counts by department
- Can't geocode individually

**Tier 4: Seed dataset (~5,000)**
- From Brilliant Maps/Al Jazeera
- Start here, expand as data acquisition succeeds
- Still impressive and viral-worthy at this scale

### 5.3 Performance Optimisation

**Clustering:**
- Use CesiumJS entity clustering for country-level aggregation
- Zoom out: show country-level markers with counts
- Zoom in: expand to individual objects
- Quad-tree spatial indexing for efficient queries

**Data serving:**
- Pre-compute GeoJSON tiles at multiple zoom levels
- Use vector tiles (MVT) for web delivery
- Lazy-load arcs (only render visible ones)
- Limit simultaneous animated arcs to ~500-1000
- Use GPU-accelerated particle systems for arc animation

**Asset optimisation:**
- Compress metadata JSON with gzip/brotli
- Serve from CDN (Cloudflare/Vercel Edge)
- Use CesiumJS Ion for tile hosting (or self-host with terrain data)

### 5.4 Social Media Shareability

**Screenshot feature:**
- One-click "Share this view" → generates high-res PNG
- Pre-composed social card templates:
  - Country spotlight: "47,832 objects from Nigeria → London"
  - Era spotlight: "The Colonial Peak: 1750-1900"
  - Top 10 ranking: "Countries that 'contributed' most to the British Museum"
- Auto-generate Twitter/Instagram-friendly 1080x1080 cards
- Include source attribution watermark

**Embed codes:**
- `<iframe>` embed for blogs and news sites
- Customisable: pre-filtered views (e.g., "show only African artifacts")
- React component for integration into other sites

**Viral hooks:**
- "The British Museum holds X objects from YOUR country" — shareable country pages
- "In 1897, the British looted 10,000 objects from Benin in a single expedition"
- Comparison stats: "More artifacts from Nigeria than from the entire UK"

---

## 6. STORYTELLING & IMPACT

### 6.1 Narrative Framework

**This is not "just a map." It's an indictment rendered in data.**

**Opening Hook:**
> "The British Museum says it holds the world's collection for humanity. But where did that collection come from? Scroll through 400 years of acquisition — from Roman Egypt to 1970s Nigeria — and see the true geography of empire."

**Narrative Arcs (user-selectable):**

1. **"The River of Loot"** — Animated timeline showing arcs flooding in from every continent as the British Empire expanded. The visual is overwhelming by design.

2. **"10 Objects That Should Go Home"** — Spotlight on the most contested items:
   - Parthenon Marbles (Greece)
   - Rosetta Stone (Egypt)
   - Benin Bronzes (Nigeria)
   - Maqdala Treasures (Ethiopia)
   - Koh-i-Noor Diamond (India — technically Crown Jewels, not BM)
   - Hoa Hakananai'a (Rapa Nui / Easter Island)
   - Aboriginal remains (Australia)
   - Aboriginal spears (Australia)
   - Gweagal Shield (Australia)
   - Ethiopian Tabots (Ethiopia)

3. **"The Punitive Expedition Trail"** — Maps specifically showing artifacts acquired through military action:
   - Benin 1897
   - Maqdala 1868
   - Summer Palace 1860
   - Ashanti 1874

4. **"By The Numbers"** — Pure data storytelling:
   - "95% of sub-Saharan African heritage is in Europe"
   - "The BM has never fully catalogued half its collection"
   - "In 2023, 2,000 objects went missing — proving what critics said for years"

### 6.2 Interactive Storytelling: Click a Country

**When a user clicks on a country (e.g., Nigeria):**

```
┌─────────────────────────────────────────────┐
│  🇳🇬 NIGERIA                                │
│  ───────────────────────────────────────     │
│  Objects in British Museum: 6,842            │
│  Acquired between: 1897 - 1960               │
│  Main acquisition method: Punitive expedition│
│                                               │
│  NOTABLE OBJECTS:                             │
│  • Benin Bronzes (1,000+ plaques)             │
│  • Benin ivory masks                          │
│  • Queen Mother Idia mask                     │
│                                               │
│  HOW THEY GOT HERE:                          │
│  In 1897, British forces invaded the Kingdom │
│  of Benin, looted the royal palace, and       │
│  dispersed thousands of artifacts across      │
│  European museums...                          │
│                                               │
│  REPATRIATION STATUS:                        │
│  🔴 Nigeria has formally requested return     │
│  🟡 Some items returned (2022)                │
│  🔴 BM has not committed to full return       │
│                                               │
│  [Read more] [Share] [See all 6,842 objects]  │
└─────────────────────────────────────────────┘
```

### 6.3 Tone & Positioning

**Critical but factual.** Let the data speak.

- Use the BM's own data against its own narrative
- Quote the BM's stated mission ("for the world") alongside the data
- Include BM's counter-arguments fairly (e.g., "universal museum" concept)
- But don't shy away from the truth: much of this collection was acquired through colonial power dynamics
- **Tagline options:**
  - "8 million objects. 190 countries. One museum."
  - "The world's collection — or the world's loss?"
  - "Every object has an origin. Every origin has a story."
  - "Mapping the geography of empire, one artifact at a time."

### 6.4 Call to Action

- Link to repatriation petition/movement websites
- "Learn more about where YOUR cultural heritage is held"
- Connect to ongoing restitution debates
- Partner with decolonisation organisations
- Educational resources for teachers

---

## 7. SCOPE & PHASES

### Phase 1: British Museum (MVP) — 4-6 weeks
**Goal:** Interactive 3D globe showing BM collection origins

- [ ] Seed dataset from Brilliant Maps (~5,000 objects)
- [ ] Scrape BM Collection Online for expanded dataset (target: 50,000+)
- [ ] Geocode all objects to country/region level
- [ ] Build CesiumJS globe with arcs from origin → London
- [ ] Implement timeline slider
- [ ] Country detail panels with storytelling
- [ ] Basic filters (era, region, type)
- [ ] Deploy to Vercel/Cloudflare Pages
- **Launch event:** Social media campaign

### Phase 2: Multi-Museum Expansion — 4-6 weeks
**Goal:** Add Met, Rijksmuseum, Smithsonian

- [ ] Integrate Met Museum API (470K objects, CC0)
- [ ] Integrate Rijksmuseum API (70K objects)
- [ ] Integrate Smithsonian API (15M+ objects — sample)
- [ ] Multi-destination arcs (origin → multiple museums)
- [ ] Museum comparison features
- [ ] Expand narrative arcs to cover multiple institutions
- [ ] "The Big 5" museum comparison dashboard

### Phase 3: Full Colonial Cartography — 8-12 weeks
**Goal:** Comprehensive global map of colonial-era artifact collection

- [ ] Add Louvre, V&A, Berlin, Vienna museums
- [ ] Aggregate statistics: total artifacts by former colonial power
- [ ] Colonial empire overlay (show British, French, Dutch, Belgian, Spanish, Portuguese territories)
- [ ] Cross-reference artifact origins with colonial boundaries
- [ ] Community contributions: crowdsourced provenance data
- [ ] Academic partnerships for verification

### Phase 4: Living Timeline — Ongoing
**Goal:** Animated historical narrative

- [ ] Watch the collection grow over 400 years in 60 seconds
- [ ] Key moment annotations (wars, treaties, expeditions)
- [ ] "What if" scenarios: "If every artifact was returned, what would the BM have left?"
- [ ] Annual update: track new repatriation actions
- [ ] Documentary-style video export
- [ ] VR experience (WebXR via CesiumJS)

---

## 8. TECHNICAL STACK

### Frontend
- **CesiumJS** — 3D globe engine (same as Project Arjun)
- **React** or **Vanilla JS** (depending on complexity)
- **Tailwind CSS** — styling
- **D3.js** — for 2D charts, timelines, histograms
- **html2canvas** or **CesiumJS native** — screenshot generation

### Data & Backend
- **Node.js** — data pipeline scripts
- **Cheerio/Puppeteer** — web scraping
- **PostGIS** or **DuckDB** — spatial data processing
- **Static JSON** — pre-computed data files served from CDN
- **GeoJSON** — standard interchange format

### Hosting
- **Vercel** or **Cloudflare Pages** — static site hosting
- **Cloudflare R2** — data storage
- **Cesium Ion** — 3D tile hosting (or self-host)

### Analytics & Social
- **Plausible** or **Umami** — privacy-respecting analytics
- **Open Graph** meta tags for social sharing
- **Twitter Cards** / **LinkedIn** previews

---

## 9. RISKS & MITIGATION

| Risk | Mitigation |
|------|------------|
| BM blocks scraping | Use rate limiting, respect robots.txt, use Met data as primary, BM as secondary |
| Data accuracy | Cross-reference multiple sources, allow community corrections, cite sources |
| Political backlash | Stick to facts, present BM's position alongside data, academic tone |
| Performance (8M objects) | Tiered loading, clustering, static tiles |
| Legal (BM trademarks) | Use data under fair use / research exemption, don't use BM branding |
| Scope creep | Strict phase gating, MVP first |

---

## 10. SUCCESS METRICS

- **Launch:** 100K+ unique visitors in first month
- **Social:** 10K+ shares, major media coverage
- **Academic:** Cited in at least 3 publications/papers
- **Impact:** Referenced in at least 1 repatriation discussion
- **Community:** 100+ community-contributed data points
- **Technical:** <3s load time, mobile-friendly, accessible

---

## APPENDIX: KEY CONTACTS & RESOURCES

- **Looty Collective:** Chidi Nwaubani & Ahmed Abokor — potential collaborators
- **Brilliant Maps:** Source of seed dataset — potential data partnership
- **globalsouthworld:** Original data analysis source
- **Digital Benin Project:** Benin Bronzes database
- **Open Restitution:** Repatriation tracking
- **CesiumJS Docs:** https://cesium.com/cesiumjs/
- **Met API Docs:** https://metmuseum.github.io/
- **Smithsonian API:** https://api.si.edu (register for key)

---

*"The British Museum says it keeps these objects safe for the world. This project asks: safe from whom? And at whose expense?"*

---

**Document created:** 2026-04-23
**Status:** Research Phase — Ready for Design & Prototyping
**Next step:** Acquire seed data, build CesiumJS prototype with sample data
