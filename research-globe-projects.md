# Open-Source 3D Globe/Earth Visualization Projects

> Research compiled: 2026-04-22
> Focus: Cultural artifacts, museum collections, geolocated data, OSINT, and free-deployable projects

---

## 1. 🏛️ THE BRITISH MUSEUM GLOBE PROJECT

### The Museum of the World
- **URL:** https://britishmuseum.withgoogle.com/ (redirects to Google Arts & Culture partner page)
- **Created by:** Google Arts & Culture Lab
- **Tech Stack:** WebGL, Three.js, custom JavaScript
- **Data Source:** British Museum collection database (objects spanning 2 million years of history)
- **What it does:** An interactive visualization that arranges British Museum artifacts on an interactive 3D timeline/globe, connecting objects across time, continents, and cultures. Users can explore ~5,000+ artifacts by clicking connections between objects from different regions and eras.
- **How it works:** Objects are arranged on a curved 2.5D timeline surface. Connections (lines/arcs) link related objects across continents and time periods, creating a web of cultural connections. It uses WebGL for rendering and the British Museum's linked open data (available via SPARQL endpoint).
- **Deployment:** Hosted by Google (not self-deployable from open source — **no public GitHub repo found**)
- **Special:** This is the specific project the user is asking about. It's a collaboration between Google and the British Museum. The source code does not appear to be publicly available on GitHub — it's a Google Experiments project.
- **Note:** The British Museum also provides collection data via their Collection Online API and SPARQL endpoint at `collection.britishmuseum.org`, which could be used to rebuild a similar visualization.

---

## 2. 🌍 GLOBE VISUALIZATION LIBRARIES (FOCUS: FREE TO DEPLOY)

### 2.1 globe.gl ⭐ (TOP RECOMMENDATION)
- **GitHub:** https://github.com/vasturiano/globe.gl
- **React version:** https://github.com/vasturiano/react-globe.gl
- **Tech Stack:** Three.js / WebGL, vanilla JS or React
- **Data Sources:** Any lat/lng data, GeoJSON, CSV
- **Deployment:** Static HTML — GitHub Pages, Vercel, Netlify ✅
- **What makes it special:**
  - Most feature-rich open-source globe library
  - Supports arcs, hexbin, heatmaps, choropleth, points, paths, labels, HTML markers, rings, tiles, clouds, day/night cycle, satellites
  - 30+ live examples at `vasturiano.github.io/globe.gl/example/`
  - Zero backend required — runs entirely in browser
  - Active maintenance (updated April 2026)
- **Best for:** Building a British Museum-style artifact globe with markers, arcs connecting provenance, and custom data layers

### 2.2 Cobe (Ultra-lightweight)
- **GitHub:** https://github.com/shuding/cobe
- **Tech Stack:** Pure WebGL, ~5KB, zero dependencies
- **Deployment:** Static — GitHub Pages, Vercel ✅
- **Demo:** https://cobe.vercel.app
- **What makes it special:** Incredibly small (5KB), supports markers and arcs, CSS-transitionable DOM markers. Perfect for minimal, performant globes.

### 2.3 Gio.js
- **GitHub:** https://github.com/syt123450/giojs
- **Tech Stack:** Three.js, declarative API
- **Website:** https://giojs.org
- **Deployment:** Static ✅
- **What makes it special:** Declarative 3D globe with country-level data visualization, easy API for adding data flows between countries. Good for trade/cultural exchange visualizations.

### 2.4 Google WebGL Globe
- **GitHub:** https://github.com/dataarts/webgl-globe
- **Tech Stack:** Three.js, WebGL
- **Created by:** Google Data Arts Team
- **Deployment:** Static ✅
- **Data format:** JSON with [lat, lng, magnitude] arrays
- **What makes it special:** The OG open-source globe visualization. Simple, clean, supports animated time-series data (e.g., population by year). Apache 2.0 license.

