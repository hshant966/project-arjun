/**
 * WaterQualityLayer — Water contamination and quality monitoring stations
 */
import { Viewer, Cartesian3, Color, HeightReference, PointGraphics, NearFarScalar } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

export class WaterQualityLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'water-quality',
    name: 'Water Quality',
    icon: '💧',
    description: 'Water quality monitoring stations, contamination alerts, and Jal Jeevan Mission status',
    category: 'maharashtra',
    color: '#00a8ff',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'water-quality',
  };

  // Sample monitoring stations across Maharashtra
  private stations = [
    { name: 'Mumbai - Vihar Lake', lat: 19.159, lng: 72.931, quality: 'good', tds: 180, ph: 7.2, coliform: 0 },
    { name: 'Mumbai - Tulsi Lake', lat: 19.179, lng: 72.919, quality: 'good', tds: 165, ph: 7.0, coliform: 0 },
    { name: 'Pune - Khadakwasla', lat: 18.437, lng: 73.770, quality: 'moderate', tds: 320, ph: 7.5, coliform: 2 },
    { name: 'Nagpur - Gorewada', lat: 21.182, lng: 79.048, quality: 'good', tds: 210, ph: 7.1, coliform: 0 },
    { name: 'Nashik - Gangapur Dam', lat: 19.963, lng: 73.736, quality: 'good', tds: 195, ph: 7.3, coliform: 1 },
    { name: 'Aurangabad - Jayakwadi', lat: 19.483, lng: 75.379, quality: 'poor', tds: 580, ph: 8.1, coliform: 15 },
    { name: 'Kolhapur - Radhanagari', lat: 16.437, lng: 74.018, quality: 'good', tds: 145, ph: 6.9, coliform: 0 },
    { name: 'Solapur - Ujani Dam', lat: 18.077, lng: 75.121, quality: 'poor', tds: 920, ph: 8.4, coliform: 45 },
    { name: 'Latur - Manjara', lat: 18.408, lng: 76.580, quality: 'poor', tds: 1200, ph: 8.6, coliform: 80 },
    { name: 'Marathwada - Godavari', lat: 19.150, lng: 76.800, quality: 'moderate', tds: 450, ph: 7.8, coliform: 8 },
    { name: 'Vidarbha - Wardha River', lat: 20.750, lng: 78.600, quality: 'moderate', tds: 380, ph: 7.6, coliform: 5 },
    { name: 'Konkan - Amba River', lat: 17.200, lng: 73.400, quality: 'good', tds: 120, ph: 6.8, coliform: 0 },
    { name: 'Thane - Ulhas River', lat: 19.220, lng: 73.150, quality: 'moderate', tds: 290, ph: 7.4, coliform: 3 },
    { name: 'Amravati - Upper Wardha', lat: 20.930, lng: 77.780, quality: 'moderate', tds: 410, ph: 7.7, coliform: 6 },
    { name: 'Dhule - Tapi River', lat: 20.900, lng: 74.780, quality: 'good', tds: 230, ph: 7.2, coliform: 1 },
  ];

  protected async loadData(): Promise<void> {
    this.clear();

    for (const s of this.stations) {
      const color = s.quality === 'good' ? '#00ff88' :
                    s.quality === 'moderate' ? '#ffaa00' : '#ff3355';

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(s.lng, s.lat, 0),
        point: {
          pixelSize: 12,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>💧 ${s.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Quality</td><td style="color:${color};font-weight:bold">${s.quality.toUpperCase()}</td></tr>
            <tr><td>TDS (ppm)</td><td>${s.tds}</td></tr>
            <tr><td>pH Level</td><td>${s.ph}</td></tr>
            <tr><td>Coliform (MPN/100ml)</td><td>${s.coliform}</td></tr>
            <tr><td>Status</td><td>${s.coliform > 10 ? '⚠️ CONTAMINATED' : s.tds > 500 ? '⚠️ HIGH TDS' : '✅ Safe'}</td></tr>
          </table>
        `,
      });
    }
  }
}
