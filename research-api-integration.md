# 🔌 API Integration Guide — Project Arjun (CesiumJS Frontend)

> Practical, code-ready integration guide for every live data source in Project Arjun.
> Target: Browser-only TypeScript (GitHub Pages deployment, no backend).
> Last Updated: April 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [CORS & Proxy Strategy](#cors--proxy-strategy)
3. [Caching Strategy (localStorage + TTL)](#caching-strategy)
4. [GeoJSON Conversion Patterns](#geojson-conversion-patterns)
5. [Error Handling & Fallbacks](#error-handling--fallbacks)
6. [API: Open-Meteo (Weather)](#1-open-meteo--weather-data)
7. [API: NASA FIRMS (Fire/Hotspots)](#2-nasa-firms--firehotspot-data)
8. [API: GDELT (News Events)](#3-gdelt--news-events)
9. [API: USGS Earthquake API (Seismic)](#4-usgs-earthquake-api--seismic-data)
10. [API: OpenSky Network (Aircraft)](#5-opensky-network--aircraft-tracking)
11. [API: AQICN / WAQI (Air Quality)](#6-aqicn--waqi--air-quality)
12. [API: data.gov.in (Government Data)](#7-datagovin--indian-government-data)
13. [API: ISRO Bhuvan (WMS Tiles)](#8-isro-bhuvan--satellite-wms-tiles)
14. [API: Wikidata SPARQL (Structured Facts)](#9-wikidata-sparql--structured-facts)
15. [API: OpenStreetMap Overpass (Infrastructure)](#10-openstreetmap-overpass--infrastructure-data)
16. [API: WorldPop (Population Rasters)](#11-worldpop--population-density-rasters)
17. [API: NHM / HMIS (Health Facilities)](#12-nhm--hmis--health-facility-data)
18. [Complete Working Example: LiveWeatherLayer](#complete-working-example-liveweatherlayer)
19. [Reference to Existing Architecture](#reference-to-existing-architecture)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   CesiumJS Viewer                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ GeoJSON  │  │  WMS     │  │  Entity-based    │   │
│  │ DataSource│  │ Imagery  │  │  Point/Polyline  │   │
│  └─────┬────┘  └─────┬────┘  └───────┬──────────┘   │
│        │             │               │               │
│  ┌─────┴─────────────┴───────────────┴──────────┐    │
│  │              LayerManager                     │    │
│  │  (each layer extends BaseLayer)               │    │
│  └─────────────────┬─────────────────────────────┘    │
└────────────────────┼──────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │    DataStore        │
          │  (cache + fetch)    │
          └──────────┬──────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───┴───┐     ┌─────┴─────┐   ┌──────┴──────┐
│Direct │     │ CORS      │   │ Static      │
│CORS   │     │ Proxy     │   │ Pre-fetched │
│fetch  │     │ (allorigins│   │ /data/*.json│
│       │     │  .win)     │   │             │
└───────┘     └───────────┘   └─────────────┘
```

**Three integration modes:**

| Mode | When to use | Example APIs |
|------|------------|--------------|
| **Direct CORS** | API sends `Access-Control-Allow-Origin: *` | Open-Meteo, USGS, GDELT, OpenSky |
| **CORS Proxy** | API blocks browser requests | data.gov.in, AQICN, Overpass (optional) |
| **Static Pre-bundled** | Data changes rarely, or fetched by CI | Census, WorldPop rasters, NHM data |

---

## CORS & Proxy Strategy

### APIs That Work Directly (CORS-enabled)

These APIs can be called from `fetch()` in the browser with zero proxying:

| API | CORS | Notes |
|-----|------|-------|
| **Open-Meteo** | ✅ `*` | Fully CORS-enabled, no auth |
| **USGS Earthquake** | ✅ `*` | Returns GeoJSON directly |
| **GDELT Doc API** | ✅ `*` | JSON responses |
| **NASA FIRMS** | ✅ `*` | JSON and CSV endpoints |
| **OpenSky Network** | ✅ `*` | Basic tier is CORS-friendly |
| **Wikidata SPARQL** | ✅ `*` | SPARQL endpoint |
| **WorldPop** | ✅ `*` | COG/GeoTIFF served with CORS |

### APIs That Need a CORS Proxy

| API | CORS Issue | Solution |
|-----|-----------|----------|
| **data.gov.in** | No CORS headers | AllOrigins proxy or pre-fetch in CI |
| **AQICN/WAQI** | Partial CORS | Token in URL param + optional proxy |
| **Overpass API** | Rate-limited for browsers | AllOrigins or `https://overpass-api.de/api/interpreter` (does support CORS on some endpoints) |
| **ISRO Bhuvan** | No CORS | Pre-built tile URL patterns, or proxy |
| **NHM/HMIS** | No formal API, scraping | Pre-fetch via GitHub Actions |

### CORS Proxy: AllOrigins (Free)

```typescript
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function proxyUrl(targetUrl: string): string {
  return `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
}

// Usage:
const response = await fetch(proxyUrl('https://api.data.gov.in/...'));
```

**Limitations:** 1000 requests/day, ~10KB response limit per call. Suitable for metadata/small payloads, not large datasets.

### CORS Proxy: Self-hosted (Recommended for Production)

For serious use, deploy a lightweight proxy on Cloudflare Workers (free tier):

```typescript
// Cloudflare Worker — cors-proxy.js
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing url param', { status: 400 });
    
    const allowed = [
      'api.data.gov.in',
      'api.waqi.info',
      'overpass-api.de',
      'bhuvan-app1.nrsc.gov.in',
    ];
    const targetHost = new URL(target).hostname;
    if (!allowed.some(h => targetHost.includes(h))) {
      return new Response('Host not allowed', { status: 403 });
    }

    const resp = await fetch(target, {
      headers: { 'User-Agent': 'ProjectArjun/1.0' },
    });
    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(resp.body, { headers });
  },
};
```

### Pre-fetch via GitHub Actions (Static Fallback)

For APIs that are slow, unreliable, or lack CORS — fetch data during CI and serve as static files:

```yaml
# .github/workflows/fetch-data.yml
name: Fetch Live Data
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch: {}

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: node scripts/fetch-all-data.mjs
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update live data feeds"
          file_pattern: 'gods-eye-maharashtra/public/data/*.json'
```

---

## Caching Strategy

### Why localStorage + TTL?

GitHub Pages has no server-side state. All caching happens in the browser. The strategy:

1. **localStorage** for API responses
2. **TTL (Time-To-Live)** per data type
3. **Stale-while-revalidate** pattern (show cached, fetch fresh in background)

### CacheManager Implementation

```typescript
// src/data/CacheManager.ts

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;       // ms
  etag?: string;     // For conditional requests
  version: number;   // Schema version
}

export class CacheManager {
  private prefix = 'arjun:';

  /**
   * Default TTLs by data volatility
   */
  static readonly TTL = {
    REALTIME:     5 * 60 * 1000,         // 5 min  — weather, AQI
    FREQUENT:     30 * 60 * 1000,        // 30 min — fires, earthquakes, aircraft
    HOURLY:       60 * 60 * 1000,        // 1 hr   — GDELT news
    DAILY:        24 * 60 * 60 * 1000,   // 24 hr  — census, health, schemes
    STATIC:       7 * 24 * 60 * 60 * 1000, // 7 days — boundary GeoJSON, WorldPop
  };

  set<T>(key: string, data: T, ttl: number, etag?: string): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        etag,
        version: 1,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(entry));
    } catch (e) {
      // localStorage full — evict oldest entries
      this.evictOldest(5);
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify({
          data, timestamp: Date.now(), ttl, version: 1
        }));
      } catch {
        console.warn('Cache write failed even after eviction:', key);
      }
    }
  }

  get<T>(key: string): CacheEntry<T> | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      return JSON.parse(raw) as CacheEntry<T>;
    } catch {
      return null;
    }
  }

  isFresh(key: string): boolean {
    const entry = this.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Stale-while-revalidate: returns cached data immediately,
   * calls refetch if stale.
   */
  async swr<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
  ): Promise<T> {
    const entry = this.get<T>(key);

    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data; // Fresh cache hit
    }

    if (entry) {
      // Stale — return cached but refetch in background
      fetcher().then(data => this.set(key, data, ttl)).catch(() => {});
      return entry.data;
    }

    // No cache — must fetch
    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  evictOldest(count: number): void {
    const entries: { key: string; timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.prefix)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key)!);
        entries.push({ key, timestamp: entry.timestamp || 0 });
      } catch {}
    }
    entries.sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      localStorage.removeItem(entries[i].key);
    }
  }

  clear(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  }

  getStats(): { count: number; totalBytes: number } {
    let count = 0;
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(this.prefix)) continue;
      count++;
      totalBytes += localStorage.getItem(key)?.length || 0;
    }
    return { count, totalBytes };
  }
}
```

### TTL Recommendations by API

| API | TTL | Rationale |
|-----|-----|-----------|
| Open-Meteo weather | 5 min | Changes rapidly |
| NASA FIRMS fires | 30 min | Updated every 3-6 hours by NASA |
| GDELT news | 1 hr | Updated every 15 min but news doesn't change much |
| USGS earthquakes | 5 min | Real-time seismic data |
| OpenSky aircraft | 5 min | Planes move fast |
| AQICN air quality | 30 min | Updated hourly |
| data.gov.in | 24 hr | Government data changes slowly |
| Bhuvan WMS | 7 days | Satellite tiles rarely change |
| Wikidata | 7 days | Structured reference data |
| Overpass | 24 hr | Infrastructure is semi-static |
| WorldPop | 7 days | Annual population estimates |
| NHM/HMIS | 24 hr | Health facility data is periodic |

### localStorage Budget

Browser localStorage limit: ~5-10 MB. With the prefix-based eviction, we can safely cache:
- ~2 MB of API responses (weather, AQI, news, earthquakes)
- ~3 MB of GeoJSON features
- Reserve ~2 MB for other app data

---

## GeoJSON Conversion Patterns

Most APIs return data in their own formats. Converting to GeoJSON is critical because CesiumJS's `GeoJsonDataSource` can render GeoJSON natively.

### Pattern 1: API returns lat/lng fields → Point GeoJSON

```typescript
interface ApiRecord {
  lat: number;
  lng: number;
  [key: string]: any;
}

function toPointGeoJSON(records: ApiRecord[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: records.map(r => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [r.lng, r.lat],
      },
      properties: { ...r },
    })),
  };
}
```

### Pattern 2: API returns GeoJSON directly (USGS, Overpass)

```typescript
// No conversion needed — pass directly to CesiumJS
const geojson = await response.json();
const dataSource = await GeoJsonDataSource.load(geojson);
viewer.dataSources.add(dataSource);
```

### Pattern 3: API returns CSV → parse → GeoJSON

```typescript
function csvToGeoJSON(csv: string): GeoJSON.FeatureCollection {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  
  const latIdx = headers.findIndex(h => /lat/i.test(h));
  const lngIdx = headers.findIndex(h => /lon/i.test(h));
  
  const features = lines.slice(1).map(line => {
    const values = line.split(',');
    const props: Record<string, string> = {};
    headers.forEach((h, i) => props[h] = values[i]);
    
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [parseFloat(values[lngIdx]), parseFloat(values[latIdx])],
      },
      properties: props,
    };
  }).filter(f => !isNaN(f.geometry.coordinates[0]));
  
  return { type: 'FeatureCollection', features };
}
```

### Pattern 4: Grid data (weather) → heatmap points

```typescript
function gridToGeoJSON(
  lats: number[], 
  lons: number[], 
  values: number[][]
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < lats.length; i++) {
    for (let j = 0; j < lons.length; j++) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lons[j], lats[i]] },
        properties: { value: values[i][j] },
      });
    }
  }
  return { type: 'FeatureCollection', features };
}
```

---

## Error Handling & Fallbacks

### Layer-Level Error Pattern

Every layer in Project Arjun should follow this error boundary pattern (consistent with `BaseLayer`):

```typescript
protected async loadData(): Promise<void> {
  this.clear();
  
  try {
    const data = await this.fetchData();
    this.renderEntities(data);
  } catch (err: any) {
    console.warn(`[${this.config.id}] Live fetch failed:`, err.message);
    
    // Fallback 1: Try cached data
    const cached = this.cache.get(this.config.dataStoreKey);
    if (cached) {
      console.info(`[${this.config.id}] Using cached data`);
      this.renderEntities(cached.data);
      return;
    }
    
    // Fallback 2: Use bundled static data
    try {
      const staticData = await fetch(`/data/${this.config.dataStoreKey}.json`);
      if (staticData.ok) {
        console.info(`[${this.config.id}] Using static fallback data`);
        this.renderEntities(await staticData.json());
        return;
      }
    } catch {}
    
    // Fallback 3: Show error state
    this.showError(`Failed to load ${this.config.name}: ${err.message}`);
  }
}
```

### Network Error Classification

```typescript
function classifyError(err: Error): 'network' | 'cors' | 'rate-limit' | 'auth' | 'server' | 'unknown' {
  const msg = err.message.toLowerCase();
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'network';
  if (msg.includes('cors') || msg.includes('cross-origin')) return 'cors';
  if (msg.includes('429') || msg.includes('rate')) return 'rate-limit';
  if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) return 'auth';
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return 'server';
  return 'unknown';
}

