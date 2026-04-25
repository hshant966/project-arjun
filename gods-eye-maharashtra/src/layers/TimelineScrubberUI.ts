/**
 * TimelineScrubberUI — Enhanced timeline with event dots, scrub-to-filter
 * Events displayed as colored dots; clicking scrubs all layers to that time
 */
import { Viewer, JulianDate } from 'cesium';
import { LayerManager } from './LayerManager';
import { DataStore } from '../data/DataStore';

export interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  category: 'disaster' | 'military' | 'political' | 'weather' | 'intelligence' | 'infrastructure' | 'health';
  color: string;
  description: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  disaster: '#FF4444',
  military: '#FF8800',
  political: '#AA66FF',
  weather: '#44AAFF',
  intelligence: '#FFD700',
  infrastructure: '#00FF88',
  health: '#FF66AA',
};

// Sample timeline events
const SAMPLE_EVENTS: TimelineEvent[] = [
  { id: 'ev-001', date: new Date('2024-01-15'), title: 'Uttarakhand Tunnel Collapse', category: 'disaster', color: '#FF4444', description: 'Workers trapped in Silkyara tunnel' },
  { id: 'ev-002', date: new Date('2024-02-14'), title: 'Cyclone Michuang Aftermath', category: 'weather', color: '#44AAFF', description: 'Chennai flooding recovery ongoing' },
  { id: 'ev-003', date: new Date('2024-03-22'), title: 'Airspace Restriction — Northern Sector', category: 'military', color: '#FF8800', description: 'NOTAM issued for military exercise' },
  { id: 'ev-004', date: new Date('2024-04-19'), title: 'Phase 1 Elections Begin', category: 'political', color: '#AA66FF', description: 'Lok Sabha elections — Phase 1 voting' },
  { id: 'ev-005', date: new Date('2024-05-01'), title: 'GPS Jamming Detected — Western Border', category: 'intelligence', color: '#FFD700', description: 'Multiple GPS anomalies near Pakistan border' },
  { id: 'ev-006', date: new Date('2024-06-15'), title: 'Heatwave Alert — North India', category: 'weather', color: '#44AAFF', description: 'Temperatures exceed 49°C in Rajasthan' },
  { id: 'ev-007', date: new Date('2024-07-20'), title: 'Monsoon Flooding — Assam', category: 'disaster', color: '#FF4444', description: 'Brahmaputra above danger level' },
  { id: 'ev-008', date: new Date('2024-08-05'), title: 'Power Grid Failure — Maharashtra', category: 'infrastructure', color: '#00FF88', description: 'Grid collapse affects 30M consumers' },
  { id: 'ev-009', date: new Date('2024-09-10'), title: 'Satellite Debris Event', category: 'intelligence', color: '#FFD700', description: 'Anti-satellite test debris tracked' },
  { id: 'ev-010', date: new Date('2024-10-02'), title: 'Transponder Gap Cluster — Bay of Bengal', category: 'intelligence', color: '#FFD700', description: '5 aircraft simultaneously go dark' },
  { id: 'ev-011', date: new Date('2024-11-15'), title: 'Dengue Outbreak — Tamil Nadu', category: 'health', color: '#FF66AA', description: 'Cases spike 300% in Chennai metro' },
  { id: 'ev-012', date: new Date('2024-12-26'), title: 'Tsunami Warning Drill', category: 'disaster', color: '#FF4444', description: 'Indian Ocean tsunami preparedness exercise' },
  { id: 'ev-013', date: new Date('2025-01-26'), title: 'Republic Day — Heightened Security', category: 'military', color: '#FF8800', description: 'Delhi airspace closed, enhanced monitoring' },
  { id: 'ev-014', date: new Date('2025-02-14'), title: 'Pulwama Anniversary Alert', category: 'military', color: '#FF8800', description: 'Kashmir on high alert' },
  { id: 'ev-015', date: new Date('2025-03-22'), title: 'Bridge Collapse — Bihar', category: 'infrastructure', color: '#00FF88', description: 'Ganges bridge failure, 12 casualties' },
  { id: 'ev-016', date: new Date('2025-04-15'), title: 'Cyclone Formation — Arabian Sea', category: 'weather', color: '#44AAFF', description: 'Tropical depression intensifying' },
  { id: 'ev-017', date: new Date('2025-04-22'), title: 'Airspace Clearing — Northern Sector', category: 'intelligence', color: '#FFD700', description: '3,400 flights simultaneously rerouted' },
  { id: 'ev-018', date: new Date('2025-04-25'), title: 'Nuclear Facility Status Change', category: 'intelligence', color: '#FFD700', description: 'BARC reports anomalous activity' },
];

