/**
 * MorningBriefing — CM's Daily Intelligence Dashboard
 * 
 * Implements the three critical views from GOVT-ANALYSIS-CM:
 * 1. District Health Scorecard — "Who's Failing Me?"
 * 2. Today's Negative News — "What Will Hit Me?"
 * 3. Fund Flow Tracker — "Where Is My Money?"
 */

import { DataStore } from '../data/DataStore';
import { fetchMaharashtraWeather, fetchMaharashtraNews, fetchMaharashtraAirQuality, WeatherData, NewsEvent, AirQuality } from '../data/LiveDataSource';

interface DistrictScore {
  name: string;
  jalJeevan: number;      // % of target
  pmAwas: number;
  mgnrega: number;
  ayushmanBharat: number;
  midDayMeal: number;
  overall: number;
  status: 'green' | 'yellow' | 'red';
}

interface NewsItem {
  headline: string;
  district: string;
  department: string;
  negativityScore: number;
  source: string;
  time: string;
  verified: boolean;
}

interface FundFlow {
  scheme: string;
  allocated: number;    // ₹ crore
  released: number;
  received: number;
  spent: number;
  ucPending: number;
  stuck: number;
  status: 'flowing' | 'stuck' | 'critical';
}

export class MorningBriefing {
  private dataStore: DataStore;
  private container: HTMLElement;
  private isVisible = false;

  // Sample data — replace with real API calls
  private districts: DistrictScore[] = [
    { name: 'Mumbai', jalJeevan: 92, pmAwas: 88, mgnrega: 95, ayushmanBharat: 91, midDayMeal: 97, overall: 93, status: 'green' },
    { name: 'Pune', jalJeevan: 89, pmAwas: 85, mgnrega: 91, ayushmanBharat: 88, midDayMeal: 94, overall: 89, status: 'green' },
    { name: 'Nagpur', jalJeevan: 78, pmAwas: 72, mgnrega: 85, ayushmanBharat: 80, midDayMeal: 88, overall: 81, status: 'yellow' },
    { name: 'Nashik', jalJeevan: 65, pmAwas: 58, mgnrega: 72, ayushmanBharat: 68, midDayMeal: 82, overall: 69, status: 'yellow' },
    { name: 'Aurangabad', jalJeevan: 52, pmAwas: 45, mgnrega: 63, ayushmanBharat: 55, midDayMeal: 75, overall: 58, status: 'red' },
    { name: 'Nandurbar', jalJeevan: 38, pmAwas: 32, mgnrega: 48, ayushmanBharat: 42, midDayMeal: 65, overall: 45, status: 'red' },
    { name: 'Gadchiroli', jalJeevan: 42, pmAwas: 35, mgnrega: 55, ayushmanBharat: 48, midDayMeal: 70, overall: 50, status: 'red' },
    { name: 'Thane', jalJeevan: 85, pmAwas: 82, mgnrega: 88, ayushmanBharat: 84, midDayMeal: 92, overall: 86, status: 'green' },
    { name: 'Solapur', jalJeevan: 58, pmAwas: 52, mgnrega: 65, ayushmanBharat: 60, midDayMeal: 78, overall: 63, status: 'yellow' },
    { name: 'Kolhapur', jalJeevan: 82, pmAwas: 78, mgnrega: 86, ayushmanBharat: 80, midDayMeal: 90, overall: 83, status: 'green' },
  ];

  private news: NewsItem[] = [
    { headline: 'Farmer suicides in Marathwada reach 15 this month', district: 'Aurangabad', department: 'Agriculture', negativityScore: 95, source: 'Loksatta', time: '2h ago', verified: true },
    { headline: 'Water contamination crisis in Nandurbar villages', district: 'Nandurbar', department: 'Water Supply', negativityScore: 88, source: 'Maharashtra Times', time: '3h ago', verified: true },
    { headline: 'Hospital deaths due to oxygen shortage in Gadchiroli', district: 'Gadchiroli', department: 'Health', negativityScore: 92, source: 'Sakal', time: '4h ago', verified: false },
    { headline: 'MGNREGA wages delayed for 3 months in Solapur', district: 'Solapur', department: 'Rural Development', negativityScore: 78, source: 'Lokmat', time: '5h ago', verified: true },
    { headline: 'Road accident kills 5 on Mumbai-Pune expressway', district: 'Pune', department: 'Transport', negativityScore: 85, source: 'TOI', time: '1h ago', verified: true },
  ];