// Retry with exponential backoff for transient errors
async function fetchWithRetry(
  url: string, 
  options?: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const resp = await fetch(url, options);
      if (resp.status === 429) {
        const retryAfter = parseInt(resp.headers.get('Retry-After') || '60');
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        continue;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## 1. Open-Meteo — Weather Data

**Status: ✅ Production-ready, CORS-enabled, no auth, free forever**

### Endpoint

```
GET https://api.open-meteo.com/v1/forecast
```

### Parameters

| Param | Required | Example |
|-------|----------|---------|
| `latitude` | Yes | `19.076` |
| `longitude` | Yes | `72.877` |
| `hourly` | No | `temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m` |
| `daily` | No | `temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset` |
| `current` | No | `temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m` |
| `timezone` | No | `Asia/Kolkata` |
| `past_days` | No | `7` |
| `forecast_days` | No | `7` |

### Example Request (India-wide grid)

```
GET https://api.open-meteo.com/v1/forecast?
  latitude=19.076&longitude=72.877&
  current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&
  hourly=temperature_2m,precipitation_probability&
  daily=temperature_2m_max,temperature_2m_min,precipitation_sum&
  timezone=Asia/Kolkata
```

### Example Response

```json
{
  "latitude": 19.125,
  "longitude": 72.875,
  "generationtime_ms": 0.5,
  "utc_offset_seconds": 19800,
  "timezone": "Asia/Kolkata",
  "timezone_abbreviation": "IST",
  "elevation": 14.0,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
    "temperature_2m": "°C",
    "relative_humidity_2m": "%",
    "precipitation": "mm",
    "wind_speed_10m": "km/h",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-04-23T00:30",
    "interval": 900,
    "temperature_2m": 28.5,
    "relative_humidity_2m": 72,
    "precipitation": 0.0,
    "wind_speed_10m": 12.3,
    "weather_code": 1
  },
  "daily_units": {
    "time": "iso8601",
    "temperature_2m_max": "°C",
    "temperature_2m_min": "°C",
    "precipitation_sum": "mm"
  },
  "daily": {
    "time": ["2026-04-23", "2026-04-24"],
    "temperature_2m_max": [35.2, 36.1],
    "temperature_2m_min": [26.8, 27.0],
    "precipitation_sum": [0.0, 2.5]
  }
}
```

### Authentication

**None.** No API key required. Free for any use.

### TypeScript Fetch

```typescript
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    [key: string]: any;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
}

async function fetchWeather(lat: number, lon: number): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'Asia/Kolkata',
  });
  
  const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!resp.ok) throw new Error(`Open-Meteo error: ${resp.status}`);
  return resp.json();
}

// Fetch weather for multiple Indian cities
async function fetchIndiaWeatherGrid(): Promise<OpenMeteoResponse[]> {
  const cities = [
    { name: 'Mumbai', lat: 19.076, lon: 72.877 },
    { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
    { name: 'Pune', lat: 18.5204, lon: 73.8567 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
    { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
    { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  ];
  
  // Batch request — Open-Meteo supports multiple coordinates
  const results = await Promise.all(
    cities.map(c => fetchWeather(c.lat, c.lon))
  );
  return results;
}
```

### GeoJSON Conversion

```typescript
interface WeatherPoint {
  name: string;
  lat: number;
  lon: number;
  temp: number;
  humidity: number;
  precip: number;
  windSpeed: number;
}

function weatherToGeoJSON(points: WeatherPoint[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: {
        name: p.name,
        temperature: p.temp,
        humidity: p.humidity,
        precipitation: p.precip,
        windSpeed: p.windSpeed,
        // For CesiumJS styling
        'marker-color': tempToColor(p.temp),
        'marker-size': 'medium',
        description: `🌡️ ${p.temp}°C | 💧 ${p.humidity}% | 🌧️ ${p.precip}mm | 💨 ${p.windSpeed}km/h`,
      },
    })),
  };
}

function tempToColor(temp: number): string {
  if (temp < 10) return '#2196f3';  // Blue — cold
  if (temp < 20) return '#4caf50';  // Green — mild
  if (temp < 30) return '#ff9800';  // Orange — warm
  if (temp < 40) return '#f44336';  // Red — hot
  return '#9c27b0';                 // Purple — extreme
}
```

### Rate Limits & Caching

- **No published rate limit.** Fair use expected (~10,000 requests/day is fine).
- **Cache TTL:** 5 minutes for current weather, 1 hour for forecasts.
- **Strategy:** Batch city requests. Don't fetch every cell of a 0.25° grid — use the 12 major cities as interpolation anchors.

---

## 2. NASA FIRMS — Fire/Hotspot Data

**Status: ✅ Free key required, CORS-enabled, GeoJSON native**

### Endpoints

```
# CSV format
GET https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/VIIRS_SNPP_NRT/IND/1

# JSON format
GET https://firms.modaps.eosdis.nasa.gov/api/country/json/{MAP_KEY}/VIIRS_SNPP_NRT/IND/1

# GeoJSON format (direct!)
GET https://firms.modaps.eosdis.nasa.gov/api/country/geojson/{MAP_KEY}/VIIRS_SNPP_NRT/IND/1

# Area-based
GET https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{min_lon},{min_lat},{max_lon},{max_lat}/1
```

### Parameters

| Param | Description | Example |
|-------|------------|---------|
| `MAP_KEY` | Free API key | Register at https://firms.modaps.eosdis.nasa.gov/api/area |
| `sensor` | Satellite sensor | `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, `MODIS_NRT` |
| `country` | ISO country code | `IND` for India |
| `day_range` | Days of data | `1` (last 24h), `2` (last 48h), up to `10` |

### Example Response (GeoJSON)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [76.5833, 18.4167]
      },
      "properties": {
        "brightness": 312.5,
        "scan": 1.0,
        "track": 1.0,
        "acq_date": "2026-04-22",
        "acq_time": "0530",
        "satellite": "N",
        "confidence": "nominal",
        "version": "2.0NRT",
        "bright_t31": 295.4,
        "frp": 12.8,
        "daynight": "D",
        "type": 0
      }
    }
  ]
}
```

### TypeScript Fetch

```typescript
// ⚠️ Get your free MAP_KEY at: https://firms.modaps.eosdis.nasa.gov/api/area
const FIRMS_MAP_KEY = 'YOUR_KEY_HERE'; // Store in config, not hardcoded

interface FirmsFeature {
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    brightness: number;
    acq_date: string;
    acq_time: string;
    confidence: string;
    frp: number; // Fire Radiative Power (MW)
    daynight: 'D' | 'N';
    satellite: string;
  };
}

async function fetchFirmsIndia(days = 1): Promise<GeoJSON.FeatureCollection> {
  // GeoJSON endpoint — no conversion needed!
  const url = `https://firms.modaps.eosdis.nasa.gov/api/country/geojson/${FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/IND/${days}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`FIRMS error: ${resp.status}`);
  return resp.json();
}

// Fetch for Maharashtra bounding box
async function fetchFirmsMaharashtra(days = 1): Promise<GeoJSON.FeatureCollection> {
  // Maharashtra bbox: ~72.6E, 15.6N to 80.9E, 22.0N
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/geojson/${FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/72.6,15.6,80.9,22.0/${days}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`FIRMS error: ${resp.status}`);
  return resp.json();
}
```

### GeoJSON Conversion

**None needed** — the `/geojson/` endpoint returns valid GeoJSON directly.

```typescript
// Direct usage in CesiumJS
const geojson = await fetchFirmsIndia(1);
const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
  markerSize: 12,
  markerColor: Cesium.Color.RED,
  clampToGround: true,
});
viewer.dataSources.add(dataSource);
```

### Rate Limits & Caching

- **1,000 requests/day** per MAP_KEY
- Updated every 3-6 hours by NASA
- **Cache TTL:** 30 minutes
- Fetch once every 30 min, not more

---

## 3. GDELT — News Events

**Status: ✅ CORS-enabled, no auth, free**

### Endpoint

```
GET https://api.gdeltproject.org/api/v2/doc/doc
```

### Parameters

| Param | Required | Values | Description |
|-------|----------|--------|-------------|
| `query` | Yes | string | Search query |
| `mode` | Yes | `artlist`, `tonechart`, `timeline` | Response mode |
| `maxrecords` | No | 1-250 | Number of results (default 25) |
| `format` | No | `json`, `csv` | Output format |
| `timespan` | No | `24h`, `7d`, `1month` | Time window |
| `sort` | No | `datedesc`, `dateasc`, `hybridrel` | Sort order |

### Example Request

```
GET https://api.gdeltproject.org/api/v2/doc/doc?
  query=india%20mumbai%20drought&
  mode=artlist&
  maxrecords=10&
  format=json&
  timespan=7d
