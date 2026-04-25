/**
 * InfrastructureLayer — Roads, bridges, dams, railways, metro projects
 */
import { Viewer, Cartesian3, Color, HeightReference, PolylineGraphics, PolylineDashMaterialProperty, Cartographic, Math as CesiumMath } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class InfrastructureLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: '🏗️',
    description: 'Major infrastructure projects: highways, metros, dams, smart cities',
    category: 'maharashtra',
    color: '#ff9800',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'infrastructure',
  };

  private projects = [
    { name: 'Mumbai Metro Line 3 (Colaba-Bandra-SEEPZ)', type: 'Metro', status: 'Under Construction', cost: '₹23,136 Cr', completion: '2025', lat: 19.054, lng: 72.840 },
    { name: 'Mumbai Metro Line 4 (Wadala-Thane)', type: 'Metro', status: 'Under Construction', cost: '₹14,549 Cr', completion: '2026', lat: 19.150, lng: 72.940 },
    { name: 'Pune Metro Phase 1', type: 'Metro', status: 'Partially Operational', cost: '₹11,420 Cr', completion: '2025', lat: 18.520, lng: 73.856 },
    { name: 'Nagpur Metro Phase 1', type: 'Metro', status: 'Operational', cost: '₹8,680 Cr', completion: '2022', lat: 21.146, lng: 79.088 },
    { name: 'Samruddhi Mahamarg (Mumbai-Nagpur)', type: 'Highway', status: 'Partially Open', cost: '₹55,000 Cr', completion: '2024', lat: 20.0, lng: 76.0 },
    { name: 'Mumbai Coastal Road', type: 'Highway', status: 'Partially Open', cost: '₹12,721 Cr', completion: '2024', lat: 19.000, lng: 72.810 },
    { name: 'Mumbai Trans Harbour Link (MTHL)', type: 'Bridge', status: 'Operational', cost: '₹17,843 Cr', completion: '2024', lat: 18.970, lng: 72.960 },
    { name: 'Navi Mumbai Airport (NMIA)', type: 'Airport', status: 'Under Construction', cost: '₹16,704 Cr', completion: '2025', lat: 18.980, lng: 73.050 },
    { name: 'Pune Ring Road', type: 'Highway', status: 'Planning', cost: '₹20,000 Cr', completion: '2028', lat: 18.580, lng: 73.800 },
    { name: 'Jal Jeevan Mission - Marathwada', type: 'Water', status: 'In Progress', cost: '₹12,400 Cr', completion: '2026', lat: 19.2, lng: 76.2 },
    { name: 'Gosikhurd Dam', type: 'Dam', status: 'Ongoing Issues', cost: '₹9,700 Cr', completion: 'Delayed', lat: 21.05, lng: 79.80 },
    { name: 'Mumbai-Ahmedabad Bullet Train', type: 'Rail', status: 'Under Construction', cost: '₹1.1 Lakh Cr', completion: '2028', lat: 19.5, lng: 73.2 },
  ];

  protected async loadData(): Promise<void> {
    this.clear();

    for (const p of this.projects) {
      const color = p.status === 'Operational' ? '#00ff88' :
                    p.status.includes('Partially') ? '#ffcc00' :
                    p.status.includes('Delayed') || p.status.includes('Issues') ? '#ff3355' :
                    p.status === 'Under Construction' || p.status === 'In Progress' ? '#ff9800' : '#888888';

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(p.lng, p.lat, 100),
        point: {
          pixelSize: 12,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🏗️ ${p.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Type</td><td>${p.type}</td></tr>
            <tr><td>Status</td><td style="color:${color};font-weight:bold">${p.status}</td></tr>
            <tr><td>Cost</td><td>${p.cost}</td></tr>
            <tr><td>Target Completion</td><td>${p.completion}</td></tr>
          </table>
        `,
      });
    }
  }
}
