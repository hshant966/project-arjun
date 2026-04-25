/**
 * LiveDataSource — Real API Integration for Project Arjun
 * 
 * Connects to live APIs:
 * - Open-Meteo (Weather)
 * - GDELT (News Events)
 * - USGS Earthquake (Seismic)
 * - AQICN (Air Quality)
 * - data.gov.in (Government Schemes)
 */

export interface LiveConfig {
  corsProxy: string;
  cacheTTL: number;
  retryCount: number;
}

const DEFAULT_CONFIG: LiveConfig = {
  corsProxy: 'https://api.allorigins.win/raw?url=',
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  retryCount: 3,
};

// Cache store
const cache = new Map<string, { data: any; timestamp: number }>();

function getCached<T>(key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ═══════════════════════════════════════════════════════════════
// 1. Open-Meteo — Weather Data (CORS enabled)
// ═══════════════════════════════════════════════════════════════

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  location: string;
  lat: number;
  lon: number;
}

const MAHARASHTRA_CITIES = [
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { name: 'Nashik', lat: 19.9975, lon: 73.7898 },
  { name: 'Aurangabad', lat: 19.8762, lon: 75.3433 },
  { name: 'Solapur', lat: 17.6599, lon: 75.9064 },
  { name: 'Kolhapur', lat: 16.7050, lon: 74.2433 },
  { name: 'Thane', lat: 19.2183, lon: 72.9781 },
  { name: 'Nandurbar', lat: 21.3700, lon: 74.2400 },
  { name: 'Gadchiroli', lat: 20.1800, lon: 80.0000 },
];

