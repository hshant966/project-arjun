/**
 * RainfallLayer — IMD rainfall data and monsoon tracking
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class RainfallLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'rainfall',
    name: 'Rainfall & Weather',
    icon: '🌧️',
    description: 'IMD rainfall data, monsoon tracking, flood alerts, and drought monitoring',
    category: 'maharashtra',
    color: '#2196f3',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'rainfall',
  };

  private stations = [
    { name: 'Mumbai (Colaba)', lat: 18.907, lng: 72.815, annual: 2384, current: 45, status: 'Normal' },
    { name: 'Mumbai (Santacruz)', lat: 19.089, lng: 72.846, annual: 2450, current: 52, status: 'Normal' },
    { name: 'Pune', lat: 18.531, lng: 73.844, annual: 722, current: 28, status: 'Normal' },
    { name: 'Mahabaleshwar', lat: 17.930, lng: 73.650, annual: 5548, current: 120, status: 'Heavy' },
    { name: 'Ratnagiri', lat: 16.990, lng: 73.298, annual: 3286, current: 85, status: 'Normal' },
    { name: 'Matheran', lat: 18.988, lng: 73.270, annual: 4100, current: 95, status: 'Normal' },
    { name: 'Nagpur', lat: 21.146, lng: 79.088, annual: 1205, current: 12, status: 'Deficient' },
    { name: 'Aurangabad', lat: 19.876, lng: 75.343, annual: 734, current: 8, status: 'Deficient' },
    { name: 'Solapur', lat: 17.660, lng: 75.906, annual: 574, current: 5, status: 'Scanty' },
    { name: 'Latur', lat: 18.408, lng: 76.576, annual: 695, current: 6, status: 'Scanty' },
    { name: 'Beed', lat: 18.989, lng: 75.758, annual: 728, current: 7, status: 'Deficient' },
    { name: 'Nanded', lat: 19.138, lng: 77.321, annual: 893, current: 10, status: 'Deficient' },
    { name: 'Kolhapur', lat: 16.705, lng: 74.243, annual: 1044, current: 35, status: 'Normal' },
    { name: 'Satara', lat: 17.680, lng: 74.018, annual: 1120, current: 40, status: 'Normal' },
    { name: 'Chandrapur', lat: 19.962, lng: 79.296, annual: 1330, current: 15, status: 'Deficient' },
    { name: 'Amravati', lat: 20.937, lng: 77.759, annual: 966, current: 11, status: 'Deficient' },
  ];

  private getStatusColor(status: string): string {
    switch (status) {
      case 'Heavy': return '#0d47a1';
      case 'Normal': return '#1976d2';
      case 'Deficient': return '#ff9800';
      case 'Scanty': return '#ff3355';
      default: return '#2196f3';
    }
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const s of this.stations) {
      const color = this.getStatusColor(s.status);
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(s.lng, s.lat, 0),
        point: {
          pixelSize: s.status === 'Heavy' ? 16 : s.status === 'Scanty' ? 14 : 10,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🌧️ ${s.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Annual Avg</td><td>${s.annual} mm</td></tr>
            <tr><td>Current Month</td><td>${s.current} mm</td></tr>
            <tr><td>Status</td><td style="color:${color};font-weight:bold">${s.status}</td></tr>
            <tr><td>Deviation</td><td>${Math.round((s.current / (s.annual / 12) - 1) * 100)}%</td></tr>
          </table>
        `,
      });
    }
  }
}
