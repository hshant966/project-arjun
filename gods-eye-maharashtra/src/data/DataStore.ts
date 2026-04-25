/**
 * DataStore — Central data management for all layers
 * Handles fetching, caching, and providing data to layers
 */
export interface DataSet {
  id: string;
  name: string;
  type: 'geojson' | 'csv' | 'json' | 'czml';
  source: string;
  data: any;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

export class DataStore {
  private datasets: Map<string, DataSet> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults() {
    // Maharashtra Districts
    this.register({
      id: 'maharashtra-districts',
      name: 'Maharashtra Districts',
      type: 'geojson',
      source: '/data/maharashtra-districts.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Maharashtra Talukas
    this.register({
      id: 'maharashtra-talukas',
      name: 'Maharashtra Talukas',
      type: 'geojson',
      source: '/data/maharashtra-talukas.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Government Schemes Data
    this.register({
      id: 'govt-schemes',
      name: 'Government Schemes',
      type: 'json',
      source: '/data/govt-schemes.json',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Water Quality Data
    this.register({
      id: 'water-quality',
      name: 'Water Quality Monitoring',
      type: 'geojson',
      source: '/data/water-quality.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Health Infrastructure
    this.register({
      id: 'health-infra',
      name: 'Health Infrastructure',
      type: 'geojson',
      source: '/data/health-infrastructure.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Air Quality
    this.register({
      id: 'air-quality',
      name: 'Air Quality Index',
      type: 'geojson',
      source: '/data/air-quality.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Agricultural Data
    this.register({
      id: 'agriculture',
      name: 'Agricultural Data',
      type: 'geojson',
      source: '/data/agriculture.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Infrastructure Projects
    this.register({
      id: 'infrastructure',
      name: 'Infrastructure Projects',
      type: 'geojson',
      source: '/data/infrastructure.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Weather / Rainfall
    this.register({
      id: 'rainfall',
      name: 'Rainfall Data',
      type: 'geojson',
      source: '/data/rainfall.geojson',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // News Events (GDELT)
    this.register({
      id: 'news-events',
      name: 'News & Events',
      type: 'json',
      source: '/data/news-events.json',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // India States
    this.register({
      id: 'india-states',
      name: 'India States & UTs',
      type: 'json',
      source: '/data/india-states.json',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // National Govt Schemes
    this.register({
      id: 'govt-schemes-india',
      name: 'National Govt Schemes',
      type: 'json',
      source: '/data/govt-schemes-india.json',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // News Verification
    this.register({
      id: 'news-verification',
      name: 'Verified News & Events',
      type: 'json',
      source: '/data/news-verification.json',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });

    // Government Failures
    this.register({
      id: 'failures',
      name: 'Government Failures',
      type: 'json',
      source: '/data/failures.json',
      data: null,
      lastUpdated: null,
      loading: false,
      error: null,
    });
  }

  register(dataset: DataSet) {
    this.datasets.set(dataset.id, dataset);
  }

  get(id: string): DataSet | undefined {
    return this.datasets.get(id);
  }

  getAll(): DataSet[] {
    return Array.from(this.datasets.values());
  }

  async load(id: string): Promise<any> {
    const dataset = this.datasets.get(id);
    if (!dataset) throw new Error(`Dataset not found: ${id}`);

    // Check cache
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      dataset.data = cached.data;
      dataset.lastUpdated = new Date(cached.timestamp);
      return cached.data;
    }

    dataset.loading = true;
    dataset.error = null;

    try {
      const response = await fetch(dataset.source);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = dataset.type === 'csv'
        ? await response.text()
        : await response.json();

      dataset.data = data;
      dataset.lastUpdated = new Date();
      dataset.loading = false;

      this.cache.set(id, { data, timestamp: Date.now() });
      return data;
    } catch (err: any) {
      dataset.error = err.message;
      dataset.loading = false;
      throw err;
    }
  }

  async loadAll(): Promise<void> {
    const promises = Array.from(this.datasets.keys()).map(id =>
      this.load(id).catch(err => {
        console.warn(`Failed to load ${id}:`, err.message);
      })
    );
    await Promise.all(promises);
  }

  // Fetch from external API with caching
  async fetchAPI(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = `api:${url}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  }
}
