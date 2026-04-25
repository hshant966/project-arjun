# Free & Open Data Sources for Geospatial Intelligence Globe

> Researched: 2026-04-22 | Focus: FREE or generous free tiers for GitHub Pages deployment

## Legend

- ✅ **Free + No API key** — Best for GitHub Pages (static fetch from browser)
- 🔑 **Free with API key** — Usable but need server proxy or key management
- 📦 **Downloadable** — Can bundle static data in the repo
- ⚠️ **Free tier limited** — Works for demos, may hit limits at scale

---

## 1. Aircraft / Flights

### OpenSky Network ✅🟢
- **URL**: https://opensky-network.org/apidoc/index.html
- **API Type**: REST API (GET/POST), no authentication required for basic access
- **Rate Limits**: Anonymous: ~10 requests per 5min | Registered: higher limits (free account)
- **Data Format**: JSON
- **Update Frequency**: ~5 seconds (real-time)
- **Data Available**: All ADS-B/Mode-S aircraft globally — callsign, position, velocity, altitude, squawk
- **Endpoint**: `https://opensky-network.org/api/states/all` (returns all tracked aircraft)
- **CORS**: Yes — can be called from browser directly
- **GitHub Pages**: ✅ YES — works directly from client-side JS. Best free option for live aircraft.
- **Notes**: Truly free for non-commercial. The gold standard for open flight data. Hugely popular. Registration free.

### ADS-B Exchange ⚠️💰
- **URL**: https://www.adsbexchange.com/data/
- **API Type**: REST, WebSocket
- **Rate Limits**: Commercial license required for API access. No public free API.
- **Data Format**: JSON
- **Update Frequency**: Up to 2Hz
- **GitHub Pages**: ❌ NOT FREE — commercial data licensing required. No public free endpoint.
- **Notes**: Most comprehensive unfiltered data (includes military, VIP), but paid only. Their web map is free to view but not to programmatically access.

### FlightRadar24 ⚠️
- **URL**: https://www.flightradar24.com/
- **API Type**: No public API. Some unofficial endpoints exist but are blocked/restricted.
- **GitHub Pages**: ❌ NOT free for API use. Strictly commercial.
- **Notes**: Great visualization but no free developer API. Heavy anti-scraping.

### RadarBox / Flightradar alternatives
- No truly free APIs available at production quality.

### **BEST PICK for Aircraft: OpenSky Network** — free, real-time, CORS-enabled, no key needed for basic use.

---

## 2. Satellites

### CelesTrak ✅🟢
- **URL**: https://celestrak.org/
- **API Type**: REST, direct file download (no auth needed)
- **Rate Limits**: Generous. No explicit rate limit, but expect fair use (~1 req/sec).
- **Data Format**: TLE (Two-Line Element), CSV, JSON (GP data formats)
- **Update Frequency**: Multiple times daily
- **Endpoints**:
  - `https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle` — ISS etc.
  - `https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle` — Brightest
  - `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle` — All active
  - JSON format: `&FORMAT=json`
- **CORS**: Yes
- **GitHub Pages**: ✅ YES — direct download, no auth. Best free satellite tracking data.
- **Notes**: Run by Dr. T.S. Kelso. The definitive source for TLE data. Transitioning to 6-digit catalog numbers (~Jul 2026).

### Space-Track.org 🔑
- **URL**: https://space-track.org
- **API Type**: REST API (requires free account + login cookie auth)
- **Rate Limits**: 20 requests per minute, 200 per hour
- **Data Format**: TLE, GP, CSV, JSON
- **Update Frequency**: Near real-time (updated multiple times daily)
- **Auth**: Cookie-based (JWT), requires account at space-track.org
- **GitHub Pages**: ⚠️ PARTIALLY — need to proxy the auth token. Can pre-download and bundle.
- **Notes**: Official USSPACECOM data source. More complete than CelesTrak but auth-required. Free account at https://www.space-track.org/auth/createAccount