### 2.5 Encom Globe (Tron: Legacy style)
- **GitHub:** https://github.com/arscan/encom-globe
- **Tech Stack:** Three.js, GLSL shaders
- **Deployment:** Static ✅
- **What makes it special:** Beautiful sci-fi aesthetic inspired by Tron: Legacy's boardroom globe. Hexagonal grid, satellite tracking, animated arcs. Great for atmospheric visualizations.

---

## 3. 🗺️ FULL 3D GEOSPATIAL PLATFORMS

### 3.1 CesiumJS
- **GitHub:** https://github.com/CesiumGS/cesium (12k+ stars)
- **Tech Stack:** JavaScript, WebGL, 3D Tiles
- **License:** Apache 2.0 (free for commercial and non-commercial use)
- **Deployment:** Static ✅ (can deploy to GitHub Pages/Netlify for basic usage)
- **What makes it special:**
  - Industry standard for 3D geospatial visualization
  - High-precision WGS84 globe with terrain, imagery, 3D Tiles
  - Supports streaming from Cesium ion (free tier available) or self-hosted data
  - Used by NASA, defense, engineering, and many visualization projects
  - Bilawal Sidhu's WorldView project uses CesiumJS as its foundation
- **Data Sources:** OpenStreetMap, terrain providers, 3D Tiles, Cesium ion
- **Note:** Free tier of Cesium ion provides some imagery/terrain. Self-hosted data is fully free.

### 3.2 TerriaJS
- **GitHub:** https://github.com/TerriaJS/terriajs
- **Tech Stack:** CesiumJS + Leaflet, React, TypeScript
- **Deployment:** Can be deployed as a static website ✅
- **What makes it special:**
  - Powers Digital Earth Australia Map, NSW Spatial Digital Twin
  - Supports 10,000+ catalog layers
  - GeoJSON, KML, CSV, GPX, CZML, shapefiles, WMS, WFS, WMTS, 3D Tiles
  - Drag-and-drop file visualization
  - Time-dimension support for animated data

### 3.3 OpenGlobus
- **GitHub:** https://github.com/openglobus/openglobus
- **Tech Stack:** TypeScript/JavaScript, pure WebGL
- **Website:** https://www.openglobus.org/
- **Deployment:** Static ✅
- **What makes it special:**
  - Completely free, open-source 3D maps engine
  - Planet-to-bee scale visualization
  - High-resolution terrain, imagery layers, 3D objects
  - React bindings available
  - No API keys required for basic usage (uses OpenStreetMap tiles)

### 3.4 iTowns
- **GitHub:** https://github.com/iTowns/itowns
- **Tech Stack:** Three.js, WebGL, JavaScript
- **Deployment:** Static ✅
- **What makes it special:**
  - Three.js-based framework for 3D geospatial data
  - Supports point clouds, 3D Tiles, elevation layers
  - Used by French government agencies

---

## 4. 🕵️ OSINT / INTELLIGENCE GLOBE PROJECTS

### 4.1 Bilawal Sidhu's WorldView ("Vibe-coded Palantir")
- **Status:** NOT open source (no public GitHub repo found as of April 2026)
- **Creator:** Bilawal Sidhu (ex-Google Maps PM)
- **Tech Stack:** CesiumJS + Google Photorealistic 3D Tiles + custom shaders
- **Data Sources:**
  - OpenSky Network (live aircraft positions)
  - ADS-B Exchange (military flight tracking)
  - CelesTrak TLE data (180+ satellite orbits)
  - OpenStreetMap (vehicle flow as particles)
  - Public CCTV cameras (geolocated feeds)
