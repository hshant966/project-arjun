/**
 * StrategicInfrastructureLayer — Military bases, air bases, naval bases, space centers, government buildings
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StrategicAsset {
  name: string;
  lat: number;
  lng: number;
  type: 'army_base' | 'air_force_base' | 'naval_base' | 'space_center' | 'government' | 'defense_corridor' | 'missile_site';
  branch: string;
  description: string;
  importance: 'critical' | 'high' | 'medium';
  state: string;
}

// ─── Strategic Assets Data ───────────────────────────────────────────────────

const STRATEGIC_ASSETS: StrategicAsset[] = [
  // Air Force Bases
  { name: 'Hindon Air Force Station', lat: 28.6692, lng: 77.3586, type: 'air_force_base', branch: 'Indian Air Force', description: 'Major air base near Delhi, houses C-17s and transport fleet', importance: 'critical', state: 'Uttar Pradesh' },
  { name: 'Ambala Air Force Station', lat: 30.3747, lng: 76.8172, type: 'air_force_base', branch: 'Indian Air Force', description: 'Rafale squadron base', importance: 'critical', state: 'Haryana' },
  { name: 'Halwara Air Force Station', lat: 30.7494, lng: 75.6328, type: 'air_force_base', branch: 'Indian Air Force', description: 'Su-30MKI base', importance: 'high', state: 'Punjab' },
  { name: 'Jodhpur Air Force Station', lat: 26.2511, lng: 73.0489, type: 'air_force_base', branch: 'Indian Air Force', description: 'Su-30MKI and MiG-21 base', importance: 'high', state: 'Rajasthan' },
  { name: 'Jamnagar Air Force Station', lat: 22.4667, lng: 70.0167, type: 'air_force_base', branch: 'Indian Air Force', description: 'Major western sector base', importance: 'high', state: 'Gujarat' },
  { name: 'Pune (Lohegaon) Air Force Station', lat: 18.5822, lng: 73.9197, type: 'air_force_base', branch: 'Indian Air Force', description: 'Su-30MKI main base', importance: 'critical', state: 'Maharashtra' },
  { name: 'Tezpur Air Force Station', lat: 26.7094, lng: 92.7847, type: 'air_force_base', branch: 'Indian Air Force', description: 'Su-30MKI base, NE sector', importance: 'high', state: 'Assam' },
  { name: 'Chabua Air Force Station', lat: 27.4622, lng: 95.1194, type: 'air_force_base', branch: 'Indian Air Force', description: 'NE sector air base', importance: 'high', state: 'Assam' },
  { name: 'Srinagar Air Force Station', lat: 33.9872, lng: 74.7742, type: 'air_force_base', branch: 'Indian Air Force', description: 'Kashmir sector base', importance: 'critical', state: 'J&K' },
  { name: 'Bareilly Air Force Station', lat: 28.4222, lng: 79.4508, type: 'air_force_base', branch: 'Indian Air Force', description: 'MiG-29 and Su-30MKI base', importance: 'high', state: 'Uttar Pradesh' },
  { name: 'Gwalior Air Force Station', lat: 26.2933, lng: 78.2278, type: 'air_force_base', branch: 'Indian Air Force', description: 'Mirage 2000 base', importance: 'high', state: 'Madhya Pradesh' },
  { name: 'Bathinda Air Force Station', lat: 30.1833, lng: 74.9333, type: 'air_force_base', branch: 'Indian Air Force', description: 'Western sector fighter base', importance: 'high', state: 'Punjab' },
  { name: 'Agra Air Force Station', lat: 27.1767, lng: 77.9608, type: 'air_force_base', branch: 'Indian Air Force', description: 'Transport hub, AWACS base', importance: 'critical', state: 'Uttar Pradesh' },
  { name: 'Dundigal Air Force Academy', lat: 17.6286, lng: 78.4036, type: 'air_force_base', branch: 'Indian Air Force', description: 'Pilot training academy', importance: 'high', state: 'Telangana' },
  { name: 'Bidar Air Force Station', lat: 17.9081, lng: 77.4872, type: 'air_force_base', branch: 'Indian Air Force', description: 'Training base', importance: 'medium', state: 'Karnataka' },

  // Naval Bases
  { name: 'INS Shivaji (Lonavala)', lat: 18.7500, lng: 73.4000, type: 'naval_base', branch: 'Indian Navy', description: 'Naval technical training establishment', importance: 'medium', state: 'Maharashtra' },
  { name: 'INS Angre (Mumbai)', lat: 18.9220, lng: 72.8347, type: 'naval_base', branch: 'Indian Navy', description: 'Western Naval Command HQ', importance: 'critical', state: 'Maharashtra' },
  { name: 'INS Kadamba (Karwar)', lat: 14.8000, lng: 74.1167, type: 'naval_base', branch: 'Indian Navy', description: 'Major naval base, aircraft carrier homeport', importance: 'critical', state: 'Karnataka' },
  { name: 'INS Dweeprakshak (Kavaratti)', lat: 10.5667, lng: 72.6333, type: 'naval_base', branch: 'Indian Navy', description: 'Lakshadweep naval base', importance: 'high', state: 'Lakshadweep' },
  { name: 'INS Baaz (Campbell Bay)', lat: 6.9833, lng: 93.9167, type: 'naval_base', branch: 'Indian Navy', description: 'Andaman & Nicobar Command, southernmost base', importance: 'critical', state: 'A&N Islands' },
  { name: 'Naval Base Kochi', lat: 9.9500, lng: 76.2667, type: 'naval_base', branch: 'Indian Navy', description: 'Southern Naval Command HQ', importance: 'critical', state: 'Kerala' },
  { name: 'INS Rajali (Arakkonam)', lat: 12.6833, lng: 79.7500, type: 'naval_base', branch: 'Indian Navy', description: 'Naval Air Station, P-8I base', importance: 'critical', state: 'Tamil Nadu' },
  { name: 'Visakhapatnam Naval Base', lat: 17.6868, lng: 83.2833, type: 'naval_base', branch: 'Indian Navy', description: 'Eastern Naval Command HQ, submarine base', importance: 'critical', state: 'Andhra Pradesh' },
  { name: 'Naval Dockyard Mumbai', lat: 18.9250, lng: 72.8400, type: 'naval_base', branch: 'Indian Navy', description: 'Major shipbuilding and repair facility', importance: 'critical', state: 'Maharashtra' },
  { name: 'Port Blair Naval Base', lat: 11.6667, lng: 92.7500, type: 'naval_base', branch: 'Indian Navy', description: 'Tri-service command, Andaman', importance: 'critical', state: 'A&N Islands' },
  { name: 'INS Hamla (Mumbai)', lat: 19.0333, lng: 72.8167, type: 'naval_base', branch: 'Indian Navy', description: 'Logistics and amphibious base', importance: 'high', state: 'Maharashtra' },

  // Army Bases
  { name: 'Army HQ (South Block, Delhi)', lat: 28.6128, lng: 77.2073, type: 'army_base', branch: 'Indian Army', description: 'Army Headquarters', importance: 'critical', state: 'Delhi' },
  { name: 'Udhampur Northern Command', lat: 32.9333, lng: 75.1333, type: 'army_base', branch: 'Indian Army', description: 'Northern Command HQ', importance: 'critical', state: 'J&K' },
  { name: 'Pune Southern Command', lat: 18.5167, lng: 73.8833, type: 'army_base', branch: 'Indian Army', description: 'Southern Command HQ', importance: 'critical', state: 'Maharashtra' },
  { name: 'Kolkata Eastern Command', lat: 22.5500, lng: 88.3500, type: 'army_base', branch: 'Indian Army', description: 'Eastern Command HQ', importance: 'critical', state: 'West Bengal' },
  { name: 'Jaipur South Western Command', lat: 26.9167, lng: 75.8000, type: 'army_base', branch: 'Indian Army', description: 'South Western Command HQ', importance: 'critical', state: 'Rajasthan' },
  { name: 'Lucknow Central Command', lat: 26.8500, lng: 80.9500, type: 'army_base', branch: 'Indian Army', description: 'Central Command HQ', importance: 'critical', state: 'Uttar Pradesh' },
  { name: 'Dimapur III Corps', lat: 25.9000, lng: 93.7333, type: 'army_base', branch: 'Indian Army', description: 'Spear Corps, NE operations', importance: 'critical', state: 'Nagaland' },
  { name: 'Leh XIV Corps', lat: 34.1500, lng: 77.5833, type: 'army_base', branch: 'Indian Army', description: 'Fire & Fury Corps, Ladakh', importance: 'critical', state: 'Ladakh' },
  { name: 'Srinagar XV Corps', lat: 34.0833, lng: 74.8333, type: 'army_base', branch: 'Indian Army', description: 'Chinar Corps, Kashmir', importance: 'critical', state: 'J&K' },
  { name: 'Jalandhar XI Corps', lat: 31.3333, lng: 75.5833, type: 'army_base', branch: 'Indian Army', description: 'Vajra Corps', importance: 'high', state: 'Punjab' },
  { name: 'Bhopal Corps', lat: 23.2667, lng: 77.4000, type: 'army_base', branch: 'Indian Army', description: 'XXI Corps', importance: 'high', state: 'Madhya Pradesh' },

  // Space Centers (ISRO)
  { name: 'Satish Dhawan Space Centre (SHAR)', lat: 13.7167, lng: 80.2333, type: 'space_center', branch: 'ISRO', description: 'India\'s primary launch center, Sriharikota', importance: 'critical', state: 'Andhra Pradesh' },
  { name: 'Thumba Equatorial Rocket Launching Station', lat: 8.5333, lng: 76.8667, type: 'space_center', branch: 'ISRO', description: 'India\'s first rocket launch site', importance: 'high', state: 'Kerala' },
  { name: 'ISRO Propulsion Complex (Mahendragiri)', lat: 8.2667, lng: 77.4833, type: 'space_center', branch: 'ISRO', description: 'Liquid propulsion systems testing', importance: 'high', state: 'Tamil Nadu' },
  { name: 'ISRO Satellite Centre (Bangalore)', lat: 13.0333, lng: 77.5667, type: 'space_center', branch: 'ISRO', description: 'Satellite design and integration', importance: 'critical', state: 'Karnataka' },
  { name: 'ISRO Telemetry Tracking (Bangalore)', lat: 13.0167, lng: 77.5833, type: 'space_center', branch: 'ISRO', description: 'Mission control and tracking', importance: 'high', state: 'Karnataka' },
  { name: 'Vikram Sarabhai Space Centre', lat: 8.5500, lng: 76.8833, type: 'space_center', branch: 'ISRO', description: 'Launch vehicle development, Thiruvananthapuram', importance: 'critical', state: 'Kerala' },
  { name: 'Space Applications Centre (Ahmedabad)', lat: 23.0333, lng: 72.5500, type: 'space_center', branch: 'ISRO', description: 'Payload and application development', importance: 'high', state: 'Gujarat' },
  { name: 'ISRO Deep Space Network (Byalalu)', lat: 12.9167, lng: 77.3833, type: 'space_center', branch: 'ISRO', description: 'Deep space communication', importance: 'high', state: 'Karnataka' },

  // Government Buildings (Delhi)
  { name: 'Rashtrapati Bhavan', lat: 28.6143, lng: 77.1994, type: 'government', branch: 'Government', description: 'President\'s residence', importance: 'critical', state: 'Delhi' },
  { name: 'Parliament House', lat: 28.6172, lng: 77.2089, type: 'government', branch: 'Government', description: 'New Parliament building', importance: 'critical', state: 'Delhi' },
  { name: 'North Block (Finance Ministry)', lat: 28.6139, lng: 77.2090, type: 'government', branch: 'Government', description: 'Finance and Home ministries', importance: 'critical', state: 'Delhi' },
  { name: 'South Block (PMO)', lat: 28.6126, lng: 77.2073, type: 'government', branch: 'Government', description: 'PMO, Defence, External Affairs', importance: 'critical', state: 'Delhi' },
  { name: 'DRDO Bhavan', lat: 28.6000, lng: 77.2000, type: 'government', branch: 'DRDO', description: 'Defence Research HQ', importance: 'critical', state: 'Delhi' },
  { name: 'NITI Aayog', lat: 28.6167, lng: 77.2167, type: 'government', branch: 'Government', description: 'Policy think tank', importance: 'high', state: 'Delhi' },

  // Defense Corridors
  { name: 'UP Defence Corridor — Lucknow Node', lat: 26.8467, lng: 80.9462, type: 'defense_corridor', branch: 'Defence Industrial', description: 'UP Defence Corridor', importance: 'high', state: 'Uttar Pradesh' },
  { name: 'UP Defence Corridor — Jhansi Node', lat: 25.4484, lng: 78.5685, type: 'defense_corridor', branch: 'Defence Industrial', description: 'UP Defence Corridor', importance: 'high', state: 'Uttar Pradesh' },
  { name: 'TN Defence Corridor — Chennai Node', lat: 13.0827, lng: 80.2707, type: 'defense_corridor', branch: 'Defence Industrial', description: 'Tamil Nadu Defence Corridor', importance: 'high', state: 'Tamil Nadu' },
  { name: 'TN Defence Corridor — Salem Node', lat: 11.6643, lng: 78.1460, type: 'defense_corridor', branch: 'Defence Industrial', description: 'Tamil Nadu Defence Corridor', importance: 'medium', state: 'Tamil Nadu' },

  // Missile Sites / Strategic Forces
  { name: 'Integrated Test Range (Chandipur)', lat: 21.4833, lng: 87.0833, type: 'missile_site', branch: 'DRDO', description: 'Missile testing facility', importance: 'critical', state: 'Odisha' },
  { name: 'APJ Abdul Kalam Island', lat: 20.7500, lng: 87.0833, type: 'missile_site', branch: 'DRDO', description: 'Wheeler Island, missile launch site', importance: 'critical', state: 'Odisha' },
  { name: 'Pokhran Test Range', lat: 27.1000, lng: 71.7833, type: 'missile_site', branch: 'DRDO', description: 'Nuclear and missile test site', importance: 'critical', state: 'Rajasthan' },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function assetColor(asset: StrategicAsset): Color {
  switch (asset.type) {
    case 'air_force_base': return Color.fromCssColorString('#00aaff');
    case 'naval_base': return Color.fromCssColorString('#0066ff');
    case 'army_base': return Color.fromCssColorString('#00cc44');
    case 'space_center': return Color.fromCssColorString('#ff8800');
    case 'government': return Color.fromCssColorString('#ffdd00');
    case 'defense_corridor': return Color.fromCssColorString('#cc66ff');
    case 'missile_site': return Color.fromCssColorString('#ff0066');
  }
}

function assetIcon(type: StrategicAsset['type']): string {
  switch (type) {
    case 'air_force_base': return '✈️';
    case 'naval_base': return '⚓';
    case 'army_base': return '🎖️';
    case 'space_center': return '🚀';
    case 'government': return '🏛️';
    case 'defense_corridor': return '🏭';
    case 'missile_site': return '🚀';
  }
}

function importanceSize(importance: StrategicAsset['importance']): number {
  switch (importance) {
    case 'critical': return 14;
    case 'high': return 11;
    case 'medium': return 8;
  }
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class StrategicInfrastructureLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'strategic-infrastructure',
    name: 'Strategic Infrastructure',
    icon: '🎖️',
    description: 'Military bases, air bases, naval bases, space centers, government buildings, defense corridors',
    category: 'intelligence',
    color: '#00aaff',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'strategic',
  };

  protected async loadData(): Promise<void> {
    for (const asset of STRATEGIC_ASSETS) {
      this.renderAsset(asset);
    }
  }

  private renderAsset(asset: StrategicAsset): void {
    const color = assetColor(asset);
    const icon = assetIcon(asset.type);
    const size = importanceSize(asset.importance);

    this.dataSource.entities.add({
      name: `${icon} ${asset.name}`,
      position: Cartesian3.fromDegrees(asset.lng, asset.lat, 1000),
      point: {
        pixelSize: size,
        color: color.withAlpha(0.9),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        heightReference: HeightReference.NONE,
        scaleByDistance: new NearFarScalar(1e5, 1.5, 1e7, 0.5),
      },
      label: {
        text: `${icon} ${asset.name}`,
        font: '11px sans-serif',
        fillColor: color,
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cartesian2(14, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
      },
      description: `
        <h3>${icon} ${asset.name}</h3>
        <table>
          <tr><td><b>Branch</b></td><td>${asset.branch}</td></tr>
          <tr><td><b>Type</b></td><td>${asset.type.replace(/_/g, ' ')}</td></tr>
          <tr><td><b>State</b></td><td>${asset.state}</td></tr>
          <tr><td><b>Importance</b></td><td style="color:${color.toCssColorString()};font-weight:bold">${asset.importance.toUpperCase()}</td></tr>
          <tr><td><b>Description</b></td><td>${asset.description}</td></tr>
          <tr><td><b>Coordinates</b></td><td>${asset.lat.toFixed(4)}, ${asset.lng.toFixed(4)}</td></tr>
        </table>
      `,
    });
  }
}
