/**
 * Dashboard — Main UI overlay with layer controls, stats, and info panels
 * Redesigned for Project Arjun with Indian tricolor accents
 */
import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium';
import { LayerManager } from '../layers/LayerManager';
import { DataStore } from '../data/DataStore';
import { NavBar, ViewMode } from './NavBar';
import { AlertPanel } from './AlertPanel';

export class Dashboard {
  private viewer: Viewer;
  private layerManager: LayerManager;
  private dataStore: DataStore;
  private container: HTMLElement;
  private navBar!: NavBar;
  private alertPanel!: AlertPanel;
  private searchTerm = '';

  constructor(viewer: Viewer, layerManager: LayerManager, dataStore: DataStore) {
    this.viewer = viewer;
    this.layerManager = layerManager;
    this.dataStore = dataStore;
    this.container = document.getElementById('ui-overlay')!;
    this.render();
  }

  private render() {
    // ── Load external stylesheet ──
    // Styles are in src/style.css, loaded by the bundler

    // ── Build the static shell ──
    this.container.innerHTML = `
      <!-- Sidebar -->
      <div class="ge-sidebar" id="layer-panel">
        <div class="ge-search-wrap">
          <div class="ge-search">
            <span class="ge-search-icon">🔍</span>
            <input class="ge-search-input" id="layer-search" type="text"
                   placeholder="Search layers..." autocomplete="off" />
          </div>
        </div>
        <div class="ge-panel-header">
          <span class="ge-panel-title">Data Layers</span>
          <button class="ge-panel-action" id="btn-toggle-all">Toggle All</button>
        </div>
        <div id="layer-list"></div>
      </div>

      <!-- Stats Panel -->
      <div class="ge-stats" id="stats-panel">
        <div class="ge-stats-header">
          <h3>📊 Overview</h3>
        </div>
        <div class="ge-stats-body">
          <div class="ge-metric-grid">
            <div class="ge-metric-card">
              <div class="ge-metric-value saffron">247</div>
              <div class="ge-metric-label">Schemes</div>
            </div>
            <div class="ge-metric-card">
              <div class="ge-metric-value green">1,842</div>
              <div class="ge-metric-label">Stations</div>
            </div>
            <div class="ge-metric-card">
              <div class="ge-metric-value white">78%</div>
              <div class="ge-metric-label">Coverage</div>
            </div>
            <div class="ge-metric-card">
              <div class="ge-metric-value info">36</div>
              <div class="ge-metric-label">Districts</div>
            </div>
          </div>

          <div class="ge-stat-item">
            <span class="ge-stat-label">
              <span class="ge-stat-label-icon">🌬️</span> Air Quality
            </span>
            <span class="ge-stat-value warn">Moderate</span>
          </div>
          <div class="ge-stat-item">
            <span class="ge-stat-label">
              <span class="ge-stat-label-icon">💧</span> Water Quality
            </span>
            <span class="ge-stat-value warn">Mixed</span>
          </div>
          <div class="ge-stat-item">
            <span class="ge-stat-label">
              <span class="ge-stat-label-icon">👥</span> Population
            </span>
            <span class="ge-stat-value">12.49 Cr</span>
          </div>
          <div class="ge-stat-item">
            <span class="ge-stat-label">
              <span class="ge-stat-label-icon">🚨</span> Active Incidents
            </span>
            <span class="ge-stat-value bad">12</span>
          </div>
          <div class="ge-stat-item">
            <span class="ge-stat-label">
              <span class="ge-stat-label-icon">📡</span> Active Layers
            </span>
            <span class="ge-stat-value" id="active-layer-count">0</span>
          </div>

          <div class="ge-progress-wrap">
            <div class="ge-progress-label">
              <span>Scheme Coverage</span>
              <span>78%</span>
            </div>
            <div class="ge-progress-bar">
              <div class="ge-progress-fill" style="width: 78%"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="ge-footer">
        Project Arjun — God's Eye India — Open Source Geospatial Intelligence — Data: OGD, CPCB, IMD, ISRO
      </div>
    `;

    // ── NavBar ──
    this.navBar = new NavBar(this.viewer, this.container, {
      onModeChange: (mode: ViewMode) => this.handleModeChange(mode),
      onAlertToggle: () => this.alertPanel?.toggle(),
    });

    // ── AlertPanel ──
    this.alertPanel = new AlertPanel(this.container, (count: number) => {
      this.navBar.setAlertCount(count);
    });

    // Set initial alert count
    this.navBar.setAlertCount(this.alertPanel.getUnreadCount());

    // ── Layer list ──
    this.renderLayerList();
    this.attachListeners();
  }

