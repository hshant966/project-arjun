# OSINT & Geospatial Data Sources for Project Arjun (God's Eye)

> India-focused Open Source Intelligence data sources, API specs, and CesiumJS integration patterns for the "wow factor" features — live aircraft, satellite tracking, disaster overlays, and infrastructure monitoring.

---

## Table of Contents

1. [Satellite Imagery APIs](#1-satellite-imagery-apis)
2. [AIS / Ship Tracking Data](#2-ais-ship-tracking-data)
3. [ADS-B / Flight Tracking](#3-ads-b--flight-tracking)
4. [GPS / Signal Intelligence](#4-gps--signal-intelligence)
5. [Social Media / News OSINT](#5-social-media--news-osint)
6. [Disaster & Crisis Monitoring](#6-disaster--crisis-monitoring)
7. [Infrastructure Monitoring](#7-infrastructure-monitoring)
8. [CesiumJS Integration Patterns](#8-cesiumjs-integration-patterns)

---

## 1. Satellite Imagery APIs

### 1.1 Sentinel Hub

| Property | Value |
|----------|-------|
| **URL** | https://www.sentinel-hub.com |
| **API Endpoint** | `https://services.sentinel-hub.com/api/v1/process` (Processing API v3) |
| **Alternative** | `https://sh.dataspace.copernicus.eu/api/v1/process` (Copernicus Data Space) |
| **Auth** | OAuth2 Client Credentials flow. Register at sentinel-hub.com → get `client_id` + `client_secret`. Token endpoint: `https://services.sentinel-hub.com/oauth/token` |
| **Tile Format** | WMTS (`/ogc/wmts/{instance_id}`), OGC API Tiles, direct image PNG/JPEG |
| **Resolution** | Sentinel-2: 10m (RGB), 20m (SWIR), 60m (atmospheric). Landsat 8/9: 15-30m |
| **Revisit Time** | Sentinel-2: 5 days (both satellites combined). Landsat: 16 days |
| **India Coverage** | ✅ Full coverage. Sentinel-2 covers entire India every 5 days |
| **Rate Limits** | Free tier: 3000 processing units/month. Paid plans scale from there |
| **Response Format** | PNG/JPEG image (direct), JSON metadata, GeoTIFF via export |

**Setup:**

```bash
# Get access token
curl -X POST https://services.sentinel-hub.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

**CesiumJS Integration — Imagery Provider:**

```javascript
// Sentinel Hub WMTS as Cesium imagery layer
const sentinelProvider = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://services.sentinel-hub.com/ogc/wmts/{instanceId}',
    layer: 'TRUE_COLOR',           // or NDVI, FALSE_COLOR, etc.
    style: 'default',
    format: 'image/png',
    tileMatrixSetID: 'PopularWebMercator',
    maximumLevel: 18,
    credit: 'Sentinel Hub / Copernicus'
});
viewer.imageryLayers.addImageryProvider(sentinelProvider);
```

**CesiumJS Integration — Direct Processing API (time-series):**

```javascript
// Fetch a specific date's imagery via Processing API
async function fetchSentinelImage(bbox, date, width = 512, height = 512) {
    const evalscript = `
        //VERSION=3
        function setup() { return { input: ["B04", "B03", "B02"], output: { bands: 3 } }; }
        function evaluatePixel(sample) { return [sample.B04, sample.B03, sample.B02]; }
    `;
    const response = await fetch('https://services.sentinel-hub.com/api/v1/process', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            input: {
                bounds: { bbox: bbox, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
                data: [{ type: "sentinel-2-l2a", dataFilter: { timeRange: { from: `${date}T00:00:00Z`, to: `${date}T23:59:59Z` } } }]
            },
            output: { width, height, responses: [{ format: { type: "image/png" } }] },
            evalscript
        })
    });
    return URL.createObjectURL(await response.blob());
}
// Usage: overlay as single-tile imagery on Cesium
const imageUrl = await fetchSentinelImage([77.0, 12.5, 77.8, 13.2], '2024-01-15');
viewer.entities.add({
    rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(77.0, 12.5, 77.8, 13.2),
        material: imageUrl
    }
});
```

---

### 1.2 NASA GIBS (Global Imagery Browse Services)

| Property | Value |
|----------|-------|
| **URL** | https://gibs.earthdata.nasa.gov |
| **WMTS Endpoint** | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi` |
| **WMS Endpoint** | `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi` |
| **Auth** | ❌ **No authentication required** for tile access. Free & open. |
| **Tile Format** | WMTS (GoogleMapsCompatible grid), WMS 1.1.1 |
| **Resolution** | Varies by product: MODIS 250m-1km, VIIRS 375m-750m, Landsat 30m |
| **Revisit Time** | MODIS: 1-2 days. VIIRS: ~12 hours (Suomi NPP + NOAA-20). Landsat: 16 days |
| **India Coverage** | ✅ Full global coverage |
| **Rate Limits** | No hard limit documented. Be reasonable (~100 req/s sustained is fine) |
| **Response Format** | PNG tiles (256×256) |

**Available layers of interest for India:**

| Layer ID | Description | Resolution |
|----------|-------------|------------|
| `VIIRS_SNPP_CorrectedReflectance_TrueColor` | Near-real-time true color | 750m |
| `MODIS_Terra_CorrectedReflectance_TrueColor` | Terra true color | 250m |
| `MODIS_Fires_All` | Active fire detections | 1km |
| `IMERG_Precipitation_Rate` | Rainfall estimate | 10km |
| `VIIRS_SNPP_DayNightBand_ENCC` | Nighttime lights | 750m |
| `GHRSST_Sea_Surface_Temperature` | Sea surface temp | 1km |
| `Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual` | Landsat mosaic | 30m |

**CesiumJS Integration:**

```javascript
// NASA GIBS WMTS — zero-auth, works immediately
const gibsTrueColor = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi',
    layer: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/jpeg',
    maximumLevel: 9,
    credit: 'NASA GIBS'
});
viewer.imageryLayers.addImageryProvider(gibsTrueColor);

// Time-dynamic layer — changes with the viewer's clock
const gibsFires = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi',
    layer: 'MODIS_Fires_All',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 9,
    // Enable time dimension
    clock: viewer.clock,
    times: Cesium.TimeIntervalCollection.fromIso8601({
        iso8601: '2024-01-01/2024-12-31/P1D',
        isStopIncluded: false
    })
});
viewer.imageryLayers.addImageryProvider(gibsFires);

// Nighttime lights — dramatic overlay for India
const nightLights = new Cesium.WebMapTileServiceImageryProvider({
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi',
    layer: 'VIIRS_SNPP_DayNightBand_ENCC',
    style: 'default',
    tileMatrixSetID: 'GoogleMapsCompatible',
    format: 'image/png',
    maximumLevel: 8,
    credit: 'NASA Black Marble'
});
// Add with alpha for overlay effect
const nightLayer = viewer.imageryLayers.addImageryProvider(nightLights);
nightLayer.alpha = 0.6;
```

---

### 1.3 Google Earth Engine (GEE)

| Property | Value |
|----------|-------|
| **URL** | https://earthengine.google.com |
| **API** | JavaScript Code Editor (browser), Python (`earthengine-api`), REST API |
| **Auth** | Google account + project registration. Free for research/non-commercial. OAuth2 or Service Account |
| **Tile Format** | Map tiles via `getMapId()` → XYZ tile URL. Export as GeoTIFF |
| **Resolution** | Sentinel-2: 10m, Landsat: 30m, MODIS: 250m-1km, SRTM: 30m DEM |
| **Revisit Time** | Depends on satellite (same as source) |
| **India Coverage** | ✅ Full coverage + India-specific datasets |
| **Rate Limits** | Free tier: generous for research. Computation quotas (concurrent EE compute units) |
| **Response Format** | XYZ tile URL (PNG), GeoTIFF export |

**India-specific datasets on GEE:**

| Dataset ID | Description |
|------------|-------------|
| `USGS/SRTMGL1_003` | SRTM 30m DEM — full India terrain |
| `CIESIN/GPWv411/GPW_Population_Count` | Gridded population |
| `JRC/GHSL/P2023A/GHS_BUILT_S` | Built-up surface (settlement layers) |
| `MODIS/061/MCD12Q1` | Land cover classification |
| `ESA/WorldCover/v200` | 10m land cover (2021) |
| `COPERNICUS/S2_SR` | Sentinel-2 surface reflectance |
| `FAO/GAUL/2015/level2` | Administrative boundaries (India districts) |

**Python integration for tile serving:**

```python
import ee
ee.Initialize(project='your-project-id')

# Get NDVI time series for India
s2 = ee.ImageCollection('COPERNICUS/S2_SR') \
    .filterBounds(ee.Geometry.Rectangle([68, 6, 98, 36])) \  # India bbox
    .filterDate('2024-01-01', '2024-03-01') \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
    .median()

ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI')

# Get a tile URL to serve to CesiumJS
map_id = ndvi.getMapId({
    'min': -0.2, 'max': 0.8,
    'palette': ['brown', 'yellow', 'green', 'darkgreen']
})
tile_url = map_id['tile_fetcher'].url_format
# → "https://earthengine.googleapis.com/v1/projects/.../tiles/{z}/{x}/{y}"
```

**CesiumJS Integration:**

```javascript
// Serve GEE tiles as custom imagery provider
const geeProvider = new Cesium.UrlTemplateImageryProvider({
    url: 'YOUR_GEE_TILE_URL/{z}/{x}/{y}.png',  // from getMapId
    maximumLevel: 15,
    credit: 'Google Earth Engine'
});
viewer.imageryLayers.addImageryProvider(geeProvider);

// Terrain from SRTM via GEE
// (Better to use Cesium Ion or AWS Open Data for SRTM tiles directly)
```

---

### 1.4 ISRO Bhuvan

| Property | Value |
|----------|-------|
| **URL** | https://bhuvan.nrsc.gov.in |
| **WMS Endpoint** | `https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms` (vector) |
| **WMS Endpoint** | `https://bhuvan-ras1.nrsc.gov.in/bhuvan/wms` (raster) |
| **Alternative** | `https://bhuvan-app1.nrsc.gov.in/thredds/wms` (THREDDS data server) |
| **Auth** | Free registration at bhuvan.nrsc.gov.in. Some layers open, some require API key |
| **Tile Format** | WMS 1.1.1 (GET requests), some WMTS |
| **Resolution** | Resourcesat-2: 5.8m (LISS-IV), 23.5m (LISS-III), 56m (AWIFS). IRS imagery |
| **Revisit Time** | Resourcesat: 5-24 days depending on sensor |
| **India Coverage** | ✅ **India-only** — this is ISRO's platform |
| **Rate Limits** | Undocumented. Moderate usage recommended. Registration-based |
| **Response Format** | PNG/JPEG via WMS GetMap |

**Notable Bhuvan layers:**

| Layer | Description |
|-------|-------------|
| `india397` | IRS P6 LISS-III 3-band mosaic |
| `lulc2020` | Land use/land cover 2020 |
| `hazard_flood` | Flood hazard zones |
| `disaster_fires` | Fire hotspot (MODIS-derived) |
| `district_boundary` | Indian administrative boundaries |
| `geology_india` | Geological map of India |

**CesiumJS Integration:**

```javascript
// Bhuvan WMS as Cesium imagery layer
const bhuvanProvider = new Cesium.WebMapServiceImageryProvider({
    url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
    layers: 'lulc2020',              // layer name from capabilities
    parameters: {
        service: 'WMS',
        format: 'image/png',
        transparent: true,
        version: '1.1.1',
        srs: 'EPSG:4326'
    },
    credit: 'ISRO/NRSC Bhuvan'
});
viewer.imageryLayers.addImageryProvider(bhuvanProvider);

// Alternative: GetCapabilities to discover layers
// https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms?service=WMS&request=GetCapabilities&version=1.1.1
```

---

### 1.5 EOS LandViewer

| Property | Value |
|----------|-------|
| **URL** | https://eos.com/landviewer |
| **API Endpoint** | `https://api.eos.com/api/v2` (EOS Data Analytics API) |
| **Auth** | Free account → API key (sent as `x-api-key` header or `Authorization: Bearer` |
| **Tile Format** | XYZ tiles, WMTS, direct image download |
| **Resolution** | Sentinel-2: 10m, Landsat: 30m, MODIS, Sentinel-1 SAR |
| **Revisit Time** | Same as source satellites |
| **India Coverage** | ✅ Full coverage |
| **Rate Limits** | Free tier: limited searches per day. Paid plans for high-volume |
| **Response Format** | GeoTIFF download, PNG tiles, JSON metadata |

**CesiumJS Integration:**

```javascript
// EOS LandViewer tile URL (from their API response)
const eosProvider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://tiles.eos.com/{id}/{z}/{x}/{y}.png?key=YOUR_KEY',
    maximumLevel: 17,
    credit: 'EOS LandViewer'
});
viewer.imageryLayers.addImageryProvider(eosProvider);
```

---

### 1.6 Additional Free Imagery Sources

| Source | URL | Auth | Resolution | Notes |
|--------|-----|------|------------|-------|
| **Copernicus Data Space** | https://dataspace.copernicus.eu | Free registration | 10m (S2) | Direct Sentinel-2 download, STAC API |
| **AWS Open Data (Landsat)** | `landsat-pds.s3.amazonaws.com` | None (requester-pays) | 30m | All Landsat 8 scenes |
| **AWS Open Data (Sentinel-2)** | `sentinel-s2-l1c.s3.amazonaws.com` | None | 10m | L1C COGs on S3 |
| **Microsoft Planetary Computer** | https://planetarycomputer.microsoft.com | Free SAS tokens | 10m+ | STAC API, Sentinel/Landsat/DEM |
| **OpenTopography** | https://opentopography.org | Free API key | 1m (lidar), 30m (SRTM) | High-res DEM for select areas |

---

## 2. AIS (Ship Tracking) Data

### 2.1 AISHub

| Property | Value |
|----------|-------|
| **URL** | http://www.aishub.net |
| **API Endpoint** | AISHub provides raw NMEA data via TCP socket connection, not a REST API |
| **Connection** | `telnet data.aishub.net 4004` or dedicated port for subscribers |
| **Auth** | Free registration → data sharing agreement (you share AIS data, they give you access) |
| **Format** | Raw NMEA sentences (`!AIVDM,...`) or JSON (for their API subscribers) |
| **Coverage** | Global, community-sourced. Indian coast coverage depends on contributor density |
| **Rate Limits** | Real-time stream. No REST rate limit (it's a socket) |

### 2.2 MarineTraffic

| Property | Value |
|----------|-------|
| **URL** | https://www.marinetraffic.com |
| **API Endpoint** | `https://services.marinetraffic.com/api/exportvessels/v:8/{API_KEY}/MINLAT:6/MAXLAT:36/MINLON:68/MAXLON:98/protocol:jsono` |
| **Auth** | API key (free tier available with registration) |
| **Format** | JSON (position reports), CSV export |
| **Rate Limits** | Free tier: very limited (~50 requests/day). Standard: 250-1000/day |
| **India Coverage** | ✅ Good coverage — multiple terrestrial stations along Indian coast |

**Free tier endpoint:**

```
GET https://services.marinetraffic.com/api/exportvessels/v:8/{API_KEY}
    /MINLAT:6/MAXLAT:36/MINLON:68/MAXLON:98
    /protocol:jsono/msgtype:extended
```

### 2.3 Spire Global

| Property | Value |
|----------|-------|
| **URL** | https://spire.com/maritime |
| **API Endpoint** | `https://api.spire.com/graphql` (GraphQL API) |
| **Auth** | OAuth2 or API key. Free trial available |
| **Format** | JSON (GraphQL response) |
| **Rate Limits** | Trial: limited. Paid: enterprise scale |
| **Coverage** | Satellite-based AIS — covers ocean (Indian Ocean especially relevant) |

### 2.4 Other AIS Sources

| Source | URL | Auth | Notes |
|--------|-----|------|-------|
| **OpenAIS** | https://openais.net | Free for non-commercial | Community feed |
| **VesselFinder** | https://www.vesselfinder.com/api | API key (free limited) | REST API, vessel positions |
| **exactEarth** | (now Spire) | — | Merged with Spire |
| **ORBCOMM** | https://www.orbcomm.com | Paid | Satellite AIS, enterprise |
| **Indian DG Shipping** | https://dgshipping.gov.in | No public API | Directory of Indian vessels |

### 2.5 Mapping Indian Shipping Lanes

Indian coast has dense traffic in:
- **Gulf of Khambhat** (Gujarat) — petroleum/LNG tankers to Jamnagar, Dahej
- **Mumbai Port / JNPT** — container traffic
- **Paradip / Vizag / Chennai** — east coast ore/bulk exports
- **Cochin / Tuticorin** — southern ports
- **Haldia / Kolkata** — Hooghly river traffic
- **Mumbai High** — offshore oil platform supply vessels
- **Andaman & Nicobar** — Strait of Malacca approaches

**CesiumJS Integration — Ship Entities as Moving Points:**

```javascript
// Fetch AIS data and render as moving entities
async function loadAISData() {
    const response = await fetch('/api/ais/india-coast'); // your proxy
    const vessels = await response.json();

    vessels.forEach(vessel => {
        const entity = viewer.entities.add({
            id: `ais-${vessel.mmsi}`,
            name: vessel.name || `MMSI ${vessel.mmsi}`,
            position: Cesium.Cartesian3.fromDegrees(
                vessel.lon, vessel.lat, 0
            ),
            point: {
                pixelSize: 8,
                color: getVesselColor(vessel.type),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e7, 0.3)
            },
            label: {
                text: vessel.name || '',
                font: '11px sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                scale: 0.8,
                pixelOffset: new Cesium.Cartesian2(0, -14),
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            properties: {
                mmsi: vessel.mmsi,
                speed: vessel.speed,
                course: vessel.course,
                vesselType: vessel.type
            }
        });
    });
}

function getVesselColor(type) {
    const colors = {
        'tanker': Cesium.Color.RED,
        'cargo': Cesium.Color.CYAN,
        'fishing': Cesium.Color.GREEN,
        'passenger': Cesium.Color.YELLOW,
        'tug': Cesium.Color.ORANGE,
        'default': Cesium.Color.WHITE
    };
    return colors[type] || colors.default;
}

// GeoJSON shipping lane arcs for CesiumJS
const shippingLanes = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "name": "Mumbai-JNPT Lane", "traffic": "high" },
            "geometry": {
                "type": "LineString",
                "coordinates": [[72.6, 18.9], [72.8, 18.5], [73.0, 17.5]]
            }
        },
        {
            "type": "Feature",
            "properties": { "name": "Gulf of Khambhat Approach", "traffic": "very-high" },
            "geometry": {
                "type": "LineString",
                "coordinates": [[71.5, 21.5], [72.0, 21.0], [72.3, 20.5]]
            }
        }
    ]
};

// Render shipping lanes as glowing polylines
Cesium.GeoJsonDataSource.load(shippingLanes, {
    stroke: Cesium.Color.CYAN.withAlpha(0.6),
    strokeWidth: 3,
    clampToGround: true
}).then(dataSource => {
    viewer.dataSources.add(dataSource);
    // Add glow effect via PolylineGlow material
    dataSource.entities.values.forEach(entity => {
        if (entity.polyline) {
            entity.polyline.material = new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.2,
                color: Cesium.Color.CYAN.withAlpha(0.6)
            });
        }
    });
});
```

---

## 3. ADS-B / Flight Tracking

### 3.1 OpenSky Network

| Property | Value |
|----------|-------|
| **URL** | https://opensky-network.org |
| **API Endpoint** | `https://opensky-network.org/api/states/all` (real-time positions) |
| **Auth** | Optional (anonymous = 10 req/min, authenticated = 100 req/min). Basic auth with free account |
| **Rate Limits** | Anonymous: 10 requests/min. Authenticated: 100 requests/min |
| **Response Format** | JSON with nested arrays |
| **Coverage** | Global. India has moderate contributor density (ISRO stations + enthusiasts) |

**Response structure:**

```json
{
  "time": 1700000000,
  "states": [
    [
      "7c6b48",           // icao24
      "AI302  ",           // callsign
      "India",             // origin_country
      1700000000,          // time_position
      1700000000,          // last_contact
      77.6088,             // longitude
      12.9716,             // latitude
      3500.0,              // baro_altitude (meters)
      false,               // on_ground
      250.0,               // velocity (m/s)
      85.0,                // true_track (degrees)
      null,                // vertical_rate
      [900],               // sensors
      3500.0,              // geo_altitude
      null,                // squawk
      false,               // spi
      0                    // position_source (0=ADS-B)
    ]
  ]
}
```

**Filter for India bounding box:**

```
GET https://opensky-network.org/api/states/all?lamin=6.0&lomin=68.0&lamax=36.0&lomax=98.0
```

**CesiumJS Integration — Live Aircraft:**

```javascript
// OpenSky Network → Live aircraft on CesiumJS
class FlightTracker {
    constructor(viewer) {
        this.viewer = viewer;
        this.aircraft = new Map();
    }

    async fetchFlights() {
        // India bounding box
        const url = 'https://opensky-network.org/api/states/all?' +
            'lamin=6&lomin=68&lamax=36&lomax=98';

        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (!data.states) return;

            const now = Cesium.JulianDate.fromDate(new Date());

            data.states.forEach(s => {
                const icao24 = s[0];
                const callsign = (s[1] || '').trim();
                const lon = s[5];
                const lat = s[6];
                const altitude = s[7] || s[13] || 1000; // baro or geo
                const velocity = s[9] || 0;
                const heading = s[10] || 0;
                const onGround = s[8];

                if (lon === null || lat === null) return;

                if (!this.aircraft.has(icao24)) {
                    // New aircraft — create entity
                    const entity = this.viewer.entities.add({
                        id: `flight-${icao24}`,
                        name: callsign || icao24,
                        position: Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
                        point: {
                            pixelSize: onGround ? 4 : 6,
                            color: onGround ?
                                Cesium.Color.GRAY :
                                Cesium.Color.fromCssColorString('#00ff88'),
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 1
                        },
                        label: {
                            text: `${callsign || icao24}\n${Math.round(velocity * 3.6)} km/h`,
                            font: '10px monospace',
                            fillColor: Cesium.Color.WHITE,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                            scale: 0.7,
                            pixelOffset: new Cesium.Cartesian2(0, -16),
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            showBackground: true,
                            backgroundColor: Cesium.Color.fromCssColorString('#00000080')
                        },
                        // Orientation based on heading
                        orientation: Cesium.Transforms.headingPitchRollQuaternion(
                            Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
                            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0)
                        )
                    });
                    this.aircraft.set(icao24, entity);
                } else {
                    // Update existing
                    const entity = this.aircraft.get(icao24);
                    entity.position = Cesium.Cartesian3.fromDegrees(lon, lat, altitude);
                    entity.label.text = `${callsign || icao24}\n${Math.round(velocity * 3.6)} km/h`;
                    entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
                        Cesium.Cartesian3.fromDegrees(lon, lat, altitude),
                        new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), 0, 0)
                    );
                }
            });
        } catch (e) {
            console.warn('OpenSky fetch failed:', e);
        }
    }

    start(intervalSec = 10) {
        this.fetchFlights();
        this._interval = setInterval(() => this.fetchFlights(), intervalSec * 1000);
    }

    stop() {
        clearInterval(this._interval);
    }
}

// Usage
const tracker = new FlightTracker(viewer);
tracker.start(10); // Poll every 10 seconds
```

**CesiumJS — GLB Aircraft Model:**

```javascript
// Replace point with 3D aircraft model
async function loadAircraftModels() {
    const model = await Cesium.Model.fromGltfAsync({
        url: '/assets/models/airplane.glb',
        minimumPixelSize: 32,
        maximumScale: 20000
    });

    // For each tracked aircraft, replace point with model
    // Use entity.model = { uri: '/assets/models/airplane.glb', ... }
    this.aircraft.forEach(entity => {
        entity.point = undefined;
        entity.model = {
            uri: '/assets/models/airplane.glb',
            minimumPixelSize: 32,
            maximumScale: 10000,
            scale: 1.0
        };
    });
}
```

### 3.2 ADS-B Exchange

| Property | Value |
|----------|-------|
| **URL** | https://www.adsbexchange.com |
| **API Endpoint** | `https://adsbexchange-com1.p.rapidapi.com/v2/lat/{lat}/lon/{lon}/dist/{nm}/` (via RapidAPI) |
| **Alternative** | `https://api.adsb.lol/v2/lat/{lat}/lon/{lon}/dist/{nm}/` (free mirror) |
| **Auth** | Free: no key needed (api.adsb.lol). RapidAPI: key required for commercial |
| **Rate Limits** | Free mirror: generous but informal. RapidAPI: tiered by plan |
| **Response Format** | JSON |
| **Coverage** | Best global coverage — no filtering. Includes MLAT positions |

**Free mirror endpoint for India:**

```
GET https://api.adsb.lol/v2/lat/20.0/lon/78.0/dist/500/
```

**Response includes:**
- `hex` — ICAO 24-bit address
- `flight` — callsign
- `lat`, `lon`, `alt_baro`, `alt_geom`
- `gs` — ground speed (knots)
- `track` — true track
- `mlat` — positions from multilateration (when available)
- `tisb` — TIS-B positions

### 3.3 Flightradar24

| Property | Value |
|----------|-------|
| **URL** | https://www.flightradar24.com |
| **API Endpoint** | `https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds={lat1},{lat2},{lon1},{lon2}` |
| **Auth** | Unauthenticated for basic feed (may be blocked). Business API requires paid access |
| **Rate Limits** | Aggressively rate-limited for unauthenticated access |
| **Response Format** | JSON (keyed by ICAO24 hex) |
| **Coverage** | Excellent — commercial receiver network |

**Note:** FR24 aggressively blocks scraping. For Arjun, prefer OpenSky or ADS-B Exchange.

---

## 4. GPS / Signal Intelligence

### 4.1 GPSJam.org

| Property | Value |
|----------|-------|
|**GPSJam** —  |
| **URL** | https://gpsjam.org |
| **API** | No public API. Data derived from ADS-B GPS quality indicators (NUCp/NIC) |
| **How it works** | Detects GPS interference by monitoring degraded GPS quality in ADS-B reports from aircraft |
| **Data Format** | Web visualization (interactive map). Data can be scraped from the hex tiles |
| **India relevance** | ⚠️ High — GPS jamming reported near India-Pakistan border, Arabian Sea, Bay of Bengal |

**Integration approach:** Scrape the hex-grid heatmap data or use their tile images as overlay.

```javascript
// Overlay GPSJam tiles as imagery layer
const gpsJamProvider = new Cesium.UrlTemplateImageryProvider({
    url: 'https://gpsjam.org/tiles/{z}/{x}/{y}.png',
    maximumLevel: 12,
    credit: 'GPSJam.org'
});
const gpsLayer = viewer.imageryLayers.addImageryProvider(gpsJamProvider);
gpsLayer.alpha = 0.4; // Semi-transparent overlay
```

### 4.2 ADS-B Exchange MLAT Coverage

| Property | Value |
|----------|-------|
| **What** | Multilateration — aircraft tracked by timing differences between ground receivers |
| **Coverage** | Available where ≥4 receivers overlap. Indian metros likely have some MLAT coverage |
| **Detection** | MLAT positions appear in ADS-B Exchange data with `type: "mlat"` |
| **Significance** | Tracks aircraft without ADS-B transponders (military, stealth) |

### 4.3 Aireon Space-Based ADS-B

| Property | Value |
|----------|-------|
| **URL** | https://www.aireon.com |
| **Coverage** | Global — receivers on Iridium NEXT satellites |
| **Relevance** | Covers Indian Ocean (beyond terrestrial receiver range) |
| **Access** | Enterprise only — used by air navigation service providers (AAI in India) |
| **For Arjun** | Cannot access directly, but space-based coverage is a talking point |

### 4.4 GPS Interference Monitoring (Indian Ocean Region)

**Known hotspots near India:**
- **Karachi FIR** — frequent GPS jamming reported
- **Tehran FIR** — chronic interference
- **Eastern Mediterranean** — conflict-related jamming
- **Red Sea / Gulf of Aden** — Houthi-related GPS spoofing
- **Myanmar** — intermittent interference

**Monitoring approaches:**
1. **GPSJam.org** — daily updated heatmap of interference
2. **OPSGROUP reports** — pilot-reported interference areas
3. **FAA SAFO / EUROCONTROL NOP** — safety notices
4. **ADS-B data quality** — monitor NUCp/NIC degradation in your own data feeds

```javascript
// Create a heatmap from GPS interference data
function createGPSInterferenceLayer(interferencePoints) {
    // interferencePoints: [{lat, lon, severity (0-1), date}]
    const heatmapData = interferencePoints.map(p => ({
        x: p.lon,
        y: p.lat,
        value: p.severity
    }));

    // Use Cesium custom datasource with point primitives
    const dataSource = new Cesium.CustomDataSource('GPS Interference');
    interferencePoints.forEach(p => {
        dataSource.entities.add({
            position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat),
            ellipse: {
                semiMajorAxis: 50000,  // 50km radius
                semiMinorAxis: 50000,
                material: new Cesium.ColorMaterialProperty(
                    Cesium.Color.RED.withAlpha(p.severity * 0.5)
                ),
                height: 0
            },
            description: `GPS Interference: ${p.severity * 100}%\nDate: ${p.date}`
        });
    });
    viewer.dataSources.add(dataSource);
}
```

---

## 5. Social Media / News OSINT

### 5.1 GDELT 2.0 (Advanced India Filtering)

Already integrated in Arjun. Advanced filtering patterns:

**GDELT GKG (Global Knowledge Graph) for India:**

```
# Filter by India geography
https://api.gdeltproject.org/api/v2/doc/doc?query=geoloc:"India"&format=json&maxrecords=50

# Filter by specific topic + India
https://api.gdeltproject.org/api/v2/doc/doc?query=theme:DISASTER&geoloc:"India"&format=json

# Filter by specific Indian state
https://api.gdeltproject.org/api/v2/doc/doc?query=geoloc:"Kerala"&format=json

# Filter by tone (negative events in India)
https://api.gdeltproject.org/api/v2/doc/doc?query=geoloc:"India" tone<-3.0&format=json

# Time-bounded query
https://api.gdeltproject.org/api/v2/doc/doc?query=geoloc:"India" theme:PROTEST&format=json&startdatetime=20240101000000&enddatetime=20240301000000
```

**GDELT TV (Television) — Indian news channels:**
```
https://api.gdeltproject.org/api/v2/tv/tv?query=geoloc:"India"&format=json
```

**GDELT Visual (Image analysis):**
```
https://api.gdeltproject.org/api/v2/summary/summary?query=geoloc:"Mumbai"&format=html
```

**CesiumJS Integration — GDELT Event Clusters:**

```javascript
// Fetch GDELT events and plot on India map
async function plotGDELTIndia() {
    const url = 'https://api.gdeltproject.org/api/v2/doc/doc?' +
        'query=geoloc:"India" theme:DISASTER&format=json&maxrecords=250';

    const resp = await fetch(url);
    const data = await resp.json();

    if (!data.articles) return;

    const dataSource = new Cesium.CustomDataSource('GDELT Events');

    data.articles.forEach(article => {
        // GDELT provides lat/lon in the article
        if (article.lat && article.lon) {
            const sentiment = article.tone || 0;
            const color = sentiment < -2 ? Cesium.Color.RED :
                          sentiment < 0 ? Cesium.Color.ORANGE :
                          Cesium.Color.GREEN;

            dataSource.entities.add({
                name: article.title,
                position: Cesium.Cartesian3.fromDegrees(article.lon, article.lat),
                point: {
                    pixelSize: 10 + Math.abs(sentiment) * 2,
                    color: color.withAlpha(0.7),
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1,
                    scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 1e7, 0.2)
                },
                description: `
                    <h3>${article.title}</h3>
                    <p><b>Source:</b> ${article.domain}</p>
                    <p><b>Date:</b> ${article.seendate}</p>
                    <p><b>Tone:</b> ${sentiment.toFixed(2)}</p>
                    <a href="${article.url}" target="_blank">Read more</a>
                `
            });
        }
    });

    viewer.dataSources.add(dataSource);
}
```

### 5.2 CrowdTangle (Meta)

| Property | Value |
|----------|-------|
| **URL** | https://www.crowdtangle.com |
| **Status** | ⚠️ **Deprecated** — Meta shut down CrowdTangle access in August 2024 |
| **Replacement** | Meta Content Library API (research access only, requires application) |
| **India use** | Was useful for monitoring Indian political pages, news outlets on Facebook/Instagram |

**Alternative: Meta Content Library API**
- Requires research institution affiliation
- Application via https://transparency.meta.com/research/
- Limited to academic/non-commercial use

### 5.3 MediaCloud

| Property | Value |
|----------|-------|
| **URL** | https://mediacloud.org |
| **API Endpoint** | `https://api.mediacloud.org/api/v2` |
| **Auth** | Free API key registration |
| **Rate Limits** | Varies by endpoint. Bulk downloads available |
| **Format** | JSON |
| **Coverage** | Strong for English-language Indian media |

**Key endpoints:**

```
GET /api/v2/stories/public?q=India+flood&rows=20
GET /api/v2/sources/list?q=India
GET /api/v2/sentences/public?q=Kerala+landslide
```

### 5.4 India-Specific Fact-Check Sources

| Source | URL | Access | Notes |
|--------|-----|--------|-------|
| **AltNews** | https://www.altnews.in | RSS feed, no API | India's leading fact-checker. Scrape articles or use RSS |
| **BOOM Live** | https://www.boomlive.in | RSS feed, no API | Fact-check + OSINT journalism |
| **Vishwas News** | https://vishwasnews.com | Web only | PIB-backed fact check |
| **PIB Fact Check** | https://pib.gov.in/factcheck.aspx | Web/RSS | Government fact-check unit |
| **Factly** | https://factly.in | RSS feed | Data journalism / fact-checking |
| **The Logical Indian** | https://thelogicalindian.com | RSS | Community fact-checking |

### 5.5 Twitter/X Search Operators for Geolocated Events

**Advanced search operators (for manual OSINT):**

```
# Geolocated within 100km of Mumbai
geocode:19.076,72.8777,100km

# Combine with keywords
flood geocode:9.9312,76.2673,100km since:2024-06-01

# India-specific keywords with geolocation
(protest OR strike) near:"Delhi" within:50km

# From Indian media accounts
from:ndtv OR from:timesofindia flood

# Image-only posts about specific events
flood Kerala filter:images since:2024-08-01

# Verified accounts only (for credibility)
cyclone Bay of Bengal filter:verified

# Exclude retweets (original posts only)
earthquake India -filter:retweets
```

**For automated access (limited):**
- Twitter API v2 (Basic tier: $100/month, limited to 10K reads/month)
- Nitter instances (decentralized, unreliable — most offline as of 2024)

---

## 6. Disaster & Crisis Monitoring

### 6.1 ReliefWeb API

| Property | Value |
|----------|-------|
| **URL** | https://reliefweb.int |
| **API Endpoint** | `https://api.reliefweb.int/v1` |
| **Auth** | ❌ **No authentication required** |
| **Rate Limits** | Reasonable use. No hard limit documented |
| **Format** | JSON (HAL format) |
| **India Coverage** | ✅ Good — tracks floods, cyclones, earthquakes in India |

**Key endpoints:**

```
# Recent disasters in India
GET https://api.reliefweb.int/v1/disasters?query[value]=India&limit=20&sort[]=date:desc

# Reports about India
GET https://api.reliefweb.int/v1/reports?query[value]=India+flood&limit=10

# Current India emergencies
GET https://api.reliefweb.int/v1/disasters?filter[field]=primary_country.name&filter[value]=India
```

**Response:**

```json
{
  "data": [
    {
      "id": 12345,
      "fields": {
        "name": "India: Floods, Jun 2024",
        "date": { "created": "2024-06-15T10:00:00Z" },
        "primary_country": { "name": "India", "location": { "lat": 20.5, "lon": 79.0 } },
        "type": [{ "name": "Flood" }],
        "description": "Monsoon flooding affected Maharashtra..."
      }
    }
  ]
}
```

### 6.2 GDACS (Global Disaster Alert and Coordination System)

| Property | Value |
|----------|-------|
| **URL** | https://www.gdacs.org |
| **API Endpoint** | `https://www.gdacs.org/gdacsapi/api/events/geteventlist/` |
| **Auth** | ❌ **No authentication required** |
| **Format** | JSON, GeoJSON, RSS, KML |
| **Rate Limits** | Open access |
| **Update Frequency** | Near-real-time (within minutes of event) |

**Key endpoints:**

```
# All current alerts (GeoJSON)
GET https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH/0/0/0/0/0/0/0/0/0/0/0/0/geojson

# India-specific (filter by bbox)
GET https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH/0/0/0/0/0/0/0/0/0/0/0/0/geojson?bbox=68,6,98,36

# Event details
GET https://www.gdacs.org/gdacsapi/api/events/getevent/{event_type}/{event_id}

# RSS feed for all alerts
GET https://www.gdacs.org/rss.aspx
```

**Alert levels:**
- 🟢 Green — no/not applicable
- 🟡 Orange — moderate risk
- 🔴 Red — severe risk

**CesiumJS Integration — Disaster Overlays:**

```javascript
// GDACS → Live disaster overlays
async function loadGDACSDisasters() {
    const url = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/' +
        'SEARCH/0/0/0/0/0/0/0/0/0/0/0/0/geojson?bbox=68,6,98,36';

    const resp = await fetch(url);
    const geojson = await resp.json();

    const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
        markerSize: 10,
        markerColor: getColorByAlert(geojson),
        stroke: Cesium.Color.RED,
        strokeWidth: 2,
        fill: Cesium.Color.RED.withAlpha(0.2)
    });

    viewer.dataSources.add(dataSource);

    // Style based on alert level
    dataSource.entities.values.forEach(entity => {
        const alertLevel = entity.properties?.alertlevel?.getValue();
        if (entity.point) {
            entity.point.color = new Cesium.ConstantProperty(
                alertLevel === 'Red' ? Cesium.Color.RED :
                alertLevel === 'Orange' ? Cesium.Color.ORANGE :
                Cesium.Color.GREEN
            );
            entity.point.pixelSize = alertLevel === 'Red' ? 16 : 10;
        }
    });
}

// Auto-refresh every 15 minutes
setInterval(loadGDACSDisasters, 15 * 60 * 1000);
```

### 6.3 PDC (Pacific Disaster Center)

| Property | Value |
|----------|-------|
| **URL** | https://www.pdc.org |
| **Hazard data** | Global hazard monitoring, early warning systems |
| **Access** | No public API. Uses their platform (DisasterAware) |
| **Alternative** | Their risk data feeds into GDACS and ReliefWeb |
| **India coverage** | Includes Bay of Bengal cyclones, Himalayan earthquakes |

### 6.4 India NDRF / SDRF Updates

| Source | URL | Method |
|--------|-----|--------|
| **NDRF (National Disaster Response Force)** | https://ndrf.gov.in | Web scrape, social media monitoring |
| **SDRF (State Disaster Response Force)** | State-level websites | Varies by state |
| **NDMA (National Disaster Management Authority)** | https://ndma.gov.in | Web scrape, RSS if available |
| **IMD (India Meteorological Department)** | https://mausam.imd.gov.in | API available (see below) |

**Scraping approach for NDRF:**

```javascript
// Monitor NDRF Twitter/X for deployment updates
// @NDRFHQ tweets about flood/cyclone deployments
// Parse tweets with disaster keywords for structured data

// Monitor NDRF website for press releases
async function scrapeNDRFUpdates() {
    // Use a CORS proxy or backend to fetch
    const resp = await fetch('/api/proxy/ndrf.gov.in/press-release');
    const html = await resp.text();
    // Parse with DOMParser or cheerio on backend
    return parsePressReleases(html);
}
```

### 6.5 IMD (India Meteorological Department)

| Property | Value |
|----------|-------|
| **URL** | https://mausam.imd.gov.in |
| **API Endpoint** | `https://mausam.imd.gov.in/backend/` (various JSON endpoints) |
| **Auth** | ❌ **No authentication** (but endpoints may change) |
| **Data available** | Cyclone tracks, rainfall, weather warnings, satellite imagery |

**Known endpoints (unstable — monitor for changes):**

```
# Cyclone tracking
GET https://mausam.imd.gov.in/backend/cyclone/

# Weather warnings (state-wise)
GET https://mausam.imd.gov.in/backend/warning/

# Rainfall data
GET https://mausam.imd.gov.in/backend/rainfall/

# Satellite image (INSAT)
GET https://mausam.imd.gov.in/backend/satellite/
```

**CesiumJS — Cyclone Track Overlay:**

```javascript
// Parse IMD cyclone data and render as animated track
async function loadIMDCycloneTrack(cycloneId) {
    const resp = await fetch(`/api/imd/cyclone/${cycloneId}`);
    const cyclone = await resp.json();
    // cyclone.positions = [{lat, lon, wind_speed, pressure, timestamp}]

    const positions = [];
    const colors = [];

    cyclone.positions.forEach((pos, i) => {
        positions.push(Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat));
        // Color by intensity (IMD categories)
        const color = pos.wind_speed > 120 ? Cesium.Color.RED :
                      pos.wind_speed > 90 ? Cesium.Color.ORANGE :
                      pos.wind_speed > 62 ? Cesium.Color.YELLOW :
                      Cesium.Color.GREEN;
        colors.push(color);
    });

    // Render as color-changing polyline
    viewer.entities.add({
        name: cyclone.name,
        polyline: {
            positions: positions,
            width: 4,
            material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.CYAN),
            clampToGround: false
        }
    });

    // Add wind radius circles at each point
    cyclone.positions.forEach(pos => {
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat),
            ellipse: {
                semiMajorAxis: (pos.wind_radius_34kt || 100) * 1852, // nm to meters
                semiMinorAxis: (pos.wind_radius_34kt || 100) * 1852,
                material: Cesium.Color.RED.withAlpha(0.15),
                outline: true,
                outlineColor: Cesium.Color.RED.withAlpha(0.3),
                height: 0
            }
        });
    });
}
```

---

## 7. Infrastructure Monitoring

### 7.1 Open Infrastructure Map

| Property | Value |
|----------|-------|
| **URL** | https://openinframap.org |
| **API** | Vector tiles at `https://tiles.openinframap.org/{z}/{x}/{y}.pbf` |
| **Auth** | ❌ **No authentication** |
| **Data Source** | OpenStreetMap (power lines, substations, pipelines, etc.) |
| **Style** | Mapbox Vector Tiles (MVT) |
| **India Coverage** | Partial — depends on OSM mapping coverage in India |

**Layers available:**
- `power` — power lines, substations, generators, plants
- `petroleum` — pipelines, refineries, storage
- `telecoms` — communication towers
- `water` — water infrastructure

### 7.2 Global Power Plant Database (WRI)

| Property | Value |
|----------|-------|
| **URL** | https://datasets.wri.org/dataset/globalpowerplantdatabase |
| **Download** | CSV/GeoJSON bulk download (~34,000 plants globally) |
| **Auth** | ❌ **No authentication** |
| **Format** | CSV, GeoJSON |
| **India Entries** | ~2,600 power plants documented |

**Key fields:** `name`, `capacity_mw`, `latitude`, `longitude`, `primary_fuel`, `commissioning_year`, `owner`, `source`

**CesiumJS Integration — Power Plants:**

```javascript
// Load Global Power Plant Database (pre-downloaded GeoJSON)
async function loadPowerPlantsIndia() {
    const resp = await fetch('/data/power-plants-india.geojson');
    const geojson = await resp.json();

    const dataSource = new Cesium.CustomDataSource('Power Plants');

    geojson.features.forEach(plant => {
        const [lon, lat] = plant.geometry.coordinates;
        const props = plant.properties;
        const capacity = props.capacity_mw || 0;

        // Size by capacity
        const pixelSize = Math.max(6, Math.min(30, capacity / 100));

        // Color by fuel type
        const fuelColors = {
            'Coal': Cesium.Color.fromCssColorString('#8B4513'),
            'Gas': Cesium.Color.fromCssColorString('#4169E1'),
            'Hydro': Cesium.Color.fromCssColorString('#00CED1'),
            'Solar': Cesium.Color.fromCssColorString('#FFD700'),
            'Wind': Cesium.Color.fromCssColorString('#98FB98'),
            'Nuclear': Cesium.Color.fromCssColorString('#FF6347'),
            'Oil': Cesium.Color.fromCssColorString('#2F4F4F'),
            'default': Cesium.Color.GRAY
        };

        dataSource.entities.add({
            name: props.name,
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            point: {
                pixelSize: pixelSize,
                color: fuelColors[props.primary_fuel] || fuelColors.default,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 1,
                scaleByDistance: new Cesium.NearFarScalar(1e4, 1.0, 1e7, 0.2)
            },
            description: `
                <h3>${props.name}</h3>
                <p><b>Capacity:</b> ${capacity} MW</p>
                <p><b>Fuel:</b> ${props.primary_fuel}</p>
                <p><b>Owner:</b> ${props.owner || 'Unknown'}</p>
                <p><b>Commissioned:</b> ${props.commissioning_year || 'N/A'}</p>
            `
        });
    });

    viewer.dataSources.add(dataSource);
}
```

### 7.3 Indian Railways Live Tracking

| Property | Value |
|----------|-------|
| **URL** | https://enquiry.indianrail.gov.in |
| **Live tracking** | https://railradar.in (third-party, community-maintained) |
| **Official API** | ❌ No public API from Indian Railways |
| **Alternative** | NTES (National Train Enquiry System) app has internal APIs (unstable, may block) |

**Known unofficial endpoints (subject to change/blocking):**

```
# NTES train position (unstable)
GET https://enquiry.indianrail.gov.in/mntes/tr?opt=TrainRunning&subOpt=GetRunningStatus&trainNo=12345&startDay=0

# RailYatri (third-party)
GET https://www.railyatri.in/api/train-running-status?train_no=12345
```

**For Arjun:** Best approach is to use OSM railway data + scheduled timetable (published as GTFS) rather than real-time tracking, since no stable API exists.

### 7.4 NHAI (National Highways Authority of India)

| Property | Value |
|----------|-------|
| **URL** | https://nhai.gov.in |
| **Data available** | Project status, e-tender, contractor info |
| **Access** | Web scraping only. No API |
| **Alternative** | https://etender.nic.in for contract-level data |

### 7.5 Smart Cities Mission / JNNURM

| Property | Value |
|----------|-------|
| **URL** | https://smartcities.gov.in |
| **Data** | Project listings, city-wise dashboards |
| **Access** | Web scraping. Budget/project data available in PDFs |
| **For Arjun** | Scrape project locations → plot as infrastructure development layer |

### 7.6 Other Infrastructure Data

| Source | URL | Access | Notes |
|--------|-----|--------|-------|
| **OpenStreetMap** | https://overpass-api.de | Free API | Query any infrastructure by tag |
| **HIFLD (Homeland)** | https://hifld-geoplatform.opendata.arcgis.com | Free | Global infrastructure datasets |
| **Global Energy Monitor** | https://globalenergymonitor.org | Free downloads | Coal plants, oil/gas, nuclear |
| **Ookla Speed Test** | `ookla-open-data.s3.amazonaws.com` | AWS Open Data | Mobile/fixed broadband speeds by tile |
| **OpenCelliD** | https://opencellid.org | Free API key | Cell tower locations |

**Overpass API for Indian infrastructure:**

```
# All power plants in India
[out:json];
area["name"="India"]->.a;
(
  node["power"="plant"](area.a);
  way["power"="plant"](area.a);
  relation["power"="plant"](area.a);
);
out center;

# All cell towers in Delhi
[out:json][bbox:28.4,76.8,28.9,77.4];
node["man_made"="communications_tower"];
out;
```

---

## 8. CesiumJS Integration Patterns

### 8.1 Time-Dynamic Satellite Passes (CZML)

CZML (Cesium Language) is the native format for time-dynamic Cesium data.

```javascript
// Generate CZML for a satellite pass over India
const satelliteCZML = [
    {
        id: "document",
        name: "Satellite Passes",
        version: "1.0",
        clock: {
            interval: "2024-01-15T00:00:00Z/2024-01-15T23:59:59Z",
            currentTime: "2024-01-15T12:00:00Z",
            multiplier: 60
        }
    },
    {
        id: "sentinel-2a",
        name: "Sentinel-2A",
        availability: "2024-01-15T00:00:00Z/2024-01-15T23:59:59Z",
        position: {
            interpolationAlgorithm: "LAGRANGE",
            interpolationDegree: 5,
            referenceFrame: "INERTIAL",
            epoch: "2024-01-15T00:00:00Z",
            cartesian: [
                // TLE-derived positions: [time_seconds, x, y, z] in meters
                0,    -2818201.0, 5746172.0, 2916935.0,
                60,   -2800000.0, 5752000.0, 2920000.0,
                // ... more positions from satellite.js TLE propagation
            ]
        },
        point: {
            pixelSize: 12,
            color: { rgba: [0, 255, 136, 255] },
            outlineColor: { rgba: [255, 255, 255, 255] },
            outlineWidth: 2
        },
        path: {
            material: {
                polylineOutline: {
                    color: { rgba: [0, 255, 136, 100] },
                    width: 2
                }
            },
            width: 2,
            leadTime: 3600,
            trailTime: 3600
        },
        label: {
            text: "Sentinel-2A",
            font: "12px sans-serif",
            fillColor: { rgba: [255, 255, 255, 255] },
            style: "FILL_AND_OUTLINE",
            pixelOffset: { cartesian2: [0, -20] }
        }
    }
];

// Load CZML
const czmlDataSource = await Cesium.CzmlDataSource.load(satelliteCZML);
viewer.dataSources.add(czmlDataSource);
```

**Full TLE-based satellite tracking:**

```javascript
// Using satellite.js (formerly satellite-js) to propagate TLEs
import * as satellite from 'satellite.js';

function propagateSatellite(tle1, tle2, startTime, durationMin, stepSec = 60) {
    const satrec = satellite.twoline2satrec(tle1, tle2);
    const positions = [];
    const start = new Date(startTime);

    for (let t = 0; t < durationMin * 60; t += stepSec) {
        const time = new Date(start.getTime() + t * 1000);
        const posVel = satellite.propagate(satrec, time);

        if (posVel.position) {
            // ECI → ECEF conversion
            const gmst = satellite.gstime(time);
            const ecf = satellite.eciToEcf(posVel.position, gmst);
            positions.push(t, ecf.x, ecf.y, ecf.z);
        }
    }

    return positions;
}

// Use with CZML
const tle1 = '1 43437U 18036A   24015.50000000  .00001234  00000-0  56789-4 0  9990';
const tle2 = '2 43437  97.8000 180.0000 0001234  90.0000 270.1234 15.20000000123456';
const positions = propagateSatellite(tle1, tle2, '2024-01-15T00:00:00Z', 1440, 30);

// Insert positions into CZML cartesian array
```

### 8.2 Terrain Providers for Indian Subcontinent

```javascript
// Option 1: Cesium World Terrain (via Ion, requires token but free)
const worldTerrain = await Cesium.createWorldTerrainAsync();
viewer.scene.terrainProvider = worldTerrain;

// Option 2: AWS Terrain Tiles (free, SRTM-based)
const awsTerrain = new Cesium.CesiumTerrainProvider({
    url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/',
    requestVertexNormals: true,
    credit: 'AWS Open Data Terrain Tiles'
});
viewer.scene.terrainProvider = awsTerrain;

// Option 3: MapTiler terrain (free tier)
const mapTilerTerrain = new Cesium.CesiumTerrainProvider({
    url: 'https://api.maptiler.com/tiles/terrain-quantized-mesh/?key=YOUR_KEY',
    requestVertexNormals: true
});

// Option 4: Custom terrain from SRTM tiles
// Download SRTM 30m tiles for India (hgt files) → convert to quantized mesh
// Use `ctb-tile` or `cesium terrain builder` to generate tiles
// Serve from local/S3/Azure Blob
const customTerrain = new Cesium.CesiumTerrainProvider({
    url: '/terrain/india-srtm30/'
});
viewer.scene.terrainProvider = customTerrain;
```

**India-specific terrain considerations:**
- Western Ghats: steep escarpment, high detail needed
- Himalayas: extreme elevation (0-8848m), LOD important
- Indo-Gangetic Plain: very flat, terrain less critical
- Andaman & Nicobar: submarine terrain matters for maritime visualization

### 8.3 3D Tiles for Building Data

```javascript
// Option 1: Google 3D Tiles via Cesium Ion (free with attribution)
const google3DTiles = await Cesium.Cesium3DTileset.fromIonAssetId(2275207);
viewer.scene.primitives.add(google3DTiles);

// Option 2: OSM 3D Buildings (osm2cesium or similar)
const osm3DTiles = new Cesium.Cesium3DTileset({
    url: '/3dtiles/osm-buildings-india/tileset.json',
    maximumScreenSpaceError: 16
});
viewer.scene.primitives.add(osm3DTiles);

// Option 3: India-specific — BIS building footprint data
// Convert GeoJSON footprints to 3D Tiles using height attributes
const buildingTiles = new Cesium.Cesium3DTileset({
    url: '/3dtiles/india-buildings/tileset.json'
});
viewer.scene.primitives.add(buildingTiles);

// Style buildings by height
buildingTiles.style = new Cesium.Cesium3DTileStyle({
    color: {
        conditions: [
            ['${height} > 100', 'color("#FF0000")'],
            ['${height} > 50', 'color("#FF8800")'],
            ['${height} > 20', 'color("#FFFF00")'],
            ['true', 'color("#88CCFF")']
        ]
    }
});
```

### 8.4 Custom Material Shaders for Heatmap Overlays

```javascript
// Rainfall heatmap using custom material
const heatmapMaterial = new Cesium.Material({
    fabric: {
        type: 'RainfallHeatmap',
        uniforms: {
            colorRamp: [
                0.0, 0.2, 0.4, 0.6, 0.8, 1.0
            ],
            colors: [
                Cesium.Color.fromCssColorString('#0000FF'),
                Cesium.Color.fromCssColorString('#00FFFF'),
                Cesium.Color.fromCssColorString('#00FF00'),
                Cesium.Color.fromCssColorString('#FFFF00'),
                Cesium.Color.fromCssColorString('#FF8800'),
                Cesium.Color.fromCssColorString('#FF0000')
            ]
        },
        source: `
            uniform float colorRamp[6];
            uniform vec4 colors[6];
            czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                float value = materialInput.st.t; // 0-1 value
                vec4 color = colors[0];
                for (int i = 1; i < 6; i++) {
                    if (value >= colorRamp[i-1] && value <= colorRamp[i]) {
                        float t = (value - colorRamp[i-1]) / (colorRamp[i] - colorRamp[i-1]);
                        color = mix(colors[i-1], colors[i], t);
                    }
                }
                material.diffuse = color.rgb;
                material.alpha = color.a * 0.7;
                return material;
            }
        `
    }
});

// Apply to a rectangle covering India
viewer.entities.add({
    rectangle: {
        coordinates: Cesium.Rectangle.fromDegrees(68, 6, 98, 36),
        material: heatmapMaterial,
        height: 0
    }
});
```

**Population density overlay (WebGL heatmap):**

```javascript
// Using heatmap.js + Cesium canvas overlay
function createPopulationHeatmap() {
    // Create offscreen canvas for heatmap
    const heatmapInstance = h337.create({
        container: document.createElement('div'),
        radius: 20,
        maxOpacity: 0.8,
        gradient: {
            '0.0': '#000033',
            '0.2': '#0000CC',
            '0.4': '#00CCFF',
            '0.6': '#00FF00',
            '0.8': '#FFFF00',
            '1.0': '#FF0000'
        }
    });

    // Project population data points onto heatmap canvas
    const dataPoints = populationData.map(p => {
        const canvasPos = viewer.scene.cartesianToCanvasCoordinates(
            Cesium.Cartesian3.fromDegrees(p.lon, p.lat)
        );
        return { x: canvasPos.x, y: canvasPos.y, value: p.density };
    });

    heatmapInstance.setData({ max: 10000, data: dataPoints });

    // Use as texture on ground rectangle
    const heatmapCanvas = heatmapInstance._renderer.canvas;
    const heatmapTexture = new Cesium.Texture({
        context: viewer.scene.context,
        source: heatmapCanvas
    });
}
```

### 8.5 Entity Clustering for Dense Data Points

```javascript
// Clustering for dense datasets (e.g., all Indian cities, cell towers, events)
const dataSource = new Cesium.CustomDataSource('Dense Points');
viewer.dataSources.add(dataSource);

// Enable clustering
dataSource.clustering.enabled = true;
dataSource.clustering.pixelRange = 30;
dataSource.clustering.minimumClusterSize = 5;

// Custom cluster styling
dataSource.clustering.clusterEvent.addEventListener(
    (clusteredEntities, cluster) => {
        // Disable default billboard
        cluster.label.show = false;
        cluster.billboard.show = true;
        cluster.billboard.image = createClusterImage(clusteredEntities.length);
        cluster.billboard.scale = 0.5 + Math.min(clusteredEntities.length / 100, 0.5);
        cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
    }
);

function createClusterImage(count) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Color gradient based on count
    const intensity = Math.min(count / 1000, 1.0);
    const r = Math.floor(255 * intensity);
    const g = Math.floor(255 * (1 - intensity * 0.5));
    const b = Math.floor(100 * (1 - intensity));

    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = count > 999 ? 'bold 16px sans-serif' : 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 999 ? `${(count / 1000).toFixed(1)}k` : count, 32, 32);

    return canvas.toDataURL();
}

// Click handler to zoom into cluster
viewer.screenSpaceEventHandler.setInputAction((click) => {
    const picked = viewer.scene.pick(click.position);
    if (Cesium.defined(picked) && Cesium.defined(picked.id)) {
        const entity = picked.id;
        if (entity.clusterIds) {
            // Clustered entity — zoom in
            const boundingSphere = Cesium.BoundingSphere.fromPoints(
                entity.clusterIds.map(id => {
                    const e = dataSource.entities.getById(id);
                    return e.position.getValue(viewer.clock.currentTime);
                }).filter(Boolean)
            );
            viewer.camera.flyToBoundingSphere(boundingSphere, {
                duration: 0.5,
                offset: new Cesium.HeadingPitchRange(0, -Math.PI / 4, boundingSphere.radius * 2)
            });
        }
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
```

---

## Summary: "Wow Factor" Feature Matrix

| Feature | Data Source | Complexity | Impact |
|---------|------------|------------|--------|
| 🛰️ Live satellite imagery | NASA GIBS + Sentinel Hub | Low | ⭐⭐⭐⭐ |
| ✈️ Live aircraft tracking | OpenSky / ADS-B Exchange | Medium | ⭐⭐⭐⭐⭐ |
| 🚢 Ship tracking | MarineTraffic / AISHub | Medium | ⭐⭐⭐⭐ |
| 🌀 Cyclone tracks | IMD + GDACS | Medium | ⭐⭐⭐⭐⭐ |
| 🔥 Fire / disaster overlays | MODIS Fires (GIBS) + GDACS | Low | ⭐⭐⭐⭐ |
| 💡 Nighttime lights | NASA Black Marble (GIBS) | Low | ⭐⭐⭐⭐⭐ |
| ⚡ Power plants | WRI Global Database | Low | ⭐⭐⭐ |
| 📡 GPS interference | GPSJam | Medium | ⭐⭐⭐⭐ |
| 🏙️ 3D buildings | Google 3D Tiles (Ion) | Low | ⭐⭐⭐⭐⭐ |
| 📰 News events | GDELT 2.0 | Low | ⭐⭐⭐ |
| 🗻 Terrain | AWS/Cesium Ion terrain | Low | ⭐⭐⭐⭐ |
| 🛤️ Satellite passes | TLE + satellite.js + CZML | High | ⭐⭐⭐⭐⭐ |

---

## Quick-Start: Top 5 Free APIs to Integrate First

1. **NASA GIBS** — zero auth, instant satellite imagery overlay
2. **OpenSky Network** — live aircraft, 10 req/min free
3. **GDACS** — disaster alerts, GeoJSON, zero auth
4. **ReliefWeb** — humanitarian events, zero auth
5. **AWS Terrain Tiles** — free global terrain

All five work without API keys. Start here, then layer on authenticated sources.

---

*Research compiled for Project Arjun — India's God's Eye Geospatial Intelligence Platform*
*Last updated: April 2025*
