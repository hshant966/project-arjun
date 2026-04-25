/**
 * config.ts — API configuration and endpoints for God's Eye data sources
 */

export const CONFIG = {
  // GDELT Project API
  gdelt: {
    baseUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',
    defaultParams: {
      mode: 'artlist',
      maxrecords: 50,
      format: 'json',
    },
    queries: {
      india: 'india',
      maharashtra: 'maharashtra',
      mumbai: 'mumbai',
      drought: 'india drought',
      flood: 'india flood',
      pollution: 'india pollution',
      protests: 'india protest OR farmer protest',
      health: 'india health crisis OR outbreak',
      infrastructure: 'india infrastructure failure',
    },
    refreshIntervalMs: 15 * 60 * 1000, // 15 minutes
  },

  // India Water Portal
  waterPortal: {
    baseUrl: 'https://www.indiawaterportal.org/api',
    endpoints: {
      waterQuality: '/water-quality',
      groundwater: '/groundwater-levels',
      rainfall: '/rainfall-data',
      riverHealth: '/river-health',
    },
    apiKey: 'WATER_PORTAL_API_KEY_PLACEHOLDER',
    refreshIntervalMs: 60 * 60 * 1000, // 1 hour
  },

  // Data.gov.in
  dataGovIn: {
    baseUrl: 'https://api.data.gov.in',
    resourceId: 'YOUR_RESOURCE_ID',
    apiKey: 'DATA_GOV_IN_API_KEY_PLACEHOLDER',
    endpoints: {
      // Resource catalog endpoints
      catalog: '/catalog',
      resource: '/resource',
      // Known useful datasets (resource IDs are placeholders — register at data.gov.in to get real ones)
      datasets: {
        waterQuality: 'RESOURCE_ID_WATER_QUALITY',
        airQuality: 'RESOURCE_ID_AIR_QUALITY',
        healthFacilities: 'RESOURCE_ID_HEALTH_FACILITIES',
        governmentSchemes: 'RESOURCE_ID_GOVT_SCHEMES',
        agriculture: 'RESOURCE_ID_AGRICULTURE',
        rainfall: 'RESOURCE_ID_RAINFALL',
        censusPopulation: 'RESOURCE_ID_CENSUS_POP',
      },
    },
    refreshIntervalMs: 30 * 60 * 1000, // 30 minutes
  },

  // Open-Meteo (free weather API, no key needed)
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com/v1',
    endpoints: {
      forecast: '/forecast',
    },
    // Maharashtra major cities
    cities: {
      mumbai: { lat: 19.076, lng: 72.877 },
      pune: { lat: 18.520, lng: 73.856 },
      nagpur: { lat: 21.146, lng: 79.088 },
      nashik: { lat: 19.997, lng: 73.789 },
      aurangabad: { lat: 19.876, lng: 75.343 },
      solapur: { lat: 17.660, lng: 75.898 },
      kolhapur: { lat: 16.705, lng: 74.243 },
      amravati: { lat: 20.933, lng: 77.751 },
    },
    refreshIntervalMs: 30 * 60 * 1000,
  },

  // Real-time / WebSocket endpoints
  realtime: {
    // SSE endpoints for live news feed (placeholder — replace with actual)
    sse: {
      newsFeed: 'SSE_ENDPOINT_PLACEHOLDER/events/news',
      alertsFeed: 'SSE_ENDPOINT_PLACEHOLDER/events/alerts',
    },
    // WebSocket endpoints
    ws: {
      liveUpdates: 'WS_ENDPOINT_PLACEHOLDER/live',
    },
    reconnectIntervalMs: 5000,
    maxReconnectAttempts: 10,
  },

  // API Manager defaults
  apiManager: {
    retryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
    rateLimitPerMinute: 30,
    requestTimeoutMs: 15000,
  },

  // Verification pipeline
  verification: {
    minSourcesForVerified: 2,
    // Weights for source credibility (0-1)
    sourceCredibility: {
      'PTI': 0.9,
      'ANI': 0.85,
      'NDTV': 0.85,
      'Times of India': 0.8,
      'Indian Express': 0.85,
      'The Hindu': 0.9,
      'Hindustan Times': 0.8,
      'Economic Times': 0.8,
      'Maharashtra Govt': 0.95,
      'CPCB': 0.95,
      'IMD': 0.95,
      'GDELT': 0.6,
      'DataGov': 0.7,
      'WaterPortal': 0.75,
      'Crowd-sourced': 0.3,
      'Social Media': 0.2,
    } as Record<string, number>,
    // Severity thresholds
    severityThresholds: {
      critical: 0.9,
      high: 0.7,
      medium: 0.5,
      low: 0.0,
    },
  },
} as const;
