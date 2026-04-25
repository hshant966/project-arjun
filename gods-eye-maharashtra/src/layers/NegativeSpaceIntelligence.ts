/**
 * NegativeSpaceIntelligence — "What disappears is the intel"
 * Bilawal's key technique: transponder gaps, GPS confidence drops,
 * airspace emptying patterns
 */
import {
  Viewer, Cartesian3, Color, Entity, CallbackProperty,
  HeightReference, Cartesian2, LabelStyle,
  VerticalOrigin, NearFarScalar, ConstantProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

// Simulated transponder gap events (aircraft that "went dark")
const TRANSPONDER_GAPS = [
  { id: 'TG-001', lat: 28.6, lon: 77.2, callSign: 'IGO-2341', lastSeen: '2024-03-15T04:22:00Z', duration: 47, threat: 'high' },
  { id: 'TG-002', lat: 19.1, lon: 72.9, callSign: 'AIC-1087', lastSeen: '2024-06-20T14:05:00Z', duration: 23, threat: 'medium' },
  { id: 'TG-003', lat: 13.0, lon: 80.3, callSign: 'SIX-445', lastSeen: '2024-09-10T22:18:00Z', duration: 65, threat: 'high' },
  { id: 'TG-004', lat: 22.6, lon: 88.4, callSign: 'VT-ALX', lastSeen: '2024-11-02T03:44:00Z', duration: 12, threat: 'low' },
  { id: 'TG-005', lat: 26.9, lon: 75.8, callSign: 'GOW-776', lastSeen: '2025-01-18T09:30:00Z', duration: 38, threat: 'medium' },
  { id: 'TG-006', lat: 17.4, lon: 78.5, callSign: 'AXB-302', lastSeen: '2025-03-05T17:12:00Z', duration: 91, threat: 'critical' },
  { id: 'TG-007', lat: 23.0, lon: 72.6, callSign: 'IGO-6890', lastSeen: '2025-04-12T01:55:00Z', duration: 15, threat: 'low' },
  { id: 'TG-008', lat: 12.3, lon: 76.6, callSign: 'VT-XYZ', lastSeen: '2025-04-20T06:08:00Z', duration: 52, threat: 'high' },
];

// GPS confidence drop zones (simulated heatmap data)
const GPS_CONFIDENCE_ZONES = [
  { lat: 28.6139, lon: 77.2090, confidence: 0.23, radius: 50000, label: 'Delhi NCR — Heavy Jamming' },
  { lat: 19.0760, lon: 72.8777, confidence: 0.45, radius: 30000, label: 'Mumbai — Intermittent' },
  { lat: 13.0827, lon: 80.2707, confidence: 0.31, radius: 40000, label: 'Chennai — Signal Degradation' },
  { lat: 22.5726, lon: 88.3639, confidence: 0.55, radius: 25000, label: 'Kolkata — Moderate' },
  { lat: 17.3850, lon: 78.4867, confidence: 0.18, radius: 35000, label: 'Hyderabad — Active Jamming' },
  { lat: 34.0, lon: 74.8, confidence: 0.08, radius: 80000, label: 'Kashmir — Severely Degraded' },
  { lat: 24.5, lon: 73.7, confidence: 0.62, radius: 60000, label: 'Rajasthan Border — Low Confidence' },
];

// Airspace emptying events — "When 3,400 flights simultaneously clear..."
const AIRSPACE_EVENTS = [
  { name: 'Northern Airspace Clearing', centerLat: 30.0, centerLon: 77.0, radius: 200000, flightsCleared: 3400, date: '2024-02-26', significance: 'Pre-strike airspace sanitization' },
  { name: 'Western Sector Empty', centerLat: 24.0, centerLon: 69.0, radius: 150000, flightsCleared: 1800, date: '2024-08-15', significance: 'Exercise or operational preparation' },
  { name: 'Bay of Bengal Corridor', centerLat: 15.0, centerLon: 85.0, radius: 180000, flightsCleared: 920, date: '2025-01-20', significance: 'Naval exercise airspace reservation' },
];

export class NegativeSpaceIntelligence extends BaseLayer {
  config: LayerConfig = {
    id: 'negative-space',
    name: 'Negative Space Intel',
    icon: '🕳️',
    description: '"What disappears is the intel" — transponder gaps, GPS drops, airspace emptying',
    category: 'intelligence',
    color: '#FF4444',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'negative-space',
  };

  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore);
  }

  protected async loadData(): Promise<void> {
    this.loadTransponderGaps();
    this.loadGPSConfidenceDrops();
    this.loadAirspaceEmptying();
  }

  private loadTransponderGaps(): void {
    const threatColors: Record<string, Color> = {
      low: Color.YELLOW.withAlpha(0.6),
      medium: Color.ORANGE.withAlpha(0.7),
      high: Color.RED.withAlpha(0.8),
      critical: Color.fromCssColorString('#FF0044').withAlpha(0.9),
    };

    for (const gap of TRANSPONDER_GAPS) {
      const pos = Cartesian3.fromDegrees(gap.lon, gap.lat, 10000);

      // Pulsing danger zone circle
      this.dataSource.entities.add({
        name: `Transponder Gap: ${gap.callSign}`,
        position: pos,
        point: {
          pixelSize: new CallbackProperty(() => {
            const t = Date.now() * 0.003;
            return 8 + Math.sin(t) * 4;
          }, false) as any,
          color: threatColors[gap.threat],
          outlineColor: Color.WHITE.withAlpha(0.5),
          outlineWidth: 1,
          heightReference: HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${gap.callSign}\n🔇 ${gap.duration}min dark\n⚠️ ${gap.threat.toUpperCase()}`,
          font: '11px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -15),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.7),
        },
        description: `
          <div style="font-family:monospace">
            <b>Transponder Gap Report</b><br/>
            Callsign: ${gap.callSign}<br/>
            Last Seen: ${gap.lastSeen}<br/>
            Duration: ${gap.duration} minutes<br/>
            Threat Level: ${gap.threat}<br/>
            <i>Aircraft went dark — transponder ceased broadcasting</i>
          </div>
        `,
      });

      // Expanding ring animation (search area)
      this.dataSource.entities.add({
        name: `${gap.callSign} Search Ring`,
        position: pos,
        ellipse: {
          semiMajorAxis: new CallbackProperty(() => {
            const t = (Date.now() % 10000) / 10000;
            return 20000 + t * 80000;
          }, false) as any,
          semiMinorAxis: new CallbackProperty(() => {
            const t = (Date.now() % 10000) / 10000;
            return 20000 + t * 80000;
          }, false) as any,
          material: threatColors[gap.threat].withAlpha(0.15),
          outline: true,
          outlineColor: threatColors[gap.threat].withAlpha(0.4),
          heightReference: HeightReference.NONE,
        },
      });
    }
  }

  private loadGPSConfidenceDrops(): void {
    for (const zone of GPS_CONFIDENCE_ZONES) {
      const pos = Cartesian3.fromDegrees(zone.lon, zone.lat, 0);

      // Confidence heatmap circle — color based on confidence
      const conf = zone.confidence;
      const heatColor = conf < 0.2
        ? Color.RED.withAlpha(0.5)
        : conf < 0.4
          ? Color.ORANGE.withAlpha(0.4)
          : conf < 0.6
            ? Color.YELLOW.withAlpha(0.3)
            : Color.GREEN.withAlpha(0.2);

      this.dataSource.entities.add({
        name: `GPS Confidence: ${zone.label}`,
        position: pos,
        ellipse: {
          semiMajorAxis: zone.radius,
          semiMinorAxis: zone.radius,
          material: heatColor,
          outline: true,
          outlineColor: heatColor.withAlpha(0.8),
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `📡 GPS: ${Math.round(conf * 100)}%\n${zone.label}`,
          font: '12px monospace',
          fillColor: conf < 0.3 ? Color.RED : Color.YELLOW,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.8),
          scale: 0.9,
        },
      });
    }
  }

  private loadAirspaceEmptying(): void {
    for (const event of AIRSPACE_EVENTS) {
      const pos = Cartesian3.fromDegrees(event.centerLon, event.centerLat, 0);

      // Large warning zone
      this.dataSource.entities.add({
        name: `Airspace Clearing: ${event.name}`,
        position: pos,
        ellipse: {
          semiMajorAxis: event.radius,
          semiMinorAxis: event.radius,
          material: Color.fromCssColorString('#FF6600').withAlpha(0.12),
          outline: true,
          outlineColor: Color.fromCssColorString('#FF6600').withAlpha(0.5),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: `⚠️ ${event.name}\n${event.flightsCleared} flights cleared\n${event.date}\n"${event.significance}"`,
          font: '13px monospace',
          fillColor: Color.fromCssColorString('#FF8800'),
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.85),
        },
        description: `
          <div style="font-family:monospace">
            <b>🚨 Airspace Emptying Event</b><br/>
            ${event.name}<br/>
            Date: ${event.date}<br/>
            Flights Cleared: ${event.flightsCleared.toLocaleString()}<br/>
            Area: ${event.radius / 1000}km radius<br/>
            Significance: ${event.significance}<br/>
            <i>"When 3,400 flights simultaneously clear an airspace, you know what's coming."</i>
          </div>
        `,
      });
    }
  }
}
