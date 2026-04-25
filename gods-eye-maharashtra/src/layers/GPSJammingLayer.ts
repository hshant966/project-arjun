/**
 * GPSJammingLayer — GPS interference zones and jamming visualization
 * Simulated jamming zones at India's borders with heatmap visualization
 * Historical jamming data points with severity indicators
 */
import {
  Viewer, Cartesian3, Color, Entity, VerticalOrigin,
  PolylineGlowMaterialProperty, HeightReference,
  NearFarScalar, CallbackProperty, LabelStyle, Cartesian2,
  PolygonHierarchy, EllipsoidGraphics, Material,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface JammingZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'military' | 'border' | 'electronic_warfare' | 'accidental';
  source: string;
  description: string;
  startDate: string;
  active: boolean;
}

interface JammingEvent {
  id: string;
  lat: number;
  lng: number;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: string;
  affectedArea: string;
  description: string;
}

// ─── Demo Data — Known and simulated GPS interference zones ──────────────────

const JAMMING_ZONES: JammingZone[] = [
  // Pakistan border - LoC area
  { id: 'jz-1', name: 'LoC - Poonch Sector EW Zone', lat: 33.8, lng: 74.2, radiusKm: 35, severity: 'high', type: 'border', source: 'Pakistan Army EW Units', description: 'Persistent GPS denial along LoC. Known electronic warfare activity.', startDate: '2019-02-01', active: true },
  { id: 'jz-2', name: 'LoC - Uri Sector Jamming', lat: 34.1, lng: 74.0, radiusKm: 20, severity: 'medium', type: 'border', source: 'Mixed', description: 'Intermittent GPS jamming affecting civilian aircraft approaches.', startDate: '2020-06-01', active: true },
  { id: 'jz-3', name: 'Sir Creek EW Zone', lat: 24.0, lng: 68.8, radiusKm: 40, severity: 'high', type: 'border', source: 'Pakistan Navy', description: 'Maritime GPS denial in disputed waters. Affects fishing and cargo vessels.', startDate: '2021-03-01', active: true },
  { id: 'jz-4', name: 'Punjab Border Jamming Belt', lat: 31.5, lng: 74.5, radiusKm: 25, severity: 'medium', type: 'border', source: 'Mixed', description: 'Cross-border GPS interference during heightened tensions.', startDate: '2023-01-01', active: true },

  // China border - LAC
  { id: 'jz-5', name: 'Depsang Plains EW Zone', lat: 35.5, lng: 78.0, radiusKm: 30, severity: 'critical', type: 'electronic_warfare', source: 'PLA EW Units', description: 'Active electronic warfare zone near LAC. GPS/GLONASS denial confirmed.', startDate: '2020-05-01', active: true },
  { id: 'jz-6', name: 'Pangong Tso Jamming', lat: 33.7, lng: 78.7, radiusKm: 25, severity: 'high', type: 'electronic_warfare', source: 'PLA EW Units', description: 'GPS interference around Pangong Lake. Both GPS and BeiDou affected.', startDate: '2020-06-01', active: true },
  { id: 'jz-7', name: 'Tawang EW Zone', lat: 27.6, lng: 91.9, radiusKm: 30, severity: 'high', type: 'electronic_warfare', source: 'PLA', description: 'Electronic warfare activity near Arunachal Pradesh border.', startDate: '2022-12-01', active: true },
  { id: 'jz-8', name: 'Chumbi Valley Jamming', lat: 27.9, lng: 88.8, radiusKm: 20, severity: 'medium', type: 'electronic_warfare', source: 'PLA', description: 'Intermittent GPS jamming near Sikkim border.', startDate: '2023-05-01', active: true },
  { id: 'jz-9', name: 'Ladakh Sector EW Corridor', lat: 34.5, lng: 77.5, radiusKm: 45, severity: 'critical', type: 'electronic_warfare', source: 'PLA EW Units', description: 'Wide-area GPS denial corridor along LAC. Severe impact on navigation.', startDate: '2020-05-01', active: true },

  // Indian military zones (training/testing)
  { id: 'jz-10', name: 'Pokhran Test Range', lat: 27.1, lng: 71.8, radiusKm: 15, severity: 'low', type: 'military', source: 'Indian Army', description: 'Periodic GPS denial during military exercises.', startDate: '2018-01-01', active: true },
  { id: 'jz-11', name: 'Andaman EW Training Zone', lat: 11.6, lng: 92.7, radiusKm: 20, severity: 'low', type: 'military', source: 'Indian Navy', description: 'Electronic warfare training area. Periodic GPS disruption.', startDate: '2021-01-01', active: true },
  { id: 'jz-12', name: 'Jaisalmer Exercise Zone', lat: 26.9, lng: 70.9, radiusKm: 18, severity: 'low', type: 'military', source: 'Indian Air Force', description: 'During exercises, GPS jamming simulated for EW training.', startDate: '2019-06-01', active: true },

  // Maritime zones
  { id: 'jz-13', name: 'Arabian Sea Anomaly Zone', lat: 15.0, lng: 68.0, radiusKm: 50, severity: 'medium', type: 'accidental', source: 'Unknown', description: 'Recurring GPS anomalies reported by merchant shipping. Possible spoofing.', startDate: '2023-08-01', active: true },
  { id: 'jz-14', name: 'Strait of Malacca Interference', lat: 4.0, lng: 100.0, radiusKm: 30, severity: 'medium', type: 'accidental', source: 'Mixed', description: 'GPS interference in congested shipping lane. Possibly deliberate spoofing.', startDate: '2022-01-01', active: true },
];