### N2YO 🔑
- **URL**: https://www.n2yo.com/api/
- **API Type**: REST API (free API key required)
- **Rate Limits**: TLE: 1000/hr | Positions: 1000/hr | Visual passes: 100/hr | Radio passes: 100/hr | Above: 100/hr
- **Data Format**: JSON
- **Update Frequency**: Real-time position calculations
- **Data Available**: TLE, positions, visual/radio passes, what's overhead
- **GitHub Pages**: ⚠️ With API key in client JS (exposed key). Better to proxy.
- **Notes**: Great for satellite pass predictions. Free key after registration.

### **BEST PICK for Satellites: CelesTrak** — no auth, CORS, JSON format, direct browser fetch.

---

## 3. Maritime / Ships

### AISHub ✅🟢
- **URL**: https://www.aishub.net/api
- **API Type**: REST web service (free account to join network, then API access)
- **Rate Limits**: Max 1 request per minute
- **Data Format**: XML, JSON, CSV. Supports compression (ZIP, GZIP, BZIP2)
- **Update Frequency**: Near real-time (AIS data, positions update every few seconds)
- **Auth**: Username-based (free to join — contribute a receiver to get full access)
- **Filterable**: By lat/lon bounding box, MMSI, IMO, interval
- **GitHub Pages**: ⚠️ Need username in URL. Can work but exposes credentials. Better to proxy.
- **Notes**: Community-driven AIS network. Free if you feed data; otherwise limited. Great global coverage.

### Global Fishing Watch 🔑
- **URL**: https://globalfishingwatch.org/our-apis/
- **API Type**: REST API (free registration + API key)
- **Rate Limits**: Not explicitly stated, generous for research
- **Data Format**: JSON, GeoJSON
- **Update Frequency**: Near real-time vessel tracking + 4VMS data
- **Data Available**: Vessel tracking, fishing activity, encounters, port visits, loitering events
- **GitHub Pages**: ⚠️ API key required. Proxy recommended.
- **Notes**: Excellent for fishing vessel monitoring. Open data initiative. Supports research & transparency.

### MarineTraffic (now Kpler) 💰
- **URL**: https://www.marinetraffic.com/
- **API Type**: Commercial REST API
- **Rate Limits**: Paid tiers only
- **GitHub Pages**: ❌ NOT free. Cheapest plans start at ~$500/month.

### VesselFinder 💰
- **URL**: https://www.vesselfinder.com/
- **API Type**: Commercial
- **GitHub Pages**: ❌ NOT free for API access.

### OpenStreetMap Maritime Data ✅
- Overpass API can query shipwrecks, harbors, ports, lighthouses from OSM
- Free, no auth, CORS enabled

### **BEST PICK for Maritime: AISHub** (with proxy) or Global Fishing Watch for fishing-specific data.

---

## 4. GPS Jamming / Interference

### ADS-B GPS Jamming Detection 🔍
- **Concept**: ADS-B data includes navigation accuracy (NACp, NIC). Aircraft reporting degraded GPS can indicate jamming zones.
- **Source**: OpenSky Network data can be analyzed for GPS anomalies
- **GitHub Pages**: ⚠️ Requires post-processing. No ready-made free API.

### RNT Foundation / GPSJam.org ✅
- **URL**: https://gpsjam.org/
- **Type**: Web visualization of GPS interference based on ADS-B data
- **Data**: Maps showing GPS interference hotspots globally
- **GitHub Pages**: ⚠️ Website is viewable but no public API. Data may be scraped for research.

### GPS Interference Monitor (academic sources)
- Various university research projects publish GPS interference datasets
- Check: Stanford GPS Lab, EU GNSS Agency reports

### FlightRadar24 Safety Scores
- FR24 tracks GPS accuracy — some data available through their network
- Not freely accessible via API

### **Summary**: GPS jamming data is largely derived, not a direct free API. Best approach: process OpenSky ADS-B data to detect GPS anomalies (degraded NACp values, ADS-R failures). No standalone free GPS jamming API exists.

