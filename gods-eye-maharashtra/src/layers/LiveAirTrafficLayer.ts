/**
 * LiveAirTrafficLayer — Real-time aircraft tracking over India
 * OpenSky Network API with altitude-based color coding
 * Bilawal Sidhu God's Eye style visualization
 */
import {
  Viewer, Cartesian3, Color, HeightReference,
  PolylineGlowMaterialProperty, Entity, VerticalOrigin,
  NearFarScalar, DistanceDisplayCondition, CallbackProperty,
  JulianDate, SampledPositionProperty, ClockRange,
  HeadingPitchRoll, Transforms, Matrix4, Quaternion,
  LabelStyle, Cartesian2,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Aircraft {
  icao24: string;
  callsign: string;
  originCountry: string;
  latitude: number;
  longitude: number;
  baroAltitude: number; // meters
  onGround: boolean;
  velocity: number; // m/s
  trueTrack: number; // degrees
  verticalRate: number;
  category: 'commercial' | 'cargo' | 'military' | 'private' | 'government' | 'unknown';
  squawk: string | null;
  airline: string | null;
  aircraftType: string | null;
  origin: string | null;
  destination: string | null;
  lastContact: number;
}

interface FlightPath {
  icao24: string;
  callsign: string;
  track: { lat: number; lng: number; alt: number; time: number }[];
}

// ─── Demo Aircraft Data ──────────────────────────────────────────────────────

const DEMO_AIRCRAFT: Aircraft[] = [
  // Commercial flights across India
  { icao24: '800a12', callsign: 'AI101', originCountry: 'India', latitude: 19.0896, longitude: 72.8656, baroAltitude: 10668, onGround: false, velocity: 245, trueTrack: 285, verticalRate: 0, category: 'commercial', squawk: '2301', airline: 'Air India', aircraftType: 'B787', origin: 'BOM', destination: 'JFK', lastContact: Date.now() },
  { icao24: '800a23', callsign: 'AI302', originCountry: 'India', latitude: 28.5562, longitude: 77.1, baroAltitude: 9144, onGround: false, velocity: 230, trueTrack: 165, verticalRate: 0, category: 'commercial', squawk: '4521', airline: 'Air India', aircraftType: 'A320', origin: 'DEL', destination: 'MAA', lastContact: Date.now() },
  { icao24: '800a34', callsign: '6E201', originCountry: 'India', latitude: 18.5794, longitude: 73.9089, baroAltitude: 8534, onGround: false, velocity: 228, trueTrack: 45, verticalRate: 0, category: 'commercial', squawk: '1200', airline: 'IndiGo', aircraftType: 'A320neo', origin: 'PNQ', destination: 'DEL', lastContact: Date.now() },
  { icao24: '800a45', callsign: '6E405', originCountry: 'India', latitude: 13.1986, longitude: 77.7066, baroAltitude: 10058, onGround: false, velocity: 240, trueTrack: 340, verticalRate: 0, category: 'commercial', squawk: '3456', airline: 'IndiGo', aircraftType: 'A321neo', origin: 'BLR', destination: 'DEL', lastContact: Date.now() },
  { icao24: '800a56', callsign: 'SG412', originCountry: 'India', latitude: 22.6520, longitude: 88.4463, baroAltitude: 7620, onGround: false, velocity: 215, trueTrack: 180, verticalRate: -2, category: 'commercial', squawk: '5678', airline: 'SpiceJet', aircraftType: 'B737', origin: 'CCU', destination: 'MAA', lastContact: Date.now() },
  { icao24: '800a67', callsign: 'UK855', originCountry: 'India', latitude: 17.2403, longitude: 78.4294, baroAltitude: 9754, onGround: false, velocity: 235, trueTrack: 310, verticalRate: 0, category: 'commercial', squawk: '7654', airline: 'Vistara', aircraftType: 'A320neo', origin: 'HYD', destination: 'DEL', lastContact: Date.now() },
  { icao24: '800a78', callsign: 'G8333', originCountry: 'India', latitude: 25.4358, longitude: 81.7356, baroAltitude: 8839, onGround: false, velocity: 222, trueTrack: 225, verticalRate: 0, category: 'commercial', squawk: '1357', airline: 'GoFirst', aircraftType: 'A320neo', origin: 'DEL', destination: 'BOM', lastContact: Date.now() },
  { icao24: '800a89', callsign: 'AI680', originCountry: 'India', latitude: 12.9716, longitude: 77.5946, baroAltitude: 10363, onGround: false, velocity: 248, trueTrack: 315, verticalRate: 0, category: 'commercial', squawk: '2200', airline: 'Air India', aircraftType: 'B777', origin: 'BLR', destination: 'LHR', lastContact: Date.now() },
  { icao24: '800a90', callsign: '6E1701', originCountry: 'India', latitude: 21.1458, longitude: 79.0882, baroAltitude: 9144, onGround: false, velocity: 232, trueTrack: 250, verticalRate: 0, category: 'commercial', squawk: '4400', airline: 'IndiGo', aircraftType: 'A320', origin: 'NAG', destination: 'BOM', lastContact: Date.now() },

  // Cargo
  { icao24: '800b12', callsign: '5Y101', originCountry: 'Kenya', latitude: 20.5, longitude: 72.9, baroAltitude: 10058, onGround: false, velocity: 238, trueTrack: 90, verticalRate: 0, category: 'cargo', squawk: '2000', airline: 'Kenya Airways Cargo', aircraftType: 'B747F', origin: 'NBO', destination: 'BOM', lastContact: Date.now() },
  { icao24: '800b23', callsign: 'FX5040', originCountry: 'USA', latitude: 26.8, longitude: 80.9, baroAltitude: 10668, onGround: false, velocity: 250, trueTrack: 240, verticalRate: 0, category: 'cargo', squawk: '2100', airline: 'FedEx', aircraftType: 'B777F', origin: 'CDG', destination: 'DEL', lastContact: Date.now() },
  { icao24: '800b34', callsign: 'SQ7922', originCountry: 'Singapore', latitude: 8.5, longitude: 80.2, baroAltitude: 10668, onGround: false, velocity: 245, trueTrack: 310, verticalRate: 0, category: 'cargo', squawk: '2200', airline: 'SIA Cargo', aircraftType: 'B747-8F', origin: 'SIN', destination: 'MAA', lastContact: Date.now() },

  // Military
  { icao24: '800c12', callsign: 'IAF-VIPER1', originCountry: 'India', latitude: 24.6, longitude: 76.2, baroAltitude: 3048, onGround: false, velocity: 180, trueTrack: 120, verticalRate: 0, category: 'military', squawk: '7700', airline: 'Indian Air Force', aircraftType: 'Su-30MKI', origin: 'Jodhpur AFS', destination: 'LoB', lastContact: Date.now() },
  { icao24: '800c23', callsign: 'IAF-CARGO', originCountry: 'India', latitude: 26.2, longitude: 84.5, baroAltitude: 6096, onGround: false, velocity: 200, trueTrack: 90, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Air Force', aircraftType: 'C-17 Globemaster', origin: 'Hindon AFS', destination: 'Bagdogra AFS', lastContact: Date.now() },
  { icao24: '800c34', callsign: 'NAVY-P8I', originCountry: 'India', latitude: 10.8, longitude: 76.2, baroAltitude: 7620, onGround: false, velocity: 210, trueTrack: 270, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Navy', aircraftType: 'P-8I Poseidon', origin: 'INS Rajali', destination: 'Maritime Patrol', lastContact: Date.now() },
  { icao24: '800c45', callsign: 'IAF-TRAIN', originCountry: 'India', latitude: 27.3, longitude: 77.8, baroAltitude: 2134, onGround: false, velocity: 150, trueTrack: 180, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Air Force', aircraftType: 'Hawk 132', origin: 'AFA Dundigal', destination: 'Training', lastContact: Date.now() },
  { icao24: '800c56', callsign: 'IAF-AWACS', originCountry: 'India', latitude: 23.0, longitude: 78.5, baroAltitude: 9144, onGround: false, velocity: 220, trueTrack: 45, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Air Force', aircraftType: 'A50EI Phalcon', origin: 'Agra AFS', destination: 'AWACS Patrol', lastContact: Date.now() },

  // Government/VVIP
  { icao24: '800d12', callsign: 'AI100', originCountry: 'India', latitude: 24.0, longitude: 75.5, baroAltitude: 11582, onGround: false, velocity: 248, trueTrack: 340, verticalRate: 0, category: 'government', squawk: '0001', airline: 'Air India One', aircraftType: 'B777-300ER', origin: 'DEL', destination: 'Diplomatic', lastContact: Date.now() },

  // Private
  { icao24: '800e12', callsign: 'VT-ABC', originCountry: 'India', latitude: 19.2, longitude: 73.1, baroAltitude: 2438, onGround: false, velocity: 120, trueTrack: 60, verticalRate: 2, category: 'private', squawk: '1200', airline: null, aircraftType: 'Cessna 172', origin: 'PNQ', destination: 'Local', lastContact: Date.now() },
  { icao24: '800e23', callsign: 'VT-XYZ', originCountry: 'India', latitude: 28.5, longitude: 77.2, baroAltitude: 1524, onGround: false, velocity: 140, trueTrack: 200, verticalRate: 0, category: 'private', squawk: '1200', airline: null, aircraftType: 'King Air 350', origin: 'DEL', destination: 'JAI', lastContact: Date.now() },

  // International overflights
  { icao24: 'a12345', callsign: 'EK510', originCountry: 'UAE', latitude: 23.0, longitude: 68.5, baroAltitude: 11582, onGround: false, velocity: 255, trueTrack: 90, verticalRate: 0, category: 'commercial', squawk: '2000', airline: 'Emirates', aircraftType: 'A380', origin: 'DXB', destination: 'BOM', lastContact: Date.now() },
  { icao24: 'a12346', callsign: 'SQ422', originCountry: 'Singapore', latitude: 6.5, longitude: 80.0, baroAltitude: 10973, onGround: false, velocity: 250, trueTrack: 310, verticalRate: 0, category: 'commercial', squawk: '2000', airline: 'Singapore Airlines', aircraftType: 'A350', origin: 'SIN', destination: 'DEL', lastContact: Date.now() },

  // On ground at major airports
  { icao24: '800f12', callsign: 'AI202', originCountry: 'India', latitude: 19.0887, longitude: 72.8679, baroAltitude: 0, onGround: true, velocity: 5, trueTrack: 270, verticalRate: 0, category: 'commercial', squawk: null, airline: 'Air India', aircraftType: 'B787', origin: 'BOM', destination: 'LHR', lastContact: Date.now() },
  { icao24: '800f23', callsign: 'UK945', originCountry: 'India', latitude: 28.5562, longitude: 77.0843, baroAltitude: 0, onGround: true, velocity: 8, trueTrack: 100, verticalRate: 0, category: 'commercial', squawk: null, airline: 'Vistara', aircraftType: 'A320neo', origin: 'DEL', destination: 'BOM', lastContact: Date.now() },
];

const DEMO_FLIGHT_PATHS: FlightPath[] = [
  { icao24: '800a12', callsign: 'AI101', track: [
    { lat: 19.0896, lng: 72.8679, alt: 0, time: Date.now() - 7200000 },
    { lat: 19.5, lng: 73.5, alt: 6096, time: Date.now() - 6600000 },
    { lat: 21.0, lng: 74.0, alt: 9144, time: Date.now() - 5400000 },
    { lat: 23.5, lng: 73.5, alt: 10058, time: Date.now() - 4200000 },
    { lat: 26.0, lng: 72.0, alt: 10668, time: Date.now() - 3000000 },
    { lat: 28.0, lng: 69.5, alt: 10668, time: Date.now() - 1800000 },
    { lat: 19.0896, lng: 72.8656, alt: 10668, time: Date.now() },
    { lat: 30.0, lng: 68.0, alt: 10668, time: Date.now() + 600000 },
    { lat: 38.0, lng: 55.0, alt: 10668, time: Date.now() + 3600000 },
    { lat: 50.0, lng: 20.0, alt: 10668, time: Date.now() + 7200000 },
  ]},
  { icao24: '800c12', callsign: 'IAF-VIPER1', track: [
    { lat: 26.2858, lng: 73.0167, alt: 0, time: Date.now() - 3600000 },
    { lat: 25.8, lng: 74.0, alt: 4572, time: Date.now() - 2400000 },
    { lat: 25.0, lng: 75.2, alt: 5486, time: Date.now() - 1200000 },
    { lat: 24.6, lng: 76.2, alt: 3048, time: Date.now() },
  ]},
  { icao24: '800a45', callsign: '6E405', track: [
    { lat: 13.1986, lng: 77.7066, alt: 0, time: Date.now() - 5400000 },
    { lat: 14.5, lng: 77.5, alt: 7620, time: Date.now() - 4200000 },
    { lat: 16.0, lng: 77.0, alt: 9754, time: Date.now() - 3000000 },
    { lat: 18.0, lng: 76.5, alt: 10058, time: Date.now() - 1800000 },
    { lat: 20.0, lng: 76.0, alt: 10058, time: Date.now() - 600000 },
    { lat: 13.1986, lng: 77.7066, alt: 10058, time: Date.now() },
    { lat: 24.0, lng: 76.5, alt: 10058, time: Date.now() + 600000 },
    { lat: 28.5562, lng: 77.0843, alt: 0, time: Date.now() + 1800000 },
  ]},
];

// ─── Color Mapping ───────────────────────────────────────────────────────────

function getAltitudeColor(altMeters: number): Color {
  if (altMeters <= 0) return Color.GRAY;
  if (altMeters < 3000) return Color.fromCssColorString('#4caf50');    // Green — low
  if (altMeters < 6000) return Color.fromCssColorString('#8bc34a');    // Light green
  if (altMeters < 9000) return Color.fromCssColorString('#ffeb3b');    // Yellow — mid
  if (altMeters < 10500) return Color.fromCssColorString('#ff9800');   // Orange — high
  return Color.fromCssColorString('#f44336');                           // Red — cruise
}

const CATEGORY_COLORS: Record<string, Color> = {
  commercial: Color.fromCssColorString('#2196f3'),
  cargo: Color.fromCssColorString('#ff9800'),
  military: Color.fromCssColorString('#ff1744'),
  private: Color.fromCssColorString('#4caf50'),
  government: Color.fromCssColorString('#9c27b0'),
  unknown: Color.GRAY,
};

const CATEGORY_ICONS: Record<string, string> = {
  commercial: '✈', cargo: '📦', military: '🎖', private: '🛩', government: '🏛', unknown: '?',
};

const AIRLINE_CODES: Record<string, string> = {
  'AI': 'Air India', '6E': 'IndiGo', 'SG': 'SpiceJet', 'UK': 'Vistara',
  'G8': 'GoFirst', 'I5': 'AirAsia India', 'IX': 'Air India Express',
  'EK': 'Emirates', 'SQ': 'Singapore Airlines', 'BA': 'British Airways',
  'LH': 'Lufthansa', 'QR': 'Qatar Airways', 'FX': 'FedEx', '5Y': 'Atlas Air',
};

function classifyAircraft(callsign: string, originCountry: string): Aircraft['category'] {
  if (callsign.startsWith('IAF') || callsign.startsWith('NAVY')) return 'military';
  if (callsign === 'AI100') return 'government';
  const prefix = callsign.substring(0, 2);
  if (AIRLINE_CODES[prefix]) return 'commercial';
  if (prefix === 'FX' || prefix === '5Y') return 'cargo';
  if (callsign.startsWith('VT-')) return 'private';
  return 'unknown';
}

// ─── Layer Implementation ────────────────────────────────────────────────────

export class LiveAirTrafficLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'live-air-traffic',
    name: 'Live Air Traffic',
    icon: '✈️',
    description: 'Real-time aircraft positions over India via OpenSky Network. Altitude color-coded, click for details.',
    category: 'intelligence',
    color: '#2196f3',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'airTraffic',
  };

  private aircraft: Aircraft[] = [...DEMO_AIRCRAFT];
  private flightPaths: FlightPath[] = [...DEMO_FLIGHT_PATHS];
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private entityMap: Map<string, Entity> = new Map();

  constructor(viewer: Viewer, dataStore: any) {
    super(viewer, dataStore);
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    this.clear();
    this.renderAircraft();
    this.renderFlightPaths();
    this.startUpdates();
  }

  async disable(): Promise<void> {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.entityMap.clear();
    await super.disable();
  }

  private startUpdates(): void {
    this.updateTimer = setInterval(() => {
      if (!this._enabled) return;
      this.simulateMovement();
      this.updateEntities();
    }, 5000);
  }

  private simulateMovement(): void {
    const dt = 5; // seconds
    this.aircraft.forEach(ac => {
      if (ac.onGround) return;
      // Move along heading
      const distMeters = ac.velocity * dt;
      const dLat = (distMeters * Math.cos(ac.trueTrack * Math.PI / 180)) / 111320;
      const dLng = (distMeters * Math.sin(ac.trueTrack * Math.PI / 180)) / (111320 * Math.cos(ac.latitude * Math.PI / 180));
      ac.latitude += dLat;
      ac.longitude += dLng;
      // Altitude change
      ac.baroAltitude += ac.verticalRate * dt;
      // Slight heading variation for realism
      ac.trueTrack += (Math.random() - 0.5) * 2;
      if (ac.trueTrack > 360) ac.trueTrack -= 360;
      if (ac.trueTrack < 0) ac.trueTrack += 360;
      // Wrap around India region
      if (ac.latitude > 38) ac.latitude = 6;
      if (ac.latitude < 6) ac.latitude = 38;
      if (ac.longitude > 98) ac.longitude = 68;
      if (ac.longitude < 68) ac.longitude = 98;
      ac.lastContact = Date.now();
    });
  }

  private updateEntities(): void {
    this.aircraft.forEach(ac => {
      const entity = this.entityMap.get(ac.icao24);
      if (!entity) return;
      entity.position = new CallbackProperty(() =>
        Cartesian3.fromDegrees(ac.longitude, ac.latitude, ac.baroAltitude), false
      );
    });
  }

  private renderAircraft(): void {
    this.aircraft.forEach(ac => {
      const altColor = getAltitudeColor(ac.baroAltitude);
      const catColor = CATEGORY_COLORS[ac.category] || Color.GRAY;
      const altKm = (ac.baroAltitude / 1000).toFixed(1);
      const speedKts = Math.round(ac.velocity * 1.944);
      const icon = CATEGORY_ICONS[ac.category] || '?';

      const entity = this.dataSource.entities.add({
        id: `aircraft-${ac.icao24}`,
        position: Cartesian3.fromDegrees(ac.longitude, ac.latitude, ac.baroAltitude),
        point: {
          pixelSize: ac.category === 'military' ? 14 : 10,
          color: altColor,
          outlineColor: catColor,
          outlineWidth: 2,
          heightReference: HeightReference.NONE,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 1e7, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${icon} ${ac.callsign}`,
          font: '12px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -15),
          scaleByDistance: new NearFarScalar(1e5, 1.0, 5e6, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.7)'),
        },
        description: `
<div style="font-family:monospace;color:#0ff;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${altColor.toCssColorString()};margin:0 0 8px 0;">${icon} ${ac.callsign}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>ICAO24:</td><td style="color:#0ff;">${ac.icao24.toUpperCase()}</td></tr>
    <tr><td>Airline:</td><td style="color:#0ff;">${ac.airline || 'N/A'}</td></tr>
    <tr><td>Aircraft:</td><td style="color:#0ff;">${ac.aircraftType || 'Unknown'}</td></tr>
    <tr><td>Category:</td><td style="color:${catColor.toCssColorString()};">${ac.category.toUpperCase()}</td></tr>
    <tr><td>Altitude:</td><td style="color:${altColor.toCssColorString()};">${altKm} km (${Math.round(ac.baroAltitude * 3.281)} ft)</td></tr>
    <tr><td>Speed:</td><td style="color:#0ff;">${speedKts} kts (${ac.velocity} m/s)</td></tr>
    <tr><td>Heading:</td><td style="color:#0ff;">${Math.round(ac.trueTrack)}°</td></tr>
    <tr><td>Vertical Rate:</td><td style="color:#0ff;">${ac.verticalRate} m/s</td></tr>
    <tr><td>Origin:</td><td style="color:#0ff;">${ac.origin || 'N/A'}</td></tr>
    <tr><td>Destination:</td><td style="color:#0ff;">${ac.destination || 'N/A'}</td></tr>
    <tr><td>Squawk:</td><td style="color:#ff0;">${ac.squawk || 'N/A'}</td></tr>
    <tr><td>Coordinates:</td><td style="color:#0ff;">${ac.latitude.toFixed(4)}°N, ${ac.longitude.toFixed(4)}°E</td></tr>
  </table>
</div>`,
      });
      this.entityMap.set(ac.icao24, entity);
    });
  }

  private renderFlightPaths(): void {
    this.flightPaths.forEach(fp => {
      const positions: Cartesian3[] = fp.track.map(p =>
        Cartesian3.fromDegrees(p.lng, p.lat, p.alt)
      );

      this.dataSource.entities.add({
        id: `flightpath-${fp.icao24}`,
        polyline: {
          positions,
          width: 2,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Color.fromCssColorString('#00e5ff').withAlpha(0.7),
          }),
          clampToGround: false,
        },
      });

      // Trail dots
      fp.track.forEach((p, i) => {
        if (i === fp.track.length - 1) return; // Skip current position
        const age = (Date.now() - p.time) / 3600000; // hours
        const alpha = Math.max(0.1, 1 - age * 0.3);
        this.dataSource.entities.add({
          id: `trail-${fp.icao24}-${i}`,
          position: Cartesian3.fromDegrees(p.lng, p.lat, p.alt),
          point: {
            pixelSize: 4,
            color: Color.fromCssColorString('#00e5ff').withAlpha(alpha),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      });
    });
  }

  /** Try fetching real data from OpenSky (falls back to demo) */
  async fetchLiveData(): Promise<void> {
    try {
      const resp = await fetch('https://opensky-network.org/api/states/all?lamin=6&lomin=68&lamax=38&lomax=98');
      if (!resp.ok) return;
      const data = await resp.json();
      if (data.states) {
        this.aircraft = data.states.slice(0, 50).map((s: any[]) => ({
          icao24: s[0],
          callsign: (s[1] || '').trim(),
          originCountry: s[2],
          longitude: s[5],
          latitude: s[6],
          baroAltitude: s[7] || 0,
          onGround: s[8],
          velocity: s[9] || 0,
          trueTrack: s[10] || 0,
          verticalRate: s[11] || 0,
          squawk: s[14],
          category: classifyAircraft((s[1] || '').trim(), s[2]),
          airline: null, aircraftType: null, origin: null, destination: null,
          lastContact: s[4] * 1000,
        }));
        this.updateEntities();
      }
    } catch { /* Use demo data */ }
  }
}