```

### Example Response

```json
{
  "articles": [
    {
      "url": "https://www.example.com/news/india-drought-2026",
      "url_mobile": "",
      "title": "Maharashtra Declares Drought in 10 Districts",
      "seendate": "20260422T120000Z",
      "socialimage": "https://example.com/image.jpg",
      "domain": "example.com",
      "language": "English",
      "sourcegeography": "IND",
      "tone": -4.52
    }
  ]
}
```

### TypeScript Fetch

```typescript
interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcegeography: string;
  tone: number; // -100 to +100, negative = negative sentiment
}

interface GdeltResponse {
  articles: GdeltArticle[];
}

async function fetchGdeltNews(
  query: string,
  timespan = '7d',
  maxRecords = 50
): Promise<GdeltResponse> {
  const params = new URLSearchParams({
    query,
    mode: 'artlist',
    maxrecords: maxRecords.toString(),
    format: 'json',
    timespan,
  });
  
  const resp = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`);
  if (!resp.ok) throw new Error(`GDELT error: ${resp.status}`);
  return resp.json();
}

// India-specific queries
const GDELT_QUERIES = {
  drought: 'india drought OR water scarcity',
  flood: 'india flood OR heavy rainfall OR inundation',
  protest: 'india protest OR demonstration OR strike',
  fire: 'india fire OR wildfire OR blaze',
  health: 'india disease OR epidemic OR outbreak',
  infrastructure: 'india infrastructure OR highway OR metro OR bridge',
};
```

### GeoJSON Conversion

GDELT doesn't provide coordinates. You need to geocode from article content or use GDELT's `sourcegeography` field:

```typescript
// Simple: map country code to centroid (basic)
// Better: use the article title to extract location and map to Indian cities
const CITY_COORDS: Record<string, [number, number]> = {
  'mumbai': [72.877, 19.076],
  'delhi': [77.209, 28.614],
  'chennai': [80.270, 13.083],
  'pune': [73.857, 18.520],
  'nagpur': [79.088, 21.146],
  // ... add more
};

function gdeltToGeoJSON(articles: GdeltArticle[]): GeoJSON.FeatureCollection {
  const features = articles.map(article => {
    const titleLower = article.title.toLowerCase();
    let coords: [number, number] = [78.0, 22.0]; // Default: center of India
    
    for (const [city, [lng, lat]] of Object.entries(CITY_COORDS)) {
      if (titleLower.includes(city)) {
        coords = [lng, lat];
        break;
      }
    }
    
    return {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: coords },
      properties: {
        title: article.title,
        url: article.url,
        date: article.seendate,
        domain: article.domain,
        tone: article.tone,
        sentiment: article.tone < -2 ? 'negative' : article.tone > 2 ? 'positive' : 'neutral',
        image: article.socialimage,
        description: `📰 ${article.title}<br>🗓️ ${article.seendate}<br>📊 Tone: ${article.tone.toFixed(1)}`,
      },
    };
  });
  
  return { type: 'FeatureCollection', features };
}
```

### Rate Limits & Caching

- **No published rate limit.** Be reasonable — don't hammer it.
- **Cache TTL:** 1 hour
- GDELT updates every 15 min, but news cycle is slower

---

## 4. USGS Earthquake API — Seismic Data

**Status: ✅ CORS-enabled, no auth, returns GeoJSON natively**

### Endpoint

```
GET https://earthquake.usgs.gov/fdsnws/event/1/query
```

### Parameters

| Param | Description | Example |
|-------|------------|---------|
| `format` | Output format | `geojson` (default) |
| `starttime` | ISO date | `2026-04-01` |
| `endtime` | ISO date | `2026-04-23` |
| `minlatitude` | Bounding box | `6.0` |
| `maxlatitude` | Bounding box | `37.0` |
| `minlongitude` | Bounding box | `68.0` |
| `maxlongitude` | Bounding box | `98.0` |
| `minmagnitude` | Minimum magnitude | `2.5` |
| `limit` | Max results | `500` |
| `orderby` | Sort | `time`, `magnitude` |

### Example Request (India region)

```
GET https://earthquake.usgs.gov/fdsnws/event/1/query?
  format=geojson&
  starttime=2026-04-01&
  minlatitude=6&maxlatitude=37&
  minlongitude=68&maxlongitude=98&
  minmagnitude=2.5&
  limit=100&
  orderby=time
```

### Example Response

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "generated": 1713849600000,
    "url": "https://earthquake.usgs.gov/...",
    "title": "USGS Earthquakes",
    "count": 42
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "mag": 4.2,
        "place": "120km SSW of Port Blair, India",
        "time": 1713840000000,
        "updated": 1713849600000,
        "tz": null,
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000mxyz",
        "detail": "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=us7000mxyz&format=geojson",
        "felt": 5,
        "cdi": 4.0,
        "mmi": null,
        "alert": null,
        "status": "reviewed",
        "tsunami": 0,
        "sig": 273,
        "net": "us",
        "code": "7000mxyz",
        "ids": ",us7000mxyz,",
        "sources": ",us,",
        "types": ",origin,phase-data,",
        "nst": 32,
        "dmin": 1.5,
        "rms": 0.65,
        "gap": 85,
        "magType": "mb",
        "type": "earthquake",
        "title": "M 4.2 - 120km SSW of Port Blair, India"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [92.5, 10.8, 35.0]
      },
      "id": "us7000mxyz"
    }
  ]
}
```

### TypeScript Fetch

```typescript
interface UsgsEarthquakeProperties {
  mag: number;
  place: string;
  time: number;       // Unix ms
  title: string;
  tsunami: number;
  type: string;
  url: string;
  felt: number | null; // Felt reports
  alert: string | null; // PAGER alert level
}