---

## 5. No-Fly Zones / Airspace Restrictions

### FAA SUA (Special Use Airspace) ✅📦
- **URL**: https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/Special_Use_Airspace/
- **Format**: Shapefiles, GeoJSON, KML
- **Update**: Monthly (AIRAC cycle)
- **Data**: Restricted areas, MOAs, TFRs (Temporary Flight Restrictions), prohibited areas
- **GitHub Pages**: ✅ YES — downloadable GeoJSON/Shapefiles, can bundle in repo.

### FAA TFR (Temporary Flight Restrictions) ✅
- **URL**: https://tfr.faa.gov/tfr2/list.html
- **Format**: HTML listing, can parse to GeoJSON
- **Update**: Real-time (updated as issued)
- **GitHub Pages**: ⚠️ Need scraping/parsing. No direct API.

### Eurocontrol ✅
- **URL**: https://www.eurocontrol.int/ServiceUnits/DAT/ViewData/Default.aspx
- **Format**: AIXM, ERAM
- **Data**: European airspace, restrictions, danger areas
- **GitHub Pages**: ⚠️ Complex format (AIXM). Need conversion.

### NATS / UK Airspace ✅
- **URL**: https://nats-uk.ead-it.com/cms-nats/opencms/en/
- **Format**: AIXM downloads
- **Data**: UK airspace structure

### OpenAirspace / OpenFlightMaps ✅
- **URL**: https://github.com/flightmaps/openflightmaps
- **Format**: GeoJSON, JSON
- **Data**: Open-source aeronautical charts + airspace data
- **GitHub Pages**: ✅ YES — open GeoJSON data available.
- **Notes**: Community-maintained open aeronautical data. Excellent for globe visualization.

### OurAirports ✅📦
- **URL**: https://ourairports.com/data/
- **Format**: CSV (airports, runways, frequencies, navaids)
- **Data**: Worldwide airport data
- **GitHub Pages**: ✅ YES — downloadable CSV, can convert to GeoJSON.

### **BEST PICK: FAA SUA + OpenFlightMaps** — GeoJSON ready for globe.

---

## 6. Weather

### OpenWeatherMap 🔑
- **URL**: https://openweathermap.org/api
- **API Type**: REST (free API key required)
- **Rate Limits**: Free tier: 1,000,000 calls/month, 60 calls/min
- **Data Format**: JSON
- **Data Available**: Current weather, forecasts (5-day/3-hour), air quality, UV index, geocoding
- **Update Frequency**: Every 10 minutes (current), 3-hourly (forecast)
- **GitHub Pages**: ⚠️ API key needed. Exposed in client JS. Proxy recommended for production.
- **Notes**: The most popular free weather API. Generous free tier.

### NOAA / NWS API ✅🟢
- **URL**: https://www.weather.gov/documentation/services-web-api
- **API Type**: REST (no auth required!)
- **Rate Limits**: None explicitly stated (fair use expected, ~1 req/sec)
- **Data Format**: GeoJSON, JSON-LD
- **Data Available**: US weather forecasts, alerts, observations, radar
- **Update Frequency**: Varies (observations: hourly, forecasts: every 6h)
- **CORS**: Yes
- **GitHub Pages**: ✅ YES — works from browser. US-only coverage.
- **Notes**: Excellent free weather source for US. International coverage via partner services.

### Open-Meteo ✅🟢
- **URL**: https://open-meteo.com/
- **API Type**: REST (no auth required!)
- **Rate Limits**: 10,000 requests/day free. Non-commercial use unlimited.
- **Data Format**: JSON
- **Data Available**: Current weather, hourly/daily forecasts, historical weather, marine, air quality
- **Update Frequency**: Hourly
- **CORS**: Yes
- **GitHub Pages**: ✅ YES — global coverage, no key, CORS-enabled. Best free weather API for globe.
- **Notes**: Open-source, uses ECMWF/GFS models. Global coverage. Highly recommended.

