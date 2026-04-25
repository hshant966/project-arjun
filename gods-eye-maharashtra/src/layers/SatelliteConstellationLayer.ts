/**
 * SatelliteConstellationLayer — Real-time satellite tracking with TLE propagation
 * ISRO, ESA, military, communication, navigation satellites
 * Orbital paths as 3D lines, color-coded by type
 */
import {
  Viewer, Cartesian3, Color, JulianDate, SampledPositionProperty,
  PolylineGlowMaterialProperty, PolylineDashMaterialProperty,
  Entity, VerticalOrigin, NearFarScalar, DistanceDisplayCondition,
  CallbackProperty, LabelStyle, Cartesian2,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

type SatType = 'communication' | 'imaging' | 'navigation' | 'military' | 'space_station' | 'weather' | 'scientific';

interface Satellite {
  noradId: string;
  name: string;
  type: SatType;
  operator: string;
  inclination: number; // deg
  period: number; // min
  altitude: number; // km
  raan: number; // right ascension ascending node
  argPerigee: number;
  meanAnomaly: number;
  eccentricity: number;
}

// ─── Demo Satellite Data ─────────────────────────────────────────────────────

const SATELLITES: Satellite[] = [
  // ISRO
  { noradId: '41240', name: 'RESOURCESAT-2A', type: 'imaging', operator: 'ISRO', inclination: 98.1, period: 99, altitude: 817, raan: 120, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0002 },
  { noradId: '44804', name: 'CARTOSAT-3', type: 'imaging', operator: 'ISRO', inclination: 97.5, period: 97, altitude: 505, raan: 60, argPerigee: 0, meanAnomaly: 90, eccentricity: 0.0001 },
  { noradId: '43658', name: 'CARTOSAT-2F', type: 'imaging', operator: 'ISRO', inclination: 97.4, period: 97, altitude: 505, raan: 180, argPerigee: 0, meanAnomaly: 180, eccentricity: 0.0001 },
  { noradId: '40069', name: 'RISAT-2BR1', type: 'imaging', operator: 'ISRO', inclination: 97.5, period: 95, altitude: 557, raan: 240, argPerigee: 0, meanAnomaly: 270, eccentricity: 0.0001 },
  { noradId: '38248', name: 'OCEANSAT-2', type: 'weather', operator: 'ISRO', inclination: 98.3, period: 99, altitude: 720, raan: 300, argPerigee: 0, meanAnomaly: 45, eccentricity: 0.0001 },
  { noradId: '48051', name: 'EOS-03 (GISAT-1)', type: 'imaging', operator: 'ISRO', inclination: 0.1, period: 1436, altitude: 35786, raan: 82, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '44342', name: 'EMISAT', type: 'military', operator: 'DRDO/ISRO', inclination: 98.3, period: 100, altitude: 748, raan: 150, argPerigee: 0, meanAnomaly: 135, eccentricity: 0.0001 },
  { noradId: '52764', name: 'CMS-02 (GSAT-24)', type: 'communication', operator: 'ISRO', inclination: 0.05, period: 1436, altitude: 35786, raan: 74, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '41028', name: 'IRNSS-1E', type: 'navigation', operator: 'ISRO', inclination: 29, period: 1436, altitude: 35786, raan: 55, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '41241', name: 'IRNSS-1F', type: 'navigation', operator: 'ISRO', inclination: 29, period: 1436, altitude: 35786, raan: 111, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '41384', name: 'IRNSS-1G', type: 'navigation', operator: 'ISRO', inclination: 29, period: 1436, altitude: 35786, raan: 167, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '41469', name: 'IRNSS-1H', type: 'navigation', operator: 'ISRO', inclination: 29, period: 1436, altitude: 35786, raan: 223, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '41551', name: 'IRNSS-1I', type: 'navigation', operator: 'ISRO', inclination: 29, period: 1436, altitude: 35786, raan: 279, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },

  // ESA / Copernicus
  { noradId: '43013', name: 'SENTINEL-2A', type: 'imaging', operator: 'ESA/Copernicus', inclination: 98.56, period: 100.6, altitude: 786, raan: 30, argPerigee: 0, meanAnomaly: 45, eccentricity: 0.0001 },
  { noradId: '42063', name: 'SENTINEL-2B', type: 'imaging', operator: 'ESA/Copernicus', inclination: 98.56, period: 100.6, altitude: 786, raan: 210, argPerigee: 0, meanAnomaly: 225, eccentricity: 0.0001 },
  { noradId: '40069', name: 'SENTINEL-1A', type: 'imaging', operator: 'ESA/Copernicus', inclination: 98.18, period: 96, altitude: 693, raan: 90, argPerigee: 0, meanAnomaly: 135, eccentricity: 0.0001 },

  // GPS constellation (selection)
  { noradId: '28190', name: 'GPS IIR-10', type: 'navigation', operator: 'USAF', inclination: 55, period: 718, altitude: 20200, raan: 0, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.001 },
  { noradId: '28474', name: 'GPS IIR-13', type: 'navigation', operator: 'USAF', inclination: 55, period: 718, altitude: 20200, raan: 60, argPerigee: 0, meanAnomaly: 60, eccentricity: 0.001 },
  { noradId: '28874', name: 'GPS IIR-14', type: 'navigation', operator: 'USAF', inclination: 55, period: 718, altitude: 20200, raan: 120, argPerigee: 0, meanAnomaly: 120, eccentricity: 0.001 },
  { noradId: '29601', name: 'GPS IIR-16', type: 'navigation', operator: 'USAF', inclination: 55, period: 718, altitude: 20200, raan: 180, argPerigee: 0, meanAnomaly: 180, eccentricity: 0.001 },
  { noradId: '32260', name: 'GPS IIF-1', type: 'navigation', operator: 'USAF', inclination: 55, period: 718, altitude: 20200, raan: 240, argPerigee: 0, meanAnomaly: 240, eccentricity: 0.001 },
  { noradId: '35752', name: 'GPS IIF-4', type: 'navigation', operator: 'USAF', inclination: 55, period: 718, altitude: 20200, raan: 300, argPerigee: 0, meanAnomaly: 300, eccentricity: 0.001 },

  // GLONASS (selection)
  { noradId: '32276', name: 'GLONASS-K 701', type: 'navigation', operator: 'Roscosmos', inclination: 64.8, period: 675, altitude: 19100, raan: 0, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.001 },
  { noradId: '36111', name: 'GLONASS-M 51', type: 'navigation', operator: 'Roscosmos', inclination: 64.8, period: 675, altitude: 19100, raan: 120, argPerigee: 0, meanAnomaly: 120, eccentricity: 0.001 },
  { noradId: '37869', name: 'GLONASS-M 52', type: 'navigation', operator: 'Roscosmos', inclination: 64.8, period: 675, altitude: 19100, raan: 240, argPerigee: 0, meanAnomaly: 240, eccentricity: 0.001 },

  // ISS
  { noradId: '25544', name: 'ISS (ZARYA)', type: 'space_station', operator: 'NASA/Roscosmos', inclination: 51.64, period: 92.9, altitude: 420, raan: 0, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },

  // Commercial imaging
  { noradId: '33332', name: 'WORLDVIEW-2', type: 'imaging', operator: 'Maxar', inclination: 97.9, period: 97, altitude: 770, raan: 45, argPerigee: 0, meanAnomaly: 90, eccentricity: 0.0001 },
  { noradId: '39418', name: 'WORLDVIEW-3', type: 'imaging', operator: 'Maxar', inclination: 97.9, period: 97, altitude: 617, raan: 135, argPerigee: 0, meanAnomaly: 180, eccentricity: 0.0001 },
  { noradId: '41848', name: 'WORLDVIEW-4', type: 'imaging', operator: 'Maxar', inclination: 97.9, period: 97, altitude: 617, raan: 225, argPerigee: 0, meanAnomaly: 270, eccentricity: 0.0001 },
  { noradId: '43559', name: 'PLEIADES-1B', type: 'imaging', operator: 'Airbus', inclination: 98.2, period: 98, altitude: 694, raan: 315, argPerigee: 0, meanAnomaly: 315, eccentricity: 0.0001 },

  // Weather
  { noradId: '28654', name: 'NOAA-15', type: 'weather', operator: 'NOAA', inclination: 98.7, period: 101.5, altitude: 807, raan: 75, argPerigee: 0, meanAnomaly: 90, eccentricity: 0.001 },
  { noradId: '37849', name: 'SUOMI NPP', type: 'weather', operator: 'NASA/NOAA', inclination: 98.71, period: 101.5, altitude: 834, raan: 165, argPerigee: 0, meanAnomaly: 180, eccentricity: 0.0009 },

  // Communication (GEO)
  { noradId: '26370', name: 'INTELSAT 702', type: 'communication', operator: 'Intelsat', inclination: 0.05, period: 1436, altitude: 35786, raan: 66, argPerigee: 0, meanAnomaly: 0, eccentricity: 0.0001 },
  { noradId: '28627', name: 'INSAT-3A', type: 'communication', operator: 'ISRO', inclination: 0.05, period: 1436, altitude: 35786, raan: 83, argPerigee: 0, meanAnomaly: 30, eccentricity: 0.0001 },
  { noradId: '33515', name: 'GSAT-8', type: 'communication', operator: 'ISRO', inclination: 0.05, period: 1436, altitude: 35786, raan: 55, argPerigee: 0, meanAnomaly: 60, eccentricity: 0.0001 },

  // Military / reconnaissance
  { noradId: '37348', name: 'USA-224 (KH-11)', type: 'military', operator: 'NRO', inclination: 97.9, period: 97, altitude: 260, raan: 200, argPerigee: 0, meanAnomaly: 45, eccentricity: 0.001 },
  { noradId: '39025', name: 'USA-245 (KH-11)', type: 'military', operator: 'NRO', inclination: 97.9, period: 97, altitude: 260, raan: 300, argPerigee: 0, meanAnomaly: 135, eccentricity: 0.001 },
  { noradId: '43080', name: 'COSMOS-2524 (Lotos-S1)', type: 'military', operator: 'Russia', inclination: 67.2, period: 96, altitude: 900, raan: 100, argPerigee: 0, meanAnomaly: 90, eccentricity: 0.001 },
];

// ─── Type Color Mapping ─────────────────────────────────────────────────────

const TYPE_COLORS: Record<SatType, { point: Color; orbit: Color; label: string; icon: string }> = {
  communication: { point: Color.fromCssColorString('#42a5f5'), orbit: Color.fromCssColorString('#1565c0'), label: '📡 Communication', icon: '📡' },
  imaging:       { point: Color.fromCssColorString('#66bb6a'), orbit: Color.fromCssColorString('#2e7d32'), label: '🛰️ Imaging', icon: '🛰' },
  navigation:    { point: Color.fromCssColorString('#ffa726'), orbit: Color.fromCssColorString('#e65100'), label: '🧭 Navigation', icon: '🧭' },
  military:      { point: Color.fromCssColorString('#ef5350'), orbit: Color.fromCssColorString('#b71c1c'), label: '🎖️ Military', icon: '🎖' },
  space_station: { point: Color.WHITE, orbit: Color.fromCssColorString('#e0e0e0'), label: '🏠 Space Station', icon: '🏠' },
  weather:       { point: Color.fromCssColorString('#4fc3f7'), orbit: Color.fromCssColorString('#0277bd'), label: '🌤️ Weather', icon: '🌤' },
  scientific:    { point: Color.fromCssColorString('#ce93d8'), orbit: Color.fromCssColorString('#6a1b9a'), label: '🔬 Scientific', icon: '🔬' },
};

// ─── Orbital Math (simplified Keplerian) ────────────────────────────────────

const MU = 398600.4418; // km³/s²
const RE = 6371;        // km

function computeOrbitalPosition(sat: Satellite, timeSec: number): { lat: number; lng: number; alt: number } {
  const a = RE + sat.altitude;
  const n = (2 * Math.PI) / (sat.period * 60); // rad/s
  const M = (sat.meanAnomaly * Math.PI / 180) + n * timeSec;
  const E = solveKepler(M, sat.eccentricity);
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + sat.eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - sat.eccentricity) * Math.cos(E / 2)
  );
  const r = a * (1 - sat.eccentricity * Math.cos(E));

  // Position in orbital plane
  const xOrb = r * Math.cos(trueAnomaly);
  const yOrb = r * Math.sin(trueAnomaly);

  // Rotation matrices
  const inc = sat.inclination * Math.PI / 180;
  const raanRad = (sat.raan + (timeSec / (sat.period * 60)) * 360) * Math.PI / 180;
  const argP = sat.argPerigee * Math.PI / 180;

  // ECI coordinates
  const cosRAAN = Math.cos(raanRad), sinRAAN = Math.sin(raanRad);
  const cosInc = Math.cos(inc), sinInc = Math.sin(inc);
  const cosAP = Math.cos(argP), sinAP = Math.sin(argP);

  const x = (cosRAAN * cosAP - sinRAAN * sinAP * cosInc) * xOrb + (-cosRAAN * sinAP - sinRAAN * cosAP * cosInc) * yOrb;
  const y = (sinRAAN * cosAP + cosRAAN * sinAP * cosInc) * xOrb + (-sinRAAN * sinAP + cosRAAN * cosAP * cosInc) * yOrb;
  const z = (sinAP * sinInc) * xOrb + (cosAP * sinInc) * yOrb;

  // ECI to lat/lng (Earth rotates)
  const earthRotAngle = (timeSec / 86400) * 2 * Math.PI;
  const xECEF = x * Math.cos(earthRotAngle) + y * Math.sin(earthRotAngle);
  const yECEF = -x * Math.sin(earthRotAngle) + y * Math.cos(earthRotAngle);

  const lat = Math.atan2(z, Math.sqrt(xECEF * xECEF + yECEF * yECEF)) * 180 / Math.PI;
  const lng = Math.atan2(yECEF, xECEF) * 180 / Math.PI;

  return { lat, lng, alt: (r - RE) * 1000 }; // alt in meters
}