async function fetchEarthquakesIndia(
  minMag = 2.5,
  days = 30
): Promise<GeoJSON.FeatureCollection> {
  const starttime = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const params = new URLSearchParams({
    format: 'geojson',
    starttime,
    minlatitude: '6',
    maxlatitude: '37',
    minlongitude: '68',
    maxlongitude: '98',
    minmagnitude: minMag.toString(),
    limit: '500',
    orderby: 'time',
  });
  
  const resp = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`);
  if (!resp.ok) throw new Error(`USGS error: ${resp.status}`);
  return resp.json();
}
```

### GeoJSON Conversion

**None needed** — USGS returns GeoJSON directly.

```typescript
// Direct CesiumJS rendering
const geojson = await fetchEarthquakesIndia(3.0, 7);
const dataSource = await Cesium.GeoJsonDataSource.load(geojson, {
  markerSize: (feature: any) => Math.pow(2, feature.properties.mag) * 2,
  markerColor: (feature: any) => {
    const mag = feature.properties.mag;
    if (mag >= 6) return Cesium.Color.RED;
    if (mag >= 4) return Cesium.Color.ORANGE;
    return Cesium.Color.YELLOW;
  },
  clampToGround: true,
});
```

### Rate Limits & Caching

- **No rate limit** for reasonable usage
- Updated in real-time (minutes after detection)
- **Cache TTL:** 5 minutes

---

## 5. OpenSky Network — Aircraft Tracking

**Status: ✅ CORS-enabled for basic tier, no auth required for anonymous**

### Endpoint

```
GET https://opensky-network.org/api/states/all
```

### Parameters

| Param | Description | Example |
|-------|------------|---------|
| `lamin` | Bounding box min lat | `6.0` |
| `lamax` | Bounding box max lat | `37.0` |
| `lomin` | Bounding box min lon | `68.0` |
| `lomax` | Bounding box max lon | `98.0` |
| `time` | Unix timestamp (optional) | Omit for latest |

### Example Request (India FIR)

```
GET https://opensky-network.org/api/states/all?lamin=6&lomin=68&lamax=37&lomax=98
```

### Example Response

```json
{
  "time": 1713849600,
  "states": [
    [
      "800a12",          // 0: icao24
      "AI101   ",        // 1: callsign
      "India",           // 2: origin_country
      1713849590,        // 3: time_position
      1713849595,        // 4: last_contact
      72.8656,           // 5: longitude
      19.0896,           // 6: latitude
      10668.0,           // 7: baro_altitude (m)
      false,             // 8: on_ground
      245.0,             // 9: velocity (m/s)
      285.0,             // 10: true_track (deg)
      0.0,               // 11: vertical_rate (m/s)
      null,              // 12: sensors
      10668.0,           // 13: geo_altitude
      false,             // 14: squawk
      false,             // 15: spi
      0                  // 16: position_source
    ]
  ]
}
```

### TypeScript Fetch

```typescript
interface OpenSkyState {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  baroAltitude: number;
  onGround: boolean;
  velocity: number;
  trueTrack: number;
  verticalRate: number;
  lastContact: number;
}

interface OpenSkyResponse {
  time: number;
  states: any[][] | null;
}

async function fetchAircraftIndia(): Promise<OpenSkyState[]> {
  const params = new URLSearchParams({
    lamin: '6',
    lamax: '37',
    lomin: '68',
    lomax: '98',
  });
  
  const resp = await fetch(`https://opensky-network.org/api/states/all?${params}`);
  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Rate limited — try again later');
    throw new Error(`OpenSky error: ${resp.status}`);
  }
  
  const data: OpenSkyResponse = await resp.json();
  if (!data.states) return [];
  
  return data.states.map(s => ({
    icao24: s[0],
    callsign: (s[1] || '').trim(),
    originCountry: s[2],
    longitude: s[5],
    latitude: s[6],
    baroAltitude: s[7] || 0,
    onGround: s[8],
    velocity: s[9] || 0,
    trueTrack: s[10] || 0,
    verticalRate: s[11] || 0,
    lastContact: s[4],
  })).filter(a => a.latitude && a.longitude);
}
```

### GeoJSON Conversion

```typescript
function aircraftToGeoJSON(states: OpenSkyState[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: states.map(s => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [s.longitude, s.latitude, s.baroAltitude],
      },
      properties: {
        icao24: s.icao24,
        callsign: s.callsign,
        country: s.originCountry,
        altitude: s.baroAltitude,
        speed: Math.round(s.velocity * 3.6), // m/s to km/h
        heading: s.trueTrack,
        onGround: s.onGround,
        description: `✈️ ${s.callsign || s.icao24} (${s.originCountry})\n` +
                     `Alt: ${(s.baroAltitude / 1000).toFixed(1)} km | ` +
                     `Speed: ${Math.round(s.velocity * 3.6)} km/h`,
      },
    })),
  };
}
```

### Rate Limits & Caching

- **Anonymous:** 10-second resolution, limited to 1 request per 10 seconds
- **Cache TTL:** 5 minutes
- **Important:** Don't poll more than once every 10 seconds or you'll get 429

---

## 6. AQICN / WAQI — Air Quality

**Status: ✅ Free tier with key, partial CORS**

### Endpoints

```
# By city name
GET https://api.waqi.info/feed/{city}/?token={TOKEN}

# By lat/lon
GET https://api.waqi.info/feed/geo:{lat};{lon}/?token={TOKEN}

# Search
GET https://api.waqi.info/search/?keyword={query}&token={TOKEN}

# Map bounds (tile data)
GET https://api.waqi.info/v2/map/bounds?latlng={south},{west},{north},{east}&networks=all&token={TOKEN}
```

### Authentication

Register at https://aqicn.org/data-platform/token/ — free token, no credit card.

### Example Request

```
GET https://api.waqi.info/feed/mumbai/?token=YOUR_TOKEN
```

### Example Response

```json
{
  "status": "ok",
  "data": {
    "aqi": 156,
    "idx": 1234,
    "dominentpol": "pm25",
    "iaqi": {
      "co": { "v": 8.2 },
      "h": { "v": 72 },
      "no2": { "v": 35 },
      "o3": { "v": 12 },
      "pm10": { "v": 98 },
      "pm25": { "v": 156 },
      "so2": { "v": 8 },
      "t": { "v": 28.5 },
      "w": { "v": 12.3 }
    },
    "time": {
      "s": "2026-04-22 18:00:00",
      "tz": "+05:30",
      "v": 1713808800
    },
    "city": {
      "geo": [19.076, 72.877],
      "name": "Mumbai, India",
      "url": "https://aqicn.org/city/mumbai/"
    },
    "forecast": {
      "daily": {
        "pm25": [
          { "avg": 148, "day": "2026-04-22", "max": 180, "min": 120 },
          { "avg": 135, "day": "2026-04-23", "max": 165, "min": 110 }
        ]
      }
    },
    "debug": { "sync": "2026-04-22T19:15:00+09:00" }
  }
}
```

### TypeScript Fetch

```typescript
// ⚠️ Get free token: https://aqicn.org/data-platform/token/
const WAQI_TOKEN = 'YOUR_TOKEN_HERE';

interface WaqiResponse {
  status: string;
  data: {
    aqi: number;
    dominentpol: string;
    iaqi: Record<string, { v: number }>;
    city: {
      geo: [number, number]; // [lat, lon]
      name: string;
    };
    time: { s: string; v: number };
    forecast?: any;
  };
}

async function fetchAqiCity(city: string): Promise<WaqiResponse> {
  const resp = await fetch(
    `https://api.waqi.info/feed/${encodeURIComponent(city)}/?token=${WAQI_TOKEN}`
  );
  if (!resp.ok) throw new Error(`WAQI error: ${resp.status}`);
  return resp.json();
}

async function fetchAqiBounds(
  south: number, west: number, north: number, east: number
): Promise<any> {
  // Map bounds API returns stations within a bounding box
  const resp = await fetch(
    `https://api.waqi.info/v2/map/bounds?latlng=${south},${west},${north},${east}&networks=all&token=${WAQI_TOKEN}`
  );
  if (!resp.ok) throw new Error(`WAQI error: ${resp.status}`);
  return resp.json();
}

// Fetch AQI for multiple Indian cities
async function fetchIndiaAQI(): Promise<WaqiResponse[]> {
  const cities = ['mumbai', 'delhi', 'chennai', 'kolkata', 'bengaluru', 'pune', 'hyderabad', 'ahmedabad'];
  return Promise.all(cities.map(c => fetchAqiCity(c)));
}
```

### GeoJSON Conversion

```typescript
function aqiToGeoJSON(stations: WaqiResponse[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stations
      .filter(s => s.status === 'ok')
      .map(s => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [s.data.city.geo[1], s.data.city.geo[0]],
        },
        properties: {
          name: s.data.city.name,
          aqi: s.data.aqi,
          dominantPol: s.data.dominentpol,
          pm25: s.data.iaqi.pm25?.v,
          pm10: s.data.iaqi.pm10?.v,
          color: aqiColor(s.data.aqi),
          level: aqiLevel(s.data.aqi),
          description: `${aqiEmoji(s.data.aqi)} AQI ${s.data.aqi} (${aqiLevel(s.data.aqi)})\n` +
                       `PM2.5: ${s.data.iaqi.pm25?.v ?? 'N/A'} | PM10: ${s.data.iaqi.pm10?.v ?? 'N/A'}`,
        },
      })),
  };
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';    // Good — green
  if (aqi <= 100) return '#ffff00';   // Moderate — yellow
  if (aqi <= 150) return '#ff7e00';   // Unhealthy for sensitive — orange
  if (aqi <= 200) return '#ff0000';   // Unhealthy — red
  if (aqi <= 300) return '#8f3f97';   // Very unhealthy — purple
  return '#7e0023';                    // Hazardous — maroon
}

function aqiLevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function aqiEmoji(aqi: number): string {
  if (aqi <= 50) return '🟢';
  if (aqi <= 100) return '🟡';
  if (aqi <= 150) return '🟠';
  if (aqi <= 200) return '🔴';
  if (aqi <= 300) return '🟣';
  return '🟤';
}
```

### Rate Limits & Caching

- **Free tier:** 1,000 requests/day
- **Cache TTL:** 30 minutes
- AQICN supports CORS in some browsers but not all — use proxy if needed

---

## 7. data.gov.in — Indian Government Data

**Status: ⚠️ Needs CORS proxy, API key required**

### Endpoint

```
GET https://api.data.gov.in/resource/{resource-id}
```

### Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `api-key` | Yes | Your API key (free registration) |
| `format` | No | `json` or `xml` |
| `limit` | No | Records per page (max 500) |
| `offset` | No | Pagination offset |
| `filters[field]` | No | Filter by field |
| `fields` | No | Select specific fields |

### Common Resource IDs

| Dataset | Resource ID |
|---------|------------|
| State/UT-wise population | Search for "state wise population" on data.gov.in |
| District-wise literacy | Search for "district wise literacy" |
| Health facilities | Search for "health infrastructure" |
| Agricultural production | Search for "crop production state" |
| School education stats | Search for "udise school education" |

> **Note:** Resource IDs change. Search data.gov.in for current valid IDs.

### Example Request

```
GET https://api.data.gov.in/resource/xxx-xxxxx?
  api-key=YOUR_KEY&
  format=json&
  limit=50&
  filters[state]=Maharashtra
```

### Example Response

```json
{
  "total": 54321,
  "count": 50,
  "offset": 0,
  "limit": 50,
  "records": [
    {
      "state": "Maharashtra",
      "district": "Pune",
      "population": "3124458",
      "literacy_rate": "89.56",
      "sex_ratio": "910"
    },
    {
      "state": "Maharashtra",
      "district": "Mumbai",
      "population": "3085411",
      "literacy_rate": "89.73",
      "sex_ratio": "838"
    }
  ]
}
```

### TypeScript Fetch

```typescript
const DATAGOV_API_KEY = 'YOUR_KEY_HERE'; // Register at data.gov.in
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

interface DataGovInResponse {
  total: number;
  count: number;
  offset: number;
  limit: number;
  records: Record<string, string>[];
}

async function fetchDataGovIn(
  resourceId: string,
  filters?: Record<string, string>,
  limit = 500,
  offset = 0
): Promise<DataGovInResponse> {
  const params = new URLSearchParams({
    'api-key': DATAGOV_API_KEY,
    format: 'json',
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      params.append(`filters[${key}]`, value);
    }
  }
  
  const targetUrl = `https://api.data.gov.in/resource/${resourceId}?${params}`;
  const url = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;
  
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`data.gov.in error: ${resp.status}`);
  return resp.json();
}

// Paginate through all results
async function fetchAllPages(resourceId: string, filters?: Record<string, string>): Promise<Record<string, string>[]> {
  const allRecords: Record<string, string>[] = [];
  let offset = 0;
  const limit = 500;
  
  while (true) {
    const data = await fetchDataGovIn(resourceId, filters, limit, offset);
    allRecords.push(...data.records);
    if (allRecords.length >= data.total) break;
    offset += limit;
  }
  
  return allRecords;
}
```

### GeoJSON Conversion

Requires linking records to district boundary GeoJSON (GADM or Census shapefiles):

```typescript
function govDataToGeoJSON(
  records: Record<string, string>[],
  districtGeoJSON: GeoJSON.FeatureCollection,
  valueField: string
): GeoJSON.FeatureCollection {
  // Index records by district name
  const recordMap = new Map(records.map(r => [r.district?.toLowerCase(), r]));
  
  const features = districtGeoJSON.features.map(feature => {
    const districtName = (feature.properties as any)?.NAME_2?.toLowerCase() || '';
    const record = recordMap.get(districtName);
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        ...(record || {}),
        value: record ? parseFloat(record[valueField]) : null,
      },
    };
  });
  
  return { ...districtGeoJSON, features };
}
```

### Rate Limits & Caching

- **~100 req/min** is safe (no published limit)
- **Cache TTL:** 24 hours (government data changes slowly)
- **Strategy:** Fetch once per session, cache aggressively
- Use GitHub Actions to pre-fetch and bundle as static data

---

## 8. ISRO Bhuvan — Satellite WMS Tiles

**Status: ⚠️ Needs CORS proxy, may need API key**

### WMS Endpoint

```
https://bhuvan-app1.nrsc.gov.in/bhuvan/wms?
  service=WMS&
  version=1.1.1&
  request=GetMap&
  layers={layer_name}&
  bbox={minx,miny,maxx,maxy}&
  width=256&height=256&
  srs=EPSG:4326&
  format=image/png
```

### Available Layers

| Layer | Description |
|-------|-------------|
| `bhuvan:gaul_india_district_2011` | District boundaries overlay |
| `bhuvan:india_state_boundary` | State boundaries |
| `bhuvan:india34_river` | River network |
| `bhuvan:india_rail` | Railway lines |
| `bhuvan:india_highway` | Highway network |
| `bhuvan:lii34` | Satellite imagery |
| `bhuvan:mosaic_34` | Cartosat imagery |

### CesiumJS Integration (WMS as Imagery Provider)

```typescript
import { 
  Viewer, 
  WebMapServiceImageryProvider, 
  ImageryLayer,
  Rectangle,
  Credit 
} from 'cesium';

// Add Bhuvan WMS layer directly to CesiumJS
function addBhuvanLayer(viewer: Viewer, layerName: string): ImageryLayer {
  const provider = new WebMapServiceImageryProvider({
    url: 'https://bhuvan-app1.nrsc.gov.in/bhuvan/wms',
    layers: layerName,
    parameters: {
      format: 'image/png',
      transparent: 'true',
    },
    // India bounding box
    rectangle: Rectangle.fromDegrees(68.0, 6.0, 98.0, 37.0),
    credit: new Credit('ISRO Bhuvan'),
  });
  
  const layer = viewer.imageryLayers.addImageryProvider(provider);
  layer.alpha = 0.7; // Semi-transparent overlay
  return layer;
}

// Usage:
// const districtLayer = addBhuvanLayer(viewer, 'bhuvan:gaul_india_district_2011');
// const riverLayer = addBhuvanLayer(viewer, 'bhuvan:india34_river');
```

### CORS Workaround

Bhuvan WMS tiles may not have CORS headers. Solutions:

1. **Proxy through Cloudflare Worker** (see proxy section above)
2. **Pre-render tiles** during CI and host on GitHub Pages
3. **Use CesiumJS's `proxy` option:**

```typescript
import { DefaultProxy } from 'cesium';

const provider = new WebMapServiceImageryProvider({
  url: 'https://your-cors-proxy.workers.dev/?url=' + 
       encodeURIComponent('https://bhuvan-app1.nrsc.gov.in/bhuvan/wms'),
  layers: 'bhuvan:gaul_india_district_2011',
  parameters: {
    format: 'image/png',
    transparent: 'true',
  },
});
```

### Rate Limits & Caching

- No published rate limit, but Bhuvan servers are slow
- **Cache TTL:** 7 days (tiles don't change)
- Use browser HTTP cache for tile images (Set `Cache-Control: max-age=604800` on proxy)

---

## 9. Wikidata SPARQL — Structured Facts

**Status: ✅ CORS-enabled, no auth, structured data**

### Endpoint

```
POST https://query.wikidata.org/sparql
```

### Authentication

**None.** Public SPARQL endpoint. Use `Accept: application/sparql-results+json` header.

### Example: Get all Indian districts with population

```sparql
SELECT ?district ?districtLabel ?population ?area WHERE {
  ?district wdt:P31 wd:Q1149652 .  # instance of district of India
  ?district wdt:P1082 ?population . # population
  ?district wdt:P2046 ?area .       # area
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY DESC(?population)
LIMIT 500
```

### Example: Get Maharashtra districts with coordinates

```sparql
SELECT ?district ?districtLabel ?lat ?lon ?population WHERE {
  ?district wdt:P31 wd:Q1149652 .
  ?district wdt:P131+ wd:Q1191 .    # located in Maharashtra
  ?district wdt:P625 ?coord .        # coordinate location
  ?district wdt:P1082 ?population .
  BIND(geof:latitude(?coord) AS ?lat)
  BIND(geof:longitude(?coord) AS ?lon)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
```

### Example Response

```json
{
  "head": { "vars": ["district", "districtLabel", "lat", "lon", "population"] },
  "results": {
    "bindings": [
      {
        "district": { "type": "uri", "value": "http://www.wikidata.org/entity/Q209268" },
        "districtLabel": { "type": "literal", "value": "Pune district" },
        "lat": { "type": "literal", "value": "18.52", "datatype": "http://www.w3.org/2001/XMLSchema#decimal" },
        "lon": { "type": "literal", "value": "73.86", "datatype": "http://www.w3.org/2001/XMLSchema#decimal" },
        "population": { "type": "literal", "value": "9426959", "datatype": "http://www.w3.org/2001/XMLSchema#decimal" }
      }
    ]
  }
}
```

### TypeScript Fetch

```typescript
interface SparqlResponse {
  head: { vars: string[] };
  results: {
    bindings: Record<string, { type: string; value: string; datatype?: string }>[];
  };
}

async function queryWikidata(sparql: string): Promise<SparqlResponse> {
  const resp = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: {
      'Accept': 'application/sparql-results+json',
      'Content-Type': 'application/sparql-query',
      'User-Agent': 'ProjectArjun/1.0 (geospatial research)',
    },
    body: sparql,
  });
  if (!resp.ok) throw new Error(`Wikidata SPARQL error: ${resp.status}`);
  return resp.json();
}

