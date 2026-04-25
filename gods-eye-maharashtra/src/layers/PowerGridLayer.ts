/**
 * PowerGridLayer — Indian power plants, transmission lines, renewable energy zones
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
  PolylineGlowMaterialProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PowerPlant {
  name: string;
  lat: number;
  lng: number;
  type: 'thermal' | 'hydro' | 'nuclear' | 'solar' | 'wind' | 'gas';
  capacityMW: number;
  state: string;
  operator: string;
  status: 'operational' | 'under_construction';
  fuel?: string;
}

interface TransmissionLine {
  name: string;
  from: [number, number];
  to: [number, number];
  voltageKV: number;
  type: 'HVDC' | 'HVAC';
  operator: string;
}

interface RenewableZone {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  type: 'solar' | 'wind' | 'hybrid';
  potentialMW: number;
  state: string;
}

interface StatePower {
  state: string;
  lat: number;
  lng: number;
  generationMW: number;
  demandMW: number;
  status: 'surplus' | 'deficit' | 'balanced';
}

// ─── Power Plants ────────────────────────────────────────────────────────────

const POWER_PLANTS: PowerPlant[] = [
  // Major Thermal Plants
  { name: 'Vindhyachal STPS', lat: 24.1000, lng: 82.6500, type: 'thermal', capacityMW: 4760, state: 'Madhya Pradesh', operator: 'NTPC', status: 'operational', fuel: 'Coal' },
  { name: 'Mundra TPP', lat: 22.8333, lng: 69.7167, type: 'thermal', capacityMW: 4620, state: 'Gujarat', operator: 'Adani Power', status: 'operational', fuel: 'Coal' },
  { name: 'Sasan UMPP', lat: 24.1333, lng: 82.1667, type: 'thermal', capacityMW: 3960, state: 'Madhya Pradesh', operator: 'Reliance Power', status: 'operational', fuel: 'Coal' },
  { name: 'Tirora TPP', lat: 21.4167, lng: 79.9333, type: 'thermal', capacityMW: 3300, state: 'Maharashtra', operator: 'Adani Power', status: 'operational', fuel: 'Coal' },
  { name: 'Rihand STPS', lat: 24.0500, lng: 83.0000, type: 'thermal', capacityMW: 3000, state: 'UP', operator: 'NTPC', status: 'operational', fuel: 'Coal' },
  { name: 'Korba STPS', lat: 22.3500, lng: 82.6833, type: 'thermal', capacityMW: 2600, state: 'Chhattisgarh', operator: 'NTPC', status: 'operational', fuel: 'Coal' },
  { name: 'Farakka STPS', lat: 24.7833, lng: 87.9167, type: 'thermal', capacityMW: 2100, state: 'West Bengal', operator: 'NTPC', status: 'operational', fuel: 'Coal' },
  { name: 'Ramagundam STPS', lat: 18.7500, lng: 79.4833, type: 'thermal', capacityMW: 2600, state: 'Telangana', operator: 'NTPC', status: 'operational', fuel: 'Coal' },
  { name: 'NTPC Dadri', lat: 28.5833, lng: 77.5500, type: 'thermal', capacityMW: 1820, state: 'UP', operator: 'NTPC', status: 'operational', fuel: 'Coal/Gas' },
  { name: 'Chandrapur STPS', lat: 19.9667, lng: 79.3000, type: 'thermal', capacityMW: 2920, state: 'Maharashtra', operator: 'MSEB', status: 'operational', fuel: 'Coal' },

  // Major Hydro Plants
  { name: 'Tehri Dam HPP', lat: 30.3833, lng: 78.4833, type: 'hydro', capacityMW: 2400, state: 'Uttarakhand', operator: 'THDC', status: 'operational' },
  { name: 'Koyna HPP', lat: 17.4000, lng: 73.7500, type: 'hydro', capacityMW: 1960, state: 'Maharashtra', operator: 'MSEB', status: 'operational' },
  { name: 'Nathpa Jhakri HPP', lat: 31.5500, lng: 77.9833, type: 'hydro', capacityMW: 1500, state: 'Himachal Pradesh', operator: 'SJVN', status: 'operational' },
  { name: 'Sardar Sarovar HPP', lat: 21.8333, lng: 73.7500, type: 'hydro', capacityMW: 1450, state: 'Gujarat', operator: 'SSNNL', status: 'operational' },
  { name: 'Bhakra HPP', lat: 31.4167, lng: 76.4333, type: 'hydro', capacityMW: 1325, state: 'Punjab', operator: 'BBMB', status: 'operational' },
  { name: 'Idukki HPP', lat: 9.8500, lng: 76.9667, type: 'hydro', capacityMW: 780, state: 'Kerala', operator: 'KSEB', status: 'operational' },

  // Nuclear (referenced from NuclearFacilitiesLayer, summary here)
  { name: 'Kudankulam NPP', lat: 8.1667, lng: 77.7167, type: 'nuclear', capacityMW: 2000, state: 'Tamil Nadu', operator: 'NPCIL', status: 'operational' },
  { name: 'Tarapur NPP', lat: 19.8333, lng: 72.6667, type: 'nuclear', capacityMW: 1400, state: 'Maharashtra', operator: 'NPCIL', status: 'operational' },

  // Major Solar Parks
  { name: 'Bhadla Solar Park', lat: 27.5333, lng: 71.9167, type: 'solar', capacityMW: 2245, state: 'Rajasthan', operator: 'Various', status: 'operational' },
  { name: 'Pavagada Solar Park', lat: 14.2500, lng: 77.2833, type: 'solar', capacityMW: 2050, state: 'Karnataka', operator: 'Various', status: 'operational' },
  { name: 'NP Kunta Solar Park', lat: 14.0833, lng: 78.4167, type: 'solar', capacityMW: 1500, state: 'Andhra Pradesh', operator: 'Various', status: 'operational' },
  { name: 'Rewa Ultra Mega Solar', lat: 24.5500, lng: 81.5000, type: 'solar', capacityMW: 750, state: 'Madhya Pradesh', operator: 'Various', status: 'operational' },
  { name: 'Charanka Solar Park', lat: 23.9000, lng: 71.2000, type: 'solar', capacityMW: 690, state: 'Gujarat', operator: 'Various', status: 'operational' },

  // Major Wind Farms
  { name: 'Muppandal Wind Farm', lat: 8.2833, lng: 77.5333, type: 'wind', capacityMW: 1500, state: 'Tamil Nadu', operator: 'Various', status: 'operational' },
  { name: 'Jaisalmer Wind Park', lat: 26.9167, lng: 70.9167, type: 'wind', capacityMW: 1064, state: 'Rajasthan', operator: 'Various', status: 'operational' },
  { name: 'Brahmanvel Wind Farm', lat: 17.5833, lng: 73.9833, type: 'wind', capacityMW: 528, state: 'Maharashtra', operator: 'Various', status: 'operational' },
  { name: 'Dhalgaon Wind Farm', lat: 16.9833, lng: 74.5833, type: 'wind', capacityMW: 278, state: 'Maharashtra', operator: 'Various', status: 'operational' },
];

// ─── Transmission Lines ──────────────────────────────────────────────────────

const TRANSMISSION_LINES: TransmissionLine[] = [
  { name: 'Biswanath-Agra HVDC', from: [92.5, 26.5], to: [78.0, 27.2], voltageKV: 800, type: 'HVDC', operator: 'POWERGRID' },
  { name: 'Rihand-Dadri HVDC', from: [83.0, 24.05], to: [77.55, 28.58], voltageKV: 500, type: 'HVDC', operator: 'POWERGRID' },
  { name: 'Chandrapur-Ramagundam', from: [79.3, 19.97], to: [79.48, 18.75], voltageKV: 400, type: 'HVAC', operator: 'POWERGRID' },
  { name: 'Korba-Bina', from: [82.68, 22.35], to: [77.0, 24.2], voltageKV: 765, type: 'HVAC', operator: 'POWERGRID' },
  { name: 'Farakka-Malda', from: [87.92, 24.78], to: [88.15, 25.0], voltageKV: 400, type: 'HVAC', operator: 'POWERGRID' },
  { name: 'Kudankulam-Madurai', from: [77.72, 8.17], to: [78.12, 9.93], voltageKV: 400, type: 'HVAC', operator: 'POWERGRID' },
  { name: 'Vadodara-Surat', from: [73.18, 22.3], to: [72.83, 21.17], voltageKV: 400, type: 'HVAC', operator: 'POWERGRID' },
  { name: 'Delhi-Agra', from: [77.1, 28.7], to: [78.0, 27.18], voltageKV: 765, type: 'HVAC', operator: 'POWERGRID' },
];

// ─── Renewable Energy Zones ──────────────────────────────────────────────────

const RENEWABLE_ZONES: RenewableZone[] = [
  { name: 'Rajasthan Solar Zone', lat: 27.0, lng: 71.5, radiusKm: 200, type: 'solar', potentialMW: 50000, state: 'Rajasthan' },
  { name: 'Gujarat Solar Zone', lat: 23.5, lng: 71.0, radiusKm: 150, type: 'solar', potentialMW: 30000, state: 'Gujarat' },
  { name: 'Tamil Nadu Wind Zone', lat: 9.0, lng: 77.8, radiusKm: 120, type: 'wind', potentialMW: 20000, state: 'Tamil Nadu' },
  { name: 'Karnataka Solar Zone', lat: 14.5, lng: 77.0, radiusKm: 130, type: 'solar', potentialMW: 25000, state: 'Karnataka' },
  { name: 'Andhra Pradesh Solar Zone', lat: 14.5, lng: 78.5, radiusKm: 100, type: 'solar', potentialMW: 20000, state: 'Andhra Pradesh' },
  { name: 'Maharashtra Wind Zone', lat: 17.5, lng: 74.0, radiusKm: 100, type: 'wind', potentialMW: 15000, state: 'Maharashtra' },
  { name: 'Madhya Pradesh Solar Zone', lat: 24.0, lng: 77.5, radiusKm: 120, type: 'solar', potentialMW: 25000, state: 'Madhya Pradesh' },
  { name: 'Ladakh Solar Zone', lat: 34.0, lng: 77.5, radiusKm: 150, type: 'solar', potentialMW: 35000, state: 'Ladakh' },
];

// ─── State Power Status ──────────────────────────────────────────────────────

const STATE_POWER: StatePower[] = [
  { state: 'Maharashtra', lat: 19.0, lng: 76.0, generationMW: 42000, demandMW: 38000, status: 'surplus' },
  { state: 'Gujarat', lat: 22.5, lng: 71.5, generationMW: 35000, demandMW: 28000, status: 'surplus' },
  { state: 'Tamil Nadu', lat: 10.5, lng: 78.5, generationMW: 30000, demandMW: 27000, status: 'surplus' },
  { state: 'Rajasthan', lat: 26.5, lng: 73.0, generationMW: 28000, demandMW: 22000, status: 'surplus' },
  { state: 'Karnataka', lat: 14.5, lng: 76.0, generationMW: 25000, demandMW: 22000, status: 'surplus' },
  { state: 'Uttar Pradesh', lat: 26.5, lng: 81.0, generationMW: 30000, demandMW: 32000, status: 'deficit' },
  { state: 'Bihar', lat: 25.5, lng: 85.0, generationMW: 6000, demandMW: 10000, status: 'deficit' },
  { state: 'Jharkhand', lat: 23.5, lng: 85.5, generationMW: 8000, demandMW: 7000, status: 'balanced' },
  { state: 'West Bengal', lat: 23.5, lng: 87.5, generationMW: 15000, demandMW: 14000, status: 'balanced' },
  { state: 'Madhya Pradesh', lat: 23.5, lng: 78.0, generationMW: 22000, demandMW: 18000, status: 'surplus' },
  { state: 'Andhra Pradesh', lat: 15.5, lng: 79.5, generationMW: 20000, demandMW: 18000, status: 'balanced' },
  { state: 'Telangana', lat: 17.5, lng: 79.0, generationMW: 18000, demandMW: 16000, status: 'balanced' },
  { state: 'Kerala', lat: 10.5, lng: 76.5, generationMW: 5000, demandMW: 7000, status: 'deficit' },
  { state: 'Odisha', lat: 20.5, lng: 84.0, generationMW: 12000, demandMW: 8000, status: 'surplus' },
  { state: 'Chhattisgarh', lat: 21.5, lng: 82.0, generationMW: 18000, demandMW: 8000, status: 'surplus' },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function plantColor(type: PowerPlant['type']): Color {
  switch (type) {
    case 'thermal': return Color.fromCssColorString('#ff6633');
    case 'hydro': return Color.fromCssColorString('#3399ff');
    case 'nuclear': return Color.fromCssColorString('#00ff88');
    case 'solar': return Color.fromCssColorString('#ffcc00');
    case 'wind': return Color.fromCssColorString('#00ccaa');
    case 'gas': return Color.fromCssColorString('#ff99cc');
  }
}

function plantIcon(type: PowerPlant['type']): string {
  switch (type) {
    case 'thermal': return '🔥';
    case 'hydro': return '💧';
    case 'nuclear': return '☢️';
    case 'solar': return '☀️';
    case 'wind': return '💨';
    case 'gas': return '⛽';
  }
}

function lineColor(kv: number): Color {
  if (kv >= 765) return Color.fromCssColorString('#ff00ff').withAlpha(0.7);
  if (kv >= 400) return Color.fromCssColorString('#ff8800').withAlpha(0.6);
  return Color.fromCssColorString('#ffcc00').withAlpha(0.5);
}

function powerStatusColor(status: StatePower['status']): string {
  switch (status) {
    case 'surplus': return '#00ff88';
    case 'deficit': return '#ff4444';
    case 'balanced': return '#ffcc00';
  }
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class PowerGridLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'power-grid',
    name: 'Power Grid & Energy',
    icon: '⚡',
    description: 'Power plants, transmission lines, renewable zones, and state power status',
    category: 'intelligence',
    color: '#ffcc00',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'powergrid',
  };

  protected async loadData(): Promise<void> {
    this.renderPowerPlants();
    this.renderTransmissionLines();
    this.renderRenewableZones();
    this.renderStatePower();
  }

  private renderPowerPlants(): void {
    for (const plant of POWER_PLANTS) {
      const color = plantColor(plant.type);
      const icon = plantIcon(plant.type);
      const size = Math.min(18, 6 + plant.capacityMW / 500);

      this.dataSource.entities.add({
        name: `${icon} ${plant.name}`,
        position: Cartesian3.fromDegrees(plant.lng, plant.lat, 1000),
        point: {
          pixelSize: size,
          color: color.withAlpha(0.85),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.NONE,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 1e7, 0.4),
        },
        label: {
          text: `${icon} ${plant.name}`,
          font: '11px sans-serif',
          fillColor: color,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(14, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.3),
        },
        description: `
          <h3>${icon} ${plant.name}</h3>
          <table>
            <tr><td><b>Type</b></td><td>${plant.type}</td></tr>
            <tr><td><b>Capacity</b></td><td>${plant.capacityMW} MW</td></tr>
            <tr><td><b>State</b></td><td>${plant.state}</td></tr>
            <tr><td><b>Operator</b></td><td>${plant.operator}</td></tr>
            <tr><td><b>Status</b></td><td>${plant.status}</td></tr>
            ${plant.fuel ? `<tr><td><b>Fuel</b></td><td>${plant.fuel}</td></tr>` : ''}
            <tr><td><b>Coordinates</b></td><td>${plant.lat.toFixed(4)}, ${plant.lng.toFixed(4)}</td></tr>
          </table>
        `,
      });
    }
  }

  private renderTransmissionLines(): void {
    for (const line of TRANSMISSION_LINES) {
      const color = lineColor(line.voltageKV);
      this.dataSource.entities.add({
        name: `${line.name} (${line.voltageKV}kV)`,
        polyline: {
          positions: [
            Cartesian3.fromDegrees(line.from[0], line.from[1], 500),
            Cartesian3.fromDegrees(line.to[0], line.to[1], 500),
          ],
          width: line.voltageKV >= 765 ? 3 : 2,
          material: new PolylineGlowMaterialProperty({
            color,
            glowPower: 0.15,
          }),
          clampToGround: true,
        },
        description: `
          <h3>⚡ ${line.name}</h3>
          <table>
            <tr><td><b>Voltage</b></td><td>${line.voltageKV} kV</td></tr>
            <tr><td><b>Type</b></td><td>${line.type}</td></tr>
            <tr><td><b>Operator</b></td><td>${line.operator}</td></tr>
          </table>
        `,
      });
    }
  }

  private renderRenewableZones(): void {
    for (const zone of RENEWABLE_ZONES) {
      const color = zone.type === 'solar'
        ? Color.fromCssColorString('#ffcc00').withAlpha(0.08)
        : Color.fromCssColorString('#00ccaa').withAlpha(0.08);

      this.dataSource.entities.add({
        name: `Renewable Zone: ${zone.name}`,
        position: Cartesian3.fromDegrees(zone.lng, zone.lat, 0),
        ellipse: {
          semiMajorAxis: zone.radiusKm * 1000,
          semiMinorAxis: zone.radiusKm * 1000,
          material: color,
          outline: true,
          outlineColor: color.withAlpha(0.3),
          outlineWidth: 1,
          height: 0,
        },
        label: {
          text: `${zone.type === 'solar' ? '☀️' : '💨'} ${zone.name}`,
          font: '11px sans-serif',
          fillColor: zone.type === 'solar' ? Color.YELLOW : Color.fromCssColorString('#00ccaa'),
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
        },
        description: `
          <h3>${zone.type === 'solar' ? '☀️' : '💨'} ${zone.name}</h3>
          <table>
            <tr><td><b>Type</b></td><td>${zone.type}</td></tr>
            <tr><td><b>Potential</b></td><td>${zone.potentialMW.toLocaleString()} MW</td></tr>
            <tr><td><b>State</b></td><td>${zone.state}</td></tr>
            <tr><td><b>Radius</b></td><td>${zone.radiusKm} km</td></tr>
          </table>
        `,
      });
    }
  }

  private renderStatePower(): void {
    for (const sp of STATE_POWER) {
      const color = Color.fromCssColorString(powerStatusColor(sp.status));
      const balance = sp.generationMW - sp.demandMW;

      this.dataSource.entities.add({
        name: `Power: ${sp.state}`,
        position: Cartesian3.fromDegrees(sp.lng, sp.lat, 5000),
        label: {
          text: `${sp.state}: ${balance > 0 ? '+' : ''}${balance} MW`,
          font: 'bold 12px sans-serif',
          fillColor: color,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
        },
        description: `
          <h3>⚡ ${sp.state} — Power Status</h3>
          <table>
            <tr><td><b>Generation</b></td><td>${sp.generationMW.toLocaleString()} MW</td></tr>
            <tr><td><b>Demand</b></td><td>${sp.demandMW.toLocaleString()} MW</td></tr>
            <tr><td><b>Balance</b></td><td style="color:${powerStatusColor(sp.status)};font-weight:bold">${balance > 0 ? '+' : ''}${balance.toLocaleString()} MW</td></tr>
            <tr><td><b>Status</b></td><td style="color:${powerStatusColor(sp.status)};font-weight:bold">${sp.status.toUpperCase()}</td></tr>
          </table>
        `,
      });
    }
  }
}
