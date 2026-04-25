/**
 * TimelineReplay — Timeline scrubber for event replay
 * Records data snapshots, plays back minute-by-minute
 * Syncs all layers to common timeline
 */
import {
  Viewer, JulianDate, ClockRange, ClockStep,
  Color, Entity, Cartesian3, LabelStyle, Cartesian2,
  VerticalOrigin, PolylineGlowMaterialProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  timestamp: number; // epoch ms
  type: 'aircraft' | 'satellite' | 'maritime' | 'jamming' | 'no-fly' | 'incident';
  title: string;
  description: string;
  lat: number;
  lng: number;
  severity: 'info' | 'warning' | 'critical';
  data: Record<string, any>;
}

interface TimelineSnapshot {
  timestamp: number;
  events: TimelineEvent[];
  layerStates: Record<string, boolean>;
}

// ─── Demo Timeline Events ────────────────────────────────────────────────────

const DEMO_EVENTS: TimelineEvent[] = [
  { id: 'te-1', timestamp: Date.now() - 3600000, type: 'aircraft', title: 'IAF Scramble — VIPER1', description: 'Su-30MKI scrambled from Jodhpur AFS. Heading towards LoC.', lat: 24.6, lng: 76.2, severity: 'warning', data: { callsign: 'IAF-VIPER1', aircraft: 'Su-30MKI' } },
  { id: 'te-2', timestamp: Date.now() - 3000000, type: 'jamming', title: 'GPS Jamming — LoC Poonch', description: 'High-severity GPS denial detected along LoC Poonch sector. Multiple aircraft reports.', lat: 33.8, lng: 74.2, severity: 'critical', data: { severity: 'high', duration: 'ongoing' } },
  { id: 'te-3', timestamp: Date.now() - 2400000, type: 'maritime', title: 'INS Kolkata — Patrol', description: 'INS Kolkata (D63) conducting patrol in Arabian Sea. Speed 22 knots.', lat: 15.0, lng: 73.5, severity: 'info', data: { vessel: 'INS Kolkata', type: 'destroyer' } },
  { id: 'te-4', timestamp: Date.now() - 1800000, type: 'satellite', title: 'CARTOSAT-3 Pass', description: 'Cartosat-3 imaging pass over Ladakh sector. Resolution: 0.25m.', lat: 34.5, lng: 77.5, severity: 'info', data: { satellite: 'CARTOSAT-3', resolution: '0.25m' } },
  { id: 'te-5', timestamp: Date.now() - 1200000, type: 'incident', title: 'Border Alert — Tawang', description: 'Unusual activity detected near Tawang sector. Indian Army on high alert.', lat: 27.6, lng: 91.9, severity: 'warning', data: { alertLevel: 'HIGH' } },
  { id: 'te-6', timestamp: Date.now() - 900000, type: 'aircraft', title: 'NAVY-P8I Maritime Patrol', description: 'P-8I Poseidon maritime patrol from INS Rajali. ASW mission.', lat: 10.8, lng: 76.2, severity: 'info', data: { callsign: 'NAVY-P8I', aircraft: 'P-8I Poseidon' } },
  { id: 'te-7', timestamp: Date.now() - 600000, type: 'jamming', title: 'GPS Anomaly — Arabian Sea', description: 'GPS anomalies reported by merchant vessels in Arabian Sea. Possible spoofing.', lat: 15.0, lng: 68.0, severity: 'warning', data: { severity: 'medium', vessels_affected: 5 } },
  { id: 'te-8', timestamp: Date.now() - 300000, type: 'satellite', title: 'EMISAT ELINT Pass', description: 'EMISAT electronic intelligence pass over Pakistan border. Signal collection.', lat: 33.0, lng: 74.0, severity: 'info', data: { satellite: 'EMISAT', mission: 'ELINT' } },
  { id: 'te-9', timestamp: Date.now(), type: 'incident', title: 'Situation Normal', description: 'All sectors nominal. Monitoring continues.', lat: 22.0, lng: 78.0, severity: 'info', data: { status: 'nominal' } },
];

const SEVERITY_COLORS: Record<string, Color> = {
  info: Color.fromCssColorString('#2196f3'),
  warning: Color.fromCssColorString('#ff9800'),
  critical: Color.RED,
};

const TYPE_ICONS: Record<string, string> = {
  aircraft: '✈️', satellite: '🛰️', maritime: '🚢', jamming: '📡', 'no-fly': '🚫', incident: '⚡',
};

// ─── Layer Implementation ────────────────────────────────────────────────────

export class TimelineReplay {
  private viewer: Viewer;
  private events: TimelineEvent[] = [...DEMO_EVENTS];
  private snapshots: TimelineSnapshot[] = [];
  private currentIndex = 0;
  private playing = false;
  private playSpeed = 1; // 1x, 2x, 5x, 10x
  private playTimer: ReturnType<typeof setInterval> | null = null;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  getEvents(): TimelineEvent[] {
    return this.events.sort((a, b) => a.timestamp - b.timestamp);
  }

  getCurrentEvent(): TimelineEvent | null {
    return this.events[this.currentIndex] || null;
  }

  /** Jump to specific time in timeline */
  seekTo(timestamp: number): void {
    const idx = this.events.findIndex(e => e.timestamp >= timestamp);
    if (idx >= 0) {
      this.currentIndex = idx;
    }
  }

  /** Step forward one event */
  stepForward(): TimelineEvent | null {
    if (this.currentIndex < this.events.length - 1) {
      this.currentIndex++;
    }
    return this.events[this.currentIndex];
  }