### Windy.com API 🔑
- **URL**: https://api.windy.com/
- **API Type**: REST/WebGL (free API key)
- **Rate Limits**: 500 requests/day free
- **Data Format**: JSON, binary (GRIB2)
- **GitHub Pages**: ⚠️ With API key. Good for wind visualization overlays.

### NOAA GFS (Global Forecast System) 📦
- **URL**: https://nomads.ncep.noaa.gov/
- **Format**: GRIB2, NetCDF
- **Data**: Global weather model data (temperature, wind, pressure at all levels)
- **GitHub Pages**: ⚠️ Complex binary format. Need conversion to GeoJSON for browser use.

### Earth Nullschool ✅🟢
- **URL**: https://earth.nullschool.net/
- **Type**: Visualization (uses GFS data)
- **Notes**: Beautiful wind/ocean visualization. Source data available.

### **BEST PICK: Open-Meteo** — truly free, global, no auth, CORS, JSON. Perfect for GitHub Pages globe.

---

## 7. Art / Museum Data

### Europeana ✅🟢
- **URL**: https://www.europeana.eu/api
- **API Type**: REST API (free API key required)
- **Rate Limits**: 100,000 requests per day (generous)
- **Data Format**: JSON-LD
- **Data Available**: 50M+ cultural heritage items from European institutions — images, metadata, geolocation
- **CORS**: Yes
- **GitHub Pages**: ✅ YES — with free API key. Geocoded cultural items perfect for globe pins.
- **Notes**: Incredible resource. Items have lat/lon coordinates. Search by location, time period, type.

### Smithsonian Open Access ✅📦
- **URL**: https://www.si.edu/openaccess
- **API Type**: REST (CC0 public domain)
- **Data Format**: JSON, IIIF manifests
- **Data Available**: Millions of images and metadata, CC0 license
- **GitHub Pages**: ✅ YES — CC0, can download and bundle. API at https://api.si.edu/openaccess/api/v1.0/
- **Notes**: Truly open. CC0 means no restrictions. API key from https://api.si.edu/openaccess/api/v1.0/

### Rijksmuseum API 🔑
- **URL**: https://data.rijksmuseum.nl/
- **API Type**: REST (free API key)
- **Rate Limits**: 10,000 requests per hour
- **Data Format**: JSON, OAI-PMH
- **Data Available**: 700,000+ artworks, high-res images, metadata
- **GitHub Pages**: ✅ YES — with free API key. Geocoded artworks available.

### British Museum API ⚠️
- **URL**: The SPARQL endpoint was at https://collection.britishmuseum.org/sparql
- **Status**: API availability has changed. Data may require alternative access methods.
- **GitHub Pages**: ⚠️ Check current availability.

### Metropolitan Museum of Art ✅🟢
- **URL**: https://metmuseum.github.io/
- **API Type**: REST (no auth!)
- **Rate Limits**: None stated
- **Data Format**: JSON
- **Data Available**: 400,000+ artworks with images and metadata
- **GitHub Pages**: ✅ YES — no auth, CORS-friendly.
- **Notes**: Excellent. Full collection data. Some items have provenance with locations.

### Google Arts & Culture ⚠️
- No public API available. Data is proprietary.

### **BEST PICK: Europeana + Met Museum** — Europeana for geocoded cultural items globally, Met for rich artwork data.

---

## 8. Satellite Imagery

### NASA Worldview / GIBS ✅🟢
- **URL**: https://worldview.earthdata.nasa.gov/ | GIBS API: https://gibs.earthdata.nasa.gov/
- **API Type**: WMTS/TMS tile service (no auth!)
- **Rate Limits**: Fair use
- **Data Format**: PNG tiles (map tiles)
- **Data Available**: Daily global satellite imagery from MODIS, VIIRS, Landsat, GOES
- **Update Frequency**: Daily (some near real-time)
- **GitHub Pages**: ✅ YES — tile layers can be added directly to Cesium/Leaflet globe. No key needed.
- **Notes**: This is THE free satellite imagery source. Massive catalog of daily global imagery.

