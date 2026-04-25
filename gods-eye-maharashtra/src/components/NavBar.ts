/**
 * NavBar — Top navigation bar for Project Arjun
 * Project name, mode switcher, actions, status indicator
 */
import { Viewer, Cartesian3, Math as CesiumMath } from 'cesium';

export type ViewMode = 'maharashtra' | 'india';

export interface NavBarCallbacks {
  onModeChange?: (mode: ViewMode) => void;
  onAlertToggle?: () => void;
  onFullscreen?: () => void;
  onHome?: () => void;
}

export class NavBar {
  private viewer: Viewer;
  private container: HTMLElement;
  private callbacks: NavBarCallbacks;
  private currentMode: ViewMode = 'maharashtra';
  private alertCount = 0;

  constructor(viewer: Viewer, container: HTMLElement, callbacks: NavBarCallbacks = {}) {
    this.viewer = viewer;
    this.container = container;
    this.callbacks = callbacks;
    this.render();
    this.attachListeners();
  }

  private render() {
    const nav = document.createElement('div');
    nav.className = 'ge-navbar';
    nav.id = 'ge-navbar';
    nav.innerHTML = `
      <!-- Brand -->
      <div class="ge-navbar-brand">
        <div class="ge-navbar-logo" title="Project Arjun">👁</div>
        <div class="ge-navbar-title">
          <span class="ge-navbar-title-main">Project Arjun</span>
          <span class="ge-navbar-title-sub">God's Eye India — Geospatial Intelligence</span>
        </div>
      </div>

      <!-- Mode Switcher -->
      <div class="ge-navbar-modes">
        <button class="ge-mode-btn active" data-mode="maharashtra">Maharashtra</button>
        <button class="ge-mode-btn" data-mode="india">All India</button>
      </div>

      <!-- Actions -->
      <div class="ge-navbar-actions">
        <button class="ge-nav-btn" id="nav-alerts" title="Alerts">
          🔔
          <span class="badge" id="alert-badge" style="display:none;">0</span>
        </button>
        <button class="ge-nav-btn" id="nav-home" title="Reset View">🏠</button>
        <button class="ge-nav-btn" id="nav-fs" title="Fullscreen">⛶</button>
        <div class="ge-nav-status">
          <span class="ge-nav-status-dot"></span>
          <span>Live</span>
        </div>
      </div>
    `;
    this.container.appendChild(nav);
  }

  private attachListeners() {
    const navbar = document.getElementById('ge-navbar')!;

    // Mode switcher
    navbar.querySelectorAll('.ge-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = (btn as HTMLElement).dataset.mode as ViewMode;
        if (mode === this.currentMode) return;
        this.currentMode = mode;
        navbar.querySelectorAll('.ge-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onModeChange?.(mode);
      });
    });

    // Alert toggle
    document.getElementById('nav-alerts')?.addEventListener('click', () => {
      this.callbacks.onAlertToggle?.();
    });

    // Home
    document.getElementById('nav-home')?.addEventListener('click', () => {
      if (this.currentMode === 'maharashtra') {
        this.viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(75.7, 19.66, 800000),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-45),
            roll: 0,
          },
          duration: 1.5,
        });
      } else {
        this.viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(78.9, 20.6, 4000000),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-45),
            roll: 0,
          },
          duration: 1.5,
        });
      }
      this.callbacks.onHome?.();
    });

    // Fullscreen
    document.getElementById('nav-fs')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      this.callbacks.onFullscreen?.();
    });
  }

  setAlertCount(count: number) {
    this.alertCount = count;
    const badge = document.getElementById('alert-badge');
    if (badge) {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  getMode(): ViewMode {
    return this.currentMode;
  }
}
