/**
 * DisasterManagementLayer — Real-time disaster monitoring for India
 * Integrates: USGS Earthquakes, NASA EONET, NDMA SACHET alerts
 * Shows: flood zones, cyclone paths, earthquake zones with severity color coding
 */
import {
  Viewer, Cartesian3, Color, HeightReference,
  PolylineGlowMaterialProperty, PolylineDashMaterialProperty,
  CallbackProperty, JulianDate, Entity, EllipsoidGeodesic,
  VerticalOrigin, NearFarScalar, DistanceDisplayCondition,
  ScreenSpaceEventHandler, ScreenSpaceEventType,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EarthquakeEvent {
  id: string;
  magnitude: number;
  depth: number; // km
  latitude: number;
  longitude: number;
  place: string;
  time: number; // epoch ms
  tsunami: boolean;
  felt: number | null; // reports
  alert: string | null; // green, yellow, orange, red
}

interface EonetEvent {
  id: string;
  title: string;
  category: string; // wildfires, volcanoes, earthquakes, floods, storms, etc.
  sources: { id: string; url: string }[];
  geometries: { date: string; type: string; coordinates: [number, number] }[];
  closed: boolean;
}

interface SACHETAlert {
  id: string;
  title: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  alertType: string; // flood, cyclone, heatwave, thunderstorm, etc.
  district: string;
  state: string;
  issuedAt: string;
  validUntil: string;
  description: string;
  coordinates: { lat: number; lng: number };
}

interface FloodZone {
  id: string;
  name: string;
  state: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  boundary: [number, number][];
  source: string;
  lastUpdated: string;
}

interface CyclonePath {
  id: string;
  name: string;
  basin: string;
  category: number; // 1-5
  currentPos: { lat: number; lng: number };
  forecastTrack: { lat: number; lng: number; timestamp: string }[];
  maxWindSpeed: number; // knots
  pressure: number; // hPa
  movementSpeed: number; // knots
  movementDirection: string;
}

interface EarthquakeZone {
  id: string;
  name: string;
  seismicZone: 'II' | 'III' | 'IV' | 'V';
  boundary: [number, number][];
  description: string;
}

// ─── Severity Color Mapping ──────────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = {
  // SACHET severity
  Minor: '#4caf50',
  Moderate: '#ff9800',
  Severe: '#f44336',
  Extreme: '#9c27b0',
  // USGS alert
  green: '#4caf50',
  yellow: '#ffeb3b',
  orange: '#ff9800',
  red: '#f44336',
  // Flood severity
  Low: '#2196f3',
  High: '#ff5722',
  Critical: '#d32f2f',
};

const MAGNITUDE_COLORS: { threshold: number; color: string; label: string }[] = [
  { threshold: 7.0, color: '#b71c1c', label: 'Major' },
  { threshold: 6.0, color: '#d32f2f', label: 'Strong' },
  { threshold: 5.0, color: '#f44336', label: 'Moderate' },
  { threshold: 4.0, color: '#ff9800', label: 'Light' },
  { threshold: 3.0, color: '#ffc107', label: 'Minor' },
  { threshold: 0.0, color: '#4caf50', label: 'Micro' },
];

function getMagnitudeColor(mag: number): string {
  for (const entry of MAGNITUDE_COLORS) {
    if (mag >= entry.threshold) return entry.color;
  }
  return '#4caf50';
}

