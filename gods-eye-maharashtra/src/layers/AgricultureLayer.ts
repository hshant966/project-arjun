/**
 * AgricultureLayer — Crop data, drought zones, irrigation coverage
 */
import { Viewer, Cartesian3, Color, HeightReference, PolygonGraphics, PolygonHierarchy, Cartesian2 } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class AgricultureLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'agriculture',
    name: 'Agriculture',
    icon: '🌾',
    description: 'Crop patterns, drought-prone areas, irrigation coverage, and MSP data',
    category: 'maharashtra',
    color: '#4caf50',
    enabled: false,
    opacity: 0.7,
    dataStoreKey: 'agriculture',
  };

  // Major agricultural zones
  private zones = [
    { name: 'Western Maharashtra - Sugarcane Belt', lat: 17.2, lng: 74.5, crop: 'Sugarcane', area: '2.5M hectares', productivity: 'High', irrigation: '78%' },
    { name: 'Vidarbha - Cotton Belt', lat: 20.8, lng: 78.5, crop: 'Cotton', area: '4.2M hectares', productivity: 'Low-Medium', irrigation: '22%' },
    { name: 'Marathwada - Soybean Zone', lat: 19.2, lng: 76.5, crop: 'Soybean', area: '3.8M hectares', productivity: 'Low', irrigation: '18%' },
    { name: 'Konkan - Rice Belt', lat: 17.0, lng: 73.3, crop: 'Rice (Paddy)', area: '1.5M hectares', productivity: 'Medium', irrigation: '65%' },
    { name: 'Nashik - Grape & Onion', lat: 20.0, lng: 73.8, crop: 'Grapes, Onion', area: '0.8M hectares', productivity: 'High', irrigation: '55%' },
    { name: 'Nagpur - Orange Belt', lat: 21.2, lng: 79.1, crop: 'Oranges', area: '0.5M hectares', productivity: 'Medium', irrigation: '35%' },
    { name: 'Solapur - Jowar Zone', lat: 17.7, lng: 75.9, crop: 'Jowar (Sorghum)', area: '2.1M hectares', productivity: 'Low', irrigation: '15%' },
    { name: 'Amravati - Soybean & Wheat', lat: 20.9, lng: 77.8, crop: 'Soybean, Wheat', area: '1.8M hectares', productivity: 'Medium', irrigation: '28%' },
  ];

  // Drought-prone districts
  private droughtZones = [
    { name: 'Beed', severity: 'Severe', lat: 18.989, lng: 75.758 },
    { name: 'Osmanabad', severity: 'Severe', lat: 18.186, lng: 76.042 },
    { name: 'Latur', severity: 'Moderate', lat: 18.408, lng: 76.576 },
    { name: 'Solapur', severity: 'Moderate', lat: 17.660, lng: 75.906 },
    { name: 'Ahmednagar', severity: 'Moderate', lat: 19.094, lng: 74.739 },
    { name: 'Dhule', severity: 'Low', lat: 20.902, lng: 74.775 },
    { name: 'Nandurbar', severity: 'Low', lat: 21.370, lng: 74.240 },
    { name: 'Satara', severity: 'Low', lat: 17.680, lng: 74.018 },
  ];

  protected async loadData(): Promise<void> {
    this.clear();

    // Agricultural zones
    for (const z of this.zones) {
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(z.lng, z.lat, 0),
        point: {
          pixelSize: 16,
          color: Color.fromCssColorString('#4caf50').withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🌾 ${z.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Primary Crop</td><td>${z.crop}</td></tr>
            <tr><td>Cultivated Area</td><td>${z.area}</td></tr>
            <tr><td>Productivity</td><td>${z.productivity}</td></tr>
            <tr><td>Irrigation Coverage</td><td>${z.irrigation}</td></tr>
          </table>
        `,
      });
    }

    // Drought zones
    for (const d of this.droughtZones) {
      const color = d.severity === 'Severe' ? '#ff0000' :
                    d.severity === 'Moderate' ? '#ff8800' : '#ffcc00';
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(d.lng, d.lat, 0),
        point: {
          pixelSize: d.severity === 'Severe' ? 18 : 14,
          color: Color.fromCssColorString(color).withAlpha(0.6),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.RED,
          outlineWidth: 2,
        },
        description: `
          <h3>⚠️ Drought Zone: ${d.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Severity</td><td style="color:${color};font-weight:bold">${d.severity}</td></tr>
          </table>
        `,
      });
    }
  }
}