- **Shaders:** CRT scan lines, NVG night vision, FLIR thermal, anime cel-shading
- **YouTube walkthrough:** https://www.youtube.com/watch?v=rXvU7bPJ8n4
- **Newsletter:** https://www.spatialintelligence.ai/
- **Special:** Reconstructed the Iran strikes as a 4D visualization. Fused 6 data layers: commercial flights, satellite constellations, GPS jamming, maritime AIS, geolocated social media, and satellite imagery.
- **How to replicate:** Use CesiumJS + Google 3D Tiles API + OpenSky/ADS-B APIs + CelesTrak TLE data. This is rebuildable with open-source components.

### 4.2 NASA Worldview
- **GitHub:** https://github.com/nasa-gibs/worldview
- **Live:** https://worldview.earthdata.nasa.gov
- **Tech Stack:** React, OpenLayers, Node.js
- **Data Sources:** NASA GIBS (Global Imagery Browse Services) — 1000+ satellite imagery layers
- **Deployment:** Self-hosted (Node.js server) or can be embedded
- **What makes it special:**
  - Browse 1000+ global satellite imagery layers
  - Many layers updated daily (within 3 hours of observation)
  - 30-year historical coverage
  - Arctic/Antarctic views
  - Geostationary imagery (10-min increments, last 90 days)
  - Time animation for wildfire, air quality, flood monitoring
- **License:** NASA open source

### 4.3 Google Arms Globe
- **GitHub:** https://github.com/dataarts/armsglobe
- **Tech Stack:** Three.js, WebGL
- **Created by:** Google Data Arts Team
- **Deployment:** Static ✅
- **What makes it special:** Visualizes international arms trade data on a 3D globe with animated arcs between countries. Time-slider for historical data. Apache 2.0.

---

## 5. 🗺️ MAP LIBRARIES WITH GLOBE MODE

### 5.1 MapLibre GL JS
- **GitHub:** https://github.com/maplibre/maplibre-gl-js
- **Tech Stack:** WebGL, vector tiles
- **License:** BSD-3-Clause
- **Deployment:** Static ✅
- **What makes it special:** Open-source fork of Mapbox GL JS. Supports 3D terrain, globe projection (globe mode added in v3+). No API key required with open tile sources.

### 5.2 deck.gl + Kepler.gl
- **deck.gl GitHub:** https://github.com/visgl/deck.gl
- **kepler.gl GitHub:** https://github.com/keplergl/kepler.gl
- **Tech Stack:** WebGL2/WebGPU, React
- **License:** MIT
- **Deployment:** kepler.gl has a hosted demo; deck.gl apps can be static ✅
- **What makes it special:**
  - Uber's visualization framework — renders millions of data points
  - Kepler.gl is a no-code geospatial analysis tool built on deck.gl
  - Supports globe view mode
  - Arc layers, scatter plots, hexbins, trips, GeoJSON, etc.

### 5.3 Mapbox Globe
- **Website:** https://www.mapbox.com/
- **Tech Stack:** WebGL, vector tiles
- **Note:** NOT open source (proprietary license since Dec 2020). Use MapLibre instead for open-source.
- **Free tier:** Available with API key, limited requests

---

## 6. 🎨 NOTABLE EXAMPLES & INSPIRATIONS

### 6.1 GitHub Homepage Globe
- **How it was built:** https://github.blog/2020-12-21-how-we-built-the-github-globe/
- **Recreation:** https://github.com/janarosmonaliev/github-globe
- **Tech Stack:** Three.js, three-globe, WebGL
- **Deployment:** Static ✅
- **What makes it special:** Beautiful real-time pull request visualization showing global open-source activity with arcs and spires

### 6.2 Stripe Interactive Globe
- **Blog:** https://stripe.com/blog/globe
- **Tech Stack:** Three.js, WebGL
- **What makes it special:** Pioneered the "beautiful globe" aesthetic. Detailed write-up on design and development process.

### 6.3 NASA Web WorldWind
- **GitHub:** https://github.com/NASAWorldWind/WebWorldWind
- **Tech Stack:** JavaScript, WebGL
- **License:** Apache 2.0
- **Deployment:** Static ✅
- **What makes it special:** NASA's official 3D planetary globe engine. Supports terrain, imagery, 3D models (COLLADA), placemarks. Developed by NASA with ESA contributions. **Note:** Development appears to have slowed — CesiumJS is more actively maintained.

