/**
 * WaterContaminationLayer — Water contamination tracking with severity levels
 * Critical layer for India-wide failure monitoring
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

interface WaterSource {
  name: string;
  lat: number;
  lng: number;
  district: string;
  type: 'river' | 'lake' | 'reservoir' | 'groundwater' | 'dam';
  arsenic: number;       // µg/L (WHO limit: 10)
  fluoride: number;      // mg/L (WHO limit: 1.5)
  nitrate: number;       // mg/L (WHO limit: 50)
  iron: number;          // mg/L (BIS limit: 0.3)
  tds: number;           // mg/L (BIS limit: 500)
  bacteria: 'absent' | 'low' | 'moderate' | 'high';
  severity: 'safe' | 'caution' | 'warning' | 'critical' | 'emergency';
  affectedPopulation: number;
  lastTested: string;
  contaminants: string[];
}

export class WaterContaminationLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'water-contamination',
    name: 'Water Contamination',
    icon: '☣️',
    description: 'Critical — water contamination tracking: arsenic, fluoride, nitrate, heavy metals, bacteria. WHO/BIS compliance monitoring.',
    category: 'maharashtra',
    color: '#0ea5e9',
    enabled: false,
    opacity: 0.85,
    dataStoreKey: 'water-contamination',
  };

  private sources: WaterSource[] = [
    // CRITICAL — Severe contamination
    { name: 'Mula-Mutha River (Pune)', lat: 18.520, lng: 73.870, district: 'Pune', type: 'river', arsenic: 18, fluoride: 2.8, nitrate: 72, iron: 1.2, tds: 1850, bacteria: 'high', severity: 'critical', affectedPopulation: 3200000, lastTested: '2025-03-15', contaminants: ['Arsenic', 'Fluoride', 'E.Coli', 'Heavy Metals'] },
    { name: 'Nag River (Nagpur)', lat: 21.160, lng: 79.100, district: 'Nagpur', type: 'river', arsenic: 14, fluoride: 3.1, nitrate: 85, iron: 2.4, tds: 2100, bacteria: 'high', severity: 'critical', affectedPopulation: 2600000, lastTested: '2025-03-10', contaminants: ['Arsenic', 'Fluoride', 'Nitrate', 'E.Coli', 'Lead'] },
    { name: 'Waldhuni River (Kalyan)', lat: 19.240, lng: 73.130, district: 'Thane', type: 'river', arsenic: 22, fluoride: 2.2, nitrate: 95, iron: 3.8, tds: 2400, bacteria: 'high', severity: 'emergency', affectedPopulation: 1800000, lastTested: '2025-04-01', contaminants: ['Arsenic', 'Mercury', 'Chromium', 'E.Coli', 'Industrial Effluents'] },
    { name: 'Groundwater — Chandrapur', lat: 19.960, lng: 79.300, district: 'Chandrapur', type: 'groundwater', arsenic: 35, fluoride: 4.5, nitrate: 42, iron: 1.8, tds: 1200, bacteria: 'moderate', severity: 'emergency', affectedPopulation: 850000, lastTested: '2025-02-28', contaminants: ['Arsenic (3.5x WHO)', 'Fluoride (3x WHO)', 'Manganese'] },

    // WARNING — Significant contamination
    { name: 'Mutha Canal (Pune)', lat: 18.500, lng: 73.850, district: 'Pune', type: 'river', arsenic: 8, fluoride: 1.8, nitrate: 55, iron: 0.6, tds: 980, bacteria: 'moderate', severity: 'warning', affectedPopulation: 1200000, lastTested: '2025-03-20', contaminants: ['Fluoride', 'Nitrate', 'Coliform'] },
    { name: 'Ulhas River (Ulhasnagar)', lat: 19.220, lng: 73.160, district: 'Thane', type: 'river', arsenic: 12, fluoride: 1.6, nitrate: 62, iron: 0.9, tds: 1100, bacteria: 'moderate', severity: 'warning', affectedPopulation: 950000, lastTested: '2025-03-18', contaminants: ['Arsenic', 'Fluoride', 'Industrial Waste'] },
    { name: 'Pavana River (Pimpri)', lat: 18.630, lng: 73.800, district: 'Pune', type: 'river', arsenic: 6, fluoride: 2.1, nitrate: 48, iron: 0.5, tds: 850, bacteria: 'low', severity: 'warning', affectedPopulation: 780000, lastTested: '2025-03-12', contaminants: ['Fluoride', 'Sewage Contamination'] },
    { name: 'Godavari River (Nashik)', lat: 19.990, lng: 73.780, district: 'Nashik', type: 'river', arsenic: 5, fluoride: 1.9, nitrate: 45, iron: 0.4, tds: 720, bacteria: 'low', severity: 'warning', affectedPopulation: 1500000, lastTested: '2025-03-22', contaminants: ['Fluoride', 'Sewage', 'Agricultural Runoff'] },
    { name: 'Groundwater — Latur', lat: 18.400, lng: 76.570, district: 'Latur', type: 'groundwater', arsenic: 4, fluoride: 3.8, nitrate: 38, iron: 0.3, tds: 1650, bacteria: 'low', severity: 'warning', affectedPopulation: 620000, lastTested: '2025-02-20', contaminants: ['Fluoride (2.5x WHO)', 'High TDS', 'Salinity'] },
    { name: 'Groundwater — Solapur', lat: 17.660, lng: 75.910, district: 'Solapur', type: 'groundwater', arsenic: 3, fluoride: 3.2, nitrate: 52, iron: 0.5, tds: 1800, bacteria: 'moderate', severity: 'warning', affectedPopulation: 540000, lastTested: '2025-02-15', contaminants: ['Fluoride', 'Nitrate', 'High TDS'] },
    { name: 'Wardha River (Wardha)', lat: 20.740, lng: 78.600, district: 'Wardha', type: 'river', arsenic: 7, fluoride: 1.7, nitrate: 40, iron: 0.7, tds: 680, bacteria: 'moderate', severity: 'warning', affectedPopulation: 420000, lastTested: '2025-03-05', contaminants: ['Arsenic', 'Fluoride', 'Coliform'] },
    { name: 'Groundwater — Yavatmal', lat: 20.390, lng: 78.130, district: 'Yavatmal', type: 'groundwater', arsenic: 11, fluoride: 2.4, nitrate: 35, iron: 0.8, tds: 920, bacteria: 'low', severity: 'warning', affectedPopulation: 380000, lastTested: '2025-03-01', contaminants: ['Arsenic', 'Fluoride', 'Pesticides'] },

    // CAUTION — Minor exceedances
    { name: 'Bhandardara Dam', lat: 19.550, lng: 73.750, district: 'Ahmednagar', type: 'dam', arsenic: 2, fluoride: 1.2, nitrate: 28, iron: 0.3, tds: 320, bacteria: 'absent', severity: 'caution', affectedPopulation: 450000, lastTested: '2025-03-25', contaminants: ['Minor Nitrate'] },
    { name: 'Jayakwadi Dam', lat: 19.500, lng: 75.600, district: 'Aurangabad', type: 'dam', arsenic: 3, fluoride: 1.4, nitrate: 35, iron: 0.2, tds: 410, bacteria: 'low', severity: 'caution', affectedPopulation: 1200000, lastTested: '2025-03-28', contaminants: ['Slight Fluoride', 'Sediment'] },
    { name: 'Koyna Reservoir', lat: 17.400, lng: 73.750, district: 'Satara', type: 'reservoir', arsenic: 1, fluoride: 0.8, nitrate: 18, iron: 0.1, tds: 180, bacteria: 'absent', severity: 'caution', affectedPopulation: 320000, lastTested: '2025-04-02', contaminants: ['Minor Turbidity'] },
    { name: 'Venna Lake (Mahabaleshwar)', lat: 17.930, lng: 73.660, district: 'Satara', type: 'lake', arsenic: 1, fluoride: 0.6, nitrate: 22, iron: 0.15, tds: 150, bacteria: 'low', severity: 'caution', affectedPopulation: 180000, lastTested: '2025-03-30', contaminants: ['Tourism Waste'] },
    { name: 'Shivsagar Lake (Koyna)', lat: 17.370, lng: 73.730, district: 'Satara', type: 'lake', arsenic: 1, fluoride: 0.7, nitrate: 15, iron: 0.12, tds: 160, bacteria: 'absent', severity: 'caution', affectedPopulation: 250000, lastTested: '2025-03-28', contaminants: ['Minor Silt'] },
    { name: 'Upper Vaitarna Dam', lat: 19.850, lng: 73.520, district: 'Thane', type: 'dam', arsenic: 2, fluoride: 1.1, nitrate: 25, iron: 0.18, tds: 280, bacteria: 'absent', severity: 'caution', affectedPopulation: 5000000, lastTested: '2025-04-03', contaminants: ['Minor Algal'] },

    // SAFE — Within limits
    { name: 'Tulsi Lake (Mumbai)', lat: 19.170, lng: 72.910, district: 'Mumbai', type: 'lake', arsenic: 0.5, fluoride: 0.4, nitrate: 8, iron: 0.05, tds: 95, bacteria: 'absent', severity: 'safe', affectedPopulation: 2500000, lastTested: '2025-04-05', contaminants: [] },
    { name: 'Vihar Lake (Mumbai)', lat: 19.150, lng: 72.920, district: 'Mumbai', type: 'lake', arsenic: 0.3, fluoride: 0.3, nitrate: 6, iron: 0.04, tds: 85, bacteria: 'absent', severity: 'safe', affectedPopulation: 3000000, lastTested: '2025-04-04', contaminants: [] },
    { name: 'Tansa Lake (Thane)', lat: 19.520, lng: 73.250, district: 'Thane', type: 'lake', arsenic: 0.4, fluoride: 0.5, nitrate: 10, iron: 0.06, tds: 110, bacteria: 'absent', severity: 'safe', affectedPopulation: 4200000, lastTested: '2025-04-01', contaminants: [] },
    { name: 'Modak Sagar (Thane)', lat: 19.450, lng: 73.280, district: 'Thane', type: 'dam', arsenic: 0.6, fluoride: 0.4, nitrate: 9, iron: 0.07, tds: 105, bacteria: 'absent', severity: 'safe', affectedPopulation: 2800000, lastTested: '2025-04-02', contaminants: [] },
    { name: 'Bhatsa River (Thane)', lat: 19.600, lng: 73.350, district: 'Thane', type: 'river', arsenic: 1.2, fluoride: 0.6, nitrate: 12, iron: 0.08, tds: 130, bacteria: 'absent', severity: 'safe', affectedPopulation: 3500000, lastTested: '2025-03-30', contaminants: [] },
  ];

  private getSeverityColor(severity: string): Color {
    switch (severity) {
      case 'emergency': return Color.fromCssColorString('#991b1b');
      case 'critical': return Color.fromCssColorString('#dc2626');
      case 'warning': return Color.fromCssColorString('#f59e0b');
      case 'caution': return Color.fromCssColorString('#eab308');
      case 'safe': return Color.fromCssColorString('#22c55e');
      default: return Color.GRAY;
    }
  }

  private getSeveritySize(severity: string): number {
    switch (severity) {
      case 'emergency': return 28;
      case 'critical': return 24;
      case 'warning': return 18;
      case 'caution': return 14;
      case 'safe': return 10;
      default: return 12;
    }
  }

  private getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'emergency': return '🚨 EMERGENCY';
      case 'critical': return '🔴 CRITICAL';
      case 'warning': return '🟠 WARNING';
      case 'caution': return '🟡 CAUTION';
      case 'safe': return '🟢 SAFE';
      default: return 'UNKNOWN';
    }
  }

  private formatPopulation(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  }

  protected async loadData(): Promise<void> {
    this.clear();
    for (const s of this.sources) {
      const color = this.getSeverityColor(s.severity);
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(s.lng, s.lat, 0),
        point: {
          pixelSize: this.getSeveritySize(s.severity),
          color: color.withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>☣️ ${s.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>District</td><td>${s.district}</td></tr>
            <tr><td>Source Type</td><td style="text-transform:capitalize">${s.type}</td></tr>
            <tr><td>Severity</td><td style="color:${color.toCssColorString()};font-weight:bold;font-size:1.1em">${this.getSeverityLabel(s.severity)}</td></tr>
            <tr><td>Affected Population</td><td><strong>${this.formatPopulation(s.affectedPopulation)}</strong></td></tr>
            <tr><td>Last Tested</td><td>${s.lastTested}</td></tr>
            <tr><td colspan="2" style="font-weight:bold;background:#fef2f2">🔬 Contaminant Levels</td></tr>
            <tr><td>Arsenic</td><td style="${s.arsenic > 10 ? 'color:#dc2626;font-weight:bold' : ''}">${s.arsenic} µg/L ${s.arsenic > 10 ? `(${(s.arsenic / 10).toFixed(1)}× WHO limit)` : '✓'}</td></tr>
            <tr><td>Fluoride</td><td style="${s.fluoride > 1.5 ? 'color:#dc2626;font-weight:bold' : ''}">${s.fluoride} mg/L ${s.fluoride > 1.5 ? `(${(s.fluoride / 1.5).toFixed(1)}× WHO limit)` : '✓'}</td></tr>
            <tr><td>Nitrate</td><td style="${s.nitrate > 50 ? 'color:#dc2626;font-weight:bold' : ''}">${s.nitrate} mg/L ${s.nitrate > 50 ? `(${(s.nitrate / 50).toFixed(1)}× WHO limit)` : '✓'}</td></tr>
            <tr><td>Iron</td><td style="${s.iron > 0.3 ? 'color:#f59e0b;font-weight:bold' : ''}">${s.iron} mg/L ${s.iron > 0.3 ? `(${(s.iron / 0.3).toFixed(1)}× BIS limit)` : '✓'}</td></tr>
            <tr><td>TDS</td><td style="${s.tds > 500 ? 'color:#f59e0b;font-weight:bold' : ''}">${s.tds} mg/L ${s.tds > 500 ? `(${(s.tds / 500).toFixed(1)}× BIS limit)` : '✓'}</td></tr>
            <tr><td>Bacteria</td><td style="${s.bacteria !== 'absent' ? 'color:#dc2626;font-weight:bold' : ''}">${s.bacteria === 'absent' ? 'Not detected ✓' : '⚠️ ' + s.bacteria.toUpperCase()}</td></tr>
            ${s.contaminants.length > 0 ? `<tr><td colspan="2" style="font-weight:bold;background:#fef2f2">⚠️ Detected Contaminants</td></tr><tr><td colspan="2">${s.contaminants.join(', ')}</td></tr>` : '<tr><td colspan="2" style="color:#22c55e">✓ All parameters within limits</td></tr>'}
          </table>
        `,
      });
    }
  }
}
