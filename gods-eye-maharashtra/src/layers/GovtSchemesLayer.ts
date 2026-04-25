/**
 * GovtSchemesLayer — Government scheme coverage and implementation status
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class GovtSchemesLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'govt-schemes',
    name: 'Government Schemes',
    icon: '📋',
    description: 'PM-KISAN, MGNREGA, Jal Jeevan, Ayushman Bharat, Ujjwala coverage status',
    category: 'india',
    color: '#9c27b0',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'govt-schemes',
  };

  private schemes = [
    { name: 'PM-KISAN', desc: '₹6000/year to farmer families', beneficiaries: '1.1 Cr (MH)', coverage: '78%', issues: 'Land record discrepancies in Marathwada' },
    { name: 'MGNREGA', desc: 'Guaranteed 100 days employment', beneficiaries: '85 Lakh (MH)', coverage: '62%', issues: 'Delayed payments in 12 districts' },
    { name: 'Jal Jeevan Mission', desc: 'Tap water to every household', beneficiaries: 'Target: 2.1 Cr HH', coverage: '58%', issues: 'Marathwada & Vidarbha lagging' },
    { name: 'Ayushman Bharat', desc: '₹5 Lakh health insurance', beneficiaries: '1.3 Cr (MH)', coverage: '71%', issues: 'Low awareness in rural areas' },
    { name: 'Ujjwala Yojana', desc: 'Free LPG connections', beneficiaries: '72 Lakh (MH)', coverage: '85%', issues: 'Refill affordability concerns' },
    { name: 'Swachh Bharat', desc: 'Toilet construction & ODF', beneficiaries: 'Universal', coverage: '96%', issues: 'Usage verification needed' },
    { name: 'PM Awas Yojana', desc: 'Housing for all', beneficiaries: '18 Lakh (MH)', coverage: '68%', issues: 'Land availability in urban areas' },
    { name: 'Mukhyamantri Majhi Ladki Bahin', desc: '₹1500/month to women (MH state)', beneficiaries: '2.4 Cr (MH)', coverage: '82%', issues: 'Budget allocation concerns' },
  ];

  // District-level scheme implementation
  private districts = [
    { name: 'Mumbai', implementation: 92, lat: 19.076, lng: 72.877 },
    { name: 'Pune', implementation: 85, lat: 18.520, lng: 73.856 },
    { name: 'Nagpur', implementation: 78, lat: 21.146, lng: 79.088 },
    { name: 'Beed', implementation: 42, lat: 18.989, lng: 75.758 },
    { name: 'Osmanabad', implementation: 38, lat: 18.186, lng: 76.042 },
    { name: 'Latur', implementation: 45, lat: 18.408, lng: 76.576 },
    { name: 'Gadchiroli', implementation: 35, lat: 20.183, lng: 80.005 },
    { name: 'Nandurbar', implementation: 40, lat: 21.370, lng: 74.240 },
    { name: 'Palghar', implementation: 55, lat: 19.697, lng: 72.765 },
    { name: 'Chandrapur', implementation: 48, lat: 19.962, lng: 79.296 },
    { name: 'Kolhapur', implementation: 82, lat: 16.705, lng: 74.243 },
    { name: 'Satara', implementation: 76, lat: 17.680, lng: 74.018 },
  ];

  protected async loadData(): Promise<void> {
    this.clear();

    for (const d of this.districts) {
      const color = d.implementation >= 80 ? '#00ff88' :
                    d.implementation >= 60 ? '#ffcc00' :
                    d.implementation >= 40 ? '#ff9800' : '#ff3355';

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(d.lng, d.lat, 0),
        point: {
          pixelSize: Math.max(10, d.implementation / 5),
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>📋 ${d.name} — Scheme Implementation</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Overall Implementation</td><td style="color:${color};font-weight:bold">${d.implementation}%</td></tr>
            <tr><td>Status</td><td>${d.implementation >= 80 ? '✅ On Track' : d.implementation >= 60 ? '⚠️ Needs Attention' : '🚨 Critical'}</td></tr>
          </table>
        `,
      });
    }
  }
}