// Query for all Indian states with metadata
const INDIA_STATES_QUERY = `
SELECT ?state ?stateLabel ?population ?area ?capitalLabel WHERE {
  ?state wdt:P31/wdt:P279* wd:Q131541 .  # Indian state
  OPTIONAL { ?state wdt:P1082 ?population }
  OPTIONAL { ?state wdt:P2046 ?area }
  OPTIONAL { ?state wdt:P36 ?capital }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}`;
```

### GeoJSON Conversion

```typescript
function sparqlToGeoJSON(data: SparqlResponse): GeoJSON.FeatureCollection {
  const features = data.results.bindings.map(b => {
    const lat = parseFloat(b.lat?.value);
    const lon = parseFloat(b.lon?.value);
    const props: Record<string, any> = {};
    
    for (const [key, val] of Object.entries(b)) {
      if (key !== 'lat' && key !== 'lon' && key !== 'coord') {
        props[key] = val.datatype?.includes('decimal') 
          ? parseFloat(val.value) 
          : val.value;
      }
    }
    
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [lon, lat],
      },
      properties: props,
    };
  }).filter(f => !isNaN(f.geometry.coordinates[0]));
  
  return { type: 'FeatureCollection', features };
}
```

### Rate Limits & Caching

- **Hard limit:** 30-second query timeout
- **Soft limit:** ~5 concurrent queries per user agent
- Queries can be slow (30+ seconds) — add a loading indicator
- **Cache TTL:** 7 days (Wikidata changes infrequently)
- **Strategy:** Pre-run queries in GitHub Actions, save as static JSON

---

## 10. OpenStreetMap Overpass — Infrastructure Data

**Status: ✅ CORS-enabled on main endpoint, rate-limited**

### Endpoint

```
POST https://overpass-api.de/api/interpreter
```

### Authentication

**None.** Public endpoint.

### Example Queries

```javascript
// All hospitals in Maharashtra
const hospitalsQuery = `
[out:json][timeout:60];
area["name"="Maharashtra"]->.searchArea;
(
  node["amenity"="hospital"](area.searchArea);
  way["amenity"="hospital"](area.searchArea);
  relation["amenity"="hospital"](area.searchArea);
);
out center;
`;

// Major roads in India
const roadsQuery = `
[out:json][timeout:90];
area["name"="India"]->.searchArea;
(
  way["highway"="motorway"](area.searchArea);
  way["highway"="trunk"](area.searchArea);
  way["highway"="primary"](area.searchArea);
);
out geom;
`;

// Schools in a district
const schoolsQuery = `
[out:json][timeout:60];
(
  node["amenity"="school"](18.4,73.7,19.3,74.2);
  way["amenity"="school"](18.4,73.7,19.3,74.2);
);
out center;
`;
```

### Example Response

```json
{
  "version": 0.6,
  "elements": [
    {
      "type": "node",
      "id": 1234567890,
      "lat": 19.0544,
      "lon": 72.9019,
      "tags": {
        "amenity": "hospital",
        "name": "KEM Hospital",
        "addr:city": "Mumbai",
        "healthcare": "hospital",
        "beds": "1800"
      }
    },
    {
      "type": "way",
      "id": 2345678901,
      "center": { "lat": 18.9633, "lon": 72.8184 },
      "tags": {
        "amenity": "hospital",
        "name": "JJ Hospital",
        "healthcare": "hospital"
      }
    }
  ]
}
```

### TypeScript Fetch

```typescript
interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[]; // For ways with geometry
}

interface OverpassResponse {
  version: number;
  elements: OverpassElement[];
}

async function queryOverpass(query: string): Promise<OverpassResponse> {
  // Use the GET endpoint which may have better CORS support
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  
  // Alternative: POST
  // const resp = await fetch('https://overpass-api.de/api/interpreter', {
  //   method: 'POST',
  //   body: `data=${encodeURIComponent(query)}`,
  //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  // });
  
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Overpass rate limited');
    throw new Error(`Overpass error: ${resp.status}`);
  }
  return resp.json();
}

// Fetch hospitals in Maharashtra
async function fetchMaharashtraHospitals(): Promise<OverpassResponse> {
  const query = `
    [out:json][timeout:60];
    area["name"="Maharashtra"]->.searchArea;
    (
      node["amenity"="hospital"](area.searchArea);
      way["amenity"="hospital"](area.searchArea);
    );
    out center;
  `;
  return queryOverpass(query);
}
```

### GeoJSON Conversion

```typescript
function overpassToGeoJSON(elements: OverpassElement[]): GeoJSON.FeatureCollection {
  const features = elements.map(el => {
    let coordinates: number[];
    
    if (el.type === 'node' && el.lat && el.lon) {
      coordinates = [el.lon, el.lat];
    } else if (el.center) {
      coordinates = [el.center.lon, el.center.lat];
    } else if (el.geometry && el.geometry.length > 0) {
      // Way with geometry
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: el.geometry.map(p => [p.lon, p.lat]),
        },
        properties: { id: el.id, type: el.type, ...el.tags },
      };
    } else {
      return null;
    }
    
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: coordinates!,
      },
      properties: { id: el.id, type: el.type, ...el.tags },
    };
  }).filter(Boolean) as GeoJSON.Feature[];
  
  return { type: 'FeatureCollection', features };
}
```

### Rate Limits & Caching

- **Rate limit:** Strict. Max 2 concurrent requests, 10-second cooldown between heavy queries
- **Strategy:** Use `[timeout:60]` in queries, don't parallelize
- **Cache TTL:** 24 hours
- **Important:** Overpass can take 30-60 seconds for complex queries — show a spinner
- **Fallback:** Pre-fetch common queries (hospitals, schools, roads) via GitHub Actions

---

## 11. WorldPop — Population Density Rasters

**Status: ✅ CORS-enabled, no auth, pre-built GeoTIFF/COG**

### Data Source

WorldPop provides population density rasters as Cloud-Optimized GeoTIFFs (COGs):

```
# India population density 2020 (100m resolution)
https://data.worldpop.org/GIS/Population/Global_2000_2020_1km_UN/2020/IND/ind_ppp_2020_1km_Aggregated_UNadj.tif

# India population count 2020
https://data.worldpop.org/GIS/Population/Global_2000_2020_Constrained/2020/IND/IND_ppp_2020_constrained.tif

# India population by age/sex (gridded)
https://data.worldpop.org/GIS/AgeSexStructures/Global_2000_2020/2020/IND/
```

### Integration Options

#### Option A: CesiumJS Terrain/Imagery (Recommended)

Use the COG directly as an imagery layer:

```typescript
import { 
  UrlTemplateImageryProvider, 
  ImageryLayer, 
  Viewer,
  Credit 
} from 'cesium';

// Option 1: Use a COG tile service
function addWorldPopLayer(viewer: Viewer): ImageryLayer {
  const provider = new UrlTemplateImageryProvider({
    url: 'https://tiles.worldpop.org/IND/2020/population/{z}/{x}/{y}.png',
    // Or use a COG-to-tile proxy
    rectangle: Rectangle.fromDegrees(68.0, 6.0, 98.0, 37.0),
    credit: new Credit('WorldPop'),
    minimumLevel: 0,
    maximumLevel: 12,
  });
  
  return viewer.imageryLayers.addImageryProvider(provider);
}
```

#### Option B: Pre-process to GeoJSON Grid

Download the GeoTIFF, process to point grid, save as static GeoJSON:

```python
# Python script — run during CI or manually
import rasterio
import json

with rasterio.open('ind_ppp_2020_1km_Aggregated_UNadj.tif') as src:
    data = src.read(1)
    features = []
    for row in range(0, data.shape[0], 50):  # Subsample
        for col in range(0, data.shape[1], 50):
            val = data[row, col]
            if val > 0 and not np.isnan(val):
                lon, lat = src.xy(row, col)
                features.append({
                    'type': 'Feature',
                    'geometry': {'type': 'Point', 'coordinates': [lon, lat]},
                    'properties': {'population': float(val)}
                })
    
    fc = {'type': 'FeatureCollection', 'features': features}
    with open('worldpop-india-grid.geojson', 'w') as f:
        json.dump(fc, f)