const JAMMING_EVENTS: JammingEvent[] = [
  { id: 'je-1', lat: 33.8, lng: 74.2, timestamp: '2024-01-15T08:30:00Z', severity: 'high', duration: '4 hours', affectedArea: 'Poonch-Rajouri corridor', description: 'Severe GPS jamming during LoC firing incident. Multiple aircraft reports.' },
  { id: 'je-2', lat: 35.5, lng: 78.0, timestamp: '2024-02-20T14:00:00Z', severity: 'critical', duration: '12 hours', affectedArea: 'Depsang-Burtse area', description: 'Wide-area GPS/GLONASS denial. PLA electronic warfare confirmed.' },
  { id: 'je-3', lat: 24.0, lng: 68.8, timestamp: '2024-03-10T06:00:00Z', severity: 'high', duration: '6 hours', affectedArea: 'Sir Creek maritime zone', description: 'Vessel navigation systems affected. Coast Guard scrambled.' },
  { id: 'je-4', lat: 33.7, lng: 78.7, timestamp: '2024-04-05T10:15:00Z', severity: 'medium', duration: '3 hours', affectedArea: 'Pangong area', description: 'Intermittent GPS interference during patrol season.' },
  { id: 'je-5', lat: 15.0, lng: 68.0, timestamp: '2024-05-12T22:00:00Z', severity: 'medium', duration: '8 hours', affectedArea: 'Arabian Sea corridor', description: 'Merchant vessels reporting GPS anomalies. Possible Iranian EW.' },
  { id: 'je-6', lat: 27.9, lng: 88.8, timestamp: '2024-06-01T04:30:00Z', severity: 'high', duration: '5 hours', affectedArea: 'Nathu La sector', description: 'Confirmed PLA jamming from Chumbi Valley. Border patrol affected.' },
  { id: 'je-7', lat: 27.6, lng: 91.9, timestamp: '2024-07-18T09:00:00Z', severity: 'high', duration: '7 hours', affectedArea: 'Tawang sector', description: 'Electronic warfare activity near LAC. Indian Army countermeasures deployed.' },
  { id: 'je-8', lat: 31.5, lng: 74.5, timestamp: '2024-08-25T16:45:00Z', severity: 'medium', duration: '2 hours', affectedArea: 'Amritsar sector', description: 'Brief GPS disruption affecting civilian aviation. Cause unclear.' },
];

// ─── Severity Color Mapping ─────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, { fill: Color; outline: Color; radius: number }> = {
  critical: { fill: Color.RED.withAlpha(0.35), outline: Color.RED, radius: 16 },
  high:     { fill: Color.fromCssColorString('#ff5722').withAlpha(0.3), outline: Color.fromCssColorString('#ff5722'), radius: 13 },
  medium:   { fill: Color.fromCssColorString('#ff9800').withAlpha(0.25), outline: Color.fromCssColorString('#ff9800'), radius: 10 },
  low:      { fill: Color.fromCssColorString('#ffeb3b').withAlpha(0.2), outline: Color.fromCssColorString('#ffeb3b'), radius: 8 },
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: '🔴 CRITICAL', high: '🟠 HIGH', medium: '🟡 MEDIUM', low: '🟢 LOW',
};

// ─── Layer Implementation ────────────────────────────────────────────────────

