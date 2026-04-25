/**
 * NuclearFacilitiesLayer — All Indian nuclear facilities with safety zones
 * Glowing markers, reactor info, capacity data
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NuclearFacility {
  name: string;
  lat: number;
  lng: number;
  type: 'power_plant' | 'research_reactor' | 'fuel_cycle' | 'waste_processing';
  reactors: ReactorInfo[];
  status: 'operational' | 'under_construction' | 'shutdown' | 'planned';
  operator: string;
  safetyZoneKm: number;
  state: string;
}

interface ReactorInfo {
  name: string;
  type: 'PHWR' | 'BWR' | 'VVER' | 'PFBR' | 'LWR' | 'Research';
  capacityMW: number;
  status: 'operational' | 'under_construction' | 'shutdown';
  commissionYear?: number;
}

// ─── Nuclear Facilities Data ─────────────────────────────────────────────────

const NUCLEAR_FACILITIES: NuclearFacility[] = [
  {
    name: 'Tarapur Atomic Power Station',
    lat: 19.8333, lng: 72.6667,
    type: 'power_plant', state: 'Maharashtra', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'TAPS-1', type: 'BWR', capacityMW: 160, status: 'operational', commissionYear: 1969 },
      { name: 'TAPS-2', type: 'BWR', capacityMW: 160, status: 'operational', commissionYear: 1969 },
      { name: 'TAPS-3', type: 'PHWR', capacityMW: 540, status: 'operational', commissionYear: 2006 },
      { name: 'TAPS-4', type: 'PHWR', capacityMW: 540, status: 'operational', commissionYear: 2005 },
    ],
  },
  {
    name: 'Rawatbhata Atomic Power Station',
    lat: 24.9333, lng: 75.6167,
    type: 'power_plant', state: 'Rajasthan', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'RAPS-1', type: 'PHWR', capacityMW: 100, status: 'shutdown', commissionYear: 1973 },
      { name: 'RAPS-2', type: 'PHWR', capacityMW: 200, status: 'operational', commissionYear: 1981 },
      { name: 'RAPS-3', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2000 },
      { name: 'RAPS-4', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2000 },
      { name: 'RAPS-5', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2010 },
      { name: 'RAPS-6', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2010 },
    ],
  },
  {
    name: 'Madras Atomic Power Station (Kalpakkam)',
    lat: 12.5500, lng: 80.1667,
    type: 'power_plant', state: 'Tamil Nadu', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'MAPS-1', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 1984 },
      { name: 'MAPS-2', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 1986 },
    ],
  },
  {
    name: 'Kudankulam Nuclear Power Plant',
    lat: 8.1667, lng: 77.7167,
    type: 'power_plant', state: 'Tamil Nadu', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'KKNPP-1', type: 'VVER', capacityMW: 1000, status: 'operational', commissionYear: 2013 },
      { name: 'KKNPP-2', type: 'VVER', capacityMW: 1000, status: 'operational', commissionYear: 2016 },
      { name: 'KKNPP-3', type: 'VVER', capacityMW: 1000, status: 'under_construction' },
      { name: 'KKNPP-4', type: 'VVER', capacityMW: 1000, status: 'under_construction' },
      { name: 'KKNPP-5', type: 'VVER', capacityMW: 1000, status: 'planned' },
      { name: 'KKNPP-6', type: 'VVER', capacityMW: 1000, status: 'planned' },
    ],
  },
  {
    name: 'Narora Atomic Power Station',
    lat: 28.1667, lng: 78.4167,
    type: 'power_plant', state: 'Uttar Pradesh', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'NAPS-1', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 1991 },
      { name: 'NAPS-2', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 1992 },
    ],
  },
  {
    name: 'Kakrapar Atomic Power Station',
    lat: 21.2333, lng: 73.3500,
    type: 'power_plant', state: 'Gujarat', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'KAPS-1', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 1993 },
      { name: 'KAPS-2', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 1995 },
      { name: 'KAPS-3', type: 'PHWR', capacityMW: 700, status: 'operational', commissionYear: 2021 },
      { name: 'KAPS-4', type: 'PHWR', capacityMW: 700, status: 'under_construction' },
    ],
  },
  {
    name: 'Kaiga Generating Station',
    lat: 14.8667, lng: 74.4333,
    type: 'power_plant', state: 'Karnataka', operator: 'NPCIL', safetyZoneKm: 30,
    reactors: [
      { name: 'KGS-1', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2000 },
      { name: 'KGS-2', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2000 },
      { name: 'KGS-3', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2007 },
      { name: 'KGS-4', type: 'PHWR', capacityMW: 220, status: 'operational', commissionYear: 2011 },
    ],
  },
  // Research & Fuel Cycle Facilities
  {
    name: 'Bhabha Atomic Research Centre (BARC)',
    lat: 19.0333, lng: 72.9167,
    type: 'research_reactor', state: 'Maharashtra', operator: 'DAE', safetyZoneKm: 15,
    reactors: [
      { name: 'CIRUS', type: 'Research', capacityMW: 40, status: 'shutdown', commissionYear: 1960 },
      { name: 'Dhruva', type: 'Research', capacityMW: 100, status: 'operational', commissionYear: 1985 },
    ],
  },
  {
    name: 'Indira Gandhi Centre for Atomic Research (IGCAR)',
    lat: 12.5333, lng: 80.1833,
    type: 'research_reactor', state: 'Tamil Nadu', operator: 'DAE', safetyZoneKm: 15,
    reactors: [
      { name: 'FBTR', type: 'PFBR', capacityMW: 40, status: 'operational', commissionYear: 1985 },
      { name: 'PFBR-500', type: 'PFBR', capacityMW: 500, status: 'under_construction' },
    ],
  },
  {
    name: 'Uranium Corporation of India (Jaduguda)',
    lat: 22.6333, lng: 86.3333,
    type: 'fuel_cycle', state: 'Jharkhand', operator: 'UCIL', safetyZoneKm: 10,
    reactors: [],
  },
  {
    name: 'Nuclear Fuel Complex (Hyderabad)',
    lat: 17.4500, lng: 78.3500,
    type: 'fuel_cycle', state: 'Telangana', operator: 'DAE', safetyZoneKm: 10,
    reactors: [],
  },
  {
    name: 'Heavy Water Plant (Tuticorin)',
    lat: 8.7833, lng: 78.1333,
    type: 'fuel_cycle', state: 'Tamil Nadu', operator: 'DAE', safetyZoneKm: 10,
    reactors: [],
  },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function facilityColor(facility: NuclearFacility): Color {
  switch (facility.type) {
    case 'power_plant': return Color.fromCssColorString('#00ff88');
    case 'research_reactor': return Color.fromCssColorString('#00aaff');
    case 'fuel_cycle': return Color.fromCssColorString('#ffaa00');
    case 'waste_processing': return Color.fromCssColorString('#ff6600');
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'operational': return '#00ff88';
    case 'under_construction': return '#ffaa00';
    case 'shutdown': return '#ff4444';
    case 'planned': return '#8888ff';
    default: return '#ffffff';
  }
}

function totalCapacity(facility: NuclearFacility): number {
  return facility.reactors
    .filter(r => r.status === 'operational')
    .reduce((sum, r) => sum + r.capacityMW, 0);
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class NuclearFacilitiesLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'nuclear-facilities',
    name: 'Nuclear Facilities',
    icon: '☢️',
    description: 'All Indian nuclear power plants, research reactors, and fuel cycle facilities',
    category: 'intelligence',
    color: '#00ff88',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'nuclear',
  };

  protected async loadData(): Promise<void> {
    for (const facility of NUCLEAR_FACILITIES) {
      this.renderFacility(facility);
    }
  }

  private renderFacility(facility: NuclearFacility): void {
    const color = facilityColor(facility);
    const cap = totalCapacity(facility);

    // Safety zone circle
    this.dataSource.entities.add({
      name: `${facility.name} — Safety Zone`,
      position: Cartesian3.fromDegrees(facility.lng, facility.lat, 0),
      ellipse: {
        semiMajorAxis: facility.safetyZoneKm * 1000,
        semiMinorAxis: facility.safetyZoneKm * 1000,
        material: color.withAlpha(0.08),
        outline: true,
        outlineColor: color.withAlpha(0.3),
        outlineWidth: 1,
        height: 0,
      },
    });

    // Main facility marker
    this.dataSource.entities.add({
      name: facility.name,
      position: Cartesian3.fromDegrees(facility.lng, facility.lat, 2000),
      point: {
        pixelSize: 16,
        color: color.withAlpha(0.9),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.NONE,
        scaleByDistance: new NearFarScalar(1e5, 2, 1e7, 0.6),
      },
      label: {
        text: `☢️ ${facility.name}`,
        font: 'bold 12px sans-serif',
        fillColor: color,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cartesian2(0, -20),
        verticalOrigin: VerticalOrigin.BOTTOM,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
      },
      description: `
        <h3>☢️ ${facility.name}</h3>
        <table>
          <tr><td><b>State</b></td><td>${facility.state}</td></tr>
          <tr><td><b>Operator</b></td><td>${facility.operator}</td></tr>
          <tr><td><b>Type</b></td><td>${facility.type.replace(/_/g, ' ')}</td></tr>
          <tr><td><b>Status</b></td><td>${facility.status}</td></tr>
          <tr><td><b>Operational Capacity</b></td><td>${cap} MW</td></tr>
          <tr><td><b>Safety Zone</b></td><td>${facility.safetyZoneKm} km radius</td></tr>
          <tr><td><b>Coordinates</b></td><td>${facility.lat.toFixed(4)}, ${facility.lng.toFixed(4)}</td></tr>
        </table>
        ${facility.reactors.length > 0 ? `
          <h4>Reactors</h4>
          <table>
            <tr><th>Name</th><th>Type</th><th>MW</th><th>Status</th></tr>
            ${facility.reactors.map(r => `
              <tr>
                <td>${r.name}</td>
                <td>${r.type}</td>
                <td>${r.capacityMW}</td>
                <td style="color:${statusColor(r.status)}">${r.status}</td>
              </tr>
            `).join('')}
          </table>
        ` : '<p><i>Processing/support facility</i></p>'}
      `,
    });
  }
}