function getMagnitudeLabel(mag: number): string {
  for (const entry of MAGNITUDE_COLORS) {
    if (mag >= entry.threshold) return entry.label;
  }
  return 'Micro';
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_EARTHQUAKES: EarthquakeEvent[] = [
  { id: 'eq-001', magnitude: 4.2, depth: 10, latitude: 18.52, longitude: 73.86, place: '12km NW of Pune, Maharashtra', time: Date.now() - 3600000, tsunami: false, felt: 23, alert: 'green' },
  { id: 'eq-002', magnitude: 5.1, depth: 33, latitude: 23.25, longitude: 77.41, place: '15km SE of Bhopal, Madhya Pradesh', time: Date.now() - 7200000, tsunami: false, felt: 156, alert: 'yellow' },
  { id: 'eq-003', magnitude: 3.8, depth: 8, latitude: 28.61, longitude: 77.23, place: '5km NE of New Delhi', time: Date.now() - 10800000, tsunami: false, felt: 42, alert: 'green' },
  { id: 'eq-004', magnitude: 6.2, depth: 45, latitude: 27.18, longitude: 88.52, place: '30km N of Gangtok, Sikkim', time: Date.now() - 86400000, tsunami: true, felt: 892, alert: 'orange' },
  { id: 'eq-005', magnitude: 4.5, depth: 15, latitude: 13.08, longitude: 80.27, place: '8km S of Chennai, Tamil Nadu', time: Date.now() - 14400000, tsunami: false, felt: 67, alert: 'green' },
  { id: 'eq-006', magnitude: 3.2, depth: 5, latitude: 19.08, longitude: 72.88, place: '10km E of Mumbai, Maharashtra', time: Date.now() - 21600000, tsunami: false, felt: 8, alert: 'green' },
  { id: 'eq-007', magnitude: 4.8, depth: 22, latitude: 24.79, longitude: 92.78, place: '25km SW of Silchar, Assam', time: Date.now() - 43200000, tsunami: false, felt: 134, alert: 'yellow' },
  { id: 'eq-008', magnitude: 5.6, depth: 38, latitude: 29.95, longitude: 78.16, place: '18km NW of Dehradun, Uttarakhand', time: Date.now() - 172800000, tsunami: false, felt: 567, alert: 'yellow' },
  { id: 'eq-009', magnitude: 7.1, depth: 60, latitude: 25.59, longitude: 93.53, place: '50km E of Imphal, Manipur', time: Date.now() - 259200000, tsunami: true, felt: 2340, alert: 'red' },
  { id: 'eq-010', magnitude: 3.5, depth: 12, latitude: 17.38, longitude: 78.49, place: '6km W of Hyderabad, Telangana', time: Date.now() - 28800000, tsunami: false, felt: 12, alert: 'green' },
];

const DEMO_EONET_EVENTS: EonetEvent[] = [
  { id: 'eonet-001', title: 'Wildfire - Bandipur Tiger Reserve', category: 'wildfires', sources: [{ id: 'ISRO', url: 'https://mosdac.gov.in' }], geometries: [{ date: new Date(Date.now() - 172800000).toISOString(), type: 'Point', coordinates: [76.50, 11.78] }], closed: false },
  { id: 'eonet-002', title: 'Tropical Cyclone Biparjoy', category: 'storms', sources: [{ id: 'IMD', url: 'https://mausam.imd.gov.in' }], geometries: [{ date: new Date(Date.now() - 86400000).toISOString(), type: 'Point', coordinates: [68.25, 21.50] }], closed: false },
  { id: 'eonet-003', title: 'Flood - Brahmaputra Basin', category: 'floods', sources: [{ id: 'NDMA', url: 'https://ndma.gov.in' }], geometries: [{ date: new Date(Date.now() - 259200000).toISOString(), type: 'Point', coordinates: [91.74, 26.14] }], closed: false },
  { id: 'eonet-004', title: 'Volcanic Activity - Barren Island', category: 'volcanoes', sources: [{ id: 'Smithsonian', url: 'https://volcano.si.edu' }], geometries: [{ date: new Date(Date.now() - 604800000).toISOString(), type: 'Point', coordinates: [93.87, 12.28] }], closed: false },
  { id: 'eonet-005', title: 'Dust Storm - Rajasthan', category: 'dustHaze', sources: [{ id: 'IMD', url: 'https://mausam.imd.gov.in' }], geometries: [{ date: new Date(Date.now() - 43200000).toISOString(), type: 'Point', coordinates: [73.85, 26.92] }], closed: false },
  { id: 'eonet-006', title: 'Flooding - Kerala Backwaters', category: 'floods', sources: [{ id: 'SDRF', url: '' }], geometries: [{ date: new Date(Date.now() - 129600000).toISOString(), type: 'Point', coordinates: [76.27, 9.93] }], closed: false },
];

const DEMO_SACHET_ALERTS: SACHETAlert[] = [
  { id: 'sachet-001', title: 'Heavy Rainfall Warning', severity: 'Severe', alertType: 'flood', district: 'Pune', state: 'Maharashtra', issuedAt: new Date(Date.now() - 7200000).toISOString(), validUntil: new Date(Date.now() + 43200000).toISOString(), description: 'Extremely heavy rainfall (>204.5mm) expected. Risk of urban flooding in low-lying areas.', coordinates: { lat: 18.52, lng: 73.86 } },
  { id: 'sachet-002', title: 'Cyclone Alert', severity: 'Extreme', alertType: 'cyclone', district: 'Mumbai', state: 'Maharashtra', issuedAt: new Date(Date.now() - 14400000).toISOString(), validUntil: new Date(Date.now() + 86400000).toISOString(), description: 'Very Severe Cyclonic Storm approaching. Wind speed 120-130 kmph gusting to 145 kmph.', coordinates: { lat: 19.08, lng: 72.88 } },
  { id: 'sachet-003', title: 'Heat Wave Warning', severity: 'Severe', alertType: 'heatwave', district: 'Nagpur', state: 'Maharashtra', issuedAt: new Date(Date.now() - 3600000).toISOString(), validUntil: new Date(Date.now() + 172800000).toISOString(), description: 'Severe heat wave conditions with temperatures reaching 47°C. Avoid outdoor activity 11am-4pm.', coordinates: { lat: 21.15, lng: 79.09 } },
  { id: 'sachet-004', title: 'Thunderstorm Warning', severity: 'Moderate', alertType: 'thunderstorm', district: 'Bengaluru', state: 'Karnataka', issuedAt: new Date(Date.now() - 1800000).toISOString(), validUntil: new Date(Date.now() + 28800000).toISOString(), description: 'Thunderstorm with lightning and gusty winds (40-50 kmph) likely.', coordinates: { lat: 12.97, lng: 77.59 } },
  { id: 'sachet-005', title: 'Flood Warning', severity: 'Severe', alertType: 'flood', district: 'Kochi', state: 'Kerala', issuedAt: new Date(Date.now() - 5400000).toISOString(), validUntil: new Date(Date.now() + 64800000).toISOString(), description: 'Rising water levels in Periyar river. Evacuation advisory for low-lying areas.', coordinates: { lat: 9.93, lng: 76.27 } },
  { id: 'sachet-006', title: 'Landslide Warning', severity: 'Moderate', alertType: 'landslide', district: 'Darjeeling', state: 'West Bengal', issuedAt: new Date(Date.now() - 10800000).toISOString(), validUntil: new Date(Date.now() + 129600000).toISOString(), description: 'Continuous heavy rainfall has saturated hillside soil. Risk of landslides in hilly terrain.', coordinates: { lat: 27.04, lng: 88.26 } },
  { id: 'sachet-007', title: 'Drought Alert', severity: 'Moderate', alertType: 'drought', district: 'Vidarbha', state: 'Maharashtra', issuedAt: new Date(Date.now() - 86400000).toISOString(), validUntil: new Date(Date.now() + 604800000).toISOString(), description: 'Rainfall deficit exceeding 50%. Agricultural drought declared for Marathwada and Vidarbha regions.', coordinates: { lat: 20.39, lng: 78.13 } },
];

const DEMO_FLOOD_ZONES: FloodZone[] = [
  { id: 'fz-001', name: 'Brahmaputra Flood Plain', state: 'Assam', severity: 'High', boundary: [[89.5, 26.5], [93.0, 26.8], [93.5, 25.5], [92.0, 24.8], [90.0, 25.0], [89.5, 26.5]], source: 'CWC', lastUpdated: new Date().toISOString() },
  { id: 'fz-002', name: 'Kosi River Basin', state: 'Bihar', severity: 'Critical', boundary: [[85.0, 26.5], [87.5, 26.8], [87.0, 25.5], [85.5, 25.0], [85.0, 26.5]], source: 'CWC', lastUpdated: new Date().toISOString() },
  { id: 'fz-003', name: 'Godavari Lowlands', state: 'Maharashtra/Telangana', severity: 'Moderate', boundary: [[73.5, 19.8], [80.0, 19.5], [80.5, 17.5], [78.0, 16.5], [74.0, 17.0], [73.5, 19.8]], source: 'CWC', lastUpdated: new Date().toISOString() },
  { id: 'fz-004', name: 'Krishna Delta', state: 'Andhra Pradesh', severity: 'Moderate', boundary: [[80.0, 16.5], [81.2, 16.8], [81.0, 15.5], [80.0, 15.8], [80.0, 16.5]], source: 'CWC', lastUpdated: new Date().toISOString() },
  { id: 'fz-005', name: 'Mumbai Coastal Lowlands', state: 'Maharashtra', severity: 'High', boundary: [[72.78, 19.25], [72.95, 19.25], [72.95, 19.05], [72.78, 19.05], [72.78, 19.25]], source: 'NDMA', lastUpdated: new Date().toISOString() },
];

const DEMO_CYCLONE_PATHS: CyclonePath[] = [
  {
    id: 'cyc-001', name: 'Biparjoy', basin: 'Arabian Sea', category: 3,
    currentPos: { lat: 21.50, lng: 68.25 },
    forecastTrack: [
      { lat: 21.50, lng: 68.25, timestamp: new Date().toISOString() },
      { lat: 22.10, lng: 67.50, timestamp: new Date(Date.now() + 21600000).toISOString() },
      { lat: 22.80, lng: 66.90, timestamp: new Date(Date.now() + 43200000).toISOString() },
      { lat: 23.50, lng: 66.40, timestamp: new Date(Date.now() + 64800000).toISOString() },
      { lat: 24.30, lng: 66.10, timestamp: new Date(Date.now() + 86400000).toISOString() },
    ],
    maxWindSpeed: 120, pressure: 955, movementSpeed: 12, movementDirection: 'NNW',
  },
  {
    id: 'cyc-002', name: 'Midhili', basin: 'Bay of Bengal', category: 1,
    currentPos: { lat: 17.80, lng: 88.50 },
    forecastTrack: [
      { lat: 17.80, lng: 88.50, timestamp: new Date().toISOString() },
      { lat: 18.50, lng: 88.00, timestamp: new Date(Date.now() + 21600000).toISOString() },
      { lat: 19.30, lng: 87.60, timestamp: new Date(Date.now() + 43200000).toISOString() },
      { lat: 20.20, lng: 87.20, timestamp: new Date(Date.now() + 64800000).toISOString() },
    ],
    maxWindSpeed: 75, pressure: 985, movementSpeed: 8, movementDirection: 'N',
  },
];

const DEMO_EARTHQUAKE_ZONES: EarthquakeZone[] = [
  { id: 'sez-001', name: 'Zone V - Himalayan Belt', seismicZone: 'V', boundary: [[75.0, 32.0], [80.0, 34.0], [85.0, 33.0], [90.0, 32.0], [92.0, 28.0], [90.0, 26.0], [82.0, 27.0], [77.0, 29.0], [75.0, 30.0], [75.0, 32.0]], description: 'Highest seismicity. Includes NE states, Kashmir, Kumaon-Garhwal. PGA > 0.36g' },
  { id: 'sez-002', name: 'Zone IV - Northern Plains', seismicZone: 'IV', boundary: [[70.0, 30.0], [75.0, 32.0], [77.0, 29.0], [82.0, 27.0], [90.0, 26.0], [92.0, 24.0], [88.0, 22.0], [80.0, 23.0], [74.0, 24.0], [70.0, 26.0], [70.0, 30.0]], description: 'High seismicity. Delhi, parts of Bihar, WB, Maharashtra. PGA 0.18-0.36g' },
  { id: 'sez-003', name: 'Zone III - Peninsular India', seismicZone: 'III', boundary: [[68.0, 24.0], [74.0, 24.0], [80.0, 23.0], [88.0, 22.0], [86.0, 18.0], [80.0, 16.0], [77.0, 12.0], [74.0, 15.0], [70.0, 19.0], [68.0, 24.0]], description: 'Moderate seismicity. Maharashtra, Gujarat coast, central India. PGA 0.09-0.18g' },
  { id: 'sez-004', name: 'Zone II - Stable Interior', seismicZone: 'II', boundary: [[74.0, 15.0], [77.0, 12.0], [80.0, 10.0], [78.0, 8.0], [76.0, 8.0], [74.0, 12.0], [74.0, 15.0]], description: 'Low seismicity. Parts of TN, Kerala, Karnataka interior. PGA < 0.09g' },
];

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class DisasterManagementLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'disaster-management',
    name: 'Disaster Management',
    icon: '🚨',
    description: 'Real-time disaster monitoring — earthquakes, cyclones, floods, NDMA alerts, EONET events',
    category: 'intelligence',
    color: '#f44336',
    enabled: false,
    opacity: 0.85,
    dataStoreKey: 'disaster-management',
  };

  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private selectedEntity: Entity | null = null;
  private handler: ScreenSpaceEventHandler | null = null;

  // ─── Data Loaders ────────────────────────────────────────────────────────

  protected async loadData(): Promise<void> {
    this.clear();
    this.loadEarthquakes(DEMO_EARTHQUAKES);
    this.loadEonetEvents(DEMO_EONET_EVENTS);
    this.loadSACHETAlerts(DEMO_SACHET_ALERTS);
    this.loadFloodZones(DEMO_FLOOD_ZONES);
    this.loadCyclonePaths(DEMO_CYCLONE_PATHS);
    this.loadSeismicZones(DEMO_EARTHQUAKE_ZONES);
    this.startAutoRefresh();
  }

  // ─── USGS Earthquakes ────────────────────────────────────────────────────

  private loadEarthquakes(quakes: EarthquakeEvent[]): void {
    for (const eq of quakes) {
      const color = getMagnitudeColor(eq.magnitude);
      const label = getMagnitudeLabel(eq.magnitude);
      const size = Math.max(8, eq.magnitude * 5);
      const ts = new Date(eq.time).toISOString();

      // Pulsing ring for significant quakes
      if (eq.magnitude >= 5.0) {
        this.addEarthquakeRing(eq, color);
      }

      this.dataSource.entities.add({
        id: `earthquake-${eq.id}`,
        position: Cartesian3.fromDegrees(eq.longitude, eq.latitude, -eq.depth * 1000),
        point: {
          pixelSize: size,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          outlineColor: Color.WHITE,
          outlineWidth: 1.5,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new NearFarScalar(1.5e2, 1.5, 1.5e7, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>🌍 M${eq.magnitude.toFixed(1)} Earthquake — ${label}</h3>
            <p><strong>📍 ${eq.place}</strong></p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>Magnitude</td><td><strong style="color:${color}">${eq.magnitude.toFixed(1)}</strong></td></tr>
              <tr><td>Depth</td><td>${eq.depth} km</td></tr>
              <tr><td>Time</td><td>${ts}</td></tr>
              <tr><td>Alert Level</td><td><span style="color:${SEVERITY_COLORS[eq.alert || 'green']}">${(eq.alert || 'green').toUpperCase()}</span></td></tr>
              <tr><td>Felt Reports</td><td>${eq.felt || 'N/A'}</td></tr>
              <tr><td>Tsunami Risk</td><td>${eq.tsunami ? '⚠️ YES' : '✅ No'}</td></tr>
              <tr><td>Lat/Lng</td><td>${eq.latitude.toFixed(4)}, ${eq.longitude.toFixed(4)}</td></tr>
            </table>
            <p><a href="https://earthquake.usgs.gov/earthquakes/eventpage/${eq.id}" target="_blank">USGS Event Page</a></p>
          </div>
        `,
      });
    }
  }

  private addEarthquakeRing(eq: EarthquakeEvent, color: string): void {
    const positions: Cartesian3[] = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI;
      const radius = eq.magnitude * 0.05;
      positions.push(Cartesian3.fromDegrees(
        eq.longitude + Math.cos(angle) * radius,
        eq.latitude + Math.sin(angle) * radius,
        0
      ));
    }
    this.dataSource.entities.add({
      position: Cartesian3.fromDegrees(eq.longitude, eq.latitude, 0),
      polyline: {
        positions,
        width: 2,
        material: new PolylineGlowMaterialProperty({
          glowPower: 0.3,
          color: Color.fromCssColorString(color).withAlpha(0.5),
        }),
        clampToGround: true,
      },
    });
  }

  // ─── NASA EONET Events ───────────────────────────────────────────────────

  private loadEonetEvents(events: EonetEvent[]): void {
    const categoryIcons: Record<string, string> = {
      wildfires: '🔥', volcanoes: '🌋', earthquakes: '🌍', floods: '🌊',
      storms: '🌪️', drought: '☀️', dustHaze: '🌫️', seaLakeIce: '🧊',
      landslides: '⛰️', manmade: '🏗️', snow: '❄️', tempExtremes: '🌡️',
    };

    const categoryColors: Record<string, string> = {
      wildfires: '#ff5722', volcanoes: '#ff9800', earthquakes: '#795548',
      floods: '#2196f3', storms: '#9c27b0', drought: '#ffc107',
      dustHaze: '#9e9e9e', landslides: '#795548',
    };

    for (const evt of events) {
      if (evt.geometries.length === 0) continue;
      const lastGeo = evt.geometries[evt.geometries.length - 1];
      const [lng, lat] = lastGeo.coordinates;
      const icon = categoryIcons[evt.category] || '⚠️';
      const color = categoryColors[evt.category] || '#ff9800';
      const status = evt.closed ? 'Closed' : '🔴 Active';

      this.dataSource.entities.add({
        id: `eonet-${evt.id}`,
        position: Cartesian3.fromDegrees(lng, lat, 0),
        point: {
          pixelSize: 14,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>${icon} ${evt.title}</h3>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Category:</strong> ${evt.category}</p>
            <p><strong>Source:</strong> ${evt.sources.map(s => `<a href="${s.url}" target="_blank">${s.id}</a>`).join(', ')}</p>
            <p><strong>First Observed:</strong> ${lastGeo.date}</p>
            <p><a href="https://eonet.gsfc.nasa.gov/api/v3/events/${evt.id}" target="_blank">EONET Details</a></p>
          </div>
        `,
      });
    }
  }

  // ─── NDMA SACHET Alerts ──────────────────────────────────────────────────

  private loadSACHETAlerts(alerts: SACHETAlert[]): void {
    for (const alert of alerts) {
      const color = SEVERITY_COLORS[alert.severity] || '#ff9800';
      const alertIcons: Record<string, string> = {
        flood: '🌊', cyclone: '🌀', heatwave: '🌡️', thunderstorm: '⛈️',
        landslide: '⛰️', drought: '🏜️', tsunami: '🌊', fog: '🌫️',
      };
      const icon = alertIcons[alert.alertType] || '⚠️';

      // Severity ring
      const radius = alert.severity === 'Extreme' ? 0.8 : alert.severity === 'Severe' ? 0.5 : 0.3;
      const ringPositions: Cartesian3[] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * 2 * Math.PI;
        ringPositions.push(Cartesian3.fromDegrees(
          alert.coordinates.lng + Math.cos(angle) * radius,
          alert.coordinates.lat + Math.sin(angle) * radius,
          0
        ));
      }

      this.dataSource.entities.add({
        id: `sachet-ring-${alert.id}`,
        polyline: {
          positions: ringPositions,
          width: 2,
          material: new PolylineDashMaterialProperty({
            color: Color.fromCssColorString(color),
            dashLength: 16,
          }),
          clampToGround: true,
        },
      });

      this.dataSource.entities.add({
        id: `sachet-${alert.id}`,
        position: Cartesian3.fromDegrees(alert.coordinates.lng, alert.coordinates.lat, 0),
        point: {
          pixelSize: 18,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          outlineColor: Color.fromCssColorString(color).withAlpha(0.3),
          outlineWidth: 4,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>${icon} NDMA SACHET: ${alert.title}</h3>
            <p style="color:${color};font-weight:bold">⚠️ ${alert.severity.toUpperCase()} ALERT</p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>Type</td><td>${alert.alertType.toUpperCase()}</td></tr>
              <tr><td>District</td><td>${alert.district}</td></tr>
              <tr><td>State</td><td>${alert.state}</td></tr>
              <tr><td>Issued</td><td>${alert.issuedAt}</td></tr>
              <tr><td>Valid Until</td><td>${alert.validUntil}</td></tr>
            </table>
            <p>${alert.description}</p>
            <p><a href="https://sachet.ndma.gov.in" target="_blank">NDMA SACHET Portal</a></p>
          </div>
        `,
      });
    }
  }

  // ─── Flood Zones ─────────────────────────────────────────────────────────

  private loadFloodZones(zones: FloodZone[]): void {
    for (const zone of zones) {
      const color = SEVERITY_COLORS[zone.severity] || '#2196f3';
      const positions = zone.boundary.flatMap(([lng, lat]) => [lng, lat, 0]);

      this.dataSource.entities.add({
        id: `flood-zone-${zone.id}`,
        polygon: {
          hierarchy: Cartesian3.fromDegreesArrayHeights(
            zone.boundary.flatMap(([lng, lat]) => [lng, lat, 0])
          ),
          material: Color.fromCssColorString(color).withAlpha(0.25),
          outline: true,
          outlineColor: Color.fromCssColorString(color).withAlpha(0.7),
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>🌊 Flood Zone: ${zone.name}</h3>
            <p style="color:${color};font-weight:bold">Severity: ${zone.severity}</p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>State</td><td>${zone.state}</td></tr>
              <tr><td>Source</td><td>${zone.source}</td></tr>
              <tr><td>Last Updated</td><td>${zone.lastUpdated}</td></tr>
            </table>
          </div>
        `,
      });
    }
  }

  // ─── Cyclone Paths ───────────────────────────────────────────────────────

  private loadCyclonePaths(cyclones: CyclonePath[]): void {
    const categoryColors = ['#4caf50', '#8bc34a', '#ffc107', '#ff9800', '#f44336'];

    for (const cyc of cyclones) {
      const color = categoryColors[Math.min(cyc.category - 1, 4)];

      // Forecast cone
      const forecastPositions = cyc.forecastTrack.map(p =>
        Cartesian3.fromDegrees(p.lng, p.lat, 5000)
      );

      this.dataSource.entities.add({
        id: `cyclone-track-${cyc.id}`,
        polyline: {
          positions: forecastPositions,
          width: 3,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.4,
            color: Color.fromCssColorString(color),
          }),
        },
      });

      // Forecast points
      for (let i = 0; i < cyc.forecastTrack.length; i++) {
        const p = cyc.forecastTrack[i];
        const opacity = 1 - (i / cyc.forecastTrack.length) * 0.6;
        this.dataSource.entities.add({
          position: Cartesian3.fromDegrees(p.lng, p.lat, 5000),
          point: {
            pixelSize: i === 0 ? 16 : 8,
            color: Color.fromCssColorString(color).withAlpha(opacity),
            outlineColor: Color.WHITE,
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }

      // Storm info pin
      this.dataSource.entities.add({
        id: `cyclone-info-${cyc.id}`,
        position: Cartesian3.fromDegrees(cyc.currentPos.lng, cyc.currentPos.lat, 0),
        point: {
          pixelSize: 22,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>🌀 Cyclone ${cyc.name} (Category ${cyc.category})</h3>
            <p style="color:${color};font-weight:bold">Basin: ${cyc.basin}</p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>Max Wind</td><td>${cyc.maxWindSpeed} knots</td></tr>
              <tr><td>Pressure</td><td>${cyc.pressure} hPa</td></tr>
              <tr><td>Movement</td><td>${cyc.movementSpeed} kts ${cyc.movementDirection}</td></tr>
              <tr><td>Position</td><td>${cyc.currentPos.lat.toFixed(2)}°N, ${cyc.currentPos.lng.toFixed(2)}°E</td></tr>
            </table>
            <p><strong>Forecast Track (${cyc.forecastTrack.length} points):</strong></p>
            <ul>${cyc.forecastTrack.map((p, i) => `<li>+${i * 6}h: ${p.lat.toFixed(2)}°N, ${p.lng.toFixed(2)}°E (${p.timestamp})</li>`).join('')}</ul>
          </div>
        `,
      });
    }
  }

  // ─── Seismic Zone Maps ───────────────────────────────────────────────────

  private loadSeismicZones(zones: EarthquakeZone[]): void {
    const zoneColors: Record<string, string> = {
      II: '#4caf50',
      III: '#ffc107',
      IV: '#ff9800',
      V: '#f44336',
    };

    for (const zone of zones) {
      const color = zoneColors[zone.seismicZone];
      this.dataSource.entities.add({
        id: `seismic-zone-${zone.id}`,
        polygon: {
          hierarchy: Cartesian3.fromDegreesArrayHeights(
            zone.boundary.flatMap(([lng, lat]) => [lng, lat, 0])
          ),
          material: Color.fromCssColorString(color).withAlpha(0.12),
          outline: true,
          outlineColor: Color.fromCssColorString(color).withAlpha(0.5),
          outlineWidth: 1.5,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>🏗️ ${zone.name}</h3>
            <p style="color:${color};font-weight:bold">BIS Seismic Zone: ${zone.seismicZone}</p>
            <p>${zone.description}</p>
          </div>
        `,
      });
    }
  }

  // ─── Auto Refresh ────────────────────────────────────────────────────────

  private startAutoRefresh(): void {
    // In production: fetch from live APIs every 60 seconds
    // USGS: https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=6&maxlatitude=37&minlongitude=68&maxlongitude=98&minmagnitude=2.5&orderby=time
    // EONET: https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50
    this.refreshInterval = setInterval(() => {
      if (this._enabled) {
        // Placeholder for live API calls
        console.log('[DisasterManagement] Auto-refresh tick');
      }
    }, 60000);
  }

  async disable(): Promise<void> {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.handler) {
      this.handler.destroy();
      this.handler = null;
    }
    await super.disable();
  }

  // ─── Material Overrides ──────────────────────────────────────────────────

  protected getMaterial(): any {
    return undefined; // Each entity has its own material
  }

  protected getPointColor(): any {
    return undefined;
  }

  protected getLineColor(): any {
    return undefined;
  }
}