  /** Step backward one event */
  stepBackward(): TimelineEvent | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    return this.events[this.currentIndex];
  }

  /** Play timeline automatically */
  play(speed = 1): void {
    this.playing = true;
    this.playSpeed = speed;
    if (this.playTimer) clearInterval(this.playTimer);
    this.playTimer = setInterval(() => {
      if (this.currentIndex >= this.events.length - 1) {
        this.pause();
        return;
      }
      this.stepForward();
    }, 2000 / speed);
  }

  /** Pause playback */
  pause(): void {
    this.playing = false;
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getProgress(): number {
    return this.events.length > 0 ? this.currentIndex / (this.events.length - 1) : 0;
  }

  /** Render timeline events on the globe */
  renderEvents(viewer: Viewer, dataSource: any): void {
    this.events.forEach((event, idx) => {
      const icon = TYPE_ICONS[event.type] || '📍';
      const color = SEVERITY_COLORS[event.severity];
      const isCurrent = idx === this.currentIndex;
      const isPast = idx < this.currentIndex;

      dataSource.entities.add({
        id: `timeline-${event.id}`,
        position: Cartesian3.fromDegrees(event.lng, event.lat, 5000),
        point: {
          pixelSize: isCurrent ? 16 : isPast ? 6 : 10,
          color: isCurrent ? Color.WHITE : isPast ? color.withAlpha(0.3) : color,
          outlineColor: color,
          outlineWidth: isCurrent ? 3 : 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: isCurrent ? `${icon} ${event.title}` : '',
          font: '12px monospace',
          fillColor: color,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -18),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.85)'),
        },
        description: `
<div style="font-family:monospace;color:#0ff;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${color.toCssColorString()};margin:0 0 8px 0;">${icon} ${event.title}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>Time:</td><td style="color:#0ff;">${new Date(event.timestamp).toISOString()}</td></tr>
    <tr><td>Type:</td><td style="color:#0ff;">${event.type.toUpperCase()}</td></tr>
    <tr><td>Severity:</td><td style="color:${color.toCssColorString()};">${event.severity.toUpperCase()}</td></tr>
    <tr><td>Location:</td><td style="color:#0ff;">${event.lat.toFixed(2)}°N, ${event.lng.toFixed(2)}°E</td></tr>
  </table>
  <p style="margin:8px 0 0;font-size:12px;color:#ccc;">${event.description}</p>
  <pre style="margin:6px 0 0;font-size:11px;color:#888;">${JSON.stringify(event.data, null, 2)}</pre>
</div>`,
      });

      // Connect events with timeline line
      if (idx > 0) {
        const prev = this.events[idx - 1];
        dataSource.entities.add({
          id: `timeline-line-${event.id}`,
          polyline: {
            positions: [
              Cartesian3.fromDegrees(prev.lng, prev.lat, 3000),
              Cartesian3.fromDegrees(event.lng, event.lat, 3000),
            ],
            width: 1,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.1,
              color: Color.fromCssColorString('#00e5ff').withAlpha(0.3),
            }),
          },
        });
      }
    });
  }

  /** Generate timeline scrubber HTML for UI */
  getScrubberHTML(): string {
    const events = this.getEvents();
    const start = events[0]?.timestamp || Date.now();
    const end = events[events.length - 1]?.timestamp || Date.now();
    const duration = end - start;

    const eventMarkers = events.map((e, i) => {
      const pct = ((e.timestamp - start) / duration) * 100;
      const color = e.severity === 'critical' ? '#f44' : e.severity === 'warning' ? '#ff9800' : '#2196f3';
      return `<div class="timeline-marker" style="left:${pct}%;background:${color};" title="${e.title}"></div>`;
    }).join('');

    const currentPct = this.events.length > 0
      ? ((this.events[this.currentIndex].timestamp - start) / duration) * 100
      : 0;

    return `
<div class="timeline-scrubber" style="position:relative;height:60px;background:#111;border:1px solid #333;border-radius:4px;padding:8px 12px;">
  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
    <span style="color:#0ff;font:11px monospace;">${new Date(start).toLocaleTimeString()}</span>
    <span style="color:#ff0;font:12px monospace;font-weight:bold;">${this.getCurrentEvent()?.title || '—'}</span>
    <span style="color:#0ff;font:11px monospace;">${new Date(end).toLocaleTimeString()}</span>
  </div>
  <div style="position:relative;height:20px;background:#222;border-radius:2px;cursor:pointer;">
    <div style="position:absolute;left:${currentPct}%;top:0;width:2px;height:100%;background:#0ff;z-index:2;"></div>
    ${eventMarkers}
  </div>
  <div style="display:flex;gap:8px;margin-top:4px;">
    <button onclick="timeline.stepBackward()" style="background:#333;color:#0ff;border:1px solid #555;padding:2px 8px;cursor:pointer;">◀◀</button>
    <button onclick="timeline.play()" style="background:#333;color:#0f0;border:1px solid #555;padding:2px 8px;cursor:pointer;">▶</button>
    <button onclick="timeline.pause()" style="background:#333;color:#f00;border:1px solid #555;padding:2px 8px;cursor:pointer;">⏸</button>
    <button onclick="timeline.stepForward()" style="background:#333;color:#0ff;border:1px solid #555;padding:2px 8px;cursor:pointer;">▶▶</button>
    <span style="color:#888;font:11px monospace;margin-left:auto;">${Math.round(this.getProgress() * 100)}%</span>
  </div>
</div>`;
  }
}
