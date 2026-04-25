/**
 * MultiLayerDataFusion — Unified timeline + correlation engine
 * Cross-references events across all data layers
 * "When earthquake happens, show related news, infrastructure damage, etc."
 */
import { Viewer, Cartesian3, Color, Entity, LabelStyle, VerticalOrigin, Cartesian2 } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

export interface FusedEvent {
  id: string;
  timestamp: Date;
  title: string;
  source: string;       // which layer generated this
  category: string;
  lat: number;
  lon: number;
  severity: number;     // 0-1
  relatedIds: string[];  // correlated event IDs
  description: string;
}

// Correlation rules — when event type A happens, look for related events
const CORRELATION_RULES = [
  {
    trigger: 'earthquake',
    related: ['infrastructure', 'health', 'disaster', 'news'],
    description: 'Earthquake → check infrastructure damage, health facilities, disaster response',
  },
  {
    trigger: 'flooding',
    related: ['weather', 'infrastructure', 'agriculture', 'disaster'],
    description: 'Flooding → check weather, road damage, crop impact, evacuation status',
  },
  {
    trigger: 'airspace-clearing',
    related: ['military', 'intelligence', 'flight-tracking', 'satellite'],
    description: 'Airspace cleared → check military movements, intel reports, satellite tasking',
  },
  {
    trigger: 'gps-jamming',
    related: ['intelligence', 'military', 'maritime', 'aviation'],
    description: 'GPS jamming → check military activity, maritime disruptions, aviation impacts',
  },
  {
    trigger: 'power-outage',
    related: ['infrastructure', 'health', 'water', 'crime'],
    description: 'Power outage → check hospitals, water supply, crime spikes',
  },
  {
    trigger: 'disease-outbreak',
    related: ['health', 'water', 'population', 'mobility'],
    description: 'Disease outbreak → check water quality, population density, movement patterns',
  },
];

// Simulated fused events
const FUSED_EVENTS: FusedEvent[] = [
  { id: 'F001', timestamp: new Date('2024-03-15T04:22:00Z'), title: 'Earthquake — NE India (M5.2)', source: 'disaster', category: 'earthquake', lat: 27.5, lon: 96.0, severity: 0.7, relatedIds: ['F002', 'F003'], description: 'Moderate earthquake in Arunachal Pradesh' },
  { id: 'F002', timestamp: new Date('2024-03-15T04:45:00Z'), title: 'Bridge inspection triggered', source: 'infrastructure', category: 'infrastructure', lat: 27.3, lon: 95.8, severity: 0.4, relatedIds: ['F001'], description: 'Automated bridge stress monitoring activated' },
  { id: 'F003', timestamp: new Date('2024-03-15T05:10:00Z'), title: 'Hospital surge protocol', source: 'health', category: 'health', lat: 27.1, lon: 95.5, severity: 0.5, relatedIds: ['F001'], description: 'Hospitals in range enter emergency readiness' },
  { id: 'F004', timestamp: new Date('2024-06-20T14:05:00Z'), title: 'GPS Jamming — Rajasthan Border', source: 'gps-jamming', category: 'gps-jamming', lat: 26.0, lon: 70.5, severity: 0.8, relatedIds: ['F005', 'F006'], description: 'Strong GPS interference detected' },
  { id: 'F005', timestamp: new Date('2024-06-20T14:15:00Z'), title: 'Maritime navigation alert', source: 'maritime', category: 'maritime', lat: 25.5, lon: 69.0, severity: 0.6, relatedIds: ['F004'], description: 'Ships switching to backup navigation' },
  { id: 'F006', timestamp: new Date('2024-06-20T14:20:00Z'), title: 'Satellite retasking — SIGINT', source: 'satellite', category: 'intelligence', lat: 26.5, lon: 71.0, severity: 0.9, relatedIds: ['F004'], description: 'SIGINT satellite repositioned to cover jamming source' },
  { id: 'F007', timestamp: new Date('2024-08-05T11:30:00Z'), title: 'Power Grid Failure — Maharashtra', source: 'power-grid', category: 'power-outage', lat: 19.5, lon: 75.0, severity: 0.85, relatedIds: ['F008', 'F009', 'F010'], description: 'Major grid collapse — 30M affected' },
  { id: 'F008', timestamp: new Date('2024-08-05T11:35:00Z'), title: 'Hospital backup generators', source: 'health', category: 'health', lat: 19.1, lon: 72.9, severity: 0.6, relatedIds: ['F007'], description: 'Hospitals switch to emergency power' },
  { id: 'F009', timestamp: new Date('2024-08-05T11:40:00Z'), title: 'Water pumping stations offline', source: 'water', category: 'infrastructure', lat: 19.3, lon: 73.5, severity: 0.7, relatedIds: ['F007'], description: 'Water supply disruption imminent' },
  { id: 'F010', timestamp: new Date('2024-08-05T12:00:00Z'), title: 'Crime spike — Mumbai', source: 'crime', category: 'crime', lat: 19.1, lon: 72.9, severity: 0.5, relatedIds: ['F007'], description: 'Police report 40% increase in incidents' },
  { id: 'F011', timestamp: new Date('2025-04-20T06:08:00Z'), title: 'Airspace Clearing — Northern Sector', source: 'negative-space', category: 'airspace-clearing', lat: 30.0, lon: 77.0, severity: 0.95, relatedIds: ['F012', 'F013'], description: '3,400 flights simultaneously rerouted' },
  { id: 'F012', timestamp: new Date('2025-04-20T06:15:00Z'), title: 'Military radar activation spike', source: 'intelligence', category: 'intelligence', lat: 30.5, lon: 77.5, severity: 0.9, relatedIds: ['F011'], description: 'Multiple radar installations report increased activity' },
  { id: 'F013', timestamp: new Date('2025-04-20T06:30:00Z'), title: 'Satellite constellation retasked', source: 'satellite', category: 'intelligence', lat: 29.5, lon: 76.5, severity: 0.85, relatedIds: ['F011'], description: 'IMINT assets redirected to Northern Sector' },
];

