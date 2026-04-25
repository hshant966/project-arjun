/**
 * AirQualityLayer — Air quality monitoring stations across Maharashtra
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class AirQualityLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'air-quality',
    name: 'Air Quality Index',
    icon: '🌬️',
    description: 'Real-time AQI monitoring stations with PM2.5, PM10, NO2, SO2 levels',
    category: 'maharashtra',
    color: '#ff6b35',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'air-quality',
  };

  private stations = [
    { name: 'Mumbai - Bandra Kurla', lat: 19.067, lng: 72.867, aqi: 156, pm25: 78, pm10: 142, category: 'Unhealthy' },
    { name: 'Mumbai - Andheri', lat: 19.119, lng: 72.847, aqi: 132, pm25: 62, pm10: 118, category: 'Unhealthy for Sensitive' },
    { name: 'Mumbai - Worli', lat: 19.017, lng: 72.817, aqi: 98, pm25: 42, pm10: 88, category: 'Moderate' },
    { name: 'Pune - Shivajinagar', lat: 18.531, lng: 73.844, aqi: 112, pm25: 52, pm10: 95, category: 'Unhealthy for Sensitive' },
    { name: 'Pune - Hadapsar', lat: 18.508, lng: 73.926, aqi: 145, pm25: 72, pm10: 135, category: 'Unhealthy' },
    { name: 'Nagpur - Sadar', lat: 21.145, lng: 79.088, aqi: 88, pm25: 35, pm10: 72, category: 'Moderate' },
    { name: 'Nashik - CBS', lat: 19.997, lng: 73.789, aqi: 76, pm25: 28, pm10: 65, category: 'Moderate' },
    { name: 'Aurangabad - CIDCO', lat: 19.876, lng: 75.343, aqi: 105, pm25: 48, pm10: 92, category: 'Unhealthy for Sensitive' },
    { name: 'Thane - Naupada', lat: 19.185, lng: 72.967, aqi: 138, pm25: 68, pm10: 125, category: 'Unhealthy' },
    { name: 'Chandrapur', lat: 19.962, lng: 79.296, aqi: 185, pm25: 95, pm10: 168, category: 'Unhealthy' },
    { name: 'Solapur', lat: 17.660, lng: 75.906, aqi: 95, pm25: 40, pm10: 82, category: 'Moderate' },
    { name: 'Kolhapur', lat: 16.705, lng: 74.243, aqi: 65, pm25: 22, pm10: 55, category: 'Good' },
  ];

  private getAqiColor(aqi: number): string {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  }

  protected async loadData(): Promise<void> {
    this.clear();
    for (const s of this.stations) {
      const color = this.getAqiColor(s.aqi);
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(s.lng, s.lat, 0),
        point: {
          pixelSize: s.aqi > 150 ? 18 : s.aqi > 100 ? 14 : 10,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🌬️ ${s.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>AQI</td><td style="color:${color};font-weight:bold;font-size:1.2em">${s.aqi} (${s.category})</td></tr>
            <tr><td>PM2.5</td><td>${s.pm25} µg/m³</td></tr>
            <tr><td>PM10</td><td>${s.pm10} µg/m³</td></tr>
          </table>
        `,
      });
    }
  }
}