export class GPSJammingLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'gps-jamming',
    name: 'GPS Jamming Zones',
    icon: '📡',
    description: 'GPS interference visualization at India borders. Simulated EW zones and historical jamming events.',
    category: 'intelligence',
    color: '#ff5722',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'gpsJamming',
  };

  constructor(viewer: Viewer, dataStore: any) {
    super(viewer, dataStore);
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    this.clear();
    this.renderJammingZones();
    this.renderJammingEvents();
    this.renderHeatmapOverlay();
  }

  private renderJammingZones(): void {
    JAMMING_ZONES.forEach(zone => {
      const colors = SEVERITY_COLORS[zone.severity];
      const typeEmoji = zone.type === 'electronic_warfare' ? '⚔️' : zone.type === 'military' ? '🎖️' : zone.type === 'border' ? '🚧' : '⚠️';

      // Zone circle
      const positions: Cartesian3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const dLat = (zone.radiusKm / 111.32) * Math.cos(angle);
        const dLng = (zone.radiusKm / (111.32 * Math.cos(zone.lat * Math.PI / 180))) * Math.sin(angle);
        positions.push(Cartesian3.fromDegrees(zone.lng + dLng, zone.lat + dLat, 500));
      }

      this.dataSource.entities.add({
        id: `jz-zone-${zone.id}`,
        polygon: {
          hierarchy: new PolygonHierarchy(positions),
          material: colors.fill,
          outline: true,
          outlineColor: colors.outline.withAlpha(0.6),
          outlineWidth: 2,
          height: 500,
          heightReference: HeightReference.RELATIVE_TO_GROUND,
        },
      });

      // Center marker
      this.dataSource.entities.add({
        id: `jz-marker-${zone.id}`,
        position: Cartesian3.fromDegrees(zone.lng, zone.lat, 1000),
        point: {
          pixelSize: colors.radius,
          color: colors.outline,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${typeEmoji} ${zone.name}`,
          font: '11px monospace',
          fillColor: colors.outline,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -15),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.8)'),
        },
        description: `
<div style="font-family:monospace;color:#ff0;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${colors.outline.toCssColorString()};margin:0 0 8px 0;">${typeEmoji} ${zone.name}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>Severity:</td><td style="color:${colors.outline.toCssColorString()};">${SEVERITY_LABELS[zone.severity]}</td></tr>
    <tr><td>Type:</td><td style="color:#ff0;">${zone.type.replace(/_/g, ' ').toUpperCase()}</td></tr>
    <tr><td>Source:</td><td style="color:#ff0;">${zone.source}</td></tr>
    <tr><td>Radius:</td><td style="color:#ff0;">${zone.radiusKm} km</td></tr>
    <tr><td>Active:</td><td style="color:${zone.active ? '#f44' : '#4caf50'};">${zone.active ? 'YES' : 'NO'}</td></tr>
    <tr><td>Since:</td><td style="color:#ff0;">${zone.startDate}</td></tr>
    <tr><td>Location:</td><td style="color:#ff0;">${zone.lat.toFixed(2)}°N, ${zone.lng.toFixed(2)}°E</td></tr>
  </table>
  <p style="margin:8px 0 0;font-size:12px;color:#ccc;">${zone.description}</p>
</div>`,
      });
    });
  }

  private renderJammingEvents(): void {
    JAMMING_EVENTS.forEach(event => {
      const colors = SEVERITY_COLORS[event.severity];
      const sevIcon = SEVERITY_LABELS[event.severity];

      this.dataSource.entities.add({
        id: `je-event-${event.id}`,
        position: Cartesian3.fromDegrees(event.lng, event.lat, 2000),
        point: {
          pixelSize: 8,
          color: colors.outline.withAlpha(0.8),
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `⚡ ${event.id.toUpperCase()}`,
          font: '10px monospace',
          fillColor: colors.outline,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -10),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
<div style="font-family:monospace;color:#f00;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${colors.outline.toCssColorString()};margin:0 0 8px 0;">⚡ Jamming Event ${event.id.toUpperCase()}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>Severity:</td><td style="color:${colors.outline.toCssColorString()};">${sevIcon}</td></tr>
    <tr><td>Timestamp:</td><td style="color:#f00;">${event.timestamp}</td></tr>
    <tr><td>Duration:</td><td style="color:#f00;">${event.duration}</td></tr>
    <tr><td>Affected Area:</td><td style="color:#f00;">${event.affectedArea}</td></tr>
    <tr><td>Location:</td><td style="color:#f00;">${event.lat.toFixed(2)}°N, ${event.lng.toFixed(2)}°E</td></tr>
  </table>
  <p style="margin:8px 0 0;font-size:12px;color:#ccc;">${event.description}</p>
</div>`,
      });
    });
  }

  private renderHeatmapOverlay(): void {
    // Add larger, more diffuse heat circles for visual impact
    JAMMING_ZONES.filter(z => z.severity === 'critical' || z.severity === 'high').forEach(zone => {
      const colors = SEVERITY_COLORS[zone.severity];
      const outerRadius = zone.radiusKm * 1.5;

      const positions: Cartesian3[] = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * 2 * Math.PI;
        const dLat = (outerRadius / 111.32) * Math.cos(angle);
        const dLng = (outerRadius / (111.32 * Math.cos(zone.lat * Math.PI / 180))) * Math.sin(angle);
        positions.push(Cartesian3.fromDegrees(zone.lng + dLng, zone.lat + dLat, 200));
      }

      this.dataSource.entities.add({
        id: `jz-heat-${zone.id}`,
        polygon: {
          hierarchy: new PolygonHierarchy(positions),
          material: colors.fill.withAlpha(0.12),
          outline: false,
          height: 200,
          heightReference: HeightReference.RELATIVE_TO_GROUND,
        },
      });
    });
  }
}
