/**
 * VerificationPipeline — Cross-references news articles with multiple sources
 * and assigns credibility scores based on source reputation
 */
import { CONFIG } from './config';
import { apiManager } from './ApiManager';
import { GDELTArticle } from './sources/GDELTClient';

export type VerificationStatus = 'verified' | 'unverified' | 'disputed';

export interface VerificationResult {
  status: VerificationStatus;
  credibilityScore: number;           // 0-100
  sourceCount: number;
  sources: string[];
  matchedArticles: CrossRefArticle[];
  timestamp: string;
}

interface CrossRefArticle {
  title: string;
  url: string;
  source: string;
  date: string;
}

interface SimpleArticle {
  title: string;
  url: string;
  source: string;
  date: string;
  location?: string;
}

export class VerificationPipeline {
  private sourceCredibility: Record<string, number>;
  private minSourcesForVerified: number;

  constructor() {
    this.sourceCredibility = CONFIG.verification.sourceCredibility;
    this.minSourcesForVerified = CONFIG.verification.minSourcesForVerified;
  }

  /**
   * Verify a news article by cross-referencing with GDELT and scoring credibility
   */
  async verifyNews(article: SimpleArticle | GDELTArticle): Promise<VerificationResult> {
    const matchedArticles = await this.crossReference(article);
    const uniqueSources = Array.from(new Set(matchedArticles.map(a => a.source)));
    const sourceCount = uniqueSources.length;

    // Calculate credibility score
    const credibilityScore = this.calculateCredibility(article, matchedArticles);

    // Determine verification status
    let status: VerificationStatus;
    if (sourceCount >= this.minSourcesForVerified && credibilityScore >= 70) {
      status = 'verified';
    } else if (sourceCount > 0 && credibilityScore >= 40) {
      status = 'unverified';
    } else if (sourceCount >= 2 && credibilityScore < 40) {
      status = 'disputed';
    } else {
      status = 'unverified';
    }

    return {
      status,
      credibilityScore,
      sourceCount,
      sources: uniqueSources,
      matchedArticles,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cross-reference article with GDELT by searching for the title
   */
  private async crossReference(article: SimpleArticle | GDELTArticle): Promise<CrossRefArticle[]> {
    const matches: CrossRefArticle[] = [];

    // Add the original article as a source
    matches.push({
      title: article.title,
      url: article.url,
      source: article.source,
      date: article.date,
    });

    try {
      // Extract key terms from title for GDELT search
      const searchTerms = this.extractSearchTerms(article.title);
      if (searchTerms.length > 0) {
        const gdeltResults = await apiManager.fetchCached<any>(
          this.buildGDELTSearchUrl(searchTerms),
          {},
          `verify:${searchTerms.join('-')}`,
          CONFIG.gdelt.refreshIntervalMs,
        );

        if (gdeltResults?.articles && Array.isArray(gdeltResults.articles)) {
          for (const result of gdeltResults.articles) {
            if (result.url !== article.url && this.isRelated(article.title, result.title || '')) {
              matches.push({
                title: result.title || 'Unknown',
                url: result.url || '',
                source: this.sourceFromDomain(result.domain),
                date: result.seendate || '',
              });
            }
          }
        }
      }
    } catch {
      // Cross-reference failed — proceed with what we have
    }

    return matches;
  }

  /**
   * Calculate credibility score (0-100) based on source reputation and corroboration
   */
  private calculateCredibility(article: SimpleArticle | GDELTArticle, matches: CrossRefArticle[]): number {
    let score = 0;

    // 1. Source reputation (0-50 points)
    const sourceRep = this.getSourceReputation(article.source);
    score += sourceRep * 50;

    // 2. Corroboration count (0-30 points)
    const uniqueSources = new Set(matches.map(m => m.source));
    const corroborationScore = Math.min(uniqueSources.size / 4, 1);
    score += corroborationScore * 30;

    // 3. High-reputation source corroboration (0-20 points)
    let hasHighRepCorroboration = false;
    for (const match of matches) {
      if (match.source !== article.source && this.getSourceReputation(match.source) >= 0.8) {
        hasHighRepCorroboration = true;
        break;
      }
    }
    if (hasHighRepCorroboration) score += 20;

    return Math.round(Math.min(score, 100));
  }

  /**
   * Get source reputation weight (0-1)
   */
  private getSourceReputation(source: string): number {
    // Direct match
    if (this.sourceCredibility[source] !== undefined) {
      return this.sourceCredibility[source];
    }

    // Fuzzy match — check if source name contains a known source
    const sourceLower = source.toLowerCase();
    for (const [key, value] of Object.entries(this.sourceCredibility)) {
      if (sourceLower.includes(key.toLowerCase()) || key.toLowerCase().includes(sourceLower)) {
        return value;
      }
    }

    // Unknown source — default low credibility
    return 0.4;
  }

  /**
   * Extract search terms from article title (remove common words)
   */
  private extractSearchTerms(title: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'and', 'or',
      'but', 'not', 'no', 'it', 'its', 'this', 'that', 'has', 'have', 'had',
    ]);

    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Limit to top 5 terms
  }

  /**
   * Build GDELT search URL from terms
   */
  private buildGDELTSearchUrl(terms: string[]): string {
    const query = terms.join(' ');
    const params = new URLSearchParams({
      mode: 'artlist',
      maxrecords: '10',
      format: 'json',
      query,
    });
    return `${CONFIG.gdelt.baseUrl}?${params.toString()}`;
  }

  /**
   * Check if two article titles are related (fuzzy match)
   */
  private isRelated(title1: string, title2: string): boolean {
    const words1 = new Set(title1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(title2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    let overlap = 0;
    for (const word of Array.from(words1)) {
      if (words2.has(word)) overlap++;
    }

    // Consider related if at least 2 significant words overlap
    return overlap >= 2 || (overlap >= 1 && words1.size <= 3);
  }

  /**
   * Extract source name from domain
   */
  private sourceFromDomain(domain?: string): string {
    if (!domain) return 'Unknown';
    const clean = domain.replace('www.', '').replace(/\.\w{2,4}$/, '');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  /**
   * Get severity based on credibility score and verification config thresholds
   */
  getSeverity(score: number): string {
    const thresholds = CONFIG.verification.severityThresholds;
    if (score >= thresholds.critical * 100) return 'critical';
    if (score >= thresholds.high * 100) return 'high';
    if (score >= thresholds.medium * 100) return 'medium';
    return 'low';
  }
}

export const verificationPipeline = new VerificationPipeline();
