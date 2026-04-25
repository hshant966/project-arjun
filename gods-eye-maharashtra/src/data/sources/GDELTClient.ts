/**
 * GDELTClient — Fetches and parses GDELT events for India
 */
import { CONFIG } from '../config';
import { apiManager } from '../ApiManager';

export interface GDELTArticle {
  title: string;
  url: string;
  date: string;
  location: string;
  source: string;
  tone: number;
}

// Raw shape from GDELT artlist endpoint
interface GDELTRawArticle {
  title: string;
  url: string;
  seendate?: string;
  sourcegeonameid?: string;
  sourcecountry?: string;
  socialimage?: string;
  domain?: string;
  language?: string;
}

interface GDELTResponse {
  articles?: GDELTRawArticle[];
  status?: string;
}

export class GDELTClient {
  private baseUrl: string;
  private defaultParams: Record<string, string | number>;

  constructor() {
    this.baseUrl = CONFIG.gdelt.baseUrl;
    this.defaultParams = CONFIG.gdelt.defaultParams as unknown as Record<string, string | number>;
  }

  /**
   * Fetch recent India-related news articles from GDELT
   */
  async fetchIndiaNews(query?: string): Promise<GDELTArticle[]> {
    const searchQuery = query ?? CONFIG.gdelt.queries.india;
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(this.defaultParams)) {
      params.set(key, String(value));
    }
    params.set('query', searchQuery);

    const url = `${this.baseUrl}?${params.toString()}`;
    const cacheKey = `gdelt:${searchQuery}`;

    const raw = await apiManager.fetchCached<GDELTResponse>(url, {}, cacheKey, CONFIG.gdelt.refreshIntervalMs);
    return this.parseResponse(raw);
  }

  /**
   * Fetch Maharashtra-specific news
   */
  async fetchMaharashtraNews(): Promise<GDELTArticle[]> {
    return this.fetchIndiaNews(CONFIG.gdelt.queries.maharashtra);
  }

  /**
   * Fetch news by topic (drought, flood, pollution, etc.)
   */
  async fetchByTopic(topic: keyof typeof CONFIG.gdelt.queries): Promise<GDELTArticle[]> {
    const query = CONFIG.gdelt.queries[topic];
    return this.fetchIndiaNews(query);
  }

  // ── Parsing ────────────────────────────────────────────

  private parseResponse(response: GDELTResponse): GDELTArticle[] {
    if (!response.articles || !Array.isArray(response.articles)) {
      return [];
    }

    return response.articles.map(article => this.parseArticle(article));
  }

  private parseArticle(raw: GDELTRawArticle): GDELTArticle {
    return {
      title: raw.title?.trim() || 'Untitled',
      url: raw.url || '',
      date: this.parseDate(raw.seendate),
      location: this.extractLocation(raw),
      source: this.extractSource(raw),
      tone: 0, // GDELT artlist mode doesn't return tone; use full mode for tone data
    };
  }

  private parseDate(seenDate?: string): string {
    if (!seenDate) return new Date().toISOString();

    // GDELT dates are in YYYYMMDDHHMMSS format
    const raw = seenDate.toString();
    if (raw.length >= 8) {
      const year = raw.substring(0, 4);
      const month = raw.substring(4, 6);
      const day = raw.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  private extractLocation(raw: GDELTRawArticle): string {
    if (raw.sourcegeonameid) {
      return raw.sourcegeonameid;
    }
    if (raw.sourcecountry) {
      return raw.sourcecountry;
    }
    // Try to infer from title
    const titleLower = (raw.title || '').toLowerCase();
    const indianCities = ['mumbai', 'delhi', 'chennai', 'kolkata', 'bangalore', 'hyderabad',
      'pune', 'ahmedabad', 'jaipur', 'lucknow', 'nagpur', 'bhopal', 'patna'];
    for (const city of indianCities) {
      if (titleLower.includes(city)) {
        return city.charAt(0).toUpperCase() + city.slice(1) + ', India';
      }
    }
    return 'India';
  }

  private extractSource(raw: GDELTRawArticle): string {
    if (raw.domain) {
      return raw.domain.replace('www.', '');
    }
    return 'GDELT';
  }
}

export const gdeltClient = new GDELTClient();
