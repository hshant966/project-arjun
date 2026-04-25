# Free Satellite Imagery & Remote Sensing Data Sources for India/Maharashtra

> Research compiled: 2026-04-22  
> Focus: Sources embeddable in free web apps, API/tile serving, rate limits, time-lapse capability

---

## Quick Reference: Web App Embedding Score

| Source | Free Tiles for Web? | API Access | India/Maharashtra Coverage | Time-Lapse |
|---|---|---|---|---|
| Copernicus Data Space (Sentinel) | ✅ WMS/WMTS | REST API | ✅ Excellent | ✅ Time-series API |
| NASA GIBS/Worldview | ✅ WMTS/TMS | REST | ✅ Global daily | ✅ Built-in |
| Bhuvan (ISRO) | ✅ WMS | Limited (Bhoonidhi API) | ✅ Best for India | ⚠️ Manual |
| Google Earth Engine | ✅ Tile layer (Map/JS) | Python/JS | ✅ Huge catalog | ✅ Excellent |
| MODIS/VIIRS (via GIBS) | ✅ TMS tiles | Via NASA APIs | ✅ Global | ✅ Via Worldview |
| OpenAerialMap | ✅ TMS tiles | REST API | ⚠️ Spotty | ❌ |
| Landsat (via GEE/USGS) | ✅ Via GEE tiles | USGS API | ✅ Global | ✅ Via GEE |
| NASA Black Marble (NTL) | ✅ Via GIBS | Earthdata download | ✅ Global | ✅ Annual composites |
| Global Forest Watch | ✅ Mapbox GL tiles | GFW Data API REST | ✅ Global | ✅ Alert system |
| WorldPop/GHSL (Urban) | ✅ Via GEE tiles | GEE + direct | ✅ Global | ✅ Multi-year |

---

## 1. Copernicus Data Space Ecosystem (Sentinel Hub)

**The gold standard for free satellite imagery in web apps.**

### What's Available
- **Sentinel-2**: 10m optical, 5-day revisit, L1C + L2A (atmospherically corrected)
- **Sentinel-1**: SAR (C-band), all-weather, 5-20m, great for flood/soil moisture
- **Sentinel-3**: Ocean/land color, 300m
- **Copernicus DEM**: Global 30m elevation model