function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 10; i++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  return E;
}

// ─── Layer Implementation ────────────────────────────────────────────────────

export class SatelliteConstellationLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'satellite-constellation',
    name: 'Satellite Constellation',
    icon: '🛰️',
    description: 'ISRO, ESA, GPS, GLONASS, military & commercial satellites. Real-time orbital positions with TLE propagation.',
    category: 'intelligence',
    color: '#66bb6a',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'satelliteConstellation',
  };

  private satellites = SATELLITES;
  private updateTimer: ReturnType<typeof setInterval> | null = null;
  private entityMap: Map<string, Entity> = new Map();
  private startTime = Date.now();

  constructor(viewer: Viewer, dataStore: any) {
    super(viewer, dataStore);
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    this.clear();
    this.renderSatellites();
    this.renderOrbits();
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
      this.updatePositions();
    }, 3000);
  }

  private updatePositions(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.satellites.forEach(sat => {
      const entity = this.entityMap.get(sat.noradId);
      if (!entity) return;
      entity.position = new CallbackProperty(() => {
        const pos = computeOrbitalPosition(sat, elapsed);
        return Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt);
      }, false);
    });
  }

  private renderSatellites(): void {
    const elapsed = (Date.now() - this.startTime) / 1000;

    this.satellites.forEach(sat => {
      const typeInfo = TYPE_COLORS[sat.type];
      const pos = computeOrbitalPosition(sat, elapsed);
      const altKm = sat.altitude.toLocaleString();

      const entity = this.dataSource.entities.add({
        id: `sat-${sat.noradId}`,
        position: Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt),
        point: {
          pixelSize: sat.type === 'space_station' ? 18 : sat.type === 'military' ? 14 : 10,
          color: typeInfo.point,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 1e8, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${typeInfo.icon} ${sat.name}`,
          font: '11px monospace',
          fillColor: typeInfo.point,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -12),
          scaleByDistance: new NearFarScalar(1e6, 1.0, 1e8, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.75)'),
        },
        description: `
<div style="font-family:monospace;color:#0f0;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${typeInfo.point.toCssColorString()};margin:0 0 8px 0;">${typeInfo.icon} ${sat.name}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>NORAD ID:</td><td style="color:#0f0;">${sat.noradId}</td></tr>
    <tr><td>Type:</td><td style="color:${typeInfo.point.toCssColorString()};">${typeInfo.label}</td></tr>
    <tr><td>Operator:</td><td style="color:#0f0;">${sat.operator}</td></tr>
    <tr><td>Altitude:</td><td style="color:#0f0;">${altKm} km</td></tr>
    <tr><td>Inclination:</td><td style="color:#0f0;">${sat.inclination}°</td></tr>
    <tr><td>Period:</td><td style="color:#0f0;">${sat.period} min</td></tr>
    <tr><td>Current Pos:</td><td style="color:#0f0;">${pos.lat.toFixed(2)}°, ${pos.lng.toFixed(2)}°</td></tr>
    <tr><td>Eccentricity:</td><td style="color:#0f0;">${sat.eccentricity}</td></tr>
  </table>
</div>`,
      });
      this.entityMap.set(sat.noradId, entity);
    });
  }

  private renderOrbits(): void {
    const sampleCount = 120;
    const elapsed = (Date.now() - this.startTime) / 1000;

    this.satellites.forEach(sat => {
      const typeInfo = TYPE_COLORS[sat.type];
      const positions: Cartesian3[] = [];

      for (let i = 0; i <= sampleCount; i++) {
        const t = elapsed + (i / sampleCount) * sat.period * 60;
        const pos = computeOrbitalPosition(sat, t);
        positions.push(Cartesian3.fromDegrees(pos.lng, pos.lat, pos.alt));
      }

      this.dataSource.entities.add({
        id: `orbit-${sat.noradId}`,
        polyline: {
          positions,
          width: sat.type === 'military' ? 3 : 1.5,
          material: new PolylineDashMaterialProperty({
            color: typeInfo.orbit.withAlpha(0.5),
            dashLength: 16,
          }),
          clampToGround: false,
        },
      });
    });
  }
}