### Sentinel Hub (Copernicus) 🔑
- **URL**: https://www.sentinel-hub.com/
- **API Type**: OGC WMS/WMTS, REST (free tier available)
- **Rate Limits**: Free tier: 3000 processing units/month
- **Data Format**: PNG/JPEG tiles, GeoTIFF
- **Data Available**: Sentinel-1 (SAR), Sentinel-2 (optical), Sentinel-3, Landsat, MODIS
- **GitHub Pages**: ⚠️ Free tier exists but limited. OAuth2 auth required.
- **Notes**: Best for on-demand custom composites (NDVI, true color, etc.)

### Google Earth Engine ⚠️
- **URL**: https://earthengine.google.com/
- **API Type**: JavaScript/Python API (requires registration)
- **Rate Limits**: Free for research/non-commercial
- **Data Available**: Petabytes of satellite imagery
- **GitHub Pages**: ❌ NOT directly — requires server-side code, not client-side.

### Mapbox Satellite 🔑
- **URL**: https://www.mapbox.com/
- **API Type**: Tile service
- **Rate Limits**: Free tier: 50,000 tile loads/month
- **GitHub Pages**: ✅ With free API token. Beautiful satellite basemap.

### Esri World Imagery ⚠️
- **URL**: https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
- **Type**: Tile service
- **GitHub Pages**: ⚠️ Terms of service may restrict. Not truly open.

### Planet Labs 💰
- Free tier very limited. Commercial focus.

### **BEST PICK: NASA GIBS/Worldview** — no auth, daily global imagery, tile layer for any globe.

---

## 9. News / Events

### GDELT Project ✅🟢
- **URL**: https://www.gdeltproject.org/
- **API Type**: GDELT 2.0 API, raw CSV downloads, BigQuery
- **Rate Limits**: API: reasonable use | Downloads: no limit
- **Data Format**: CSV, JSON (via API), BigQuery tables
- **Data Available**: Global events database — protests, conflicts, diplomacy, media mentions. 100+ languages.
- **Update Frequency**: Every 15 minutes (GDELT 2.0)
- **Endpoints**:
  - `https://api.gdeltproject.org/api/v2/doc/doc?query=*&mode=artlist&maxrecords=250&format=json`
  - `https://api.gdeltproject.org/api/v2/gkg/gkg?query=*&mode=artlist&maxrecords=250&format=json`
- **CORS**: Limited (may need proxy)
- **GitHub Pages**: ✅ YES — API works. Globe-compatible: events have lat/lon coordinates.
- **Notes**: Largest open global events database. Incredible for visualizing world events on a globe. GKG (Global Knowledge Graph) has themes, locations, emotions.

### ACLED (Armed Conflict Location & Event Data) 🔑
- **URL**: https://acleddata.com/
- **API Type**: REST (free for researchers with registration)
- **Rate Limits**: Varies by tier
- **Data Format**: CSV, JSON
- **Data Available**: Political violence, protests, armed conflicts globally
- **Update Frequency**: Weekly
- **GitHub Pages**: ⚠️ Registration required. Good for conflict visualization.

### EventRegistry ⚠️
- **URL**: https://eventregistry.org/
- **API Type**: REST (free tier: 1,000 requests/day)
- **Data Format**: JSON
- **Data**: News events, topics, concepts
- **GitHub Pages**: ⚠️ With free API key.

### USGS Earthquake API ✅🟢
- **URL**: https://earthquake.usgs.gov/fdsnws/event/1/
- **API Type**: REST (no auth!)
- **Rate Limits**: None stated (fair use)
- **Data Format**: GeoJSON, CSV, KML, QuakeML
- **Data Available**: Global earthquakes, M2.5+ with location, depth, magnitude
- **Update Frequency**: Real-time (within minutes)
- **CORS**: Yes
- **GitHub Pages**: ✅ YES — direct GeoJSON, no auth. Perfect globe layer.
- **Notes**: One of the best free geo-located event APIs. Earthquakes are inherently geospatial.