export async function fetchMaharashtraWeather(): Promise<WeatherData[]> {
  const cacheKey = 'weather-maharashtra';
  const cached = getCached<WeatherData[]>(cacheKey, DEFAULT_CONFIG.cacheTTL);
  if (cached) return cached;

  const results: WeatherData[] = [];

  for (const city of MAHARASHTRA_CITIES) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code`;
      const response = await fetch(url);
      const data = await response.json();
      const current = data.current;

      results.push({
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        precipitation: current.precipitation,
        condition: getWeatherCondition(current.weather_code),
        location: city.name,
        lat: city.lat,
        lon: city.lon,
      });
    } catch (error) {
      console.error(`Failed to fetch weather for ${city.name}:`, error);
    }
  }

  setCache(cacheKey, results);
  return results;
}

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Depositing Rime Fog',
    51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
    61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
    80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Thunderstorm with Heavy Hail',
  };
  return conditions[code] || 'Unknown';
}

// ═══════════════════════════════════════════════════════════════
// 2. GDELT — News Events (CORS enabled)
// ═══════════════════════════════════════════════════════════════

export interface NewsEvent {
  title: string;
  url: string;
  source: string;
  date: string;
  tone: number;
  location: string;
  lat: number;
  lon: number;
  themes: string[];
}

export async function fetchMaharashtraNews(): Promise<NewsEvent[]> {
  const cacheKey = 'news-maharashtra';
  const cached = getCached<NewsEvent[]>(cacheKey, DEFAULT_CONFIG.cacheTTL);
  if (cached) return cached;

  try {
    // GDELT Doc API - search for Maharashtra news
    const query = 'Maharashtra India';
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=50&format=json`;
    const response = await fetch(url);
    const data = await response.json();

    const events: NewsEvent[] = (data.articles || []).map((article: any) => ({
      title: article.title,
      url: article.url,
      source: article.domain,
      date: article.seendate,
      tone: article.tone || 0,
      location: 'Maharashtra',
      lat: 19.7515,
      lon: 75.7139,
      themes: article.theme ? article.theme.split(';') : [],
    }));

    setCache(cacheKey, events);
    return events;
  } catch (error) {
    console.error('Failed to fetch GDELT news:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. USGS Earthquake — Seismic Data (CORS enabled)
// ═══════════════════════════════════════════════════════════════

export interface Earthquake {
  magnitude: number;
  location: string;
  lat: number;
  lon: number;
  depth: number;
  time: string;
  url: string;
}

export async function fetchMaharashtraEarthquakes(): Promise<Earthquake[]> {
  const cacheKey = 'earthquakes-maharashtra';
  const cached = getCached<Earthquake[]>(cacheKey, DEFAULT_CONFIG.cacheTTL);
  if (cached) return cached;

  try {
    // USGS Earthquake API - Maharashtra region (bounding box)
    const minLat = 15.0, maxLat = 22.0, minLon = 72.0, maxLon = 81.0;
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${getDateDaysAgo(30)}&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&minmagnitude=2.5`;
    const response = await fetch(url);
    const data = await response.json();

    const earthquakes: Earthquake[] = data.features.map((feature: any) => ({
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      lat: feature.geometry.coordinates[1],
      lon: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2],
      time: new Date(feature.properties.time).toISOString(),
      url: feature.properties.url,
    }));

    setCache(cacheKey, earthquakes);
    return earthquakes;
  } catch (error) {
    console.error('Failed to fetch earthquake data:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. AQICN — Air Quality (CORS enabled with token)
// ═══════════════════════════════════════════════════════════════

export interface AirQuality {
  aqi: number;
  city: string;
  lat: number;
  lon: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  level: string;
}

// Using free demo token - replace with real token for production
const AQICN_TOKEN = 'demo';

export async function fetchMaharashtraAirQuality(): Promise<AirQuality[]> {
  const cacheKey = 'airquality-maharashtra';
  const cached = getCached<AirQuality[]>(cacheKey, DEFAULT_CONFIG.cacheTTL);
  if (cached) return cached;

  const results: AirQuality[] = [];

  for (const city of MAHARASHTRA_CITIES.slice(0, 5)) { // Limit to 5 cities for demo
    try {
      const url = `https://api.waqi.info/feed/${city.name}/?token=${AQICN_TOKEN}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'ok') {
        const d = data.data;
        results.push({
          aqi: d.aqi,
          city: city.name,
          lat: city.lat,
          lon: city.lon,
          pm25: d.iaqi?.pm25?.v || 0,
          pm10: d.iaqi?.pm10?.v || 0,
          o3: d.iaqi?.o3?.v || 0,
          no2: d.iaqi?.no2?.v || 0,
          so2: d.iaqi?.so2?.v || 0,
          co: d.iaqi?.co?.v || 0,
          level: getAQILevel(d.aqi),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch AQI for ${city.name}:`, error);
    }
  }

  setCache(cacheKey, results);
  return results;
}

function getAQILevel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

// ═══════════════════════════════════════════════════════════════
// 5. NASA FIRMS — Fire Hotspots (CORS enabled)
// ═══════════════════════════════════════════════════════════════

export interface FireHotspot {
  lat: number;
  lon: number;
  brightness: number;
  confidence: number;
  frp: number; // Fire Radiative Power
  date: string;
}

export async function fetchMaharashtraFires(): Promise<FireHotspot[]> {
  const cacheKey = 'fires-maharashtra';
  const cached = getCached<FireHotspot[]>(cacheKey, DEFAULT_CONFIG.cacheTTL);
  if (cached) return cached;

  try {
    // NASA FIRMS API - Maharashtra bounding box
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/MODIS_NRT/India/1`;
    const response = await fetch(url);
    const text = await response.text();

    // Parse CSV and filter for Maharashtra
    const lines = text.split('\n');
    const fires: FireHotspot[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.length >= 13) {
        const lat = parseFloat(cols[0]);
        const lon = parseFloat(cols[1]);

        // Check if within Maharashtra bounds
        if (lat >= 15.0 && lat <= 22.0 && lon >= 72.0 && lon <= 81.0) {
          fires.push({
            lat,
            lon,
            brightness: parseFloat(cols[2]),
            confidence: parseInt(cols[8]),
            frp: parseFloat(cols[12]),
            date: cols[5],
          });
        }
      }
    }

    setCache(cacheKey, fires);
    return fires;
  } catch (error) {
    console.error('Failed to fetch fire data:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════
// Data Aggregator — Fetch All Live Data
// ═══════════════════════════════════════════════════════════════

export interface LiveData {
  weather: WeatherData[];
  news: NewsEvent[];
  earthquakes: Earthquake[];
  airQuality: AirQuality[];
  fires: FireHotspot[];
  lastUpdated: string;
}

export async function fetchAllLiveData(): Promise<LiveData> {
  const [weather, news, earthquakes, airQuality, fires] = await Promise.all([
    fetchMaharashtraWeather(),
    fetchMaharashtraNews(),
    fetchMaharashtraEarthquakes(),
    fetchMaharashtraAirQuality(),
    fetchMaharashtraFires(),
  ]);

  return {
    weather,
    news,
    earthquakes,
    airQuality,
    fires,
    lastUpdated: new Date().toISOString(),
  };
}