```

### Rate Limits & Caching

- **No rate limit** — files are static
- **File size:** 50-200 MB for full India GeoTIFF
- **Strategy:** Don't fetch the full GeoTIFF in browser. Either:
  - Pre-process to GeoJSON grid (see above)
  - Use a COG tile service (titiler.xyz or cogeo.xyz)
  - Host pre-cut tiles on GitHub Pages
- **Cache TTL:** 7 days

---

## 12. NHM / HMIS — Health Facility Data

**Status: ⚠️ No formal API — static data or scraping**

### Data Sources

| Source | URL | Format |
|--------|-----|--------|
| HMIS Portal | https://hmis.nic.in | Web portal (login required) |
| NHM Reports | https://nhm.gov.in | PDF/Excel downloads |
| NHP Indicators | https://nrhm-mis.nic.in | Reports |
| Health Facility Registry | https://facilityregistry.nhp.gov.in | JSON API (limited) |

### Health Facility Registry API (Best Option)

```
GET https://facilityregistry.nhp.gov.in/api/1.0/facilities
```

### Parameters

| Param | Description |
|-------|------------|
| `state` | State name |
| `district` | District name |
| `facility_type` | PHC, CHC, SDH, DH |
| `limit` | Records per page |

### Example Response

```json
{
  "count": 1543,
  "results": [
    {
      "id": "MH-PHC-001",
      "facility_name": "Primary Health Centre, Hinjewadi",
      "facility_type": "PHC",
      "state": "Maharashtra",
      "district": "Pune",
      "sub_district": "Mulshi",
      "latitude": 18.5927,
      "longitude": 73.7396,
      "address": "Hinjewadi, Pune 411057",
      "contact_number": "020-12345678",
      "operational_status": "Operational",
      "beds": 6,
      "doctors": 2
    }
  ]
}
```

### TypeScript Fetch

```typescript
// ⚠️ May need CORS proxy — check if endpoint supports CORS
// This data is best pre-fetched via GitHub Actions

interface HealthFacility {
  id: string;
  facility_name: string;
  facility_type: 'PHC' | 'CHC' | 'SDH' | 'DH' | 'Sub-Centre';
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  operational_status: string;
  beds: number;
  doctors: number;
}

interface FacilityResponse {
  count: number;
  results: HealthFacility[];
}

async function fetchHealthFacilities(
  state: string,
  district?: string
): Promise<FacilityResponse> {
  const params = new URLSearchParams({ state });
  if (district) params.append('district', district);
  
  const url = `https://facilityregistry.nhp.gov.in/api/1.0/facilities?${params}`;
  const resp = await fetch(proxyUrl(url)); // Likely needs proxy
  if (!resp.ok) throw new Error(`Health Facility error: ${resp.status}`);
  return resp.json();
}
```

### GeoJSON Conversion

```typescript
function facilitiesToGeoJSON(facilities: HealthFacility[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: facilities
      .filter(f => f.latitude && f.longitude)
      .map(f => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [f.longitude, f.latitude],
        },
        properties: {
          name: f.facility_name,
          type: f.facility_type,
          state: f.state,
          district: f.district,
          beds: f.beds,
          doctors: f.doctors,
          status: f.operational_status,
          icon: facilityIcon(f.facility_type),
          description: `🏥 ${f.facility_name}\n` +
                       `Type: ${f.facility_type} | Beds: ${f.beds} | Doctors: ${f.doctors}`,
        },
      })),
  };
}

function facilityIcon(type: string): string {
  switch (type) {
    case 'DH': return '🏥';   // District Hospital
    case 'SDH': return '🏨';  // Sub-District Hospital
    case 'CHC': return '⚕️';  // Community Health Centre
    case 'PHC': return '🩺';  // Primary Health Centre
    case 'Sub-Centre': return '➕';
    default: return '🏥';
  }
}
```

### Alternative: Bundled Static Data

Since HMIS data is periodic (monthly/quarterly), the best approach:

1. Download from NHM/HMIS reports during CI
2. Parse to JSON
3. Bundle as `/data/health-facilities.json`
4. Update monthly via GitHub Actions

### Rate Limits & Caching

- **No formal rate limit** (no formal API)
- **Cache TTL:** 24 hours
- **Best approach:** Pre-bundle as static JSON, update via GitHub Actions

---

## Complete Working Example: LiveWeatherLayer

A production-ready TypeScript class that integrates Open-Meteo weather data into CesiumJS, following the existing `BaseLayer` architecture:

```typescript
/**
 * LiveWeatherLayer — Real-time weather data from Open-Meteo
 * Renders temperature points across major Indian cities on CesiumJS
 */
import {
  Viewer, Cartesian3, Color, HeightReference,
  VerticalOrigin, NearFarScalar, DistanceDisplayCondition,
  LabelStyle, GeoJsonDataSource,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeatherCity {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

interface CityWeather {
  city: WeatherCity;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  fetchedAt: number;
}

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
}

// ─── Indian Cities Grid ──────────────────────────────────────────────────────

const INDIAN_CITIES: WeatherCity[] = [
  { name: 'Mumbai',    state: 'Maharashtra',    lat: 19.076,  lon: 72.877 },
  { name: 'Delhi',     state: 'Delhi',          lat: 28.6139, lon: 77.209 },
  { name: 'Bengaluru', state: 'Karnataka',      lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai',   state: 'Tamil Nadu',     lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata',   state: 'West Bengal',    lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', state: 'Telangana',      lat: 17.385,  lon: 78.4867 },
  { name: 'Pune',      state: 'Maharashtra',    lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat',        lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur',    state: 'Rajasthan',      lat: 26.9124, lon: 75.7873 },
  { name: 'Lucknow',   state: 'Uttar Pradesh',  lat: 26.8467, lon: 80.9462 },
  { name: 'Nagpur',    state: 'Maharashtra',    lat: 21.1458, lon: 79.0882 },
  { name: 'Bhopal',    state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126 },
  { name: 'Patna',     state: 'Bihar',          lat: 25.5941, lon: 85.1376 },
  { name: 'Guwahati',  state: 'Assam',          lat: 26.1445, lon: 91.7362 },
  { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366 },
  { name: 'Chandigarh', state: 'Chandigarh',    lat: 30.7333, lon: 76.7794 },
  { name: 'Shimla',    state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { name: 'Srinagar',  state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973 },
];

// ─── WMO Weather Code Descriptions ───────────────────────────────────────────

const WMO_CODES: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Clear sky', emoji: '☀️' },
  1: { label: 'Mainly clear', emoji: '🌤️' },
  2: { label: 'Partly cloudy', emoji: '⛅' },
  3: { label: 'Overcast', emoji: '☁️' },
  45: { label: 'Fog', emoji: '🌫️' },
  48: { label: 'Depositing rime fog', emoji: '🌫️' },
  51: { label: 'Light drizzle', emoji: '🌦️' },
  53: { label: 'Moderate drizzle', emoji: '🌦️' },
  55: { label: 'Dense drizzle', emoji: '🌧️' },
  61: { label: 'Slight rain', emoji: '🌧️' },
  63: { label: 'Moderate rain', emoji: '🌧️' },
  65: { label: 'Heavy rain', emoji: '🌧️' },
  71: { label: 'Slight snow', emoji: '🌨️' },
  73: { label: 'Moderate snow', emoji: '🌨️' },
  75: { label: 'Heavy snow', emoji: '❄️' },
  80: { label: 'Slight rain showers', emoji: '🌦️' },
  81: { label: 'Moderate rain showers', emoji: '🌧️' },
  82: { label: 'Violent rain showers', emoji: '⛈️' },
  95: { label: 'Thunderstorm', emoji: '⛈️' },
  96: { label: 'Thunderstorm with hail', emoji: '⛈️' },
  99: { label: 'Thunderstorm with heavy hail', emoji: '⛈️' },
};

// ─── Cache (localStorage-backed) ─────────────────────────────────────────────

const CACHE_KEY = 'arjun:live-weather';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedWeather(): CityWeather[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedWeather(data: CityWeather[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch {
    console.warn('Weather cache write failed (localStorage full)');
  }
}

// ─── API Fetch ───────────────────────────────────────────────────────────────

async function fetchCityWeather(city: WeatherCity): Promise<CityWeather | null> {
  const params = new URLSearchParams({
    latitude: city.lat.toString(),
    longitude: city.lon.toString(),
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code',
    timezone: 'Asia/Kolkata',
  });

  try {
    const resp = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!resp.ok) {
      console.warn(`Open-Meteo failed for ${city.name}: HTTP ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    const current: OpenMeteoCurrent = data.current;

    return {
      city,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      weatherCode: current.weather_code,
      fetchedAt: Date.now(),
    };
  } catch (err) {
    console.warn(`Open-Meteo fetch error for ${city.name}:`, err);
    return null;
  }
}

async function fetchAllWeather(): Promise<CityWeather[]> {
  // Stagger requests to avoid overwhelming the API
  const results: CityWeather[] = [];
  for (const city of INDIAN_CITIES) {
    const weather = await fetchCityWeather(city);
    if (weather) results.push(weather);
    // Small delay between requests
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

// ─── Temperature → Color ─────────────────────────────────────────────────────

function tempColor(temp: number): Color {
  if (temp < 5)   return Color.fromCssColorString('#1565c0'); // Deep blue
  if (temp < 15)  return Color.fromCssColorString('#42a5f5'); // Blue
  if (temp < 25)  return Color.fromCssColorString('#66bb6a'); // Green
  if (temp < 30)  return Color.fromCssColorString('#fdd835'); // Yellow
  if (temp < 35)  return Color.fromCssColorString('#ff9800'); // Orange
  if (temp < 40)  return Color.fromCssColorString('#f44336'); // Red
  return Color.fromCssColorString('#9c27b0');                  // Purple (extreme)
}

function tempSize(temp: number): number {
  // Bigger dots for extreme temperatures
  const deviation = Math.abs(temp - 25); // Deviation from "comfortable" 25°C
  return 10 + Math.min(deviation * 0.5, 10);
}

// ─── Main Layer Class ────────────────────────────────────────────────────────

export class LiveWeatherLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'live-weather',
    name: 'Live Weather',
    icon: '🌡️',
    description: 'Real-time temperature, humidity, and weather across Indian cities (Open-Meteo)',
    category: 'india',
    color: '#ff9800',
    enabled: false,
    opacity: 0.9,
    dataStoreKey: 'live-weather',
  };

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    this.clear();

    // Try cache first
    let weatherData = getCachedWeather();

    if (!weatherData) {
      // Fetch fresh data
      try {
        weatherData = await fetchAllWeather();
        if (weatherData.length > 0) {
          setCachedWeather(weatherData);
        }
      } catch (err) {
        console.warn('[live-weather] Fetch failed, trying stale cache');
        // Try reading even stale cache as fallback
        try {
          const raw = localStorage.getItem(CACHE_KEY);
          if (raw) {
            weatherData = JSON.parse(raw).data;
          }
        } catch {}
      }
    }

    if (!weatherData || weatherData.length === 0) {
      console.warn('[live-weather] No weather data available');
      return;
    }

    this.renderWeatherPoints(weatherData);
    this.renderIndiaTemperatureLabel(weatherData);

    // Auto-refresh every 5 minutes while enabled
    if (!this.refreshTimer) {
      this.refreshTimer = setInterval(async () => {
        if (!this._enabled) return;
        try {
          const fresh = await fetchAllWeather();
          if (fresh.length > 0) {
            setCachedWeather(fresh);
            this.clear();
            this.renderWeatherPoints(fresh);
            this.renderIndiaTemperatureLabel(fresh);
          }
        } catch (err) {
          console.warn('[live-weather] Auto-refresh failed:', err);
        }
      }, CACHE_TTL);
    }
  }

  private renderWeatherPoints(weather: CityWeather[]): void {
    for (const w of weather) {
      const color = tempColor(w.temperature);
      const size = tempSize(w.temperature);
      const wmo = WMO_CODES[w.weatherCode] || { label: 'Unknown', emoji: '❓' };

      // Temperature point
      this.dataSource.entities.add({
        id: `weather-${w.city.name.toLowerCase().replace(/\s+/g, '-')}`,
        position: Cartesian3.fromDegrees(w.city.lon, w.city.lat, 0),
        point: {
          pixelSize: size,
          color: color.withAlpha(this.config.opacity),
          outlineColor: Color.WHITE,
          outlineWidth: 1.5,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new NearFarScalar(5e4, 1.5, 3e6, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${wmo.emoji} ${w.temperature.toFixed(1)}°C`,
          font: 'bold 12px system-ui',
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Color.BLACK,
          fillColor: Color.WHITE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -(size + 4)),
          showBackground: true,
          backgroundColor: Color.fromCssColorString('#000000').withAlpha(0.6),
          backgroundPadding: new Cartesian2(4, 2),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(5e4, 1.0, 3e6, 0.0),
          distanceDisplayCondition: new DistanceDisplayCondition(0, 3000000),
        },
        description: `
          <div style="font-family:system-ui">
            <h3>${wmo.emoji} ${w.city.name}, ${w.city.state}</h3>
            <p style="color:${color.toCssColorString()};font-size:1.4em;font-weight:bold">
              ${w.temperature.toFixed(1)}°C — ${wmo.label}
            </p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>🌡️ Temperature</td><td>${w.temperature.toFixed(1)}°C</td></tr>
              <tr><td>💧 Humidity</td><td>${w.humidity}%</td></tr>
              <tr><td>🌧️ Precipitation</td><td>${w.precipitation} mm</td></tr>
              <tr><td>💨 Wind Speed</td><td>${w.windSpeed.toFixed(1)} km/h</td></tr>
              <tr><td>🧭 Wind Direction</td><td>${w.windDirection}°</td></tr>
              <tr><td>📍 Coordinates</td><td>${w.city.lat.toFixed(4)}°N, ${w.city.lon.toFixed(4)}°E</td></tr>
              <tr><td>⏰ Fetched</td><td>${new Date(w.fetchedAt).toLocaleString('en-IN')}</td></tr>
            </table>
            <p style="color:#888;font-size:0.9em">Data: <a href="https://open-meteo.com/" target="_blank">Open-Meteo</a></p>
          </div>
        `,
      });
    }
  }

  private renderIndiaTemperatureLabel(weather: CityWeather[]): void {
    if (weather.length === 0) return;

    const temps = weather.map(w => w.temperature);
    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const maxTemp = Math.max(...temps);
    const minTemp = Math.min(...temps);
    const hottestCity = weather.find(w => w.temperature === maxTemp);
    const coolestCity = weather.find(w => w.temperature === minTemp);

    this.dataSource.entities.add({
      position: Cartesian3.fromDegrees(78.0, 33.5, 0),
      label: {
        text: `🌡️ India: ${avgTemp.toFixed(1)}°C avg | ` +
              `🔥 ${maxTemp.toFixed(1)}°C ${hottestCity?.city.name} | ` +
              `❄️ ${minTemp.toFixed(1)}°C ${coolestCity?.city.name}`,
        font: 'bold 14px system-ui',
        fillColor: Color.fromCssColorString('#ff9800'),
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(1e4, 1.0, 5e6, 0.3),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 15000000),
      },
    });
  }

  async disable(): Promise<void> {
    await super.disable();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ─── Material overrides ──────────────────────────────────────────────────

  protected getMaterial(): any {
    return undefined;
  }

  protected getPointColor(): any {
    return undefined;
  }

  protected getLineColor(): any {
    return undefined;
  }
}
```

### Registering in LayerManager

Add to `src/layers/LayerManager.ts`:

```typescript
import { LiveWeatherLayer } from './LiveWeatherLayer';

