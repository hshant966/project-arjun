/**
 * MaritimeTrafficLayer — Vessel tracking over Indian Ocean
 * Simulated AIS data for key shipping lanes
 * Vessel types: cargo, tanker, military, fishing
 */
import {
  Viewer, Cartesian3, Color, Entity, VerticalOrigin,
  HeightReference, NearFarScalar, DistanceDisplayCondition,
  CallbackProperty, LabelStyle, Cartesian2,
  PolylineGlowMaterialProperty, PolygonHierarchy,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vessel {
  mmsi: string;
  name: string;
  type: 'cargo' | 'tanker' | 'military' | 'fishing' | 'passenger' | 'tug' | 'pilot';
  flag: string;
  lat: number;
  lng: number;
  speed: number; // knots
  course: number; // degrees
  heading: number;
  destination: string;
  eta: string;
  draught: number; // meters
  length: number;
  width: number;
  status: string;
}

interface ShippingLane {
  name: string;
  points: [number, number][];
  color: string;
  width: number;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_VESSELS: Vessel[] = [
  // Arabian Sea - Container ships
  { mmsi: '414000001', name: 'MV Bharat Express', type: 'cargo', flag: '🇮🇳', lat: 19.5, lng: 68.2, speed: 14.5, course: 45, heading: 45, destination: 'JNPT Mumbai', eta: '2024-01-16 08:00', draught: 12.5, length: 366, width: 51, status: 'Under Way Using Engine' },
  { mmsi: '414000002', name: 'MV Indian Star', type: 'cargo', flag: '🇮🇳', lat: 15.8, lng: 70.5, speed: 12.8, course: 180, heading: 182, destination: 'Cochin Port', eta: '2024-01-16 14:00', draught: 10.2, length: 292, width: 45, status: 'Under Way Using Engine' },
  { mmsi: '414000003', name: 'MV Sagarmala', type: 'cargo', flag: '🇮🇳', lat: 22.3, lng: 69.8, speed: 16.2, course: 270, heading: 268, destination: 'Kandla Port', eta: '2024-01-16 06:00', draught: 14.0, length: 400, width: 59, status: 'Under Way Using Engine' },
  { mmsi: '414000004', name: 'MSC Mumbai', type: 'cargo', flag: '🇵🇦', lat: 20.2, lng: 71.5, speed: 18.3, course: 315, heading: 313, destination: 'Mundra Port', eta: '2024-01-16 10:00', draught: 13.8, length: 399, width: 61, status: 'Under Way Using Engine' },
  { mmsi: '414000005', name: 'COSCO Mumbai', type: 'cargo', flag: '🇨🇳', lat: 16.5, lng: 72.0, speed: 17.5, course: 350, heading: 348, destination: 'JNPT Mumbai', eta: '2024-01-16 16:00', draught: 14.2, length: 400, width: 59, status: 'Under Way Using Engine' },

  // Arabian Sea - Tankers
  { mmsi: '414000010', name: 'MT Indian Crude', type: 'tanker', flag: '🇮🇳', lat: 21.0, lng: 66.5, speed: 12.0, course: 90, heading: 88, destination: 'Jamnagar Refinery', eta: '2024-01-16 20:00', draught: 18.0, length: 333, width: 60, status: 'Under Way Using Engine' },
  { mmsi: '414000011', name: 'MT Ratnagiri', type: 'tanker', flag: '🇮🇳', lat: 17.5, lng: 69.0, speed: 11.5, course: 20, heading: 22, destination: 'Mumbai Port', eta: '2024-01-17 04:00', draught: 15.5, length: 280, width: 50, status: 'Under Way Using Engine' },
  { mmsi: '414000012', name: 'VLCC Arabian Gulf', type: 'tanker', flag: '🇱🇷', lat: 23.5, lng: 65.0, speed: 13.2, course: 135, heading: 133, destination: 'Mangalore Port', eta: '2024-01-17 12:00', draught: 20.5, length: 380, width: 68, status: 'Under Way Using Engine' },
  { mmsi: '414000013', name: 'MT Persian Star', type: 'tanker', flag: '🇮🇷', lat: 24.5, lng: 62.5, speed: 10.8, course: 150, heading: 152, destination: 'Kochi Refinery', eta: '2024-01-18 08:00', draught: 16.0, length: 274, width: 48, status: 'Under Way Using Engine' },

  // Bay of Bengal
  { mmsi: '414000020', name: 'MV Chennai Pride', type: 'cargo', flag: '🇮🇳', lat: 13.1, lng: 80.3, speed: 14.0, course: 90, heading: 92, destination: 'Chennai Port', eta: '2024-01-16 12:00', draught: 11.5, length: 300, width: 44, status: 'Under Way Using Engine' },
  { mmsi: '414000021', name: 'MV Kolkata Express', type: 'cargo', flag: '🇮🇳', lat: 20.0, lng: 87.5, speed: 15.2, course: 210, heading: 208, destination: 'Kolkata Port', eta: '2024-01-16 18:00', draught: 9.8, length: 260, width: 40, status: 'Under Way Using Engine' },
  { mmsi: '414000022', name: 'Evergreen Kolkata', type: 'cargo', flag: '🇹🇼', lat: 14.5, lng: 82.0, speed: 19.0, course: 30, heading: 28, destination: 'Colombo Port', eta: '2024-01-16 06:00', draught: 14.5, length: 400, width: 59, status: 'Under Way Using Engine' },

  // Strait of Malacca approaches
  { mmsi: '414000030', name: 'Maersk Malacca', type: 'cargo', flag: '🇩🇰', lat: 6.5, lng: 98.0, speed: 16.5, course: 310, heading: 308, destination: 'Port Klang', eta: '2024-01-16 04:00', draught: 13.0, length: 366, width: 51, status: 'Under Way Using Engine' },
  { mmsi: '414000031', name: 'Hapag Singapore', type: 'cargo', flag: '🇩🇪', lat: 4.5, lng: 100.5, speed: 15.8, course: 280, heading: 282, destination: 'Singapore', eta: '2024-01-16 08:00', draught: 12.8, length: 335, width: 48, status: 'Under Way Using Engine' },

  // Military vessels
  { mmsi: '414000040', name: 'INS Vikrant', type: 'military', flag: '🇮🇳', lat: 12.5, lng: 76.0, speed: 18.0, course: 270, heading: 268, destination: 'Sea Trial', eta: 'N/A', draught: 8.4, length: 262, width: 62, status: 'Under Way Using Engine' },
  { mmsi: '414000041', name: 'INS Kolkata', type: 'military', flag: '🇮🇳', lat: 15.0, lng: 73.5, speed: 22.0, course: 180, heading: 182, destination: 'Naval Exercise', eta: 'N/A', draught: 6.5, length: 163, width: 17, status: 'Under Way Using Engine' },
  { mmsi: '414000042', name: 'INS Arihant', type: 'military', flag: '🇮🇳', lat: 17.5, lng: 82.5, speed: 12.0, course: 90, heading: 88, destination: 'Patrol', eta: 'Classified', draught: 11.0, length: 112, width: 11, status: 'Under Way Using Engine' },
  { mmsi: '414000043', name: 'USS Ronald Reagan', type: 'military', flag: '🇺🇸', lat: 10.0, lng: 78.0, speed: 15.0, course: 45, heading: 43, destination: '7th Fleet Ops', eta: 'Classified', draught: 12.5, length: 333, width: 78, status: 'Under Way Using Engine' },
  { mmsi: '414000044', name: 'PLAN Shandong', type: 'military', flag: '🇨🇳', lat: 7.5, lng: 95.0, speed: 16.0, course: 240, heading: 238, destination: 'South China Sea', eta: 'Classified', draught: 11.0, length: 315, width: 75, status: 'Under Way Using Engine' },
  { mmsi: '414000045', name: 'INS Teg', type: 'military', flag: '🇮🇳', lat: 20.5, lng: 70.0, speed: 25.0, course: 200, heading: 198, destination: 'Patrol', eta: 'N/A', draught: 4.5, length: 125, width: 15, status: 'Under Way Using Engine' },

  // Fishing fleets
  { mmsi: '414000050', name: 'FV Maharashtra Fisher', type: 'fishing', flag: '🇮🇳', lat: 17.0, lng: 71.5, speed: 6.0, course: 270, heading: 268, destination: 'Mumbai', eta: '2024-01-16 20:00', draught: 3.0, length: 20, width: 6, status: 'Engaged in Fishing' },
  { mmsi: '414000051', name: 'FV Goa Pearl', type: 'fishing', flag: '🇮🇳', lat: 14.5, lng: 73.0, speed: 5.5, course: 350, heading: 348, destination: 'Marmagao', eta: '2024-01-16 18:00', draught: 2.5, length: 18, width: 5, status: 'Engaged in Fishing' },
  { mmsi: '414000052', name: 'FV Tamil Nadu Fleet', type: 'fishing', flag: '🇮🇳', lat: 10.0, lng: 79.0, speed: 4.8, course: 90, heading: 92, destination: 'Nagapattinam', eta: '2024-01-17 06:00', draught: 2.8, length: 22, width: 7, status: 'Engaged in Fishing' },
  { mmsi: '414000053', name: 'FV Kerala Catch', type: 'fishing', flag: '🇮🇳', lat: 9.5, lng: 75.5, speed: 5.0, course: 180, heading: 182, destination: 'Kochi', eta: '2024-01-16 22:00', draught: 2.2, length: 16, width: 5, status: 'Engaged in Fishing' },
  { mmsi: '414000054', name: 'FV Gujarat Trawler', type: 'fishing', flag: '🇮🇳', lat: 22.0, lng: 68.5, speed: 7.0, course: 230, heading: 228, destination: 'Porbandar', eta: '2024-01-16 14:00', draught: 3.2, length: 24, width: 7, status: 'Engaged in Fishing' },

  // Passenger
  { mmsi: '414000060', name: 'MV Lakshadweep Express', type: 'passenger', flag: '🇮🇳', lat: 11.0, lng: 72.5, speed: 14.0, course: 270, heading: 268, destination: 'Lakshadweep', eta: '2024-01-16 10:00', draught: 5.0, length: 120, width: 20, status: 'Under Way Using Engine' },

  // Tugs
  { mmsi: '414000070', name: 'Tug Mumbai Harbour', type: 'tug', flag: '🇮🇳', lat: 18.9, lng: 72.8, speed: 4.0, course: 90, heading: 92, destination: 'JNPT', eta: '2024-01-16 08:00', draught: 4.5, length: 30, width: 10, status: 'Under Way Using Engine' },
];

const SHIPPING_LANES: ShippingLane[] = [
  { name: 'Arabian Sea Main Lane', color: '#2196f3', width: 3, points: [[25.0, 57.0], [22.0, 62.0], [20.0, 65.0], [18.0, 68.0], [16.0, 71.0], [14.0, 73.0], [12.0, 75.0], [10.0, 77.0]] },
  { name: 'Bay of Bengal Lane', color: '#42a5f5', width: 3, points: [[10.0, 78.0], [12.0, 80.0], [14.0, 82.0], [16.0, 84.0], [18.0, 86.0], [20.0, 88.0], [22.0, 89.0]] },
  { name: 'Mumbai-Colombo Lane', color: '#64b5f6', width: 2, points: [[19.0, 72.8], [16.0, 73.0], [13.0, 75.0], [10.0, 77.0], [8.0, 79.8]] },
  { name: 'Strait of Malacca Approach', color: '#90caf9', width: 2, points: [[7.0, 96.0], [6.0, 97.5], [5.0, 99.0], [4.0, 100.0], [2.5, 101.5]] },
  { name: 'Chennai-Singapore Lane', color: '#42a5f5', width: 2, points: [[13.1, 80.3], [11.0, 82.0], [8.5, 85.0], [6.0, 90.0], [4.0, 96.0], [2.0, 100.0]] },
  { name: 'Red Sea - India Lane', color: '#1e88e5', width: 3, points: [[15.0, 43.0], [14.0, 48.0], [14.0, 53.0], [16.0, 58.0], [18.0, 62.0], [20.0, 66.0], [21.0, 69.0], [20.0, 72.8]] },
];

// ─── Color Mapping ───────────────────────────────────────────────────────────

const VESSEL_COLORS: Record<string, { color: Color; icon: string; label: string }> = {
  cargo:     { color: Color.fromCssColorString('#2196f3'), icon: '🚢', label: 'Cargo' },
  tanker:    { color: Color.fromCssColorString('#ff9800'), icon: '🛢️', label: 'Tanker' },
  military:  { color: Color.fromCssColorString('#ff1744'), icon: '⚓', label: 'Military' },
  fishing:   { color: Color.fromCssColorString('#4caf50'), icon: '🐟', label: 'Fishing' },
  passenger: { color: Color.fromCssColorString('#9c27b0'), icon: '🛳️', label: 'Passenger' },
  tug:       { color: Color.fromCssColorString('#795548'), icon: '🔧', label: 'Tug' },
  pilot:     { color: Color.fromCssColorString('#607d8b'), icon: '🚤', label: 'Pilot' },
};

// ─── Layer Implementation ────────────────────────────────────────────────────

export class MaritimeTrafficLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'maritime-traffic',
    name: 'Maritime Traffic',
    icon: '🚢',
    description: 'Vessel tracking over Indian Ocean. Cargo, tanker, military, fishing. Click for AIS details.',
    category: 'intelligence',
    color: '#2196f3',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'maritimeTraffic',
  };

  private vessels = DEMO_VESSELS;
  private updateTimer: ReturnType<typeof setInterval> | null = null;

  constructor(viewer: Viewer, dataStore: any) {
    super(viewer, dataStore);
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    this.clear();
    this.renderShippingLanes();
    this.renderVessels();
    this.startUpdates();
  }

  async disable(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    await super.disable();
  }

  private startUpdates(): void {
    this.updateTimer = setInterval(() => {
      if (!this._enabled) return;
      this.simulateMovement();
    }, 5000);
  }

  private simulateMovement(): void {
    this.vessels.forEach(v => {
      const dt = 5;
      const distNm = v.speed * (dt / 3600);
      const distDeg = distNm / 60;
      const dLat = distDeg * Math.cos(v.course * Math.PI / 180);
      const dLng = distDeg * Math.sin(v.course * Math.PI / 180) / Math.cos(v.lat * Math.PI / 180);
      v.lat += dLat;
      v.lng += dLng;
      // Keep in Indian Ocean region
      if (v.lat > 30) v.lat = -10;
      if (v.lat < -10) v.lat = 30;
      if (v.lng > 105) v.lng = 35;
      if (v.lng < 35) v.lng = 105;
      // Slight course variation
      v.course += (Math.random() - 0.5) * 3;
    });
  }

  private renderShippingLanes(): void {
    SHIPPING_LANES.forEach(lane => {
      const positions = lane.points.map(p => Cartesian3.fromDegrees(p[1], p[0], 0));
      this.dataSource.entities.add({
        id: `lane-${lane.name.replace(/\s/g, '-')}`,
        polyline: {
          positions,
          width: lane.width,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.15,
            color: Color.fromCssColorString(lane.color).withAlpha(0.4),
          }),
          clampToGround: true,
        },
      });

      // Lane label at midpoint
      const midIdx = Math.floor(lane.points.length / 2);
      const mid = lane.points[midIdx];
      this.dataSource.entities.add({
        id: `lane-label-${lane.name.replace(/\s/g, '-')}`,
        position: Cartesian3.fromDegrees(mid[1], mid[0], 100),
        label: {
          text: `◄ ${lane.name} ►`,
          font: '10px monospace',
          fillColor: Color.fromCssColorString(lane.color).withAlpha(0.6),
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    });
  }

  private renderVessels(): void {
    this.vessels.forEach(v => {
      const typeInfo = VESSEL_COLORS[v.type] || VESSEL_COLORS.cargo;

      this.dataSource.entities.add({
        id: `vessel-${v.mmsi}`,
        position: new CallbackProperty(() =>
          Cartesian3.fromDegrees(v.lng, v.lat, 0), false
        ),
        point: {
          pixelSize: v.type === 'military' ? 16 : v.type === 'tanker' ? 14 : 10,
          color: typeInfo.color,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 5e6, 0.5),
        },
        label: {
          text: `${typeInfo.icon} ${v.name}`,
          font: '11px monospace',
          fillColor: typeInfo.color,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.75)'),
          scaleByDistance: new NearFarScalar(1e5, 1.0, 5e6, 0.0),
        },
        description: `
<div style="font-family:monospace;color:#0cf;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${typeInfo.color.toCssColorString()};margin:0 0 8px 0;">${typeInfo.icon} ${v.name}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>MMSI:</td><td style="color:#0cf;">${v.mmsi}</td></tr>
    <tr><td>Type:</td><td style="color:${typeInfo.color.toCssColorString()};">${typeInfo.label}</td></tr>
    <tr><td>Flag:</td><td style="color:#0cf;">${v.flag}</td></tr>
    <tr><td>Speed:</td><td style="color:#0cf;">${v.speed} knots</td></tr>
    <tr><td>Course:</td><td style="color:#0cf;">${v.course}°</td></tr>
    <tr><td>Heading:</td><td style="color:#0cf;">${v.heading}°</td></tr>
    <tr><td>Destination:</td><td style="color:#0cf;">${v.destination}</td></tr>
    <tr><td>ETA:</td><td style="color:#0cf;">${v.eta}</td></tr>
    <tr><td>Draught:</td><td style="color:#0cf;">${v.draught}m</td></tr>
    <tr><td>Dimensions:</td><td style="color:#0cf;">${v.length}m × ${v.width}m</td></tr>
    <tr><td>Status:</td><td style="color:#0cf;">${v.status}</td></tr>
    <tr><td>Position:</td><td style="color:#0cf;">${v.lat.toFixed(2)}°N, ${v.lng.toFixed(2)}°E</td></tr>
  </table>
</div>`,
      });
    });
  }
}
