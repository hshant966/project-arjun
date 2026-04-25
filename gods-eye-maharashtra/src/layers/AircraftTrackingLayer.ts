/**
 * AircraftTrackingLayer — Live aircraft tracking via OpenSky Network
 * Military vs commercial indicators, flight path visualization
 * Covers India FIR with demo data
 */
import {
  Viewer, Cartesian3, Color, HeightReference,
  PolylineGlowMaterialProperty, PolylineDashMaterialProperty,
  CallbackProperty, JulianDate, Entity, VerticalOrigin,
  NearFarScalar, DistanceDisplayCondition, Matrix4,
  Transforms, HeadingPitchRoll, Quaternion,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Aircraft {
  icao24: string; // ICAO 24-bit address
  callsign: string;
  originCountry: string;
  latitude: number;
  longitude: number;
  baroAltitude: number; // meters
  onGround: boolean;
  velocity: number; // m/s
  trueTrack: number; // degrees
  verticalRate: number; // m/s
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

// ─── Demo Data — Representative flights over India ───────────────────────────

const DEMO_AIRCRAFT: Aircraft[] = [
  // ── Commercial ────────────────────────────────────────────────────────────
  { icao24: '800a12', callsign: 'AI101', originCountry: 'India', latitude: 19.0896, longitude: 72.8656, baroAltitude: 10668, onGround: false, velocity: 245, trueTrack: 285, verticalRate: 0, category: 'commercial', squawk: '2301', airline: 'Air India', aircraftType: 'B787', origin: 'BOM', destination: 'JFK', lastContact: Date.now() - 5000 },
  { icao24: '800a23', callsign: 'AI302', originCountry: 'India', latitude: 28.5562, longitude: 77.1000, baroAltitude: 9144, onGround: false, velocity: 230, trueTrack: 165, verticalRate: 0, category: 'commercial', squawk: '4521', airline: 'Air India', aircraftType: 'A320', origin: 'DEL', destination: 'MAA', lastContact: Date.now() - 3000 },
  { icao24: '800a34', callsign: '6E201', originCountry: 'India', latitude: 18.5794, longitude: 73.9089, baroAltitude: 8534, onGround: false, velocity: 228, trueTrack: 45, verticalRate: 0, category: 'commercial', squawk: '1200', airline: 'IndiGo', aircraftType: 'A320neo', origin: 'PNQ', destination: 'DEL', lastContact: Date.now() - 8000 },
  { icao24: '800a45', callsign: '6E405', originCountry: 'India', latitude: 13.1986, longitude: 77.7066, baroAltitude: 10058, onGround: false, velocity: 240, trueTrack: 340, verticalRate: 0, category: 'commercial', squawk: '3456', airline: 'IndiGo', aircraftType: 'A321neo', origin: 'BLR', destination: 'DEL', lastContact: Date.now() - 2000 },
  { icao24: '800a56', callsign: 'SG412', originCountry: 'India', latitude: 22.6520, longitude: 88.4463, baroAltitude: 7620, onGround: false, velocity: 215, trueTrack: 180, verticalRate: -2, category: 'commercial', squawk: '5678', airline: 'SpiceJet', aircraftType: 'B737', origin: 'CCU', destination: 'MAA', lastContact: Date.now() - 6000 },
  { icao24: '800a67', callsign: 'UK855', originCountry: 'India', latitude: 17.2403, longitude: 78.4294, baroAltitude: 9754, onGround: false, velocity: 235, trueTrack: 310, verticalRate: 0, category: 'commercial', squawk: '7654', airline: 'Vistara', aircraftType: 'A320neo', origin: 'HYD', destination: 'DEL', lastContact: Date.now() - 4000 },
  { icao24: '800a78', callsign: 'G8333', originCountry: 'India', latitude: 25.4358, longitude: 81.7356, baroAltitude: 8839, onGround: false, velocity: 222, trueTrack: 225, verticalRate: 0, category: 'commercial', squawk: '1357', airline: 'GoAir', aircraftType: 'A320neo', origin: 'DEL', destination: 'BOM', lastContact: Date.now() - 7000 },

  // ── Cargo ─────────────────────────────────────────────────────────────────
  { icao24: '800b12', callsign: '5Y101', originCountry: 'Kenya', latitude: 20.5000, longitude: 72.9000, baroAltitude: 10058, onGround: false, velocity: 238, trueTrack: 90, verticalRate: 0, category: 'cargo', squawk: '2000', airline: 'Kenya Airways Cargo', aircraftType: 'B747F', origin: 'NBO', destination: 'BOM', lastContact: Date.now() - 5000 },
  { icao24: '800b23', callsign: 'FX5040', originCountry: 'United States', latitude: 26.8000, longitude: 80.9000, baroAltitude: 10668, onGround: false, velocity: 250, trueTrack: 240, verticalRate: 0, category: 'cargo', squawk: '2100', airline: 'FedEx', aircraftType: 'B777F', origin: 'CDG', destination: 'DEL', lastContact: Date.now() - 3000 },

  // ── Military ──────────────────────────────────────────────────────────────
  { icao24: '800c12', callsign: 'IAF-VIPER1', originCountry: 'India', latitude: 24.6000, longitude: 76.2000, baroAltitude: 3048, onGround: false, velocity: 180, trueTrack: 120, verticalRate: 0, category: 'military', squawk: '7700', airline: 'Indian Air Force', aircraftType: 'Su-30MKI', origin: 'Jodhpur AFS', destination: 'LoB', lastContact: Date.now() - 10000 },
  { icao24: '800c23', callsign: 'IAF-CARGO', originCountry: 'India', latitude: 26.2000, longitude: 84.5000, baroAltitude: 6096, onGround: false, velocity: 200, trueTrack: 90, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Air Force', aircraftType: 'C-17 Globemaster', origin: 'Hindon AFS', destination: 'Bagdogra AFS', lastContact: Date.now() - 12000 },
  { icao24: '800c34', callsign: 'NAVY-P8I', originCountry: 'India', latitude: 10.8000, longitude: 76.2000, baroAltitude: 7620, onGround: false, velocity: 210, trueTrack: 270, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Navy', aircraftType: 'P-8I Poseidon', origin: 'INS Rajali', destination: 'Maritime Patrol', lastContact: Date.now() - 15000 },
  { icao24: '800c45', callsign: 'IAF-TRAIN', originCountry: 'India', latitude: 27.3000, longitude: 77.8000, baroAltitude: 2134, onGround: false, velocity: 150, trueTrack: 180, verticalRate: 0, category: 'military', squawk: null, airline: 'Indian Air Force', aircraftType: 'Hawk 132', origin: 'AFA Dundigal', destination: 'Training', lastContact: Date.now() - 8000 },

  // ── Government/VVIP ───────────────────────────────────────────────────────
  { icao24: '800d12', callsign: 'AI100', originCountry: 'India', latitude: 24.0000, longitude: 75.5000, baroAltitude: 11582, onGround: false, velocity: 248, trueTrack: 340, verticalRate: 0, category: 'government', squawk: '0001', airline: 'Air India One', aircraftType: 'B777-300ER', origin: 'DEL', destination: 'Diplomatic', lastContact: Date.now() - 4000 },

  // ── Private ───────────────────────────────────────────────────────────────
  { icao24: '800e12', callsign: 'VT-ABC', originCountry: 'India', latitude: 19.2000, longitude: 73.1000, baroAltitude: 2438, onGround: false, velocity: 120, trueTrack: 60, verticalRate: 2, category: 'private', squawk: '1200', airline: null, aircraftType: 'Cessna 172', origin: 'PNQ', destination: 'Local', lastContact: Date.now() - 20000 },
  { icao24: '800e23', callsign: 'VT-XYZ', originCountry: 'India', latitude: 28.5000, longitude: 77.2000, baroAltitude: 1524, onGround: false, velocity: 140, trueTrack: 200, verticalRate: 0, category: 'private', squawk: '1200', airline: null, aircraftType: 'King Air 350', origin: 'DEL', destination: 'JAI', lastContact: Date.now() - 10000 },

  // ── On Ground ─────────────────────────────────────────────────────────────
  { icao24: '800f12', callsign: 'AI202', originCountry: 'India', latitude: 19.0887, longitude: 72.8679, baroAltitude: 0, onGround: true, velocity: 5, trueTrack: 270, verticalRate: 0, category: 'commercial', squawk: null, airline: 'Air India', aircraftType: 'B787', origin: 'BOM', destination: 'LHR', lastContact: Date.now() - 30000 },
  { icao24: '800f23', callsign: 'UK945', originCountry: 'India', latitude: 28.5562, longitude: 77.0843, baroAltitude: 0, onGround: true, velocity: 8, trueTrack: 100, verticalRate: 0, category: 'commercial', squawk: null, airline: 'Vistara', aircraftType: 'A320neo', origin: 'DEL', destination: 'BOM', lastContact: Date.now() - 45000 },
];

const DEMO_FLIGHT_PATHS: FlightPath[] = [
  {
    icao24: '800a12', callsign: 'AI101',
    track: [
      { lat: 19.0896, lng: 72.8679, alt: 0, time: Date.now() - 7200000 },
      { lat: 19.5, lng: 73.5, alt: 6096, time: Date.now() - 6600000 },
      { lat: 21.0, lng: 74.0, alt: 9144, time: Date.now() - 5400000 },
      { lat: 23.5, lng: 73.5, alt: 10058, time: Date.now() - 4200000 },
      { lat: 26.0, lng: 72.0, alt: 10668, time: Date.now() - 3000000 },
      { lat: 28.0, lng: 69.5, alt: 10668, time: Date.now() - 1800000 },
      { lat: 19.0896, lng: 72.8656, alt: 10668, time: Date.now() - 5000 }, // Current
      { lat: 30.0, lng: 68.0, alt: 10668, time: Date.now() + 600000 }, // Projected
      { lat: 38.0, lng: 55.0, alt: 10668, time: Date.now() + 3600000 },
      { lat: 50.0, lng: 20.0, alt: 10668, time: Date.now() + 7200000 },
    ],
  },
  {
    icao24: '800c12', callsign: 'IAF-VIPER1',
    track: [
      { lat: 26.2858, lng: 73.0167, alt: 0, time: Date.now() - 3600000 },
      { lat: 25.8, lng: 74.0, alt: 4572, time: Date.now() - 2400000 },
      { lat: 25.0, lng: 75.2, alt: 5486, time: Date.now() - 1200000 },
      { lat: 24.6, lng: 76.2, alt: 3048, time: Date.now() - 10000 },
    ],
  },
];

// ─── Color Mapping ───────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  commercial: '#2196f3',
  cargo: '#ff9800',
  military: '#f44336',
  private: '#4caf50',
  government: '#9c27b0',
  unknown: '#9e9e9e',
};

const CATEGORY_LABELS: Record<string, string> = {
  commercial: '✈️ Commercial',
  cargo: '📦 Cargo',
  military: '🎖️ Military',
  private: '🛩️ Private',
  government: '🏛️ Government',
  unknown: '❓ Unknown',
};

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class AircraftTrackingLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'aircraft-tracking',
    name: 'Aircraft Tracking',
    icon: '✈️',
    description: 'Live aircraft tracking via OpenSky Network — military, commercial, cargo over India',
    category: 'global',
    color: '#42a5f5',
    enabled: false,
    opacity: 0.85,
    dataStoreKey: 'aircraft-tracking',
  };

  protected async loadData(): Promise<void> {
    this.clear();
    this.loadAircraft(DEMO_AIRCRAFT);
    this.loadFlightPaths(DEMO_FLIGHT_PATHS);
    this.loadAircraftStats(DEMO_AIRCRAFT);
  }

  // ─── Aircraft Markers ────────────────────────────────────────────────────

  private loadAircraft(aircraft: Aircraft[]): void {
    for (const ac of aircraft) {
      const color = CATEGORY_COLORS[ac.category] || '#9e9e9e';
      const catLabel = CATEGORY_LABELS[ac.category] || 'Unknown';

      const altitudeKm = (ac.baroAltitude / 1000).toFixed(1);
      const speedKmh = (ac.velocity * 3.6).toFixed(0);
      const heading = ac.trueTrack;

      // Military aircraft get a distinct red glow ring
      if (ac.category === 'military') {
        const ringPositions: Cartesian3[] = [];
        for (let i = 0; i <= 32; i++) {
          const angle = (i / 32) * 2 * Math.PI;
          ringPositions.push(Cartesian3.fromDegrees(
            ac.longitude + Math.cos(angle) * 0.15,
            ac.latitude + Math.sin(angle) * 0.15,
            0
          ));
        }
        this.dataSource.entities.add({
          polyline: {
            positions: ringPositions,
            width: 2,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.3,
              color: Color.fromCssColorString('#f44336').withAlpha(0.4),
            }),
            clampToGround: true,
          },
        });
      }

      // Aircraft entity
      this.dataSource.entities.add({
        id: `aircraft-${ac.icao24}`,
        position: Cartesian3.fromDegrees(
          ac.longitude, ac.latitude,
          ac.onGround ? 0 : ac.baroAltitude
        ),
        point: {
          pixelSize: ac.category === 'military' ? 16 :
                     ac.onGround ? 8 : 12,
          color: Color.fromCssColorString(color).withAlpha(
            ac.onGround ? 0.5 : this.config.opacity
          ),
          outlineColor: ac.category === 'military' ?
            Color.fromCssColorString('#ff0000') : Color.WHITE,
          outlineWidth: ac.category === 'military' ? 2.5 : 1.5,
          scaleByDistance: new NearFarScalar(1e4, 1.5, 5e6, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>${catLabel}: ${ac.callsign.trim()}</h3>
            <p style="color:${color};font-weight:bold">
              ${ac.onGround ? '🛬 ON GROUND' : `✈️ ${(ac.baroAltitude * 3.28084 / 1000).toFixed(0)}k ft`}
            </p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>ICAO24</td><td>${ac.icao24.toUpperCase()}</td></tr>
              <tr><td>Callsign</td><td>${ac.callsign}</td></tr>
              <tr><td>Aircraft Type</td><td>${ac.aircraftType || 'Unknown'}</td></tr>
              <tr><td>Airline/Unit</td><td>${ac.airline || 'N/A'}</td></tr>
              <tr><td>Origin</td><td>${ac.origin || 'N/A'}</td></tr>
              <tr><td>Destination</td><td>${ac.destination || 'N/A'}</td></tr>
              <tr><td>Country</td><td>${ac.originCountry}</td></tr>
              <tr><td>Altitude</td><td>${altitudeKm} km (${(ac.baroAltitude * 3.28084).toFixed(0)} ft)</td></tr>
              <tr><td>Speed</td><td>${speedKmh} km/h (${(ac.velocity * 1.94384).toFixed(0)} kts)</td></tr>
              <tr><td>Heading</td><td>${heading.toFixed(0)}°</td></tr>
              <tr><td>Vertical Rate</td><td>${ac.verticalRate > 0 ? '↑' : ac.verticalRate < 0 ? '↓' : '→'} ${Math.abs(ac.verticalRate).toFixed(1)} m/s</td></tr>
              ${ac.squawk ? `<tr><td>Squawk</td><td>${ac.squawk}</td></tr>` : ''}
              <tr><td>Position</td><td>${ac.latitude.toFixed(4)}°N, ${ac.longitude.toFixed(4)}°E</td></tr>
            </table>
            <p><a href="https://www.opensky-network.org/datasets/states/?icao24=${ac.icao24}" target="_blank">OpenSky Data</a></p>
          </div>
        `,
      });
    }
  }

  // ─── Flight Paths ────────────────────────────────────────────────────────

  private loadFlightPaths(paths: FlightPath[]): void {
    for (const path of paths) {
      const ac = DEMO_AIRCRAFT.find(a => a.icao24 === path.icao24);
      const color = ac ? CATEGORY_COLORS[ac.category] : '#9e9e9e';

      // Historical track (solid)
      const historicalIdx = path.track.findIndex(t => t.time > Date.now() - 60000);
      const historicalTrack = path.track.slice(0, historicalIdx > 0 ? historicalIdx + 1 : path.track.length - 1);
      if (historicalTrack.length >= 2) {
        const positions = historicalTrack.map(t =>
          Cartesian3.fromDegrees(t.lng, t.lat, t.alt)
        );
        this.dataSource.entities.add({
          id: `flight-path-hist-${path.icao24}`,
          polyline: {
            positions,
            width: 2,
            material: new PolylineGlowMaterialProperty({
              glowPower: 0.15,
              color: Color.fromCssColorString(color).withAlpha(0.7),
            }),
          },
        });
      }

      // Projected track (dashed)
      const futureTrack = path.track.filter(t => t.time > Date.now());
      if (futureTrack.length >= 2) {
        const currentPos = path.track.find(t => t.time <= Date.now() && t.time > Date.now() - 600000);
        const projectedPositions = [
          currentPos ? Cartesian3.fromDegrees(currentPos.lng, currentPos.lat, currentPos.alt) : null,
          ...futureTrack.map(t => Cartesian3.fromDegrees(t.lng, t.lat, t.alt)),
        ].filter(Boolean) as Cartesian3[];

        if (projectedPositions.length >= 2) {
          this.dataSource.entities.add({
            id: `flight-path-proj-${path.icao24}`,
            polyline: {
              positions: projectedPositions,
              width: 1.5,
              material: new PolylineDashMaterialProperty({
                color: Color.fromCssColorString(color).withAlpha(0.5),
                dashLength: 8,
              }),
            },
          });
        }
      }
    }
  }

  // ─── Stats Summary ───────────────────────────────────────────────────────

  private loadAircraftStats(aircraft: Aircraft[]): void {
    const total = aircraft.length;
    const airborne = aircraft.filter(a => !a.onGround).length;
    const military = aircraft.filter(a => a.category === 'military').length;
    const commercial = aircraft.filter(a => a.category === 'commercial').length;

    // Place summary label over India center
    this.dataSource.entities.add({
      position: Cartesian3.fromDegrees(78.0, 22.0, 0),
      label: {
        text: `✈️ ${airborne}/${total} airborne | 🎖️ ${military} military | ✈️ ${commercial} commercial`,
        font: 'bold 13px system-ui',
        fillColor: Color.fromCssColorString('#42a5f5'),
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(1e4, 1.0, 2e6, 0.3),
        distanceDisplayCondition: new DistanceDisplayCondition(0, 2000000),
      },
    });

    // FIR boundary outline (simplified India FIR)
    const firBoundary = [
      [68.0, 24.0], [68.0, 37.0], [80.0, 37.0], [97.5, 28.0],
      [97.5, 8.0], [80.0, 6.0], [68.0, 8.0], [68.0, 24.0],
    ];
    this.dataSource.entities.add({
      polyline: {
        positions: firBoundary.map(([lng, lat]) => Cartesian3.fromDegrees(lng, lat, 0)),
        width: 1,
        material: new PolylineDashMaterialProperty({
          color: Color.fromCssColorString('#42a5f5').withAlpha(0.2),
          dashLength: 16,
        }),
        clampToGround: true,
      },
    });
  }

  // ─── Material Overrides ──────────────────────────────────────────────────

  protected getMaterial(): any {
    return undefined;
  }

  protected getPointColor(): any {
    return undefined;
  }

  protected getLineColor(): any {
    return undefined;
  }
}
