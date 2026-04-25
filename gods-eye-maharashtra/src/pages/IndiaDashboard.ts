/**
 * IndiaDashboard — India-wide view component
 * Provides national-level monitoring with state-level data, scheme coverage, news verification, and failure tracking
 */
import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium';
import { LayerManager } from '../layers/LayerManager';
import { DataStore } from '../data/DataStore';

export class IndiaDashboard {
  private viewer: Viewer;
  private layerManager: LayerManager;
  private dataStore: DataStore;
  private container: HTMLElement;
  private isActive = false;
  private onNavigateBack: (() => void) | null = null;

  constructor(viewer: Viewer, layerManager: LayerManager, dataStore: DataStore) {
    this.viewer = viewer;
    this.layerManager = layerManager;
    this.dataStore = dataStore;
    this.container = document.createElement('div');
    this.container.id = 'india-dashboard';
    this.container.style.display = 'none';
    document.getElementById('ui-overlay')!.appendChild(this.container);
  }

  activate(onBack: () => void): void {
    this.isActive = true;
    this.onNavigateBack = onBack;
    this.container.style.display = '';

    // Fly camera to India overview
    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(78.96, 22.59, 3500000),
      orientation: {
        heading: CesiumMath.toRadians(0),
        pitch: CesiumMath.toRadians(-45),
        roll: 0,
      },
      duration: 2.0,
    });

    // Enable India layers, disable Maharashtra layers
    this.enableIndiaLayers();
    this.render();
    this.attachListeners();
  }

  deactivate(): void {
    this.isActive = false;
    this.container.style.display = 'none';
    this.disableIndiaLayers();
  }

  private async enableIndiaLayers(): Promise<void> {
    const indiaLayerIds = [
      'india-states', 'govt-schemes-india', 'news-verification', 'failures',
      'govt-schemes', 'news-events',
    ];
    const maharashtraLayerIds = [
      'maharashtra-districts', 'water-quality', 'air-quality',
      'health-infra', 'agriculture', 'infrastructure', 'rainfall',
    ];

    // Disable Maharashtra layers
    for (const id of maharashtraLayerIds) {
      await this.layerManager.disableLayer(id);
    }

    // Enable India layers
    for (const id of indiaLayerIds) {
      await this.layerManager.enableLayer(id);
    }
  }

  private async disableIndiaLayers(): Promise<void> {
    const indiaLayerIds = [
      'india-states', 'govt-schemes-india', 'news-verification', 'failures',
    ];
    for (const id of indiaLayerIds) {
      await this.layerManager.disableLayer(id);
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <style>
        /* ─── India Dashboard Styles ───────────────────────────── */
        #india-dashboard {
          position: absolute; inset: 0; pointer-events: none; z-index: 10;
        }
        #india-dashboard > * { pointer-events: auto; }

        /* Header */
        .id-header {
          position: absolute; top: 0; left: 0; right: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px;
          background: linear-gradient(180deg, rgba(10,10,15,0.95) 0%, rgba(10,10,15,0) 100%);
        }
        .id-title {
          font-size: 1.1rem; font-weight: 700; letter-spacing: 2px;
          color: #ff9800; text-transform: uppercase;
        }
        .id-title span { color: #888; font-weight: 400; font-size: 0.75rem; letter-spacing: 1px; margin-left: 8px; }
        .id-header-actions { display: flex; gap: 8px; }
        .id-btn {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer;
          font-size: 0.8rem; transition: all 0.2s;
        }
        .id-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
        .id-btn.active { background: rgba(255,152,0,0.3); border-color: rgba(255,152,0,0.5); color: #ff9800; }

        /* Layer Panel */
        .id-layer-panel {
          position: absolute; top: 60px; left: 16px; width: 280px;
          background: rgba(10,10,15,0.92); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; backdrop-filter: blur(20px);
          max-height: calc(100vh - 180px); overflow-y: auto;
        }
        .id-panel-header {
          padding: 14px 16px 10px; border-bottom: 1px solid rgba(255,255,255,0.08);
          font-size: 0.8rem; font-weight: 600; color: #888; text-transform: uppercase;
          letter-spacing: 1px; display: flex; justify-content: space-between; align-items: center;
        }
        .id-category {
          padding: 8px 16px 4px; font-size: 0.7rem; font-weight: 600;
          color: #666; text-transform: uppercase; letter-spacing: 1px;
        }
        .id-layer-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 16px; cursor: pointer; transition: background 0.15s;
          border-left: 3px solid transparent;
        }
        .id-layer-item:hover { background: rgba(255,255,255,0.05); }
        .id-layer-item.active { background: rgba(255,152,0,0.08); border-left-color: #ff9800; }
        .id-layer-icon { font-size: 1.1rem; width: 24px; text-align: center; }
        .id-layer-info { flex: 1; }
        .id-layer-name { font-size: 0.85rem; color: #ddd; font-weight: 500; }
        .id-layer-desc { font-size: 0.65rem; color: #666; margin-top: 2px; }
        .id-layer-toggle {
          width: 36px; height: 20px; border-radius: 10px;
          background: rgba(255,255,255,0.1); position: relative; cursor: pointer;
          transition: background 0.2s;
        }
        .id-layer-toggle.on { background: rgba(255,152,0,0.4); }
        .id-layer-toggle::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%;
          background: #888; transition: all 0.2s;
        }
        .id-layer-toggle.on::after { left: 18px; background: #ff9800; }

        /* Stats Panel */
        .id-stats {
          position: absolute; top: 60px; right: 16px; width: 280px;
          background: rgba(10,10,15,0.92); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; backdrop-filter: blur(20px);
          padding: 16px;
          max-height: calc(100vh - 180px); overflow-y: auto;
        }
        .id-stats h3 { font-size: 0.8rem; color: #888; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .id-stats-section {
          margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .id-stats-section:last-child { border-bottom: none; margin-bottom: 0; }
        .id-stats-section h4 { font-size: 0.7rem; color: #ff9800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .id-stat-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 4px 0;
        }
        .id-stat-label { font-size: 0.75rem; color: #aaa; }
        .id-stat-value { font-size: 0.82rem; font-weight: 600; }
        .id-stat-value.good { color: #00ff88; }
        .id-stat-value.warn { color: #ffcc00; }
        .id-stat-value.bad { color: #ff3355; }

        /* Scheme Panel */
        .id-schemes {
          position: absolute; bottom: 30px; left: 16px; width: 360px;
          background: rgba(10,10,15,0.92); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; backdrop-filter: blur(20px);
          padding: 16px;
          max-height: 300px; overflow-y: auto;
        }
        .id-schemes h3 { font-size: 0.8rem; color: #888; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .id-scheme-item {
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .id-scheme-name { font-size: 0.82rem; color: #ddd; font-weight: 600; }
        .id-scheme-bar {
          width: 100%; height: 6px; background: rgba(255,255,255,0.08);
          border-radius: 3px; margin-top: 4px; overflow: hidden;
        }
        .id-scheme-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .id-scheme-meta { display: flex; justify-content: space-between; margin-top: 4px; }
        .id-scheme-meta span { font-size: 0.65rem; color: #666; }

        /* Failure Ticker */
        .id-failures {
          position: absolute; bottom: 30px; right: 16px; width: 320px;
          background: rgba(10,10,15,0.92); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; backdrop-filter: blur(20px);
          padding: 16px;
          max-height: 300px; overflow-y: auto;
        }
        .id-failures h3 { font-size: 0.8rem; color: #888; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .id-failure-item {
          padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
          cursor: pointer; transition: background 0.15s;
        }
        .id-failure-item:hover { background: rgba(255,255,255,0.03); }
        .id-failure-title { font-size: 0.78rem; color: #ddd; font-weight: 500; }
        .id-failure-meta { display: flex; gap: 8px; margin-top: 4px; }
        .id-failure-tag {
          font-size: 0.6rem; padding: 2px 6px; border-radius: 4px;
          font-weight: 600; text-transform: uppercase;
        }
        .id-failure-tag.critical { background: rgba(255,51,85,0.2); color: #ff3355; }
        .id-failure-tag.high { background: rgba(255,152,0,0.2); color: #ff9800; }
        .id-failure-tag.medium { background: rgba(255,204,0,0.2); color: #ffcc00; }

        /* Scrollbar */
        .id-layer-panel::-webkit-scrollbar,
        .id-stats::-webkit-scrollbar,
        .id-schemes::-webkit-scrollbar,
        .id-failures::-webkit-scrollbar { width: 4px; }
        .id-layer-panel::-webkit-scrollbar-track,
        .id-stats::-webkit-scrollbar-track,
        .id-schemes::-webkit-scrollbar-track,
        .id-failures::-webkit-scrollbar-track { background: transparent; }
        .id-layer-panel::-webkit-scrollbar-thumb,
        .id-stats::-webkit-scrollbar-thumb,
        .id-schemes::-webkit-scrollbar-thumb,
        .id-failures::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

        /* Responsive */
        @media (max-width: 1024px) {
          .id-schemes { display: none; }
          .id-failures { width: 280px; }
        }
        @media (max-width: 768px) {
          .id-layer-panel { width: 240px; left: 8px; }
          .id-stats { display: none; }
          .id-failures { display: none; }
          .id-schemes { display: none; }
        }
      </style>

      <!-- Header -->
      <div class="id-header">
        <div class="id-title">GOD'S EYE <span>India Intelligence Network</span></div>
        <div class="id-header-actions">
          <button class="id-btn" id="id-btn-mh">🏛️ Maharashtra</button>
          <button class="id-btn active" id="id-btn-india">🇮🇳 All India</button>
          <button class="id-btn" id="id-btn-home">🏠 Home</button>
        </div>
      </div>

      <!-- Layer Panel -->
      <div class="id-layer-panel" id="id-layer-panel">
        <div class="id-panel-header">
          <span>🗂️ India Layers</span>
        </div>
        <div id="id-layer-list"></div>
      </div>

      <!-- Stats Panel -->
      <div class="id-stats" id="id-stats">
        <h3>🇮🇳 India Overview</h3>
        <div class="id-stats-section">
          <h4>Demographics</h4>
          <div class="id-stat-item">
            <span class="id-stat-label">Population</span>
            <span class="id-stat-value">144.2 Cr</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">States + UTs</span>
            <span class="id-stat-value">28 + 8</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Districts</span>
            <span class="id-stat-value">766</span>
          </div>
        </div>
        <div class="id-stats-section">
          <h4>Environment</h4>
          <div class="id-stat-item">
            <span class="id-stat-label">National AQI Avg</span>
            <span class="id-stat-value warn">Moderate</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Severe AQI Cities</span>
            <span class="id-stat-value bad">24</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Heatwave Deaths (2025)</span>
            <span class="id-stat-value bad">4,200+</span>
          </div>
        </div>
        <div class="id-stats-section">
          <h4>Key Schemes</h4>
          <div class="id-stat-item">
            <span class="id-stat-label">MGNREGA Coverage</span>
            <span class="id-stat-value warn">62%</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Jal Jeevan (Tap Water)</span>
            <span class="id-stat-value warn">78%</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Ayushman Beneficiaries</span>
            <span class="id-stat-value good">30 Cr</span>
          </div>
        </div>
        <div class="id-stats-section">
          <h4>Monitoring</h4>
          <div class="id-stat-item">
            <span class="id-stat-label">Verified News</span>
            <span class="id-stat-value good" id="id-verified-count">10</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">False/Misinfo</span>
            <span class="id-stat-value bad" id="id-false-count">3</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Critical Failures</span>
            <span class="id-stat-value bad" id="id-critical-count">9</span>
          </div>
          <div class="id-stat-item">
            <span class="id-stat-label">Active Layers</span>
            <span class="id-stat-value" id="id-active-layers">0</span>
          </div>
        </div>
      </div>

      <!-- National Schemes Panel -->
      <div class="id-schemes" id="id-schemes">
        <h3>📋 National Scheme Implementation</h3>
        ${this.renderSchemes()}
      </div>

      <!-- Critical Failures Ticker -->
      <div class="id-failures" id="id-failures">
        <h3>🚨 Critical Failures</h3>
        ${this.renderFailures()}
      </div>
    `;

    this.renderLayerList();
  }

  private renderSchemes(): string {
    const schemes = [
      { name: 'MGNREGA', full: 'Employment Guarantee', pct: 62, budget: '₹73K Cr', color: '#ff9800' },
      { name: 'PM-KISAN', full: 'Farmer Income Support', pct: 72, budget: '₹60K Cr', color: '#00ff88' },
      { name: 'Ayushman Bharat', full: 'Health Insurance', pct: 65, budget: '₹7.5K Cr', color: '#ffcc00' },
      { name: 'Jal Jeevan', full: 'Tap Water for All', pct: 78, budget: '₹67K Cr', color: '#00a8ff' },
      { name: 'Ujjwala 2.0', full: 'LPG Connections', pct: 85, budget: '₹12K Cr', color: '#00ff88' },
      { name: 'Swachh Bharat', full: 'Sanitation', pct: 92, budget: '₹1.41L Cr', color: '#00ff88' },
      { name: 'PM Awas', full: 'Housing for All', pct: 68, budget: '₹54K Cr', color: '#ffcc00' },
    ];

    return schemes.map(s => `
      <div class="id-scheme-item">
        <div class="id-scheme-name">${s.name} <span style="color:#666;font-weight:400;font-size:0.7rem">— ${s.full}</span></div>
        <div class="id-scheme-bar">
          <div class="id-scheme-fill" style="width:${s.pct}%;background:${s.color}"></div>
        </div>
        <div class="id-scheme-meta">
          <span>Coverage: ${s.pct}%</span>
          <span>Budget: ${s.budget}</span>
        </div>
      </div>
    `).join('');
  }

  private renderFailures(): string {
    const criticalFailures = [
      { title: 'Arsenic Contamination — Bihar', severity: 'critical', category: 'water', pop: '3 Cr affected' },
      { title: 'Fluoride Crisis — Rajasthan', severity: 'critical', category: 'water', pop: '1.5 Cr affected' },
      { title: 'Ganga Pollution — Varanasi', severity: 'critical', category: 'water', pop: '50 Lakh' },
      { title: 'NH-66 Death Trap — Konkan', severity: 'critical', category: 'infrastructure', pop: '25 Lakh' },
      { title: 'Mumbai Railway Deaths', severity: 'critical', category: 'infrastructure', pop: '75 Lakh daily' },
      { title: 'Bihar Bridge Collapses', severity: 'critical', category: 'infrastructure', pop: '80 Lakh' },
      { title: 'Manipur Violence', severity: 'critical', category: 'governance', pop: '3.2M state' },
      { title: 'Delhi Severe AQI', severity: 'critical', category: 'environment', pop: '2 Cr NCR' },
      { title: 'Custodial Deaths National', severity: 'critical', category: 'governance', pop: '1,800+/year' },
    ];

    return criticalFailures.map(f => `
      <div class="id-failure-item">
        <div class="id-failure-title">${f.title}</div>
        <div class="id-failure-meta">
          <span class="id-failure-tag ${f.severity}">${f.severity}</span>
          <span style="font-size:0.65rem;color:#888">${f.pop}</span>
        </div>
      </div>
    `).join('');
  }

  private renderLayerList(): void {
    const listEl = document.getElementById('id-layer-list');
    if (!listEl) return;

    const layers = this.layerManager.getAllLayers().filter(l =>
      l.config.category === 'india' || l.config.category === 'global'
    );

    let html = '<div class="id-category">India-wide Data</div>';
    for (const layer of layers) {
      html += `
        <div class="id-layer-item ${layer.enabled ? 'active' : ''}" data-layer-id="${layer.config.id}">
          <div class="id-layer-icon">${layer.config.icon}</div>
          <div class="id-layer-info">
            <div class="id-layer-name">${layer.config.name}</div>
            <div class="id-layer-desc">${layer.config.description.slice(0, 55)}...</div>
          </div>
          <div class="id-layer-toggle ${layer.enabled ? 'on' : ''}" data-toggle="${layer.config.id}"></div>
        </div>
      `;
    }

    listEl.innerHTML = html;
    this.updateActiveCount();
  }

  private updateActiveCount(): void {
    const countEl = document.getElementById('id-active-layers');
    if (countEl) {
      countEl.textContent = String(this.layerManager.getEnabledLayers().length);
    }
  }

  private attachListeners(): void {
    // Layer toggles
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;

      // Toggle switch
      const toggleId = target.dataset.toggle;
      if (toggleId) {
        await this.layerManager.toggleLayer(toggleId);
        target.classList.toggle('on');
        const item = target.closest('.id-layer-item');
        if (item) item.classList.toggle('active');
        this.updateActiveCount();
        return;
      }

      // Navigate to Maharashtra
      if (target.id === 'id-btn-mh' || target.closest('#id-btn-mh')) {
        if (this.onNavigateBack) this.onNavigateBack();
        return;
      }

      // Home button
      if (target.id === 'id-btn-home' || target.closest('#id-btn-home')) {
        this.viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(78.96, 22.59, 3500000),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-45),
            roll: 0,
          },
          duration: 1.5,
        });
        return;
      }
    });
  }
}
