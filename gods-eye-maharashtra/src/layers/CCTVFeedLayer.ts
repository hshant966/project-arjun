/**
 * CCTVFeedLayer — Mock CCTV camera positions for Indian cities
 * Shows camera icons on map with simulated feed panels
 */
import {
  Viewer, Cartesian3, Color, Entity, CallbackProperty,
  HeightReference, Cartesian2, LabelStyle, VerticalOrigin,
  ScreenSpaceEventHandler, ScreenSpaceEventType,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

// Mock CCTV camera positions — major Indian cities
const CCTV_CAMERAS = [
  // Delhi
  { id: 'DEL-001', name: 'Connaught Place', lat: 28.6315, lon: 77.2167, city: 'Delhi', type: 'traffic', status: 'online' },
  { id: 'DEL-002', name: 'India Gate', lat: 28.6129, lon: 77.2295, city: 'Delhi', type: 'monument', status: 'online' },
  { id: 'DEL-003', name: 'Red Fort', lat: 28.6562, lon: 77.2410, city: 'Delhi', type: 'security', status: 'online' },
  { id: 'DEL-004', name: 'Parliament Street', lat: 28.6172, lon: 77.2089, city: 'Delhi', type: 'govt', status: 'online' },
  { id: 'DEL-005', name: 'IGI Airport Approach', lat: 28.5562, lon: 77.1000, city: 'Delhi', type: 'airport', status: 'online' },
  { id: 'DEL-006', name: 'Chandni Chowk', lat: 28.6506, lon: 77.2303, city: 'Delhi', type: 'market', status: 'offline' },

  // Mumbai
  { id: 'MUM-001', name: 'Gateway of India', lat: 18.9220, lon: 72.8347, city: 'Mumbai', type: 'monument', status: 'online' },
  { id: 'MUM-002', name: 'Marine Drive', lat: 18.9432, lon: 72.8234, city: 'Mumbai', type: 'traffic', status: 'online' },
  { id: 'MUM-003', name: 'CST Station', lat: 18.9398, lon: 72.8355, city: 'Mumbai', type: 'transit', status: 'online' },
  { id: 'MUM-004', name: 'Bandra-Worli Sea Link', lat: 19.0300, lon: 72.8150, city: 'Mumbai', type: 'traffic', status: 'online' },
  { id: 'MUM-005', name: 'CSIA Terminal 2', lat: 19.0896, lon: 72.8656, city: 'Mumbai', type: 'airport', status: 'online' },

  // Bangalore
  { id: 'BLR-001', name: 'MG Road', lat: 12.9758, lon: 77.6068, city: 'Bangalore', type: 'traffic', status: 'online' },
  { id: 'BLR-002', name: 'Vidhana Soudha', lat: 12.9795, lon: 77.5907, city: 'Bangalore', type: 'govt', status: 'online' },
  { id: 'BLR-003', name: 'Electronic City', lat: 12.8458, lon: 77.6559, city: 'Bangalore', type: 'tech', status: 'online' },
  { id: 'BLR-004', name: 'Kempegowda Airport', lat: 13.1986, lon: 77.7066, city: 'Bangalore', type: 'airport', status: 'online' },
  { id: 'BLR-005', name: 'Silk Board Junction', lat: 12.9172, lon: 77.6228, city: 'Bangalore', type: 'traffic', status: 'offline' },

  // Chennai
  { id: 'CHE-001', name: 'Marina Beach', lat: 13.0499, lon: 80.2824, city: 'Chennai', type: 'public', status: 'online' },
  { id: 'CHE-002', name: 'Central Station', lat: 13.0827, lon: 80.2707, city: 'Chennai', type: 'transit', status: 'online' },

  // Kolkata
  { id: 'KOL-001', name: 'Howrah Bridge', lat: 22.5851, lon: 88.3467, city: 'Kolkata', type: 'traffic', status: 'online' },
  { id: 'KOL-002', name: 'Victoria Memorial', lat: 22.5449, lon: 88.3426, city: 'Kolkata', type: 'monument', status: 'online' },
];

const TYPE_COLORS: Record<string, string> = {
  traffic: '#00AAFF',
  monument: '#FFD700',
  security: '#FF4444',
  govt: '#FF8800',
  airport: '#00FF88',
  transit: '#AA66FF',
  market: '#FF66AA',
  public: '#88DDFF',
  tech: '#00FFCC',
};

export class CCTVFeedLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'cctv-feeds',
    name: 'CCTV Feeds',
    icon: '📹',
    description: 'CCTV camera positions across Delhi, Mumbai, Bangalore, Chennai & Kolkata',
    category: 'intelligence',
    color: '#00AAFF',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'cctv-feeds',
  };

  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore);
  }

  protected async loadData(): Promise<void> {
    for (const cam of CCTV_CAMERAS) {
      const pos = Cartesian3.fromDegrees(cam.lon, cam.lat, 100);
      const typeColor = Color.fromCssColorString(TYPE_COLORS[cam.type] || '#888888');
      const isOnline = cam.status === 'online';

      // Camera icon — pulsing for online, dim for offline
      this.dataSource.entities.add({
        name: `CCTV: ${cam.name}`,
        position: pos,
        billboard: {
          image: this.createCameraIcon(TYPE_COLORS[cam.type] || '#888', isOnline),
          width: 28,
          height: 28,
          verticalOrigin: VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cartesian2(1e5, 1.0, 1e7, 0.5),
        },
        point: {
          pixelSize: new CallbackProperty(() => {
            if (!isOnline) return 6;
            const t = Date.now() * 0.004;
            return 8 + Math.sin(t) * 2;
          }, false) as any,
          color: isOnline ? typeColor.withAlpha(0.6) : Color.GRAY.withAlpha(0.3),
          outlineColor: Color.WHITE.withAlpha(isOnline ? 0.5 : 0.2),
          outlineWidth: 1,
          heightReference: HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          show: false, // hidden when billboard is shown
        },
        label: {
          text: `📹 ${cam.name}\n${cam.city} | ${cam.type} | ${cam.status === 'online' ? '🟢 LIVE' : '🔴 OFFLINE'}`,
          font: '11px monospace',
          fillColor: isOnline ? Color.WHITE : Color.GRAY,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.75),
          scale: 0.85,
        },
        description: `
          <div style="font-family:monospace;padding:8px">
            <h3 style="color:${TYPE_COLORS[cam.type]}">📹 ${cam.name}</h3>
            <p><b>City:</b> ${cam.city}</p>
            <p><b>Type:</b> ${cam.type}</p>
            <p><b>Camera ID:</b> ${cam.id}</p>
            <p><b>Status:</b> ${cam.status === 'online' ? '🟢 Online — Live Feed' : '🔴 Offline'}</p>
            <p><b>Coordinates:</b> ${cam.lat.toFixed(4)}°N, ${cam.lon.toFixed(4)}°E</p>
            <hr/>
            <p style="color:#888;font-size:11px">
              ${isOnline ? 'Simulated feed — connect to public traffic camera APIs for live streams' : 'Camera offline — last ping failed'}
            </p>
          </div>
        `,
      });

      // Coverage cone (field of view indicator)
      if (isOnline) {
        this.dataSource.entities.add({
          name: `${cam.name} FOV`,
          position: pos,
          cone: {
            // Cesium doesn't have native cone, use a small ellipse as coverage indicator
          },
          ellipse: {
            semiMajorAxis: 200,
            semiMinorAxis: 150,
            material: typeColor.withAlpha(0.08),
            outline: true,
            outlineColor: typeColor.withAlpha(0.25),
            heightReference: HeightReference.CLAMP_TO_GROUND,
          },
        } as any);
      }
    }

    // Add a small simulated "feed panel" overlay in the DOM
    this.createFeedPanel();
  }

  private createCameraIcon(color: string, online: boolean): string {
    // Create a simple SVG camera icon as a data URL
    const fillColor = online ? color : '#555555';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="13" fill="rgba(0,0,0,0.6)" stroke="${fillColor}" stroke-width="1.5"/>
      <rect x="8" y="10" width="10" height="8" rx="1.5" fill="${fillColor}" opacity="0.8"/>
      <circle cx="13" cy="14" r="2.5" fill="rgba(0,0,0,0.5)"/>
      ${online ? `<circle cx="20" cy="8" r="3" fill="#00FF00" opacity="0.8"/>` : `<circle cx="20" cy="8" r="3" fill="#FF0000" opacity="0.5"/>`}
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  private createFeedPanel(): void {
    // Create a floating CCTV panel in the UI
    const panel = document.createElement('div');
    panel.id = 'cctv-feed-panel';
    panel.innerHTML = `
      <style>
        #cctv-feed-panel {
          position: absolute; top: 80px; right: 20px;
          width: 240px; background: rgba(10,10,20,0.92);
          border: 1px solid rgba(0,170,255,0.3); border-radius: 8px;
          padding: 10px; z-index: 100; display: none;
          backdrop-filter: blur(10px);
        }
        .cctv-title { font-size: 12px; color: #00AAFF; font-weight: 600; margin-bottom: 8px; }
        .cctv-feed { margin-bottom: 8px; }
        .cctv-feed-header {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; color: #aaa; margin-bottom: 4px;
        }
        .cctv-feed-box {
          width: 100%; height: 100px; background: #111;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: #444; overflow: hidden; position: relative;
        }
        .cctv-feed-box.online {
          background: linear-gradient(135deg, #0a1a0a, #0a0a1a);
          animation: cctv-scan 3s ease-in-out infinite;
        }
        .cctv-feed-box .live-badge {
          position: absolute; top: 4px; right: 4px;
          background: #FF0000; color: white; font-size: 8px;
          padding: 1px 4px; border-radius: 2px; font-weight: bold;
        }
        @keyframes cctv-scan {
          0%, 100% { border-color: rgba(0,170,255,0.2); }
          50% { border-color: rgba(0,170,255,0.5); }
        }
      </style>
      <div class="cctv-title">📹 CCTV Feed Monitor</div>
      ${CCTV_CAMERAS.slice(0, 4).map(cam => `
        <div class="cctv-feed">
          <div class="cctv-feed-header">
            <span style="color:${TYPE_COLORS[cam.type]}">●</span>
            <span>${cam.city} — ${cam.name}</span>
          </div>
          <div class="cctv-feed-box ${cam.status === 'online' ? 'online' : ''}">
            ${cam.status === 'online'
              ? `<div class="live-badge">● LIVE</div><span style="color:#00AAFF40;font-size:24px">📹</span>`
              : '<span>NO SIGNAL</span>'}
          </div>
        </div>
      `).join('')}
    `;

    const uiOverlay = document.getElementById('ui-overlay');
    if (uiOverlay) uiOverlay.appendChild(panel);
    else document.body.appendChild(panel);
  }

  async enable(): Promise<void> {
    await super.enable();
    const panel = document.getElementById('cctv-feed-panel');
    if (panel) panel.style.display = 'block';
  }

  async disable(): Promise<void> {
    const panel = document.getElementById('cctv-feed-panel');
    if (panel) panel.style.display = 'none';
    await super.disable();
  }
}