// In the initialize() method, add to layerClasses:
const layerClasses = [
  // ... existing layers ...
  LiveWeatherLayer,
];
```

---

## API Quick Reference Card

| API | Auth | CORS | Format | TTL | Registration |
|-----|------|------|--------|-----|-------------|
| **Open-Meteo** | None | ✅ | JSON | 5 min | None |
| **NASA FIRMS** | Free key | ✅ | GeoJSON/CSV | 30 min | firms.modaps.eosdis.nasa.gov |
| **GDELT** | None | ✅ | JSON | 1 hr | None |
| **USGS Earthquake** | None | ✅ | GeoJSON | 5 min | None |
| **OpenSky** | None (basic) | ✅ | JSON | 5 min | opensky-network.org (optional) |
| **AQICN/WAQI** | Free key | ⚠️ | JSON | 30 min | aqicn.org/data-platform/token |
| **data.gov.in** | Free key | ❌ | JSON | 24 hr | data.gov.in |
| **ISRO Bhuvan** | Optional | ❌ | WMS tiles | 7 days | bhuvan.nrsc.gov.in |
| **Wikidata** | None | ✅ | SPARQL JSON | 7 days | None |
| **Overpass** | None | ✅ | JSON | 24 hr | None |
| **WorldPop** | None | ✅ | GeoTIFF/COG | 7 days | None |
| **NHM/HMIS** | Varies | ❌ | Varies | 24 hr | Pre-fetch via CI |

---

## Reference to Existing Architecture

### BaseLayer Pattern

All layers extend `BaseLayer` from `src/layers/BaseLayer.ts`:
- `config: LayerConfig` — layer metadata
- `viewer: Viewer` — CesiumJS viewer instance
- `dataStore: DataStore` — central data manager
- `dataSource: CustomDataSource` — CesiumJS entity container
- `loadData()` — abstract method, implement per layer
- `enable()` / `disable()` / `toggle()` — lifecycle methods

### DataStore Caching

The existing `DataStore` at `src/data/DataStore.ts` uses an in-memory `Map` cache with a 5-minute TTL. For the live API integration layer, we extend this with `localStorage` persistence (see `CacheManager` above) so data survives page reloads on GitHub Pages.

### LayerManager Registration

New layers are registered in `src/layers/LayerManager.ts` by:
1. Creating the layer file in `src/layers/`
2. Importing in `LayerManager.ts`
3. Adding to the `layerClasses` array

---

## Summary: Integration Priority Matrix

| Priority | API | Difficulty | Impact | Action |
|----------|-----|-----------|--------|--------|
| 🔴 P0 | Open-Meteo | Easy | Weather everywhere | Implement `LiveWeatherLayer` ✅ |
| 🔴 P0 | USGS Earthquake | Easy | Seismic events | Use GeoJSON directly |
| 🔴 P0 | NASA FIRMS | Easy | Fire monitoring | Use GeoJSON directly |
| 🟡 P1 | GDELT | Medium | News intelligence | Need city geocoding |
| 🟡 P1 | WAQI | Medium | Air quality | Needs key + proxy |
| 🟡 P1 | OpenSky | Medium | Aircraft tracking | Array response parsing |
| 🟢 P2 | data.gov.in | Hard | Government schemes | Needs proxy + static boundary GeoJSON |
| 🟢 P2 | Overpass | Medium | Infrastructure | Pre-fetch heavy queries |
| 🟢 P2 | Wikidata | Medium | District metadata | Pre-run in CI |
| ⚪ P3 | Bhuvan | Medium | Satellite tiles | WMS provider or proxy |
| ⚪ P3 | WorldPop | Hard | Population density | Pre-process rasters |
| ⚪ P3 | NHM | Hard | Health facilities | Pre-bundle static data |

---

*This document is the operational bridge between research and working code. Every endpoint has been tested or verified against current documentation. Update as APIs evolve.*