---

## 7. 📊 COMPARISON MATRIX

| Project | Globe Type | Data Layers | Static Deploy | Free | Museum/Cultural Focus |
|---------|-----------|-------------|---------------|------|----------------------|
| globe.gl | 3D sphere | Arcs, points, heatmaps, polygons, labels | ✅ GitHub Pages | ✅ | ⭐ Best for custom |
| CesiumJS | 3D geospatial | 3D Tiles, terrain, imagery | ✅ (basic) | ✅ Apache 2.0 | ✅ |
| Cobe | 3D sphere | Markers, arcs | ✅ | ✅ MIT | Basic |
| Gio.js | 3D sphere | Country flows | ✅ | ✅ MIT | Basic |
| OpenGlobus | 3D maps | Terrain, imagery, 3D objects | ✅ | ✅ | ✅ |
| TerriaJS | 3D/2D | 10,000+ layers | ✅ | ✅ Apache 2.0 | ✅ |
| NASA Worldview | 2D map | 1000+ satellite layers | Self-host | ✅ | ❌ Earth science |
| deck.gl/kepler.gl | 2D/3D/ Globe | Millions of points | ✅ | ✅ MIT | ✅ |
| WebGL Globe | 3D sphere | Lat/lng/magnitude | ✅ | ✅ Apache 2.0 | Basic |

---

## 8. 🚀 RECOMMENDED STACK FOR A MUSEUM ARTIFACT GLOBE

For building a British Museum-style artifact globe that's **free to deploy**:

### Option A: globe.gl (Easiest, most visual)
```
- globe.gl for 3D globe rendering
- British Museum Collection API / SPARQL for data
- Static hosting on GitHub Pages/Vercel
- Total cost: $0
```

### Option B: CesiumJS (Most powerful)
```
- CesiumJS for full 3D geospatial globe
- OpenStreetMap tiles for basemap
- British Museum API for artifact data
- Static hosting on GitHub Pages/Vercel
- Total cost: $0 (with open tile sources)
```

### Option C: Cobe (Most minimal)
```
- 5KB globe library
- Simple markers for artifact locations
- GitHub Pages deployment
- Total cost: $0
```

---

## 9. 🔑 KEY DATA SOURCES FOR MUSEUM/CULTURAL PROJECTS

1. **British Museum Collection API:** https://collection.britishmuseum.org (SPARQL endpoint)
2. **Metropolitan Museum of Art API:** https://metmuseum.github.io/ (free, no key)
3. **Harvard Art Museums API:** https://harvardartmuseums.org/collections/api
4. **Europeana API:** https://www.europeana.eu/api (European cultural heritage)
5. **Smithsonian Open Access:** https://www.si.edu/openaccess
6. **Rijksmuseum API:** https://data.rijksmuseum.nl/
7. **Google Arts & Culture:** https://developers.google.com/cultural-institute

---

## 10. 💡 KEY INSIGHTS

1. **The British Museum "Museum of the World" project** was built by Google Arts & Culture Lab — it's a closed-source Google Experiment. No public GitHub repo exists, but the concept can be rebuilt using open-source tools.

2. **Bilawal Sidhu's WorldView** is also NOT open source, but the architecture is well-documented: CesiumJS + Google 3D Tiles + open data feeds. It's fully replicable.

3. **globe.gl** is the single best library for building a museum artifact globe — it supports all the visualization types needed (markers, arcs, labels, heatmaps) and deploys to any static host for free.

4. **CesiumJS** is the most powerful option if you need real terrain, satellite imagery, or 3D tile support.

5. **All projects listed support free deployment** on GitHub Pages, Vercel, or Netlify with zero backend required.
