/**
 * CrimeHeatmapLayer — Crime hotspot visualization for Maharashtra districts
 */
import { Viewer, Cartesian3, Color, HeightReference, Entity } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

interface CrimeDistrict {
  name: string;
  lat: number;
  lng: number;
  totalCrimes: number;
  violentCrimes: number;
  propertyCrimes: number;
  cyberCrimes: number;
  crimesAgainstWomen: number;
  trend: 'rising' | 'stable' | 'declining';
  riskLevel: 'critical' | 'high' | 'moderate' | 'low';
}

export class CrimeHeatmapLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'crime-heatmap',
    name: 'Crime Hotspots',
    icon: '🔴',
    description: 'District-wise crime statistics with hotspot identification and trend analysis',
    category: 'maharashtra',
    color: '#dc2626',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'crime-heatmap',
  };

  private districts: CrimeDistrict[] = [
    { name: 'Mumbai', lat: 19.076, lng: 72.877, totalCrimes: 48520, violentCrimes: 3210, propertyCrimes: 28400, cyberCrimes: 4850, crimesAgainstWomen: 6120, trend: 'rising', riskLevel: 'critical' },
    { name: 'Pune', lat: 18.520, lng: 73.856, totalCrimes: 22180, violentCrimes: 1450, propertyCrimes: 12800, cyberCrimes: 3200, crimesAgainstWomen: 2850, trend: 'stable', riskLevel: 'high' },
    { name: 'Thane', lat: 19.218, lng: 72.978, totalCrimes: 19650, violentCrimes: 1280, propertyCrimes: 11200, cyberCrimes: 2400, crimesAgainstWomen: 2520, trend: 'rising', riskLevel: 'high' },
    { name: 'Nagpur', lat: 21.146, lng: 79.088, totalCrimes: 15430, violentCrimes: 1680, propertyCrimes: 8500, cyberCrimes: 1850, crimesAgainstWomen: 2100, trend: 'declining', riskLevel: 'high' },
    { name: 'Nashik', lat: 19.997, lng: 73.789, totalCrimes: 9870, violentCrimes: 620, propertyCrimes: 5800, cyberCrimes: 1200, crimesAgainstWomen: 1350, trend: 'stable', riskLevel: 'moderate' },
    { name: 'Aurangabad', lat: 19.876, lng: 75.343, totalCrimes: 8940, violentCrimes: 580, propertyCrimes: 5100, cyberCrimes: 980, crimesAgainstWomen: 1280, trend: 'rising', riskLevel: 'moderate' },
    { name: 'Solapur', lat: 17.660, lng: 75.906, totalCrimes: 6520, violentCrimes: 480, propertyCrimes: 3600, cyberCrimes: 520, crimesAgainstWomen: 920, trend: 'stable', riskLevel: 'moderate' },
    { name: 'Kolhapur', lat: 16.705, lng: 74.243, totalCrimes: 5890, violentCrimes: 320, propertyCrimes: 3400, cyberCrimes: 480, crimesAgainstWomen: 790, trend: 'declining', riskLevel: 'low' },
    { name: 'Chandrapur', lat: 19.962, lng: 79.296, totalCrimes: 4210, violentCrimes: 520, propertyCrimes: 2100, cyberCrimes: 280, crimesAgainstWomen: 680, trend: 'stable', riskLevel: 'moderate' },
    { name: 'Satara', lat: 17.680, lng: 74.000, totalCrimes: 3850, violentCrimes: 210, propertyCrimes: 2200, cyberCrimes: 350, crimesAgainstWomen: 540, trend: 'declining', riskLevel: 'low' },
    { name: 'Latur', lat: 18.408, lng: 76.560, totalCrimes: 3620, violentCrimes: 280, propertyCrimes: 2000, cyberCrimes: 310, crimesAgainstWomen: 490, trend: 'stable', riskLevel: 'low' },
    { name: 'Akola', lat: 20.710, lng: 77.000, totalCrimes: 4580, violentCrimes: 390, propertyCrimes: 2600, cyberCrimes: 380, crimesAgainstWomen: 610, trend: 'rising', riskLevel: 'moderate' },
    { name: 'Dhule', lat: 20.902, lng: 74.775, totalCrimes: 2980, violentCrimes: 310, propertyCrimes: 1500, cyberCrimes: 190, crimesAgainstWomen: 420, trend: 'stable', riskLevel: 'low' },
    { name: 'Nanded', lat: 19.138, lng: 77.321, totalCrimes: 5230, violentCrimes: 450, propertyCrimes: 2900, cyberCrimes: 420, crimesAgainstWomen: 720, trend: 'rising', riskLevel: 'moderate' },
    { name: 'Ahmednagar', lat: 19.095, lng: 74.739, totalCrimes: 6180, violentCrimes: 380, propertyCrimes: 3500, cyberCrimes: 580, crimesAgainstWomen: 870, trend: 'stable', riskLevel: 'moderate' },
    { name: 'Amravati', lat: 20.937, lng: 77.760, totalCrimes: 5670, violentCrimes: 410, propertyCrimes: 3200, cyberCrimes: 450, crimesAgainstWomen: 750, trend: 'stable', riskLevel: 'moderate' },
    { name: 'Jalgaon', lat: 21.008, lng: 75.563, totalCrimes: 4120, violentCrimes: 290, propertyCrimes: 2400, cyberCrimes: 320, crimesAgainstWomen: 510, trend: 'declining', riskLevel: 'low' },
    { name: 'Sangli', lat: 16.852, lng: 74.582, totalCrimes: 4780, violentCrimes: 260, propertyCrimes: 2800, cyberCrimes: 410, crimesAgainstWomen: 620, trend: 'stable', riskLevel: 'low' },
    { name: 'Yavatmal', lat: 20.389, lng: 78.131, totalCrimes: 3450, violentCrimes: 420, propertyCrimes: 1800, cyberCrimes: 230, crimesAgainstWomen: 480, trend: 'rising', riskLevel: 'moderate' },
    { name: 'Navi Mumbai', lat: 19.033, lng: 73.029, totalCrimes: 12340, violentCrimes: 680, propertyCrimes: 7500, cyberCrimes: 1800, crimesAgainstWomen: 1460, trend: 'rising', riskLevel: 'high' },
  ];

  private getRiskColor(risk: string): Color {
    switch (risk) {
      case 'critical': return Color.fromCssColorString('#dc2626');
      case 'high': return Color.fromCssColorString('#f97316');
      case 'moderate': return Color.fromCssColorString('#eab308');
      case 'low': return Color.fromCssColorString('#22c55e');
      default: return Color.GRAY;
    }
  }

  private getPixelSize(totalCrimes: number): number {
    if (totalCrimes > 40000) return 28;
    if (totalCrimes > 15000) return 22;
    if (totalCrimes > 8000) return 16;
    return 12;
  }

  private getTrendIcon(trend: string): string {
    switch (trend) {
      case 'rising': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  }

  protected async loadData(): Promise<void> {
    this.clear();
    for (const d of this.districts) {
      const color = this.getRiskColor(d.riskLevel);
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(d.lng, d.lat, 0),
        point: {
          pixelSize: this.getPixelSize(d.totalCrimes),
          color: color.withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🔴 ${d.name} District — Crime Report</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Risk Level</td><td style="color:${color.toCssColorString()};font-weight:bold;text-transform:uppercase">${d.riskLevel}</td></tr>
            <tr><td>Total Crimes</td><td><strong>${d.totalCrimes.toLocaleString()}</strong></td></tr>
            <tr><td>Violent Crimes</td><td>${d.violentCrimes.toLocaleString()}</td></tr>
            <tr><td>Property Crimes</td><td>${d.propertyCrimes.toLocaleString()}</td></tr>
            <tr><td>Cyber Crimes</td><td>${d.cyberCrimes.toLocaleString()}</td></tr>
            <tr><td>Crimes Against Women</td><td>${d.crimesAgainstWomen.toLocaleString()}</td></tr>
            <tr><td>Trend</td><td>${this.getTrendIcon(d.trend)} ${d.trend}</td></tr>
          </table>
        `,
      });
    }
  }
}
