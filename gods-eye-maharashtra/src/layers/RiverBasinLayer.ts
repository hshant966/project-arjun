/**
 * RiverBasinLayer — Major Indian rivers, dams, and flood risk zones
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
  PolylineGlowMaterialProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface River {
  name: string;
  color: string;
  width: number;
  coordinates: [number, number][];
  length: number; // km
  basin: string;
  states: string[];
}

interface Dam {
  name: string;
  river: string;
  lat: number;
  lng: number;
  capacityTMC: number; // Thousand Million Cubic feet
  heightM: number;
  type: 'earth' | 'gravity' | 'arch' | 'buttress';
  status: 'operational' | 'under_construction';
  state: string;
}

interface FloodZone {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  risk: 'low' | 'medium' | 'high' | 'extreme';
  river: string;
  season: string;
}

// ─── River Data ──────────────────────────────────────────────────────────────

const RIVERS: River[] = [
  {
    name: 'Ganga', color: '#0066ff', width: 5, length: 2525,
    basin: 'Ganga Basin', states: ['Uttarakhand', 'UP', 'Bihar', 'Jharkhand', 'West Bengal'],
    coordinates: [
      [78.96, 30.99], [79.07, 30.16], [79.47, 29.39], [80.09, 28.70],
      [80.88, 28.01], [81.55, 27.45], [82.03, 26.88], [83.01, 26.14],
      [83.97, 25.74], [84.50, 25.53], [85.08, 25.36], [85.56, 25.22],
      [86.14, 25.07], [86.70, 24.87], [87.16, 24.68], [87.80, 24.42],
      [88.10, 23.85], [88.45, 22.82], [88.60, 22.25], [88.80, 21.67],
    ],
  },
  {
    name: 'Yamuna', color: '#3399ff', width: 3, length: 1376,
    basin: 'Ganga Basin', states: ['Himachal Pradesh', 'Uttarakhand', 'UP', 'Delhi', 'Haryana'],
    coordinates: [
      [78.27, 31.01], [78.07, 30.60], [77.74, 30.18], [77.55, 29.87],
      [77.22, 29.53], [77.10, 29.07], [77.31, 28.72], [77.24, 28.44],
      [77.17, 28.20], [77.33, 27.68], [77.80, 27.20], [78.30, 26.82],
      [79.02, 26.45], [79.55, 25.90], [80.10, 25.45], [80.60, 25.25],
      [81.05, 25.42], [81.45, 25.36],
    ],
  },
  {
    name: 'Brahmaputra', color: '#00ccff', width: 5, length: 2900,
    basin: 'Brahmaputra Basin', states: ['Assam', 'Arunachal Pradesh'],
    coordinates: [
      [92.00, 28.00], [92.50, 27.50], [93.00, 27.20], [93.50, 26.90],
      [94.00, 26.70], [94.50, 26.50], [95.00, 26.40], [95.50, 26.30],
      [95.90, 26.20], [96.20, 26.10], [96.50, 25.90], [96.80, 25.60],
      [97.00, 25.50], [97.20, 25.30], [97.50, 25.00], [97.00, 24.50],
    ],
  },
  {
    name: 'Godavari', color: '#0099cc', width: 4, length: 1465,
    basin: 'Godavari Basin', states: ['Maharashtra', 'Telangana', 'Andhra Pradesh'],
    coordinates: [
      [73.35, 19.92], [74.00, 19.80], [75.00, 19.60], [76.00, 19.50],
      [77.00, 19.30], [78.00, 18.90], [79.00, 18.50], [79.50, 18.00],
      [80.00, 17.50], [80.50, 17.00], [81.00, 16.50], [81.50, 16.20],
      [81.80, 16.00],
    ],
  },
  {
    name: 'Krishna', color: '#0077aa', width: 4, length: 1400,
    basin: 'Krishna Basin', states: ['Maharashtra', 'Karnataka', 'Andhra Pradesh'],
    coordinates: [
      [73.87, 17.98], [74.50, 17.60], [75.00, 17.20], [75.50, 16.90],
      [76.00, 16.50], [76.50, 16.20], [77.00, 15.90], [78.00, 15.50],
      [79.00, 15.20], [80.00, 15.00], [80.50, 15.50], [81.00, 15.90],
    ],
  },
  {
    name: 'Narmada', color: '#005588', width: 3, length: 1312,
    basin: 'Narmada Basin', states: ['Madhya Pradesh', 'Maharashtra', 'Gujarat'],
    coordinates: [
      [81.72, 22.83], [81.50, 22.70], [81.00, 22.50], [80.50, 22.40],
      [80.00, 22.30], [79.50, 22.10], [79.00, 22.00], [78.50, 21.90],
      [78.00, 21.80], [77.50, 21.70], [77.00, 21.60], [76.50, 21.60],
      [76.00, 21.70], [75.50, 21.80], [75.00, 21.90], [74.50, 22.00],
      [74.00, 21.80], [73.50, 21.60], [73.00, 21.50], [72.50, 21.60],
      [72.20, 21.70],
    ],
  },
  {
    name: 'Cauvery', color: '#3377aa', width: 3, length: 800,
    basin: 'Cauvery Basin', states: ['Karnataka', 'Tamil Nadu'],
    coordinates: [
      [75.51, 12.42], [75.80, 12.30], [76.00, 12.10], [76.50, 11.90],
      [77.00, 11.70], [77.50, 11.50], [78.00, 11.30], [78.50, 11.10],
      [79.00, 10.90], [79.30, 10.70], [79.50, 10.50], [79.80, 10.30],
      [80.00, 10.50],
    ],
  },
  {
    name: 'Indus', color: '#004477', width: 4, length: 3180,
    basin: 'Indus Basin', states: ['J&K', 'Ladakh'],
    coordinates: [
      [78.50, 34.50], [78.00, 34.00], [77.50, 33.50], [77.00, 33.00],
      [76.50, 32.50], [76.00, 32.00], [75.50, 31.50], [75.00, 31.00],
      [74.50, 30.50], [74.00, 30.00], [73.50, 29.50],
    ],
  },
];

const DAMS: Dam[] = [
  { name: 'Bhakra Dam', river: 'Sutlej', lat: 31.4167, lng: 76.4333, capacityTMC: 7.54, heightM: 226, type: 'gravity', status: 'operational', state: 'Himachal Pradesh' },
  { name: 'Tehri Dam', river: 'Bhagirathi', lat: 30.3833, lng: 78.4833, capacityTMC: 3.54, heightM: 260, type: 'earth', status: 'operational', state: 'Uttarakhand' },
  { name: 'Sardar Sarovar Dam', river: 'Narmada', lat: 21.8333, lng: 73.7500, capacityTMC: 7.7, heightM: 163, type: 'gravity', status: 'operational', state: 'Gujarat' },
  { name: 'Nagarjuna Sagar Dam', river: 'Krishna', lat: 16.5833, lng: 79.3167, capacityTMC: 9.37, heightM: 124, type: 'gravity', status: 'operational', state: 'Telangana' },
  { name: 'Hirakud Dam', river: 'Mahanadi', lat: 21.5333, lng: 83.8667, capacityTMC: 8.12, heightM: 60, type: 'earth', status: 'operational', state: 'Odisha' },
  { name: 'Krishna Raja Sagara Dam', river: 'Cauvery', lat: 12.4167, lng: 76.5667, capacityTMC: 1.63, heightM: 40, type: 'gravity', status: 'operational', state: 'Karnataka' },
  { name: 'Bhavanisagar Dam', river: 'Bhavani', lat: 11.4667, lng: 77.1167, capacityTMC: 0.93, heightM: 40, type: 'earth', status: 'operational', state: 'Tamil Nadu' },
  { name: 'Indira Sagar Dam', river: 'Narmada', lat: 22.2833, lng: 76.5000, capacityTMC: 12.22, heightM: 92, type: 'gravity', status: 'operational', state: 'Madhya Pradesh' },
  { name: 'Koyna Dam', river: 'Koyna', lat: 17.4000, lng: 73.7500, capacityTMC: 2.83, heightM: 103, type: 'gravity', status: 'operational', state: 'Maharashtra' },
  { name: 'Tungabhadra Dam', river: 'Tungabhadra', lat: 15.2667, lng: 76.3333, capacityTMC: 3.72, heightM: 49, type: 'gravity', status: 'operational', state: 'Karnataka' },
  { name: 'Rihand Dam', river: 'Rihand', lat: 24.0500, lng: 83.0000, capacityTMC: 10.62, heightM: 91, type: 'gravity', status: 'operational', state: 'Uttar Pradesh' },
  { name: 'Maithon Dam', river: 'Barakar', lat: 23.7833, lng: 86.8167, capacityTMC: 1.36, heightM: 50, type: 'gravity', status: 'operational', state: 'Jharkhand' },
  { name: 'Jayakwadi Dam', river: 'Godavari', lat: 19.5000, lng: 75.8833, capacityTMC: 2.91, heightM: 40, type: 'earth', status: 'operational', state: 'Maharashtra' },
  { name: 'Almatti Dam', river: 'Krishna', lat: 16.2500, lng: 75.8833, capacityTMC: 3.07, heightM: 52, type: 'gravity', status: 'operational', state: 'Karnataka' },
  { name: 'Polavaram Dam', river: 'Godavari', lat: 17.2500, lng: 81.6500, capacityTMC: 5.73, heightM: 45, type: 'earth', status: 'under_construction', state: 'Andhra Pradesh' },
];

const FLOOD_ZONES: FloodZone[] = [
  { name: 'Bihar Flood Plains', lat: 25.5, lng: 85.5, radiusKm: 150, risk: 'extreme', river: 'Ganga', season: 'Monsoon (Jul-Oct)' },
  { name: 'Assam Flood Zone', lat: 26.5, lng: 92.0, radiusKm: 120, risk: 'extreme', river: 'Brahmaputra', season: 'Monsoon (Jun-Sep)' },
  { name: 'West Bengal Sundarbans', lat: 22.0, lng: 88.5, radiusKm: 100, risk: 'high', river: 'Ganga', season: 'Monsoon + Cyclone' },
  { name: 'UP Flood Plains', lat: 26.5, lng: 82.0, radiusKm: 100, risk: 'high', river: 'Ganga/Yamuna', season: 'Monsoon (Jul-Sep)' },
  { name: 'Odisha Flood Zone', lat: 20.5, lng: 85.0, radiusKm: 80, risk: 'high', river: 'Mahanadi', season: 'Monsoon + Cyclone' },
  { name: 'Maharashtra Konkan', lat: 17.0, lng: 73.5, radiusKm: 60, risk: 'high', river: 'Multiple', season: 'Monsoon (Jun-Oct)' },
  { name: 'Gujarat Flood Zone', lat: 22.5, lng: 72.0, radiusKm: 70, risk: 'medium', river: 'Narmada/Tapi', season: 'Monsoon (Jul-Sep)' },
  { name: 'Chennai Flood Zone', lat: 13.08, lng: 80.27, radiusKm: 50, risk: 'high', river: 'Adyar/Cooum', season: 'NE Monsoon (Oct-Dec)' },
  { name: 'Kerala Flood Zone', lat: 10.0, lng: 76.5, radiusKm: 80, risk: 'high', river: 'Multiple', season: 'SW Monsoon (Jun-Sep)' },
  { name: 'Kashmir Flood Zone', lat: 34.0, lng: 74.8, radiusKm: 60, risk: 'medium', river: 'Jhelum', season: 'Spring melt + Monsoon' },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function floodRiskColor(risk: FloodZone['risk']): Color {
  switch (risk) {
    case 'low': return Color.fromCssColorString('#88cc00').withAlpha(0.15);
    case 'medium': return Color.fromCssColorString('#ffcc00').withAlpha(0.18);
    case 'high': return Color.fromCssColorString('#ff8800').withAlpha(0.2);
    case 'extreme': return Color.fromCssColorString('#ff0000').withAlpha(0.25);
  }
}

function damStatusColor(status: Dam['status']): Color {
  return status === 'operational' ? Color.GREEN : Color.YELLOW;
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class RiverBasinLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'river-basin',
    name: 'River Basins & Dams',
    icon: '🌊',
    description: 'Major Indian rivers, dams, reservoirs, and flood risk zones',
    category: 'intelligence',
    color: '#0066ff',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'rivers',
  };

  protected async loadData(): Promise<void> {
    this.renderRivers();
    this.renderDams();
    this.renderFloodZones();
  }

  private renderRivers(): void {
    for (const river of RIVERS) {
      const positions = river.coordinates.map(([lng, lat]) =>
        Cartesian3.fromDegrees(lng, lat, 200)
      );

      this.dataSource.entities.add({
        name: `River: ${river.name}`,
        polyline: {
          positions,
          width: river.width,
          material: new PolylineGlowMaterialProperty({
            color: Color.fromCssColorString(river.color),
            glowPower: 0.2,
          }),
          clampToGround: true,
        },
        description: `
          <h3>🌊 ${river.name}</h3>
          <table>
            <tr><td><b>Length</b></td><td>${river.length} km</td></tr>
            <tr><td><b>Basin</b></td><td>${river.basin}</td></tr>
            <tr><td><b>States</b></td><td>${river.states.join(', ')}</td></tr>
          </table>
        `,
      });

      // Label at midpoint
      const mid = Math.floor(river.coordinates.length / 2);
      const [mlng, mlat] = river.coordinates[mid];
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(mlng, mlat, 3000),
        label: {
          text: `💧 ${river.name}`,
          font: 'bold 13px sans-serif',
          fillColor: Color.fromCssColorString(river.color),
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.5),
        },
      });
    }
  }

  private renderDams(): void {
    for (const dam of DAMS) {
      const color = damStatusColor(dam.status);
      const size = Math.min(16, 8 + dam.heightM / 30);

      this.dataSource.entities.add({
        name: `Dam: ${dam.name}`,
        position: Cartesian3.fromDegrees(dam.lng, dam.lat, 1000),
        point: {
          pixelSize: size,
          color: color.withAlpha(0.9),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.NONE,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 1e7, 0.5),
        },
        label: {
          text: `🏗️ ${dam.name}`,
          font: '11px sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(14, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
        },
        description: `
          <h3>🏗️ ${dam.name}</h3>
          <table>
            <tr><td><b>River</b></td><td>${dam.river}</td></tr>
            <tr><td><b>State</b></td><td>${dam.state}</td></tr>
            <tr><td><b>Height</b></td><td>${dam.heightM} m</td></tr>
            <tr><td><b>Capacity</b></td><td>${dam.capacityTMC} TMC</td></tr>
            <tr><td><b>Type</b></td><td>${dam.type}</td></tr>
            <tr><td><b>Status</b></td><td>${dam.status}</td></tr>
            <tr><td><b>Coordinates</b></td><td>${dam.lat.toFixed(4)}, ${dam.lng.toFixed(4)}</td></tr>
          </table>
        `,
      });
    }
  }

  private renderFloodZones(): void {
    for (const zone of FLOOD_ZONES) {
      const color = floodRiskColor(zone.risk);

      this.dataSource.entities.add({
        name: `Flood Zone: ${zone.name}`,
        position: Cartesian3.fromDegrees(zone.lng, zone.lat, 0),
        ellipse: {
          semiMajorAxis: zone.radiusKm * 1000,
          semiMinorAxis: zone.radiusKm * 1000,
          material: color,
          outline: true,
          outlineColor: color.withAlpha(0.5),
          outlineWidth: 1,
          height: 0,
        },
        description: `
          <h3>⚠️ ${zone.name}</h3>
          <table>
            <tr><td><b>Risk Level</b></td><td style="color:${zone.risk === 'extreme' ? '#ff0000' : zone.risk === 'high' ? '#ff8800' : '#ffcc00'};font-weight:bold">${zone.risk.toUpperCase()}</td></tr>
            <tr><td><b>River</b></td><td>${zone.river}</td></tr>
            <tr><td><b>Season</b></td><td>${zone.season}</td></tr>
            <tr><td><b>Radius</b></td><td>${zone.radiusKm} km</td></tr>
            <tr><td><b>Coordinates</b></td><td>${zone.lat.toFixed(2)}, ${zone.lng.toFixed(2)}</td></tr>
          </table>
        `,
      });
    }
  }
}