### NASA EONET (Earth Observatory Natural Event Tracker) ✅🟢
- **URL**: https://eonet.gsfc.nasa.gov/api/v3/
- **API Type**: REST (no auth!)
- **Rate Limits**: None stated
- **Data Format**: JSON/GeoJSON
- **Data Available**: Wildfires, volcanoes, storms, icebergs, floods — natural events with coordinates
- **Update Frequency**: Daily
- **CORS**: Yes
- **GitHub Pages**: ✅ YES — direct browser fetch. Events have lat/lon. Perfect for globe.
- **Notes**: Curated by NASA from satellite observations. Events are geocoded. Excellent.

### ReliefWeb (OCHA) ✅🟢
- **URL**: https://api.reliefweb.int/
- **API Type**: REST (no auth!)
- **Rate Limits**: Fair use
- **Data Format**: JSON
- **Data Available**: Humanitarian crises, disasters, reports
- **GitHub Pages**: ✅ YES

### **BEST PICK: GDELT + USGS Earthquakes + NASA EONET** — all free, all geo-coded, all globe-ready.

---

## 10. Geographic / Base Map Data

### Natural Earth ✅📦
- **URL**: https://www.naturalearthdata.com/downloads/
- **Data**: Vector (SHP, GeoJSON, GeoPackage) + Raster
- **Scales**: 1:10m (detailed), 1:50m (medium), 1:110m (schematic)
- **License**: Free for any use
- **GitHub Pages**: ✅ YES — download GeoJSON, bundle in repo. Perfect base map.
- **Notes**: The standard for natural-looking world maps. Countries, states, coastlines, rivers, lakes, etc.

