/**
 * ApiManager — Centralized API client with retry, caching, and rate limiting
 */
import { CONFIG } from './config';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RateLimitState {
  timestamps: number[];
}

export class ApiManager {
  private static instance: ApiManager;
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, RateLimitState>();
  private defaultRetries: number;
  private defaultRetryDelay: number;
  private retryBackoffMultiplier: number;
  private cacheTimeoutMs: number;
  private rateLimitPerMinute: number;
  private requestTimeoutMs: number;

  private constructor() {
    const cfg = CONFIG.apiManager;
    this.defaultRetries = cfg.retryAttempts;
    this.defaultRetryDelay = cfg.retryDelayMs;
    this.retryBackoffMultiplier = cfg.retryBackoffMultiplier;
    this.cacheTimeoutMs = cfg.cacheTimeoutMs;
    this.rateLimitPerMinute = cfg.rateLimitPerMinute;
    this.requestTimeoutMs = cfg.requestTimeoutMs;
  }

  static getInstance(): ApiManager {
    if (!ApiManager.instance) {
      ApiManager.instance = new ApiManager();
    }
    return ApiManager.instance;
  }

  // ── Cache ──────────────────────────────────────────────

  getCache<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  setCache<T = any>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs ?? this.cacheTimeoutMs,
    });
  }

  invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  clearCache(): void {
    this.cache.clear();
  }

  // ── Rate Limiting ──────────────────────────────────────

  private checkRateLimit(domain: string): boolean {
    const now = Date.now();
    const windowMs = 60_000; // 1 minute
    let state = this.rateLimits.get(domain);
    if (!state) {
      state = { timestamps: [] };
      this.rateLimits.set(domain, state);
    }

    // Prune timestamps older than the window
    state.timestamps = state.timestamps.filter(t => now - t < windowMs);

    if (state.timestamps.length >= this.rateLimitPerMinute) {
      return false;
    }

    state.timestamps.push(now);
    return true;
  }

  private getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  // ── Fetch with Retry ──────────────────────────────────

  async fetchWithRetry<T = any>(
    url: string,
    options: RequestInit = {},
    retries?: number,
  ): Promise<T> {
    const maxRetries = retries ?? this.defaultRetries;
    const domain = this.getDomain(url);

    if (!this.checkRateLimit(domain)) {
      throw new Error(`Rate limit exceeded for ${domain}. Max ${this.rateLimitPerMinute} requests/minute.`);
    }

    let lastError: Error | null = null;
    let delay = this.defaultRetryDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as T;
        return data;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          await this.sleep(delay);
          delay *= this.retryBackoffMultiplier;
        }
      }
    }

    throw lastError ?? new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
  }

  // ── Fetch with Cache ──────────────────────────────────

  async fetchCached<T = any>(
    url: string,
    options: RequestInit = {},
    cacheKey?: string,
    ttlMs?: number,
  ): Promise<T> {
    const key = cacheKey ?? url;
    const cached = this.getCache<T>(key);
    if (cached !== null) return cached;

    const data = await this.fetchWithRetry<T>(url, options);
    this.setCache(key, data, ttlMs);
    return data;
  }

  // ── Helpers ────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const apiManager = ApiManager.getInstance();