### API Endpoints (All Free)
| API | Purpose | Docs |
|---|---|---|
| **OGC WMS/WMTS** | Drop-in tile layer for Leaflet/MapLibre | [OGC Docs](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/OGC.html) |
| **Sentinel Hub Process API** | Custom evalscripts (NDVI, false color, etc.) | [Process API](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Process.html) |
| **Catalogue API (STAC)** | Search by date/AOI/cloud cover | [STAC](https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Catalog.html) |
| **openEO API** | Scalable processing on cloud | [openEO](https://openeo.org/) |

### Getting Maharashtra AOI Tiles
```javascript
// Leaflet example — Sentinel-2 L2A tiles for Maharashtra (Pune)
const sentinelTiles = L.tileLayer.wms('https://sh.dataspace.copernicus.eu/ogc/wms/<INSTANCE_ID>', {
  layers: 'TRUE-COLOR',
  format: 'image/png',
  transparent: true,
  maxcc: 20,  // max cloud cover %
  time: '2026-03-01/2026-03-31',
  attribution: 'Copernicus Sentinel data'
});
```

### Maharashtra Bounding Box
```
North: 22.0°N  South: 15.6°E  West: 72.6°E  East: 80.9°E
```

### Rate Limits
- **Free tier**: 3,000 processing units/month (approx 3,000 km² of 10m imagery)
- **OGC tiles**: More generous — essentially unlimited for reasonable use
- **Evalscripts**: Custom band math, NDVI, false color, SAR composites
- **Tip**: Use WMS/WMTS for browsing (low cost), Process API only for downloads/analysis

### Time-Lapse
- Catalogue API returns date-sorted scenes → generate frame sequence
- `evalscript` can return per-pixel median/percentile composites
- Planet.com offers similar paid time-lapse, but Sentinel is free

### Signup
- Free account at [dataspace.copernicus.eu](https://dataspace.copernicus.eu/)
- OAuth2 token required for all API calls

---

## 2. NASA GIBS / Worldview

**Best for daily global imagery with zero signup for tile access.**

### What's Available
- **Daily global composites** from MODIS, VIIRS, GOES, Landsat, Sentinel
- 250m-2km resolution (not high-res, but daily!)
- Pre-rendered imagery bands: True Color, NDVI, Fires, Snow, Aerosols, Sea Surface Temp

### Tile API (Direct — No Auth Needed!)
```
# TMS endpoint — drop directly into MapLibre/Leaflet
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{date}/{tileMatrixSet}/{z}/{y}/{x}.jpg

# Example: MODIS Terra True Color for any date
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-03-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg

# Key layers for India:
# - MODIS_Terra_CorrectedReflectance_TrueColor
# - MODIS_Terra_NDVI
# - MODIS_Combined_Fire_Tiles
# - VIIRS_SNPP_DayNightBand_ENCC
# - VIIRS_SNPP_CorrectedReflectance_TrueColor
# - GHRSST_Sea_Surface_Temperature
```

### Web App Embedding
```javascript
// MapLibre GL JS — zero-auth daily satellite layer
map.addSource('gibs-modis', {
  type: 'raster',
  tiles: [
    'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-03-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg'
  ],
  tileSize: 256,
  attribution: 'NASA GIBS'
});
```

### Time-Lapse
- Worldview app has built-in time slider: [worldview.earthdata.nasa.gov](https://worldview.earthdata.nasa.gov/)
- For programmatic: iterate dates in tile URL, capture frames
- GIBS supports dates from 2000-present for most MODIS products

### Rate Limits
- **No authentication required** for tile access
- **Generous rate limit**: ~50 req/s is fine; don't hammer it
- Caching recommended for production

### Advanced: NASA Earthdata Auth (for downloads)
- Free signup at [earthdata.nasa.gov](https://earthdata.nasa.gov/)
- Required for bulk data download via `wget`/`curl`

---

## 3. Bhuvan (ISRO) — Indian Satellite Portal

**Best resolution for India-specific data. ISRO's own satellite imagery.**

### What's Available
- **Resourcesat LISS-IV**: 5.8m multispectral (India only)
- **Resourcesat LISS-III**: 23.5m multispectral
- **AWiFS**: 56m wide-field, great for state-level monitoring
- **Cartosat**: 2.5m panchromatic (stereo pairs for DEM)
- **Oceansat**: Ocean color, scatterometer
- **Thematic products**: Land use/land cover maps, wasteland atlas, flood maps

### Access Methods
| Method | URL | Notes |
|---|---|---|
| **2D Map Viewer** | [bhuvan-app1.nrsc.gov.in](https://bhuvan-app1.nrsc.gov.in/bhuvan2d/bhuvan/bhuvan2d.php) | Visual browse, no API |
| **Thematic Portal** | [bhuvan-app1.nrsc.gov.in/thematic](https://bhuvan-app1.nrsc.gov.in/thematic/) | WMS layers, clip & ship |
| **Data Download** | [bhuvan-app3.nrsc.gov.in/data](https://bhuvan-app3.nrsc.gov.in/data/) | Free registration, download tiles |
| **Bhoonidhi API** | [bhoonidhi.nrsc.gov.in](https://bhoonidhi.nrsc.gov.in/) | New programmatic API for satellite data |
| **Open Data Archive** | [bhuvan-app3.nrsc.gov.in/data](https://bhuvan-app3.nrsc.gov.in/data/) | Ortho imagery, DEM |

### WMS for Web Apps
```
# Bhuvan OGC WMS endpoint (check for active services)
https://bhuvan-vec.nrsc.gov.in/bhuvan/wms?

# Example layers available:
# - LULC_50K (Land Use Land Cover)
# - Wasteland
# - Watershed
```

### Limitations for Web Embedding
- ⚠️ WMS endpoints can be unreliable/slow
- ⚠️ No public WMTS or tile REST API documented
- ⚠️ Bhoonidhi API requires institutional approval in some cases
- ✅ Best approach: Download tiles → serve from your own CDN/TileServer

### Maharashtra Specific
- State-level LULC maps available
- Watershed boundary datasets
- District-level admin boundaries
- Historical AWiFS data from 2005-present

---

## 4. Google Earth Engine (GEE)

**Most powerful free geospatial analysis platform. Huge India-specific dataset catalog.**

### Pricing
- **Free for non-commercial/academic use** (Google Cloud non-commercial terms)
- **Commercial**: Pay-as-you-go based on compute and storage
- **Free tier includes**: Full access to data catalog, JavaScript & Python APIs, visualization

### India-Specific Datasets on GEE
| Dataset | ID | Resolution | Use Case |
|---|---|---|---|
| Sentinel-2 L2A | `COPERNICUS/S2_SR_HARMONIZED` | 10m | Optical imagery, NDVI |
| Landsat 8/9 | `LANDSAT/LC08/C02/T1_L2` | 30m | Historical analysis |
| MODIS NDVI | `MODIS/061/MOD13A1` | 500m, 16-day | Vegetation index |
| MODIS Land Cover | `MODIS/061/MCD12Q1` | 500m annual | Land classification |
| VIIRS Nighttime Lights | `NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG` | 500m | Economic activity |
| Global Forest Change | `UMD/hansen/global_forest_change_2023_v1_11` | 30m | Deforestation |
| WorldPop Population | `WorldPop/GP/100m/pop` | 100m | Population density |
| GHSL Built-Up | `JRC/GHSL/P2023A/GHS_BUILT_S` | 100m | Urban expansion |
| Sentinel-1 SAR | `COPERNICUS/S1_GRD` | 10m | Flood mapping |
| ERA5 Climate | `ECMWF/ERA5_LAND/HOURLY` | 11km | Weather/climate |
| SRTM DEM | `USGS/SRTMGL1_003` | 30m | Elevation |
| GPM Rainfall | `NASA/GPM_L3/IMERG_MONTHLY_V07` | 10km | Precipitation |

### Web App Embedding (Tile Layers)
```javascript
// GEE Python API → get tile URL → serve in web app
import ee
ee.Initialize()

# Generate a visualized tile layer URL
image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterBounds(ee.Geometry.Rectangle([72.6, 15.6, 80.9, 22.0])) \
    .filterDate('2026-03-01', '2026-03-31') \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) \
    .median()

vis_params = {'bands': ['B4', 'B3', 'B2'], 'min': 0, 'max': 3000}
map_id = image.getMapId(vis_params)
tile_url = map_id['tile_fetcher'].url_format  # Use this in Leaflet/MapLibre
```

### Time-Lapse in GEE
```javascript
// JavaScript Code Editor — built-in animation feature
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(maharashtra)
  .filterDate('2020-01-01', '2026-04-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .select(['B4','B3','B2']);

// Export as GIF or video
print(ui.Chart.image.series(s2.select('B4'), maharashtra, ee.Reducer.mean(), 100));
```

### Rate Limits
- **Free tier**: Shared compute pool — complex analyses may queue
- **Concurrent exports**: Limited to ~3 simultaneous
- **No explicit tile rate limit** but be reasonable
- **Earth Engine Apps**: Free hosted web apps with map layers

### Best Practice for Dashboard
- Use GEE for analysis → export GeoTIFF → serve tiles via TileServer-GL or Martin
- Or use `getMapId()` tile URLs directly (time-limited, ~72h)

---

## 5. MODIS / VIIRS (via GIBS + NASA Earthdata)

### MODIS Products (Free, Global)
| Product | Resolution | Temporal | Use |
|---|---|---|---|
| MOD13A1 (NDVI/EVI) | 500m | 16-day | Vegetation health |
| MCD12Q1 (Land Cover) | 500m | Annual | Land classification |
| MOD14/MCD14ML (Fire) | 1km | Daily | Active fire detection |
| MOD44B (VCF) | 250m | Annual | Tree/vegetation cover |
| MCD43A4 (NBAR) | 500m | Daily | Surface reflectance |

### VIIRS Products
| Product | Resolution | Use |
|---|---|---|
| VNP09GA (Surface Reflectance) | 500m | Daily imagery |
| VNP14IMG (Active Fire) | 375m | Fire detection (better than MODIS) |
| VNP21A1 (LST) | 750m | Land surface temperature |
| VNP46A2 (NTL) | 500m | Night-time lights |

### Access Options
1. **GIBS tiles** (no auth) — for visualization
2. **NASA Earthdata** (free signup) — for data download
3. **Google Earth Engine** — processed, analysis-ready
4. **AppEEARS** — subset & download tool at [lpdaacsvc.cr.usgs.gov](https://lpdaacsvc.cr.usgs.gov/appeears/)

### Fire Data for Maharashtra
```javascript
// GIBS tile for MODIS fires
https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Fires_Terra/default/{date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png
```

---

## 6. OpenAerialMap (OAM)

**Community-contributed drone and aerial imagery.**

### What's Available
- Drone orthomosaics from humanitarian mapping
- Some commercial satellite imagery (Maxar open data)
- Higher resolution than satellite in some areas

### Access
- **Browser**: [map.openaerialmap.org](http://map.openaerialmap.org/#/)
- **Catalog API**: `https://api.openaerialmap.org/meta` — JSON catalog of all imagery
- **Tile Server**: Each image has a TMS tile URL

### API Endpoints
```
# Search by bbox (Maharashtra)
GET https://api.openaerialmap.org/meta?bbox=72.6,15.6,80.9,22.0

# Returns list of imagery with tile URLs
# Tile URL format: {tileserver}/{z}/{x}/{y}.png
```

### Limitations for Maharashtra
- ⚠️ Coverage is very spotty — mostly disaster-response areas
- ⚠️ Not systematic satellite coverage
- ✅ Good for supplementing with drone data where available
- ✅ CC-BY licensed, fully free

### Web App Embedding
```javascript
// Direct TMS from OAM catalog
L.tileLayer(oam_item.tilejson_url, { attribution: 'OpenAerialMap' });
```

---

## 7. Landsat (via USGS EarthExplorer + GEE)

**The longest-running free satellite program (1972-present).**

### Available Missions
| Mission | Resolution | Bands | Archive |
|---|---|---|---|
| Landsat 9 (2021-) | 30m multispec, 15m pan | 11 bands | Current |
| Landsat 8 (2013-) | 30m multispec, 15m pan | 11 bands | Current |
| Landsat 7 (1999-2022) | 30m (SLC-off after 2003) | 8 bands | Historical |
| Landsat 5 (1984-2013) | 30m | 7 bands | Historical |
| Landsat 1-3 (1972-1983) | 60-80m | 4 bands | Archived |

### Access Methods
1. **USGS EarthExplorer**: [earthexplorer.usgs.gov](https://earthexplorer.usgs.gov/) — download after free registration
2. **GEE Collection**: Analysis-ready, atmospherically corrected (L2)
3. **GIBS tiles**: Landsat 8/9 WELD composites
4. **AWS Open Data**: `s3://usgs-landsat/` — no auth needed

### Web App Tiles
```javascript
// Via Google Earth Engine
var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(maharashtra)
  .filterDate('2025-01-01', '2025-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .median();
```

### Best For
- Historical change detection (50+ years of data)
- Urban sprawl analysis
- Deforestation time-series
- Water body monitoring

---

## 8. Night-Time Lights (NASA Black Marble + VIIRS)

**Proxies for economic activity, urbanization, electrification.**

### Data Sources
| Source | Product | Resolution | Period |
|---|---|---|---|
| **NASA Black Marble (VNP46)** | Daily NTL corrected | 500m | 2012-present |
| **EOG Annual VNL V2** | Annual avg radiance | ~450m | 2012-present |
| **DMSP-OLS** | Legacy NTL | 2.7km | 1992-2013 |
| **GIBS tiles** | VIIRS DNB composites | 500m | Daily |

### Access
- **GIBS tiles** (free, no auth): `VIIRS_SNPP_DayNightBand_ENCC`
- **Black Marble toolkit**: Python/R packages for download + processing
- **GEE**: `NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG`
- **World Bank blog**: Excellent R/Python tutorials for Black Marble

### Use Cases for Maharashtra
- Economic activity proxy by district
- Urban growth detection
- Festival/event detection (Diwali lights!)
- Rural electrification tracking

```javascript
// GEE: Monthly VIIRS night lights for Maharashtra
var ntl = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG')
  .filterDate('2020-01-01', '2026-04-01')
  .select('avg_rad')
  .filterBounds(maharashtra);
```

---

## 9. Deforestation Monitoring (Global Forest Watch)

**Near-real-time deforestation alerts via API.**

### GFW Data API
- **Base URL**: `https://data-api.globalforestwatch.org/`
- **Documentation**: [data-api.globalforestwatch.org](https://data-api.globalforestwatch.org/)
- **Auth**: Free API key (signup at GFW)

### Key Endpoints
```
# Tree cover loss by admin region
GET /dataset/umd_tree_cover_loss/v1.11/query
  ?geostore={geojson}
  &period=2001-01-01,2023-12-31
  &aggregate_values=true

# GLAD deforestation alerts (Sentinel-2 based)
GET /dataset/glad_alerts/latest/query
  ?geostore={geojson}
  &period=2025-01-01,2026-04-22

# VIIRS active fires
GET /dataset/nasa_viirs_fire_alerts/latest/query
```

### Tile Layers for Web Apps
GFW uses Mapbox GL — their tile layers are available:
```javascript
// GFW GLAD alerts (Sentinel-2 based deforestation detection)
map.addSource('glad-alerts', {
  type: 'raster',
  tiles: ['https://tiles.globalforestwatch.org/umd_glad_alerts/latest/{z}/{x}/{y}.png'],
  tileSize: 256
});

// RADD alerts (Sentinel-1 SAR based)
map.addSource('radd-alerts', {
  type: 'raster',
  tiles: ['https://tiles.globalforestwatch.org/radd_alerts/latest/{z}/{x}/{y}.png'],
  tileSize: 256
});
```

### Maharashtra Specific
- India has dense GLAD alert coverage
- Western Ghats forests in Maharashtra are well-monitored
- Teak, bamboo, and tropical dry forest areas tracked

---

## 10. Urban Expansion & Population Density

### Datasets
| Dataset | Source | Resolution | Period |
|---|---|---|---|
| **GHSL Built-Up Surface** | EU Joint Research Centre | 100m | 1975-2030 (5yr intervals) |
| **WorldPop Population** | University of Southampton | 100m | 2000-2020 |
| **Meta High-Res Population** | Facebook/Meta | 30m | 2020 |
| **Global Urban Footprint** | DLR | 12m | 2010-2016 |
| **OpenStreetMap Buildings** | OSM | Varies | Current |
| **World Settlement Footprint** | DLR/ESA | 10m | 2015-2020 |

### Access
- **GHSL**: GEE `JRC/GHSL/P2023A/GHS_BUILT_S` or direct download from [ghsl.jrc.ec.europa.eu](https://ghsl.jrc.ec.europa.eu/)
- **WorldPop**: GEE `WorldPop/GP/100m/pop` or [worldpop.org](https://www.worldpop.org/)
- **Meta Population**: GEE `WorldPop/GP/100m/pop_age_sex` or [data.humdata.org](https://data.humdata.org/)

```javascript
// GEE: Built-up area growth in Maharashtra
var builtUp2000 = ee.Image('JRC/GHSL/P2023A/GHS_BUILT_S/2000')
  .select('built_surface')
  .clip(maharashtra);
var builtUp2020 = ee.Image('JRC/GHSL/P2023A/GHS_BUILT_S/2020')
  .select('built_surface')
  .clip(maharashtra);
```

---

## Practical Recommendations for a Free Web Dashboard

### Best Architecture
```
┌──────────────────────────────────────────────────┐
│                 Web Dashboard                     │
│  MapLibre GL JS / Leaflet / Deck.gl               │
├──────────────────────────────────────────────────┤
│  Tile Sources (no server needed)                  │
│  ├── GIBS TMS: Daily satellite, fires, NTL       │
│  ├── Copernicus OGC WMS: High-res Sentinel       │
│  ├── GEE tile URLs: Analysis results             │
│  └── GFW tiles: Deforestation alerts             │
├──────────────────────────────────────────────────┤
│  Backend (optional — for cached/proxied tiles)    │
│  ├── TileServer-GL or Martin (Rust)              │
│  ├── Proxy/cache expensive tile sources           │
│  └── Store analysis outputs as MBTiles            │
├──────────────────────────────────────────────────┤
│  Analysis (offline/scheduled)                     │
│  ├── GEE Python API: Generate indices/stats       │
│  ├── GFW API: Deforestation alerts               │
│  └── Export to GeoJSON/MBTiles for fast serving   │
└──────────────────────────────────────────────────┘
```

### Recommended Stack
1. **MapLibre GL JS** — free, open-source map library (no Mapbox license needed)
2. **GIBS tiles** — zero-auth, instant daily satellite layer
3. **Copernicus WMS** — higher-res Sentinel-2 when zoomed in
4. **GEE tiles** — for computed products (NDVI, LULC change, population)
5. **GitHub Pages / Vercel / Cloudflare Pages** — free hosting for static tile dashboard

### Rate Limit Summary
| Source | Auth Required | Rate Limit | Tile Format |
|---|---|---|---|
| NASA GIBS | No | ~50 req/s | TMS/WMTS |
| Copernicus OGC | Yes (free) | 3,000 PU/month | WMS/WMTS |
| GEE tiles | Yes (free) | Generous but shared | XYZ (time-limited URLs) |
| GFW tiles | No for tiles | Reasonable | Mapbox vector/raster |
| OpenAerialMap | No | Varies | TMS |
| Bhuvan WMS | Varies | Unreliable | WMS |
| USGS/AWS Landsat | No (AWS) | AWS public bucket | GeoTIFF |

### Time-Lapse Implementation Options
1. **Easiest**: NASA Worldview built-in time slider (iframe embed)
2. **GEE**: Export animation frames → create GIF/MP4 → serve statically
3. **Copernicus**: Date-parameterized WMS → animate via JavaScript canvas
4. **GIBS**: Change date in tile URL → JavaScript timer for frame animation
5. **Frame-based**: Download GeoTIFF sequence → ffmpeg → MP4 → `<video>` tag

### Making Maharashtra-Specific Layers
```javascript
// Maharashtra AOI polygon (approximate)
const maharashtra = {
  type: 'Polygon',
  coordinates: [[[72.6, 22.0], [80.9, 22.0], [80.9, 15.6], [72.6, 15.6], [72.6, 22.0]]]
};

// GIBS daily satellite for Maharashtra region — just add as tile layer
// Works out of the box, no cropping needed (tiles are global)

// For GEE analysis clipped to Maharashtra:
var maharashtra = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM1_NAME', 'Maharashtra'));
```

---

## Key URLs & Links

| Resource | URL |
|---|---|
| Copernicus Data Space | https://dataspace.copernicus.eu/ |
| Sentinel Hub Docs | https://documentation.dataspace.copernicus.eu/ |
| NASA GIBS | https://wiki.earthdata.nasa.gov/display/GIBS |
| NASA Worldview | https://worldview.earthdata.nasa.gov/ |
| Bhuvan Portal | https://bhuvan.nrsc.gov.in/ |
| Bhoonidhi API | https://bhoonidhi.nrsc.gov.in/ |
| Google Earth Engine | https://earthengine.google.com/ |
| USGS EarthExplorer | https://earthexplorer.usgs.gov/ |
| Global Forest Watch | https://www.globalforestwatch.org/ |
| GFW Data API | https://data-api.globalforestwatch.org/ |
| NASA Black Marble | https://blackmarble.gsfc.nasa.gov/ |
| OpenAerialMap | https://openaerialmap.org/ |
| GHSL | https://ghsl.jrc.ec.europa.eu/ |
| WorldPop | https://www.worldpop.org/ |
| ESA WorldCover | https://esa-worldcover.org/ |
| NASA Earthdata | https://www.earthdata.nasa.gov/ |
| AppEEARS (subset tool) | https://lpdaacsvc.cr.usgs.gov/appeears/ |