  private renderLayerList() {
    const listEl = document.getElementById('layer-list')!;
    const categories: { key: string; label: string; icon: string }[] = [
      { key: 'maharashtra', label: 'Maharashtra State', icon: '🗺️' },
      { key: 'india', label: 'India-wide', icon: '🇮🇳' },
      { key: 'global', label: 'Global / Satellite', icon: '🛰️' },
      { key: 'intelligence', label: 'Intelligence', icon: '🔍' },
    ];

    let html = '';
    for (const cat of categories) {
      let layers = this.layerManager.getLayersByCategory(cat.key as any);
      if (layers.length === 0) continue;

      // Filter by search term
      if (this.searchTerm) {
        layers = layers.filter(l =>
          l.config.name.toLowerCase().includes(this.searchTerm) ||
          l.config.description.toLowerCase().includes(this.searchTerm)
        );
        if (layers.length === 0) continue;
      }

      html += `<div class="ge-category">
        <span class="ge-category-icon">${cat.icon}</span>
        ${cat.label}
        <span class="ge-category-count">${layers.length}</span>
      </div>`;

      for (const layer of layers) {
        html += `
          <div class="ge-layer-item ${layer.enabled ? 'active' : ''}" data-layer-id="${layer.config.id}">
            <div class="ge-layer-icon">${layer.config.icon}</div>
            <div class="ge-layer-info">
              <div class="ge-layer-name">${layer.config.name}</div>
              <div class="ge-layer-desc">${layer.config.description.slice(0, 55)}...</div>
            </div>
            <div class="ge-layer-toggle ${layer.enabled ? 'on' : ''}" data-toggle="${layer.config.id}"></div>
          </div>
        `;
      }
    }

    if (!html && this.searchTerm) {
      html = `<div style="padding:20px 14px;text-align:center;color:var(--text-muted);font-size:0.78rem;">
        No layers matching "${this.searchTerm}"
      </div>`;
    }

    listEl.innerHTML = html;
    this.updateActiveCount();
  }

  private updateActiveCount() {
    const countEl = document.getElementById('active-layer-count');
    if (countEl) {
      countEl.textContent = String(this.layerManager.getEnabledLayers().length);
    }
  }

  private async handleModeChange(mode: ViewMode) {
    if (mode === 'maharashtra') {
      // Fly to Maharashtra
      this.viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(75.7, 19.66, 800000),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-45),
          roll: 0,
        },
        duration: 1.5,
      });

      // Disable India-specific layers, re-enable Maharashtra layers
      for (const id of ['india-states', 'govt-schemes-india', 'news-verification', 'failures']) {
        await this.layerManager.disableLayer(id);
      }
      for (const id of ['maharashtra-districts']) {
        await this.layerManager.enableLayer(id);
      }
    } else {
      // Fly to India overview
      this.viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(78.9, 20.6, 4000000),
        orientation: {
          heading: CesiumMath.toRadians(0),
          pitch: CesiumMath.toRadians(-45),
          roll: 0,
        },
        duration: 1.5,
      });

      // Enable India-specific layers
      for (const id of ['india-states', 'govt-schemes-india', 'news-verification', 'failures']) {
        await this.layerManager.enableLayer(id);
      }
    }

    // Refresh layer list to reflect new state
    this.renderLayerList();
  }

  private attachListeners() {
    // Layer toggles
    this.container.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      const toggleId = target.dataset.toggle;
      if (toggleId) {
        await this.layerManager.toggleLayer(toggleId);
        target.classList.toggle('on');
        const item = target.closest('.ge-layer-item');
        if (item) item.classList.toggle('active');
        this.updateActiveCount();
      }
    });

    // Toggle all
    document.getElementById('btn-toggle-all')?.addEventListener('click', async () => {
      const enabled = this.layerManager.getEnabledLayers().length;
      if (enabled > 0) {
        await this.layerManager.disableAll();
      } else {
        await this.layerManager.enableAll();
      }
      this.renderLayerList();
    });

    // Search
    const searchInput = document.getElementById('layer-search') as HTMLInputElement;
    if (searchInput) {
      let debounce: ReturnType<typeof setTimeout>;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          this.searchTerm = searchInput.value.toLowerCase().trim();
          this.renderLayerList();
        }, 200);
      });
    }
  }
}