### OpenStreetMap ✅🟢
- **URL**: https://www.openstreetmap.org/ | API: https://wiki.openstreetmap.org/wiki/API_v0.6
- **API Type**: Overpass API for queries, tile servers for maps
- **Rate Limits**: Overpass: ~2 requests/sec, 10,000 query elements. Tiles: fair use.
- **Data**: Everything — roads, buildings, POIs, land use, natural features
- **GitHub Pages**: ✅ YES — use Overpass API or pre-extracted GeoJSON.
- **Notes**: Overpass Turbo (https://overpass-turbo.eu/) great for extracting data.

### GeoJSON repositories ✅📦
- **world-atlas** (TopoJSON): https://github.com/topojson/world-atlas
- **countries** (GeoJSON): https://github.com/datasets/geo-countries
- **US states**: https://github.com/PublicaMundi/MappingAPI
- **Natural Earth GeoJSON**: Pre-converted available on GitHub
- **GitHub Pages**: ✅ YES — direct CDN or bundled.

### OpenFlights Airports ✅📦
- **URL**: https://openflights.org/data.html
- **Format**: CSV (airports, airlines, routes)
- **Data**: 10,000+ airports with lat/lon
- **GitHub Pages**: ✅ YES — convert CSV to GeoJSON.

### GeoNames ✅🟢
- **URL**: https://www.geonames.org/export/
- **API Type**: REST (free account, 2000/hr) + bulk download
- **Data**: 11M+ geographical names, features
- **GitHub Pages**: ✅ YES — download dataset or use API.

### HydroSHEDS / HydroLAKES 📦
- **URL**: https://www.hydrosheds.org/
- **Data**: Rivers, lakes, watersheds (global)
- **Format**: Shapefile, GeoTIFF
- **GitHub Pages**: ✅ — downloadable.

### **BEST PICK: Natural Earth + world-atlas TopoJSON** — lightweight, beautiful, globe-ready.

---

## Bonus: Other Useful Free Geo Sources

### Marine / Ocean
| Source | URL | Auth | Format | Globe Ready |
|--------|-----|------|--------|-------------|
| NOAA NCEI Ocean Data | https://www.ncei.noaa.gov/ | No | NetCDF, CSV | ⚠️ Conversion needed |
| Ocean Biodiversity (OBIS) | https://obis.org/ | No | JSON | ✅ |
| Marine Regions | https://www.marineregions.org/ | No | GeoJSON, WFS | ✅ |

### Space / Astronomy
| Source | URL | Auth | Format | Globe Ready |
|--------|-----|------|--------|-------------|
| JPL Small-Body Database | https://ssd.jpl.nasa.gov/tools/sbdb_query.html | No | JSON, CSV | ⚠️ |
| Minor Planet Center | https://minorplanetcenter.net/ | No | JSON | ⚠️ |
| Stellarium Web | https://stellarium-web.org/ | No | JS lib | ✅ |

### Population / Demographics
| Source | URL | Auth | Format | Globe Ready |
|--------|-----|------|--------|-------------|
| WorldPop | https://www.worldpop.org/ | No | GeoTIFF | ⚠️ |
| GPWv4 (NASA SEDAC) | https://sedac.ciesin.columbia.edu/ | Free reg | GeoTIFF | ⚠️ |
| Kontur Population | https://data.humdata.org/dataset/kontur-population-dataset | No | H3 GeoJSON | ✅ |

### Energy / Environment
| Source | URL | Auth | Format | Globe Ready |
|--------|-----|------|--------|-------------|
| Global Power Plant DB | https://datasets.wri.org/dataset/globalpowerplantdatabase | No | CSV, GeoJSON | ✅ |
| EIA (US Energy) | https://www.eia.gov/opendata/ | Free key | JSON | ✅ |
| Global Forest Watch | https://www.globalforestwatch.org/ | Free reg | API, tiles | ✅ |

### Infrastructure / Networks
| Source | URL | Auth | Format | Globe Ready |
|--------|-----|------|--------|-------------|
| submarinecablemap.com | https://www.submarinecablemap.com/ | No | GeoJSON | ✅ |
| Telegeography (BGP/ASN) | https://bgp.he.net/ | No | API | ⚠️ |
| OpenCelliD | https://opencellid.org/ | Free key | CSV | ✅ |

---

## Recommended GitHub Pages Globe Stack

For a fully **free** geospatial globe with NO backend server:

### Base Globe
- **CesiumJS** or **deck.gl** or **Three.js + Globe.gl** — open source 3D globe

### Layers (all no-auth, browser-compatible)
1. **Base map**: Natural Earth GeoJSON (bundled) or Cesium Ion free tier
2. **Aircraft**: OpenSky Network API (real-time, CORS)
3. **Satellites**: CelesTrak TLE → SGP4.js for orbit propagation
4. **Earthquakes**: USGS GeoJSON feed (real-time)
5. **Natural events**: NASA EONET API (wildfires, volcanoes, storms)
6. **Weather**: Open-Meteo API (global, no key)
7. **Satellite imagery**: NASA GIBS tile layers
8. **Events/News**: GDELT API
9. **Museum/Art**: Europeana API (with free key) or Met Museum (no key)
10. **Airspace**: FAA SUA GeoJSON + OpenFlightMaps

### Architecture
```
Browser (GitHub Pages static)
├── index.html + JS bundle
├── data/ (pre-downloaded Natural Earth, airport CSV → GeoJSON)
├── CDN: CesiumJS / Three.js
└── Live APIs (direct fetch from browser):
    ├── opensky-network.org
    ├── celestrak.org
    ├── earthquake.usgs.gov
    ├── eonet.gsfc.nasa.gov
    ├── api.open-meteo.com
    ├── gibs.earthdata.nasa.gov (tiles)
    ├── api.gdeltproject.org
    └── collectionapi.metmuseum.org
```

All the "live" APIs support CORS and require no authentication, making them perfect for a pure client-side GitHub Pages deployment.