export class TimelineScrubberUI {
  private viewer: Viewer;
  private layerManager: LayerManager;
  private dataStore: DataStore;
  private container: HTMLElement;
  private events: TimelineEvent[] = SAMPLE_EVENTS;
  private currentDate: Date = new Date();
  private startDate: Date = new Date('2024-01-01');
  private endDate: Date = new Date('2025-05-01');
  private selectedCategory: string | null = null;
  private isPlaying = false;
  private animFrame: number | null = null;
  private onDateCallbacks: ((date: Date) => void)[] = [];

  constructor(viewer: Viewer, layerManager: LayerManager, dataStore: DataStore) {
    this.viewer = viewer;
    this.layerManager = layerManager;
    this.dataStore = dataStore;

    this.container = document.createElement('div');
    this.container.id = 'timeline-scrubber';
    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay) uiOverlay.appendChild(this.container);
    else document.body.appendChild(this.container);

    this.render();
    this.attachListeners();
  }

  private render(): void {
    const totalMs = this.endDate.getTime() - this.startDate.getTime();

    // Generate event dot positions
    const eventDots = this.events
      .filter(ev => !this.selectedCategory || ev.category === this.selectedCategory)
      .map(ev => {
        const pct = ((ev.date.getTime() - this.startDate.getTime()) / totalMs) * 100;
        return `<div class="ts-event-dot" data-id="${ev.id}"
          style="left:${pct}%;background:${ev.color}"
          title="${ev.title} (${ev.date.toLocaleDateString()})"></div>`;
      }).join('');

    // Category filter buttons
    const categories = ['disaster', 'military', 'political', 'weather', 'intelligence', 'infrastructure', 'health'];
    const catButtons = categories.map(cat => `
      <button class="ts-cat-btn ${this.selectedCategory === cat ? 'active' : ''}"
        data-cat="${cat}"
        style="--cat-color:${CATEGORY_COLORS[cat]}">
        ${cat}
      </button>
    `).join('');

    this.container.innerHTML = `
      <style>
        #timeline-scrubber {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(5,5,15,0.98), rgba(5,5,15,0.85));
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 8px 20px 12px;
          z-index: 200;
          backdrop-filter: blur(15px);
        }
        .ts-top-row {
          display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
        }
        .ts-categories {
          display: flex; gap: 4px; flex-wrap: wrap; flex: 1;
        }
        .ts-cat-btn {
          padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #777; font-size: 9px;
          cursor: pointer; transition: all 0.2s; text-transform: uppercase;
          font-family: monospace;
        }
        .ts-cat-btn:hover { color: var(--cat-color); border-color: var(--cat-color); }
        .ts-cat-btn.active {
          background: var(--cat-color); color: #000; border-color: var(--cat-color);
          font-weight: bold;
        }
        .ts-now-label {
          font-size: 11px; color: #00d4ff; font-weight: 600;
          font-variant-numeric: tabular-nums; min-width: 140px; text-align: right;
        }
        .ts-play-btn {
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3);
          color: #00d4ff; cursor: pointer; font-size: 12px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; flex-shrink: 0;
        }
        .ts-play-btn:hover { background: rgba(0,212,255,0.25); }
        .ts-play-btn.playing { background: rgba(0,212,255,0.3); color: #fff; }

        .ts-track-wrap {
          position: relative; height: 40px; margin: 0 10px;
        }
        .ts-track {
          position: absolute; top: 16px; left: 0; right: 0; height: 6px;
          background: rgba(255,255,255,0.06); border-radius: 3px;
          cursor: pointer;
        }
        .ts-track-fill {
          position: absolute; top: 0; left: 0; height: 100%;
          background: linear-gradient(90deg, #00d4ff, #00ff88);
          border-radius: 3px; pointer-events: none;
          transition: width 0.05s linear;
        }
        .ts-playhead {
          position: absolute; top: 10px; width: 16px; height: 16px;
          border-radius: 50%; background: #00d4ff; border: 2px solid #fff;
          box-shadow: 0 0 10px rgba(0,212,255,0.5);
          transform: translateX(-50%); pointer-events: none;
          transition: left 0.05s linear;
        }
        .ts-events-container {
          position: absolute; top: 0; left: 0; right: 0; height: 14px;
        }
        .ts-event-dot {
          position: absolute; top: 0; width: 8px; height: 8px;
          border-radius: 50%; transform: translateX(-50%);
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 0 4px currentColor;
        }
        .ts-event-dot:hover {
          transform: translateX(-50%) scale(1.8);
          z-index: 10;
        }
        .ts-date-labels {
          display: flex; justify-content: space-between;
          font-size: 9px; color: #444; padding: 2px 0;
          font-family: monospace;
        }

        .ts-event-tooltip {
          display: none; position: absolute; bottom: 50px;
          background: rgba(10,10,20,0.95); border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px; padding: 8px 12px; z-index: 300;
          max-width: 250px; pointer-events: none;
          backdrop-filter: blur(10px);
        }
        .ts-event-tooltip.show { display: block; }
        .ts-tooltip-title { font-size: 11px; color: #fff; font-weight: 600; margin-bottom: 3px; }
        .ts-tooltip-date { font-size: 9px; color: #888; margin-bottom: 3px; }
        .ts-tooltip-desc { font-size: 10px; color: #aaa; }
      </style>

      <div class="ts-top-row">
        <button class="ts-play-btn" id="ts-play-btn" title="Play/Pause timeline">▶</button>
        <div class="ts-categories">${catButtons}</div>
        <div class="ts-now-label" id="ts-now-label">
          ${this.currentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div class="ts-track-wrap" id="ts-track-wrap">
        <div class="ts-events-container">${eventDots}</div>
        <div class="ts-track" id="ts-track">
          <div class="ts-track-fill" id="ts-track-fill" style="width:100%"></div>
        </div>
        <div class="ts-playhead" id="ts-playhead" style="left:100%"></div>
      </div>

      <div class="ts-date-labels">
        <span>Jan 2024</span>
        <span>Apr 2024</span>
        <span>Jul 2024</span>
        <span>Oct 2024</span>
        <span>Jan 2025</span>
        <span>Apr 2025</span>
      </div>

      <div class="ts-event-tooltip" id="ts-tooltip">
        <div class="ts-tooltip-title" id="ts-tooltip-title"></div>
        <div class="ts-tooltip-date" id="ts-tooltip-date"></div>
        <div class="ts-tooltip-desc" id="ts-tooltip-desc"></div>
      </div>
    `;
  }

  private attachListeners(): void {
    const track = document.getElementById('ts-track')!;
    const trackWrap = document.getElementById('ts-track-wrap')!;
    const tooltip = document.getElementById('ts-tooltip')!;

    // Track click/drag to scrub
    const scrub = (clientX: number) => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const totalMs = this.endDate.getTime() - this.startDate.getTime();
      this.currentDate = new Date(this.startDate.getTime() + totalMs * pct);
      this.updatePlayhead(pct);
      this.notifyDateChange();
    };

    track.addEventListener('mousedown', (e) => {
      scrub(e.clientX);
      const onMove = (ev: MouseEvent) => scrub(ev.clientX);
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    // Play button
    document.getElementById('ts-play-btn')!.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      const btn = document.getElementById('ts-play-btn')!;
      btn.textContent = this.isPlaying ? '⏸' : '▶';
      btn.classList.toggle('playing', this.isPlaying);
      if (this.isPlaying) this.startPlayback();
      else this.stopPlayback();
    });

    // Category filters
    this.container.addEventListener('click', (e) => {
      const catBtn = (e.target as HTMLElement).closest('.ts-cat-btn') as HTMLElement;
      if (catBtn) {
        const cat = catBtn.dataset.cat!;
        this.selectedCategory = this.selectedCategory === cat ? null : cat;
        this.render();
        this.attachListeners();
      }
    });

    // Event dot hover & click
    const dots = this.container.querySelectorAll('.ts-event-dot');
    dots.forEach(dot => {
      const eventId = (dot as HTMLElement).dataset.id!;
      const event = this.events.find(ev => ev.id === eventId);
      if (!event) return;

      dot.addEventListener('mouseenter', (e) => {
        const tooltipTitle = document.getElementById('ts-tooltip-title')!;
        const tooltipDate = document.getElementById('ts-tooltip-date')!;
        const tooltipDesc = document.getElementById('ts-tooltip-desc')!;
        tooltipTitle.textContent = event.title;
        tooltipTitle.style.color = event.color;
        tooltipDate.textContent = event.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
        tooltipDesc.textContent = event.description;

        const rect = (dot as HTMLElement).getBoundingClientRect();
        const wrapRect = trackWrap.getBoundingClientRect();
        tooltip.style.left = `${rect.left - wrapRect.left + 4}px`;
        tooltip.classList.add('show');
      });

      dot.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
      });

      dot.addEventListener('click', () => {
        this.currentDate = new Date(event.date);
        const totalMs = this.endDate.getTime() - this.startDate.getTime();
        const pct = (this.currentDate.getTime() - this.startDate.getTime()) / totalMs;
        this.updatePlayhead(pct);
        this.notifyDateChange();
      });
    });
  }

  private updatePlayhead(pct: number): void {
    const fill = document.getElementById('ts-track-fill');
    const head = document.getElementById('ts-playhead');
    const label = document.getElementById('ts-now-label');
    if (fill) fill.style.width = `${pct * 100}%`;
    if (head) head.style.left = `${pct * 100}%`;
    if (label) {
      label.textContent = this.currentDate.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    }
  }

  private startPlayback(): void {
    this.stopPlayback();
    const tick = () => {
      if (!this.isPlaying) return;
      const totalMs = this.endDate.getTime() - this.startDate.getTime();
      const advance = totalMs * 0.0005; // ~0.05% per frame
      this.currentDate = new Date(this.currentDate.getTime() + advance);
      if (this.currentDate >= this.endDate) {
        this.currentDate = new Date(this.startDate);
      }
      const pct = (this.currentDate.getTime() - this.startDate.getTime()) / totalMs;
      this.updatePlayhead(pct);
      this.notifyDateChange();
      this.animFrame = requestAnimationFrame(tick);
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  private stopPlayback(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  private notifyDateChange(): void {
    for (const cb of this.onDateCallbacks) {
      cb(this.currentDate);
    }
  }

  onDateChange(cb: (date: Date) => void): () => void {
    this.onDateCallbacks.push(cb);
    return () => {
      const idx = this.onDateCallbacks.indexOf(cb);
      if (idx >= 0) this.onDateCallbacks.splice(idx, 1);
    };
  }

  getCurrentDate(): Date { return this.currentDate; }
  getEvents(): TimelineEvent[] { return this.events; }

  addEvent(event: TimelineEvent): void {
    this.events.push(event);
    this.render();
    this.attachListeners();
  }

  destroy(): void {
    this.stopPlayback();
    this.onDateCallbacks = [];
    this.container.remove();
  }
}