export class MultiLayerDataFusion extends BaseLayer {
  config: LayerConfig = {
    id: 'data-fusion',
    name: 'Data Fusion',
    icon: '🔗',
    description: 'Multi-layer correlation engine — cross-references events across all data sources',
    category: 'intelligence',
    color: '#FFD700',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'data-fusion',
  };

  private correlationPanel: HTMLElement | null = null;

  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore);
  }

  protected async loadData(): Promise<void> {
    // Plot all fused events on the globe
    for (const event of FUSED_EVENTS) {
      const severityColor = event.severity > 0.8
        ? Color.RED.withAlpha(0.9)
        : event.severity > 0.5
          ? Color.ORANGE.withAlpha(0.8)
          : Color.YELLOW.withAlpha(0.7);

      this.dataSource.entities.add({
        name: event.title,
        position: Cartesian3.fromDegrees(event.lon, event.lat, 5000),
        point: {
          pixelSize: 6 + event.severity * 10,
          color: severityColor,
          outlineColor: Color.WHITE.withAlpha(0.6),
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${event.title}\n[${event.source}]`,
          font: '11px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.7),
          scale: 0.85,
        },
        description: this.buildEventDescription(event),
      });

      // Draw correlation lines to related events
      for (const relId of event.relatedIds) {
        const related = FUSED_EVENTS.find(e => e.id === relId);
        if (related) {
          this.dataSource.entities.add({
            name: `Correlation: ${event.id} → ${relId}`,
            polyline: {
              positions: [
                Cartesian3.fromDegrees(event.lon, event.lat, 3000),
                Cartesian3.fromDegrees(related.lon, related.lat, 3000),
              ],
              width: 1.5,
              material: Color.fromCssColorString('#FFD700').withAlpha(0.3),
            },
          });
        }
      }
    }

    // Build correlation panel UI
    this.createCorrelationPanel();
  }

  private buildEventDescription(event: FusedEvent): string {
    const relatedEvents = event.relatedIds
      .map(id => FUSED_EVENTS.find(e => e.id === id))
      .filter(Boolean);

    const relatedHtml = relatedEvents.map(re => `
      <div style="margin:4px 0;padding:4px 8px;background:rgba(255,255,255,0.05);border-left:2px solid ${re!.severity > 0.7 ? '#FF4444' : '#FFAA00'}">
        <b>${re!.title}</b><br/>
        <span style="color:#888;font-size:10px">${re!.source} | Severity: ${(re!.severity * 100).toFixed(0)}%</span>
      </div>
    `).join('');

    return `
      <div style="font-family:monospace;padding:8px;max-width:350px">
        <h3 style="color:#FFD700;margin:0 0 8px">🔗 ${event.title}</h3>
        <p><b>Source:</b> ${event.source}</p>
        <p><b>Time:</b> ${event.timestamp.toISOString()}</p>
        <p><b>Severity:</b> <span style="color:${event.severity > 0.8 ? '#FF4444' : event.severity > 0.5 ? '#FFAA00' : '#FFFF00'}">${(event.severity * 100).toFixed(0)}%</span></p>
        <p>${event.description}</p>
        ${relatedHtml ? `<hr/><p><b>🔗 Correlated Events:</b></p>${relatedHtml}` : ''}
      </div>
    `;
  }

  private createCorrelationPanel(): void {
    this.correlationPanel = document.createElement('div');
    this.correlationPanel.id = 'correlation-panel';
    this.correlationPanel.innerHTML = `
      <style>
        #correlation-panel {
          position: absolute; top: 80px; left: 20px;
          width: 280px; max-height: 500px; overflow-y: auto;
          background: rgba(10,10,20,0.92); border: 1px solid rgba(255,215,0,0.2);
          border-radius: 8px; padding: 12px; z-index: 100;
          backdrop-filter: blur(10px); display: none;
        }
        #correlation-panel::-webkit-scrollbar { width: 4px; }
        #correlation-panel::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 2px; }
        .corr-title { font-size: 13px; color: #FFD700; font-weight: 600; margin-bottom: 10px; }
        .corr-rule {
          margin-bottom: 8px; padding: 8px;
          background: rgba(255,255,255,0.03); border-radius: 4px;
          border-left: 3px solid #FFD700;
        }
        .corr-rule-trigger { font-size: 11px; color: #FFD700; font-weight: 600; }
        .corr-rule-related { font-size: 10px; color: #888; margin-top: 4px; }
        .corr-event {
          margin: 4px 0; padding: 6px 8px;
          background: rgba(255,255,255,0.03); border-radius: 4px;
          font-size: 10px; cursor: pointer; transition: all 0.2s;
        }
        .corr-event:hover { background: rgba(255,215,0,0.08); }
        .corr-event-title { color: #ddd; font-weight: 600; }
        .corr-event-meta { color: #666; margin-top: 2px; }
      </style>
      <div class="corr-title">🔗 Data Fusion — Correlation Engine</div>
      <div style="margin-bottom:10px;font-size:10px;color:#888">
        Cross-references events across all intelligence layers.
        Click an event to fly to it.
      </div>
      ${CORRELATION_RULES.map(rule => `
        <div class="corr-rule">
          <div class="corr-rule-trigger">IF: ${rule.trigger}</div>
          <div class="corr-rule-related">→ Check: ${rule.related.join(', ')}</div>
          <div style="font-size:9px;color:#555;margin-top:3px;font-style:italic">${rule.description}</div>
        </div>
      `).join('')}
      <hr style="border-color:rgba(255,255,255,0.05);margin:10px 0"/>
      <div style="font-size:10px;color:#FFD700;margin-bottom:6px">📋 Active Correlations</div>
      ${FUSED_EVENTS.filter(e => e.relatedIds.length > 0).map(event => `
        <div class="corr-event" data-lon="${event.lon}" data-lat="${event.lat}">
          <div class="corr-event-title">${event.title}</div>
          <div class="corr-event-meta">
            ${event.source} | ${event.timestamp.toLocaleDateString()} | Severity: ${(event.severity * 100).toFixed(0)}%
            ${event.relatedIds.length > 0 ? ` | 🔗 ${event.relatedIds.length} linked` : ''}
          </div>
        </div>
      `).join('')}
    `;

    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay) uiOverlay.appendChild(this.correlationPanel);
    else document.body.appendChild(this.correlationPanel);

    // Click handlers for events
    this.correlationPanel.querySelectorAll('.corr-event').forEach(el => {
      el.addEventListener('click', () => {
        const lon = parseFloat((el as HTMLElement).dataset.lon!);
        const lat = parseFloat((el as HTMLElement).dataset.lat!);
        this.viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(lon, lat, 200000),
          duration: 1.5,
        });
      });
    });
  }

  async enable(): Promise<void> {
    await super.enable();
    if (this.correlationPanel) this.correlationPanel.style.display = 'block';
  }

  async disable(): Promise<void> {
    if (this.correlationPanel) this.correlationPanel.style.display = 'none';
    await super.disable();
  }
}
