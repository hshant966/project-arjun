# Research: Bilawal Sidhu's "God's Eye" / WorldView — Reverse Engineering Report

**Date:** 2026-04-23  
**Researcher:** Project Arjun Research Agent  
**Purpose:** Deep dive into Bilawal Sidhu's geospatial intelligence platform to inform Project Arjun's architecture

---

## 1. Who is Bilawal Sidhu?

### Professional Background
- **Former role:** Senior/Principal Product Manager at Google (6 years, promoted 3x in 5 years)
- **Google teams:** AR/VR, 3D Maps, ARCore Geospatial API, Google Maps Immersive View
- **Key contribution:** Helped build Google's Photorealistic 3D Tiles — the volumetric city model infrastructure that powers Google Earth's 3D cities at global scale
- **Current:** Solo creator, TED Tech Curator, A16z Scout, runs "Map the World" newsletter
- **Location:** Austin, Texas (US naturalized citizen)
- **Online presence:**
  - YouTube: `@bilawalsidhu` (~180K subscribers, "Mapping the World with Bilawal Sidhu")
  - X/Twitter: `@bilawalsidhu` (1.6M+ audience across platforms, 500M+ total views)
  - Substack: [spatialintelligence.ai](https://www.spatialintelligence.ai) (35K+ subscribers)
  - LinkedIn: [linkedin.com/in/bilawalsidhu](https://linkedin.com/in/bilawalsidhu)
  - GitHub: [github.com/bilawalsidhu](https://github.com/bilawalsidhu) — **NO PUBLIC REPOS** (closed source)
  - Podcast: Apple Podcasts "Bilawal Sidhu Podcast"
  - Website: [bilawal.ai](https://bilawal.ai)
  - Maven course: "Generative AI Creation Masterclass"

### Father
- **KBS Sidhu, IAS (retd.)** — Special Chief Secretary to the Government of Punjab, India. Editor-in-Chief of The KBS Chronicle. Published a detailed analysis of WorldView on his Substack.

---

## 2. Key Videos & Content

### 2.1 "Ex-Google PM Builds God's Eye to Monitor Iran in 4D" (March 2026)
- **URL:** https://www.youtube.com/watch?v=0p8o7AeHDzg
- **Views:** 1.8M+ (went viral)
- **Content:** Full walkthrough of WorldView used to reconstruct Operation Epic Fury (US-Israeli strikes on Iran). Shows real-time fusion of 6 data layers on a 3D globe, scrubbable minute-by-minute.
- **Key quote from his Substack:** "On a 3D globe with actual flight paths, actual satellite passes, actual GPS interference zones, actual ship movements. All from public data."

### 2.2 "Ex-Google Maps PM Vibe Coded Palantir in a Weekend" (February 2026)
- **URL:** https://www.youtube.com/watch?v=rXvU7bPJ8n4
- **Views:** 290K+
- **Content:** Initial WorldView demo. Showcased the base platform with live air traffic, satellite orbits, CCTV feeds, and shader effects. Palantir co-founder Joe Lonsdale responded publicly.
- **Key quote:** "I didn't write this code by hand. I described features in voice notes and screenshots, threw them at multiple AI agents running simultaneously."

### 2.3 "Your WiFi Can See You. Here's How." (March 2026)
- **URL:** https://youtu.be/0OdR8rRMz3I (referenced in Substack)
- **Content:** Deep dive into WiFi sensing — CSI (Channel State Information), 802.11bf standard, DensePose from WiFi, person re-identification via radio signals. Not directly God's Eye, but shows his interest in ambient sensing/surveillance tech.

### 2.4 Other Known Content Themes
- 3D Gaussian Splatting and NeRFs
- AI creation workflows (generative AI for images, video, 3D)
- AR/VR and spatial computing
- Google Maps / Immersive View deep dives
- Commercial satellite imagery analysis
- Drone photogrammetry

---

## 3. WorldView System Architecture — Reverse Engineered

### 3.1 Foundation Layer: 3D Globe Engine
- **Primary rendering:** Google's **Photorealistic 3D Tiles API** (same tech as Google Earth)
  - He explicitly states this is the foundation
  - Volumetric city models from aerial photogrammetry
  - Petabytes of reconstruction data, millions of images
  - Publicly accessible via API: [developers.google.com/maps/documentation/tile](https://developers.google.com/maps/documentation/tile)
- **Rendering technology:** WebGL-based, custom shader pipeline on top of Google Tiles
  - NOT Cesium, NOT Mapbox, NOT Three.js directly — uses Google's native tile renderer
  - Custom GLSL shaders for visual effects
- **Globe view:** Zoomed-out 3D earth with interactive data layers
- **City view:** Close-up with photorealistic 3D buildings, streets, landmarks

### 3.2 Data Layers (6 Primary Feeds)

#### Layer 1: Live Air Traffic (ADS-B)
- **OpenSky Network** — ~7,000+ live aircraft positions, continuously updated
- **ADS-B Exchange** — crowdsourced military flight tracking (includes aircraft that don't show on FlightRadar24)
- **Data type:** Real-time aircraft positions, altitude, speed, callsign
- **API:** REST-based, free tier available
- **Visualization:** Aircraft rendered as 3D objects with trails, military callsigns highlighted

#### Layer 2: Satellite Constellations (TLE)
- **CelesTrak** — NORAD Two-Line Element (TLE) data for 180+ satellites
- **Includes:** Commercial (Capella SAR, Planet, Maxar) and military (KH-11 Keyhole, Russian BARS-M, Chinese Gaofen)
- **Data type:** Orbital elements updated periodically
- **Visualization:** Real orbital paths rendered as 3D trajectories, clickable to track individual satellites

#### Layer 3: GPS Jamming / Interference
- **Source:** Inferred from commercial aircraft GPS confidence levels
- **Method:** Aggregating NACp (Navigation Accuracy Category for Position) data from ADS-B transponders across the global commercial fleet
- **Key insight:** "You're basically mining the global fleet of commercial aircraft as a distributed sensor network for electronic warfare"
- **Visualization:** Red tiles/zones indicating degraded GPS reliability

#### Layer 4: Maritime Traffic (AIS)
- **Source:** AIS (Automatic Identification System) transponder data
- **Coverage:** Commercial shipping, especially in chokepoints like Strait of Hormuz
- **Visualization:** Vessel positions and movements on the ocean surface
- **Notable use:** Watching tankers scatter during the Hormuz blockade

#### Layer 5: No-Fly Zones & Airspace Restrictions
- **Source:** NOTAMs, aviation authority restrictions
- **Visualization:** Red zones on the globe showing cascading airspace closures
- **Notable use:** Iran → Iraq → Kuwait → Gulf airspace going dark sequentially

#### Layer 6: Strike Coordinates & Geolocated Events
- **Source:** Open-source reporting, correlated against official sources
- **Method:** Geolocation from news reports, cross-referenced for confidence
- **Visualization:** Markers on the globe at confirmed strike locations
- **Limitation:** "Only graduated highest confidence events to the map"

#### Layer 7: CCTV / Live Camera Feeds (Beta)
- **Source:** Public traffic cameras (Austin, TX demonstrated)
- **Method:** Geographically located camera feeds projected onto 3D building models
- **Technical:** Real camera footage draped onto photogrammetric 3D models
- **Status:** Built but experimental

#### Layer 8: OpenStreetMap Vehicle Flow
- **Source:** OpenStreetMap data
- **Visualization:** Vehicle flow on city streets rendered as a **particle system**

### 3.3 Visual Effects / Shader Pipeline
Custom GLSL shaders applied as post-processing layers:

| Shader | Description | Reference |
|--------|-------------|-----------|
| **CRT Scan Lines** | Retro CRT monitor look, scan line artifacts | Military display aesthetics |
| **Night Vision (NVG)** | Green-tinted, high-contrast night vision goggles | Military NVG specifications |
| **FLIR Thermal** | Heat-map visualization (white-hot/black-hot) | FLIR camera output standards |
| **Anime Cel-Shading** | Studio Ghibli-style flat shading | Aesthetic contrast experiment |
| **Military Reticle** | Targeting crosshairs and HUD overlays | Targeting pod displays |

**Key insight:** "Built from studying actual military display specifications — not for the aesthetics, but because those display systems were engineered to extract maximum information from sensor data."

### 3.4 AI Agent Architecture
- **Development approach:** "Vibe coding" — voice notes + screenshots → AI agents
- **AI models used:** Gemini 3.1 Pro, Claude 4.6, Codex 5.3
- **Agent count:** Up to 8 agents running simultaneously
- **Agent specializations:**
  - Satellite tracker agent
  - CCTV feed integration agent
  - Shader pipeline agent
  - Data normalization agent
  - Timeline alignment agent
  - UI/UX agent
  - etc.
- **Workflow:** No Cursor IDE — straight into terminal with each agent in its own window
- **Key quote:** "Running sometimes 8 agents at once, each working on a different subsystem"

### 3.5 Real-Time Data Handling
- **Data capture:** AI agent sent WhatsApp message to snapshot all data feeds before caches cleared
- **Time synchronization:** All layers aligned to a common timeline
- **Playback:** Timeline slider for scrubbable, minute-by-minute replay
- **Architecture pattern:** Data ingestion → normalization → coordinate alignment → timestamp sync → unified timeline → 3D rendering

### 3.6 The "God's Eye" / Panoptic Mode
- Detection overlays: every vehicle on the street highlighted
- Military flights with callsigns + altitude data
- All satellites in orbit visible
- CCTV feeds projected onto buildings
- Name origin: "Panoptic view" — from Jeremy Bentham's panopticon concept

---

## 4. The Larger Vision: SpatialOS

WorldView is the **demo**. The real project is **SpatialOS**:
- Continuously updating model of the physical world
- Ingests sensor data from satellites, cameras, IoT devices
- Makes the model queryable by AI agents in real time
- Analogous to: "this demo is to SpatialOS what Google Maps is to Google's location intelligence infrastructure"
- The map is the product people see; underneath is data pipelines, model updates, APIs

**Timeline:** WorldView opens to the public in April 2026 (likely imminent or just launched).

---

## 5. Complete Tech Stack Summary

### Frontend / Rendering
| Component | Technology | Status |
|-----------|-----------|--------|
| 3D Globe Base | Google Photorealistic 3D Tiles API | Confirmed |
| Rendering Engine | WebGL (custom, not Cesium/Mapbox/Three.js directly) | Inferred |
| Shader System | Custom GLSL shaders (CRT, NVG, FLIR, Cel-shading) | Confirmed |
| UI Framework | Likely React/Next.js (modern web app) | Inferred |
| Particle Systems | Custom WebGL particles for vehicle flow | Confirmed |
| Globe Controls | Custom camera/orbit controls | Inferred |

### Data Sources
| Data | Source | API Type | Cost |
|------|--------|----------|------|
| Aircraft Positions | OpenSky Network | REST API | Free |
| Military Flights | ADS-B Exchange | REST API | Free/Paid |
| Satellite Orbits | CelesTrak (NORAD TLE) | REST/data files | Free |
| City 3D Models | Google 3D Tiles API | Tiles API | Free tier / Paid |
| Street Data | OpenStreetMap | Overpass API / Tiles | Free |
| Maritime Traffic | AIS providers | Various | Varies |
| GPS Interference | Inferred from ADS-B data | Derived | Free |
| CCTV Cameras | Public municipal feeds | Direct HTTP | Free |
| Strike Coordinates | OSINT geolocation | Manual + APIs | Free |

### AI / Development Tools
| Tool | Purpose |
|------|---------|
| Gemini 3.1 Pro | Code generation, data analysis |
| Claude 4.6 | Code generation, architecture |
| Codex 5.3 | Code generation |
| WhatsApp API | Agent communication/control channel |

### Infrastructure
| Component | Inference |
|-----------|-----------|
| Hosting | Likely Vercel/Cloudflare (modern web) |
| Data Storage | Likely time-series DB or in-memory for replay |
| CDN | Substack CDN for images, likely Cloudflare for app |
| Real-time | Polling-based (not WebSocket) for data feeds |

---

## 6. Gap Analysis: What Bilawal Has That Arjun Doesn't

### Features Bilawal Has (Missing from Arjun)
1. **Photorealistic 3D city rendering** — Google 3D Tiles integration
2. **Custom shader effects** — NVG, FLIR, CRT, cel-shading overlays
3. **Satellite orbit visualization** — Real TLE-based orbital tracking with 180+ satellites
4. **GPS jamming visualization** — Derived from aircraft GPS confidence data
5. **Maritime AIS integration** — Ship tracking on water
6. **CCTV feed projection** — Real camera feeds mapped onto 3D buildings
7. **Timeline replay** — Scrubbable, minute-by-minute event reconstruction
8. **Multi-layer data fusion** — 6+ simultaneous data layers on one globe
9. **Military flight tracking** — ADS-B Exchange for non-civilian aircraft
10. **Airspace closure visualization** — Real-time NOTAM/no-fly zone display
11. **Particle system vehicle flow** — OpenStreetMap data as flowing particles

### Data Sources Bilawal Uses (Arjun May Not Have)
1. **ADS-B Exchange** — Military/crowdsourced flight data
2. **CelesTrak TLE** — Satellite orbital elements
3. **Google Photorealistic 3D Tiles** — Volumetric city models
4. **AIS maritime data** — Ship tracking
5. **Public CCTV camera feeds** — Municipal traffic cameras
6. **GPS NACp confidence data** — For interference mapping

### Advantages Arjun Has / Should Exploit
1. **India-specific data sources** — Indian NOTAMs, ISRO satellite data, Indian airspace
2. **Government data integration** — Indian government open data portals
3. **Regional focus** — Deep coverage of Indian subcontinent vs. Bilawal's global-but-shallow approach
4. **Potential for classified/semi-classified Indian data** — Government partnerships
5. **Open source** — Can build community; Bilawal's code is closed
6. **Custom domain** — India-specific geopolitics, border monitoring, disaster response

---

## 7. Implementation Roadmap for Project Arjun

### 🔴 Quick Wins (1 Day)

| # | Feature | Data Source | Effort |
|---|---------|-------------|--------|
| 1 | **OpenSky Network integration** | OpenSky REST API | Low — free API, straightforward |
| 2 | **CelesTrak TLE satellite tracking** | CelesTrak data files | Low — download TLE files, compute orbits with satellite.js |
| 3 | **CRT / NVG shader overlay** | Custom GLSL/WebGL shaders | Medium — shader code is well-documented |
| 4 | **Airspace closure visualization** | NOTAM data or ICAO API | Medium — need parsing logic |
| 5 | **OpenStreetMap vehicle particles** | OSM Overpass API | Medium — particle system implementation |

### 🟡 Medium-Term (1 Week)

| # | Feature | Notes |
|---|---------|-------|
| 1 | **ADS-B Exchange integration** | Military flight tracking, may need paid API access |
| 2 | **GPS jamming heatmap** | Derive from aircraft NACp data aggregation |
| 3 | **FLIR thermal shader** | More complex shader, reference Bilawal's approach |
| 4 | **Timeline replay system** | Record data snapshots, build scrubbing UI |
| 5 | **Maritime AIS layer** | Integrate AIS data for Indian Ocean, Arabian Sea |

### 🟢 Advanced Features (1 Month)

| # | Feature | Notes |
|---|---------|-------|
| 1 | **Google Photorealistic 3D Tiles** | Apply for API access, integrate 3D city models |
| 2 | **Multi-layer data fusion engine** | Unified timeline across all data sources |
| 3 | **AI agent data capture system** | Auto-snapshot data feeds during events |
| 4 | **CCTV feed integration** | Indian traffic camera feeds mapped to 3D |
| 5 | **"God's Eye" panoptic mode** | Combined overlay of all intelligence layers |
| 6 | **Strike/event geolocation & verification** | OSINT correlation pipeline |

### 🔵 Research Items (Needs Investigation)

| # | Item | Why |
|---|------|-----|
| 1 | **Google 3D Tiles API pricing** | Free tier limits, cost at scale for India coverage |
| 2 | **Indian satellite imagery sources** | ISRO Bhuvan, NRSC data availability and API |
| 3 | **Indian NOTAM/airspace data** | DGCA data feeds, real-time availability |
| 4 | **Indian AIS data providers** | Indian Ocean maritime tracking sources |
| 5 | **ISRO satellite TLE data** | Indian remote sensing satellite orbits |
| 6 | **Bilawal's "WorldView" public release** | April 2026 — monitor for open-source components |
| 7 | **WiFi sensing for perimeter monitoring** | 802.11bf standard, potential for border monitoring |
| 8 | **ZaiNar positioning technology** | WiFi/5G sub-nanosecond positioning, indoor tracking |

---

## 8. Key Technical Insights from Bilawal's Work

### The "Intelligence from Nothing" Principle
Each public data source is meaningless alone. But layer them on the same timeline and globe:
> "The whole becomes dramatically greater than the sum of its parts. Fuse enough public data together and you get an understanding that 'feels' like it should be classified."

### The "Negative Space" Intelligence Technique
What disappears tells you as much as what appears:
- Military aircraft turn off transponders → holes in the map
- GPS confidence drops → electronic warfare is active
- Airspace empties → strikes are imminent
- "When 3,400 flights simultaneously clear an airspace, you don't need anyone with a security clearance to tell you what's coming"

### AI Agent Swarm Development Pattern
- 8 concurrent agents, each owning a subsystem
- Voice notes + screenshots as input (not code)
- Direct terminal access, no IDE
- Weekend project → production-quality output
- Implication for Arjun: We should adopt this multi-agent development approach

### Sousveillance vs. Surveillance
Bilawal frames WorldView as **sousveillance** (watching back) vs. surveillance (being watched):
> "Same data streams. Same satellite feeds. Same CCTV cameras. But the interface is in your browser, and you control it."

For Arjun: This framing is powerful for a government transparency tool in India.

---

## 9. Competitive Landscape

| Product | Creator | Status | Key Difference |
|---------|---------|--------|----------------|
| **WorldView** | Bilawal Sidhu | April 2026 public | Solo-built, aesthetic-first, open data |
| **Palantir Gotham** | Palantir Technologies | Enterprise | Classified data, analyst workflows, $B contracts |
| **Sentinel Hub** | Sinergise | SaaS | Satellite imagery processing, not real-time fusion |
| **Google Earth Engine** | Google | Free/Paid | Remote sensing analysis, not real-time OSINT |
| **MarineTraffic** | MarineTraffic | SaaS | Maritime-only |
| **Flightradar24** | Flightradar24 | SaaS | Aviation-only |
| **Orbital Insight** | Orbital Insight | Enterprise | Satellite analytics, commercial focus |

**Arjun's niche:** India-focused, open-source, government transparency, with Bilawal's multi-layer fusion approach.

---

## 10. Actionable Next Steps for Arjun

1. **Immediately:** Integrate OpenSky Network API for flight tracking over India
2. **This week:** Download CelesTrak TLE data, render ISRO satellite orbits on our globe
3. **This week:** Implement CRT/NVG shader effects for the "intelligence aesthetic"
4. **Apply for:** Google Photorealistic 3D Tiles API access (free tier)
5. **Monitor:** Bilawal's WorldView public launch (April 2026) — watch for any open-source releases
6. **Research:** Indian data equivalents for every Bilawal data source
7. **Adopt:** Multi-agent AI development pattern for rapid feature building
8. **Read:** His Substack articles for architectural insights and data fusion patterns

---

## 11. Sources

1. [I Built a Spy Satellite Simulator](https://www.spatialintelligence.ai/p/i-built-a-spy-satellite-simulator) — Bilawal's Substack (Feb 24, 2026)
2. [The Intelligence Monopoly Is Over](https://www.spatialintelligence.ai/p/the-intelligence-monopoly-is-over) — Bilawal's Substack (Mar 4, 2026)
3. [Your WiFi Can See You](https://www.spatialintelligence.ai/p/your-wifi-can-see-you-heres-how) — Bilawal's Substack (Mar 17, 2026)
4. [Ex-Google PM Builds God's Eye](https://www.youtube.com/watch?v=0p8o7AeHDzg) — YouTube (Mar 2026)
5. [Ex-Google Maps PM Vibe Coded Palantir](https://www.youtube.com/watch?v=rXvU7bPJ8n4) — YouTube (Feb 2026)
6. [The War You Can Watch in a Browser](https://kbssidhu.substack.com/p/the-war-you-can-watch-in-a-browser) — KBS Sidhu Substack (Mar 2026)
7. [He Was Promoted 3x in 5 Years at Google](https://www.news.aakashg.com/p/he-was-promoted-3x-in-5-years-at) — Aakash Gupta podcast
8. [LinkedIn Profile](https://www.linkedin.com/in/bilawalsidhu)
9. [GitHub Profile](https://github.com/bilawalsidhu)
10. [Maven Course](https://maven.com/bilawal/generative-ai-masterclass)

---

*End of Research Report — Project Arjun*
