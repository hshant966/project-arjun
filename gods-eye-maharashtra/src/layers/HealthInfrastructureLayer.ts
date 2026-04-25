/**
 * HealthInfrastructureLayer — Hospitals, PHCs, and health facilities
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class HealthInfrastructureLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'health-infra',
    name: 'Health Infrastructure',
    icon: '🏥',
    description: 'Hospitals, Primary Health Centers, Sub-centers, and Ayushman Bharat coverage',
    category: 'maharashtra',
    color: '#ff4081',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'health-infra',
  };

  private facilities = [
    { name: 'KEM Hospital Mumbai', type: 'Government Hospital', lat: 19.017, lng: 72.844, beds: 1800, status: 'active' },
    { name: 'Sion Hospital', type: 'Government Hospital', lat: 19.038, lng: 72.860, beds: 1450, status: 'active' },
    { name: 'Nair Hospital', type: 'Government Hospital', lat: 19.017, lng: 72.856, beds: 1200, status: 'active' },
    { name: 'Sassoon Hospital Pune', type: 'Government Hospital', lat: 18.531, lng: 73.860, beds: 1200, status: 'active' },
    { name: 'GMCH Nagpur', type: 'Government Hospital', lat: 21.145, lng: 79.051, beds: 900, status: 'active' },
    { name: 'PHC Ahmednagar', type: 'PHC', lat: 19.094, lng: 74.739, beds: 30, status: 'active' },
    { name: 'PHC Latur', type: 'PHC', lat: 18.408, lng: 76.576, beds: 25, status: 'needs upgrade' },
    { name: 'PHC Osmanabad', type: 'PHC', lat: 18.186, lng: 76.042, beds: 20, status: 'understaffed' },
    { name: 'PHC Beed', type: 'PHC', lat: 18.989, lng: 75.758, beds: 25, status: 'active' },
    { name: 'Sub-Center Gadchiroli', type: 'Sub-Center', lat: 20.183, lng: 80.005, beds: 4, status: 'needs medicine' },
    { name: 'Sub-Center Nandurbar', type: 'Sub-Center', lat: 21.370, lng: 74.240, beds: 6, status: 'active' },
    { name: 'PHC Palghar', type: 'PHC', lat: 19.697, lng: 72.765, beds: 20, status: 'understaffed' },
    { name: 'District Hospital Kolhapur', type: 'District Hospital', lat: 16.705, lng: 74.243, beds: 500, status: 'active' },
    { name: 'District Hospital Amravati', type: 'District Hospital', lat: 20.937, lng: 77.759, beds: 450, status: 'active' },
    { name: 'PHC Wardha', type: 'PHC', lat: 20.745, lng: 78.602, beds: 30, status: 'active' },
    { name: 'PHC Bhandara', type: 'PHC', lat: 21.167, lng: 79.650, beds: 25, status: 'active' },
  ];

  private getTypeColor(type: string): string {
    switch (type) {
      case 'Government Hospital': return '#ff1744';
      case 'District Hospital': return '#ff5722';
      case 'PHC': return '#ff9800';
      case 'Sub-Center': return '#ffc107';
      default: return '#e91e63';
    }
  }

  protected async loadData(): Promise<void> {
    this.clear();
    for (const f of this.facilities) {
      const color = this.getTypeColor(f.type);
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(f.lng, f.lat, 0),
        point: {
          pixelSize: f.type.includes('Hospital') ? 14 : 10,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 1,
        },
        description: `
          <h3>🏥 ${f.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Type</td><td>${f.type}</td></tr>
            <tr><td>Beds</td><td>${f.beds}</td></tr>
            <tr><td>Status</td><td style="color:${f.status === 'active' ? '#00ff88' : '#ffaa00'}">${f.status}</td></tr>
          </table>
        `,
      });
    }
  }
}