  private funds: FundFlow[] = [
    { scheme: 'Jal Jeevan Mission', allocated: 15000, released: 12000, received: 10500, spent: 8200, ucPending: 2300, stuck: 4300, status: 'stuck' },
    { scheme: 'PM Awas Yojana', allocated: 8000, released: 6500, received: 5800, spent: 4200, ucPending: 1600, stuck: 2300, status: 'stuck' },
    { scheme: 'MGNREGA', allocated: 12000, released: 10000, received: 9200, spent: 7800, ucPending: 1400, stuck: 1200, status: 'flowing' },
    { scheme: 'Ayushman Bharat', allocated: 5000, released: 4200, received: 3800, spent: 3100, ucPending: 700, stuck: 400, status: 'flowing' },
    { scheme: 'Mid-Day Meal', allocated: 3000, released: 2800, received: 2600, spent: 2400, ucPending: 200, stuck: 200, status: 'flowing' },
  ];

  private liveWeather: WeatherData[] = [];
  private liveNews: NewsEvent[] = [];
  private liveAQI: AirQuality[] = [];
  private liveLoaded = false;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
    this.container = document.createElement('div');
    this.container.className = 'morning-briefing';
    this.container.id = 'morning-briefing';
    document.body.appendChild(this.container);
    this.render();
    this.loadLiveData();
  }

  private async loadLiveData() {
    try {
      const [weather, news, aqi] = await Promise.all([
        fetchMaharashtraWeather(),
        fetchMaharashtraNews(),
        fetchMaharashtraAirQuality(),
      ]);
      this.liveWeather = weather;
      this.liveNews = news;
      this.liveAQI = aqi;
      this.liveLoaded = true;
      this.render();
    } catch (e) {
      console.error('[MorningBriefing] Live data fetch failed:', e);
    }
  }

  private render() {
    this.container.innerHTML = `
      <div class="briefing-overlay ${this.isVisible ? 'visible' : ''}">
        <div class="briefing-panel">
          <div class="briefing-header">
            <div class="briefing-title">
              <span class="briefing-icon">🏛️</span>
              <h2>Morning Briefing</h2>
              <span class="briefing-date">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <button class="briefing-close" id="close-briefing">✕</button>
          </div>

          <!-- Critical Alerts -->
          <div class="briefing-alerts">
            <div class="alert-critical">
              <span class="alert-icon">🔴</span>
              <span class="alert-text"><strong>${this.districts.filter(d => d.status === 'red').length} districts</strong> critically behind on scheme targets</span>
            </div>
            <div class="alert-warning">
              <span class="alert-icon">🟡</span>
              <span class="alert-text"><strong>₹${this.funds.reduce((sum, f) => sum + f.stuck, 0).toLocaleString()} crore</strong> stuck in fund transfers</span>
            </div>
            <div class="alert-info">
              <span class="alert-icon">📰</span>
              <span class="alert-text"><strong>${this.getDisplayNews().filter(n => n.negativityScore > 80).length} high-impact news</strong> items need attention</span>
            </div>
            ${this.liveWeather.length > 0 ? `
            <div class="alert-info">
              <span class="alert-icon">🌡️</span>
              <span class="alert-text"><strong>Live Weather:</strong> ${this.liveWeather.slice(0, 3).map(w => `${w.location} ${w.temperature}°C`).join(' · ')}</span>
            </div>` : ''}
            ${this.liveAQI.length > 0 ? `
            <div class="alert-info">
              <span class="alert-icon">🌬️</span>
              <span class="alert-text"><strong>Air Quality:</strong> ${this.liveAQI.slice(0, 3).map(a => `${a.city} AQI ${a.aqi}`).join(' · ')}</span>
            </div>` : ''}
          </div>

          <!-- Section 1: District Health Scorecard -->
          <div class="briefing-section">
            <h3 class="section-title">
              <span class="section-icon">📊</span>
              District Health Scorecard
              <span class="section-subtitle">Scheme performance ranking</span>
            </h3>
            <div class="district-table">
              <div class="district-header">
                <span class="col-rank">#</span>
                <span class="col-name">District</span>
                <span class="col-scheme">Jal Jeevan</span>
                <span class="col-scheme">PM Awas</span>
                <span class="col-scheme">MGNREGA</span>
                <span class="col-scheme">Ayushman</span>
                <span class="col-scheme">Mid-Day</span>
                <span class="col-overall">Overall</span>
              </div>
              ${this.districts
                .sort((a, b) => a.overall - b.overall)
                .slice(0, 8)
                .map((d, i) => `
                  <div class="district-row ${d.status}">
                    <span class="col-rank">${i + 1}</span>
                    <span class="col-name">${d.name}</span>
                    <span class="col-scheme ${this.getScoreClass(d.jalJeevan)}">${d.jalJeevan}%</span>
                    <span class="col-scheme ${this.getScoreClass(d.pmAwas)}">${d.pmAwas}%</span>
                    <span class="col-scheme ${this.getScoreClass(d.mgnrega)}">${d.mgnrega}%</span>
                    <span class="col-scheme ${this.getScoreClass(d.ayushmanBharat)}">${d.ayushmanBharat}%</span>
                    <span class="col-scheme ${this.getScoreClass(d.midDayMeal)}">${d.midDayMeal}%</span>
                    <span class="col-overall ${d.status}">${d.overall}%</span>
                  </div>
                `).join('')}
            </div>
          </div>

          <!-- Section 2: Today's Negative News -->
          <div class="briefing-section">
            <h3 class="section-title">
              <span class="section-icon">📰</span>
              Today's Negative News
              <span class="section-subtitle">What will hit you today ${this.liveLoaded ? '🔴 LIVE' : '⏳ Loading...'}</span>
            </h3>
            <div class="news-feed">
              ${this.getDisplayNews().map(n => `
                  <div class="news-item ${n.negativityScore > 85 ? 'critical' : n.negativityScore > 70 ? 'warning' : 'normal'}">
                    <div class="news-header">
                      <span class="news-score">${n.negativityScore}</span>
                      <span class="news-headline">${n.headline}</span>
                      ${n.verified ? '<span class="news-verified">✓ Verified</span>' : '<span class="news-unverified">⚠ Unverified</span>'}
                    </div>
                    <div class="news-meta">
                      <span class="news-district">📍 ${n.district}</span>
                      <span class="news-dept">🏢 ${n.department}</span>
                      <span class="news-source">${n.source}</span>
                      <span class="news-time">${n.time}</span>
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>

          <!-- Section 3: Fund Flow Tracker -->
          <div class="briefing-section">
            <h3 class="section-title">
              <span class="section-icon">💰</span>
              Fund Flow Tracker
              <span class="section-subtitle">Where is your money?</span>
            </h3>
            <div class="fund-flow">
              ${this.funds.map(f => `
                <div class="fund-item ${f.status}">
                  <div class="fund-header">
                    <span class="fund-name">${f.scheme}</span>
                    <span class="fund-status ${f.status}">${f.status === 'critical' ? '🔴 Critical' : f.status === 'stuck' ? '🟡 Stuck' : '🟢 Flowing'}</span>
                  </div>
                  <div class="fund-bar-container">
                    <div class="fund-bar">
                      <div class="fund-segment allocated" style="width: 100%" title="Allocated: ₹${f.allocated.toLocaleString()} Cr"></div>
                      <div class="fund-segment released" style="width: ${(f.released / f.allocated * 100)}%" title="Released: ₹${f.released.toLocaleString()} Cr"></div>
                      <div class="fund-segment spent" style="width: ${(f.spent / f.allocated * 100)}%" title="Spent: ₹${f.spent.toLocaleString()} Cr"></div>
                    </div>
                  </div>
                  <div class="fund-details">
                    <span>Allocated: ₹${f.allocated.toLocaleString()} Cr</span>
                    <span>Released: ₹${f.released.toLocaleString()} Cr</span>
                    <span>Spent: ₹${f.spent.toLocaleString()} Cr</span>
                    <span class="fund-stuck">Stuck: ₹${f.stuck.toLocaleString()} Cr</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  private getScoreClass(score: number): string {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  }

  private getDisplayNews(): NewsItem[] {
    if (this.liveNews.length === 0) return this.news;
    // Convert live GDELT news to NewsItem format, prefer negative tone
    const liveItems: NewsItem[] = this.liveNews
      .filter(n => n.tone < -1)
      .slice(0, 10)
      .map(n => ({
        headline: n.title,
        district: n.location || 'Maharashtra',
        department: n.themes[0] || 'General',
        negativityScore: Math.min(99, Math.round(Math.abs(n.tone) * 10)),
        source: n.source,
        time: new Date(n.date).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        verified: true,
      }));
    return liveItems.length > 0 ? liveItems : this.news;
  }

  private setupEventListeners() {
    document.getElementById('close-briefing')?.addEventListener('click', () => this.hide());
  }

  show() {
    this.isVisible = true;
    this.container.querySelector('.briefing-overlay')?.classList.add('visible');
  }

  hide() {
    this.isVisible = false;
    this.container.querySelector('.briefing-overlay')?.classList.remove('visible');
  }

  toggle() {
    if (this.isVisible) this.hide();
    else this.show();
  }
}
