/**
 * GovtSchemesIndiaLayer — National government schemes with district-level coverage data
 * Covers MGNREGA, PM-KISAN, Ayushman Bharat, Jal Jeevan Mission, etc.
 */
import { Viewer, Cartesian3, Color, HeightReference, NearFarScalar } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

interface SchemeData {
  name: string;
  fullName: string;
  ministry: string;
  launched: string;
  description: string;
  budget: string;
  nationalCoverage: string;
  beneficiaries: string;
  keyIssues: string[];
}

interface DistrictSchemeData {
  district: string;
  state: string;
  lat: number;
  lng: number;
  mgnrega: number;      // % implementation
  pmKisan: number;
  ayushman: number;
  jalJeevan: number;
  ujjwala: number;
  overall: number;
}

export class GovtSchemesIndiaLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'govt-schemes-india',
    name: 'National Govt Schemes',
    icon: '📋',
    description: 'MGNREGA, PM-KISAN, Ayushman Bharat, Jal Jeevan, Ujjwala — district-level implementation',
    category: 'india',
    color: '#9c27b0',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'govt-schemes-india',
  };

  private schemes: SchemeData[] = [
    {
      name: 'MGNREGA',
      fullName: 'Mahatma Gandhi National Rural Employment Guarantee Act',
      ministry: 'Ministry of Rural Development',
      launched: '2005',
      description: 'Guarantees 100 days of wage employment per year to rural households willing to do unskilled manual work.',
      budget: '₹73,000 Cr (FY 2025-26)',
      nationalCoverage: '26.8 Cr person-days generated',
      beneficiaries: '15 Cr households',
      keyIssues: ['Delayed wage payments in 8 states', 'Material component misappropriation', 'Ghosts workers in Bihar, UP', 'Only 3% of households complete 100 days'],
    },
    {
      name: 'PM-KISAN',
      fullName: 'Pradhan Mantri Kisan Samman Nidhi',
      ministry: 'Ministry of Agriculture',
      launched: '2019',
      description: 'Direct income support of ₹6,000/year to farmer families with cultivable land.',
      budget: '₹60,000 Cr (FY 2025-26)',
      nationalCoverage: '9.5 Cr beneficiaries',
      beneficiaries: 'All land-holding farmer families',
      keyIssues: ['Exclusion of tenant farmers & sharecroppers', 'Land record discrepancies', 'Benami registrations', 'Aadhaar-bank linking failures'],
    },
    {
      name: 'Ayushman Bharat - PMJAY',
      fullName: 'Pradhan Mantri Jan Arogya Yojana',
      ministry: 'Ministry of Health & Family Welfare',
      launched: '2018',
      description: 'Health insurance coverage of ₹5 lakh per family per year for secondary and tertiary care.',
      budget: '₹7,500 Cr (FY 2025-26)',
      nationalCoverage: '30 Cr beneficiaries (12 Cr families)',
      beneficiaries: 'SECC 2011 identified families',
      keyIssues: ['Low awareness in rural areas', 'Private hospital fraud', 'Many claims rejected', 'States with own schemes not integrating'],
    },
    {
      name: 'Jal Jeevan Mission',
      fullName: 'Jal Jeevan Mission - Har Ghar Jal',
      ministry: 'Ministry of Jal Shakti',
      launched: '2019',
      description: 'Provide functional household tap water connections to every rural household by 2024.',
      budget: '₹67,000 Cr (FY 2025-26)',
      nationalCoverage: '78% households connected',
      beneficiaries: '19 Cr rural households',
      keyIssues: ['Water quality not tested post-connection', 'Source sustainability concerns', 'Northeast & tribal areas lagging', 'Operational & maintenance challenges'],
    },
    {
      name: 'Ujjwala Yojana 2.0',
      fullName: 'Pradhan Mantri Ujjwala Yojana',
      ministry: 'Ministry of Petroleum & Natural Gas',
      launched: '2016 (2.0: 2021)',
      description: 'Free LPG connections to BPL households to shift from biomass cooking.',
      budget: '₹12,000 Cr (FY 2025-26)',
      nationalCoverage: '10.3 Cr connections',
      beneficiaries: 'BPL and SC/ST households',
      keyIssues: ['Refill affordability crisis', 'Many connections dormant', 'Revert to biomass cooking', 'Black market for cylinders'],
    },
    {
      name: 'Swachh Bharat Mission 2.0',
      fullName: 'Swachh Bharat Mission - Urban & Gramin',
      ministry: 'Ministry of Housing & Urban Affairs',
      launched: '2014 (2.0: 2021)',
      description: 'ODF sustainability, solid waste management, and grey/black water management.',
      budget: '₹1.41 Lakh Cr (Phase 2)',
      nationalCoverage: 'ODF+ declared in 4,437 towns',
      beneficiaries: 'Universal',
      keyIssues: ['Open defecation relapse in many areas', 'Waste processing capacity insufficient', 'ODF verification questionable', 'Manual scavenging persists'],
    },
    {
      name: 'PM Awas Yojana',
      fullName: 'Pradhan Mantri Awas Yojana - Urban & Gramin',
      ministry: 'Ministry of Rural/Urban Development',
      launched: '2015',
      description: 'Housing for all — pucca house with basic amenities for urban and rural poor.',
      budget: '₹54,419 Cr (FY 2025-26)',
      nationalCoverage: '3.2 Cr houses completed',
      beneficiaries: 'EWS/LIG families',
      keyIssues: ['Land availability in urban areas', 'Construction quality concerns', 'Delayed disbursements', 'Beneficiary selection disputes'],
    },
  ];

  // District-level implementation data across India
  private districts: DistrictSchemeData[] = [
    // Maharashtra
    { district: 'Mumbai', state: 'MH', lat: 19.076, lng: 72.877, mgnrega: 35, pmKisan: 45, ayushman: 78, jalJeevan: 92, ujjwala: 88, overall: 82 },
    { district: 'Pune', state: 'MH', lat: 18.520, lng: 73.856, mgnrega: 62, pmKisan: 82, ayushman: 75, jalJeevan: 85, ujjwala: 90, overall: 80 },
    { district: 'Nagpur', state: 'MH', lat: 21.146, lng: 79.088, mgnrega: 55, pmKisan: 78, ayushman: 68, jalJeevan: 72, ujjwala: 85, overall: 72 },
    { district: 'Beed', state: 'MH', lat: 18.989, lng: 75.758, mgnrega: 28, pmKisan: 52, ayushman: 45, jalJeevan: 48, ujjwala: 72, overall: 48 },
    { district: 'Gadchiroli', state: 'MH', lat: 20.183, lng: 80.005, mgnrega: 32, pmKisan: 48, ayushman: 38, jalJeevan: 42, ujjwala: 65, overall: 42 },
    // UP
    { district: 'Varanasi', state: 'UP', lat: 25.317, lng: 82.974, mgnrega: 45, pmKisan: 68, ayushman: 55, jalJeevan: 62, ujjwala: 82, overall: 62 },
    { district: 'Lucknow', state: 'UP', lat: 26.847, lng: 80.946, mgnrega: 40, pmKisan: 72, ayushman: 62, jalJeevan: 70, ujjwala: 85, overall: 66 },
    { district: 'Gorakhpur', state: 'UP', lat: 26.760, lng: 83.373, mgnrega: 35, pmKisan: 58, ayushman: 48, jalJeevan: 55, ujjwala: 78, overall: 54 },
    { district: 'Bahraich', state: 'UP', lat: 27.574, lng: 81.594, mgnrega: 25, pmKisan: 42, ayushman: 35, jalJeevan: 38, ujjwala: 68, overall: 40 },
    { district: 'Agra', state: 'UP', lat: 27.176, lng: 78.008, mgnrega: 38, pmKisan: 65, ayushman: 58, jalJeevan: 68, ujjwala: 82, overall: 62 },
    // Bihar
    { district: 'Patna', state: 'BR', lat: 25.594, lng: 85.138, mgnrega: 30, pmKisan: 55, ayushman: 48, jalJeevan: 52, ujjwala: 75, overall: 52 },
    { district: 'Muzaffarpur', state: 'BR', lat: 26.120, lng: 85.365, mgnrega: 22, pmKisan: 45, ayushman: 38, jalJeevan: 42, ujjwala: 70, overall: 42 },
    { district: 'Darbhanga', state: 'BR', lat: 26.154, lng: 86.103, mgnrega: 20, pmKisan: 42, ayushman: 32, jalJeevan: 38, ujjwala: 65, overall: 38 },
    { district: 'Araria', state: 'BR', lat: 26.150, lng: 87.500, mgnrega: 18, pmKisan: 38, ayushman: 28, jalJeevan: 32, ujjwala: 58, overall: 32 },
    // Rajasthan
    { district: 'Jaipur', state: 'RJ', lat: 26.912, lng: 75.787, mgnrega: 42, pmKisan: 72, ayushman: 62, jalJeevan: 55, ujjwala: 82, overall: 62 },
    { district: 'Barmer', state: 'RJ', lat: 25.752, lng: 71.396, mgnrega: 28, pmKisan: 52, ayushman: 35, jalJeevan: 28, ujjwala: 68, overall: 38 },
    { district: 'Jaisalmer', state: 'RJ', lat: 26.916, lng: 70.910, mgnrega: 25, pmKisan: 48, ayushman: 30, jalJeevan: 22, ujjwala: 62, overall: 34 },
    { district: 'Kota', state: 'RJ', lat: 25.214, lng: 75.865, mgnrega: 48, pmKisan: 75, ayushman: 68, jalJeevan: 65, ujjwala: 85, overall: 68 },
    // MP
    { district: 'Bhopal', state: 'MP', lat: 23.260, lng: 77.410, mgnrega: 45, pmKisan: 68, ayushman: 58, jalJeevan: 62, ujjwala: 80, overall: 62 },
    { district: 'Jhabua', state: 'MP', lat: 22.768, lng: 74.590, mgnrega: 18, pmKisan: 35, ayushman: 28, jalJeevan: 25, ujjwala: 55, overall: 30 },
    { district: 'Mandla', state: 'MP', lat: 22.600, lng: 80.380, mgnrega: 22, pmKisan: 42, ayushman: 32, jalJeevan: 30, ujjwala: 58, overall: 35 },
    // Karnataka
    { district: 'Bengaluru Urban', state: 'KA', lat: 12.972, lng: 77.594, mgnrega: 28, pmKisan: 42, ayushman: 72, jalJeevan: 88, ujjwala: 92, overall: 78 },
    { district: 'Kalaburagi', state: 'KA', lat: 17.330, lng: 76.830, mgnrega: 38, pmKisan: 62, ayushman: 55, jalJeevan: 58, ujjwala: 78, overall: 58 },
    { district: 'Mysuru', state: 'KA', lat: 12.296, lng: 76.639, mgnrega: 52, pmKisan: 72, ayushman: 68, jalJeevan: 78, ujjwala: 88, overall: 72 },
    // Tamil Nadu
    { district: 'Chennai', state: 'TN', lat: 13.083, lng: 80.270, mgnrega: 22, pmKisan: 35, ayushman: 72, jalJeevan: 95, ujjwala: 90, overall: 80 },
    { district: 'Madurai', state: 'TN', lat: 9.925, lng: 78.120, mgnrega: 35, pmKisan: 58, ayushman: 68, jalJeevan: 88, ujjwala: 88, overall: 72 },
    { district: 'Thoothukudi', state: 'TN', lat: 8.764, lng: 78.135, mgnrega: 30, pmKisan: 52, ayushman: 62, jalJeevan: 82, ujjwala: 85, overall: 68 },
    // Gujarat
    { district: 'Ahmedabad', state: 'GJ', lat: 23.023, lng: 72.571, mgnrega: 32, pmKisan: 62, ayushman: 68, jalJeevan: 78, ujjwala: 88, overall: 70 },
    { district: 'Dahod', state: 'GJ', lat: 22.833, lng: 74.253, mgnrega: 22, pmKisan: 45, ayushman: 42, jalJeevan: 48, ujjwala: 68, overall: 45 },
    { district: 'Kutch', state: 'GJ', lat: 23.083, lng: 69.670, mgnrega: 35, pmKisan: 58, ayushman: 48, jalJeevan: 42, ujjwala: 72, overall: 50 },
    // West Bengal
    { district: 'Kolkata', state: 'WB', lat: 22.573, lng: 88.364, mgnrega: 18, pmKisan: 28, ayushman: 55, jalJeevan: 82, ujjwala: 85, overall: 65 },
    { district: 'Jalpaiguri', state: 'WB', lat: 26.524, lng: 88.720, mgnrega: 28, pmKisan: 52, ayushman: 48, jalJeevan: 62, ujjwala: 75, overall: 52 },
    { district: 'Purulia', state: 'WB', lat: 23.333, lng: 86.367, mgnrega: 15, pmKisan: 38, ayushman: 32, jalJeevan: 35, ujjwala: 62, overall: 35 },
    // Odisha
    { district: 'Bhubaneswar', state: 'OD', lat: 20.296, lng: 85.825, mgnrega: 42, pmKisan: 65, ayushman: 58, jalJeevan: 72, ujjwala: 82, overall: 64 },
    { district: 'Kalahandi', state: 'OD', lat: 19.913, lng: 83.167, mgnrega: 18, pmKisan: 38, ayushman: 32, jalJeevan: 35, ujjwala: 58, overall: 34 },
    { district: 'Koraput', state: 'OD', lat: 18.813, lng: 82.712, mgnrega: 15, pmKisan: 35, ayushman: 28, jalJeevan: 30, ujjwala: 52, overall: 30 },
    // Jharkhand
    { district: 'Ranchi', state: 'JH', lat: 23.344, lng: 85.309, mgnrega: 32, pmKisan: 52, ayushman: 48, jalJeevan: 55, ujjwala: 72, overall: 52 },
    { district: 'Palamu', state: 'JH', lat: 23.813, lng: 84.067, mgnrega: 18, pmKisan: 35, ayushman: 28, jalJeevan: 32, ujjwala: 55, overall: 32 },
    // Northeast
    { district: 'Imphal East', state: 'MN', lat: 24.793, lng: 93.946, mgnrega: 22, pmKisan: 32, ayushman: 38, jalJeevan: 45, ujjwala: 58, overall: 38 },
    { district: 'Aizawl', state: 'MZ', lat: 23.727, lng: 92.718, mgnrega: 28, pmKisan: 35, ayushman: 45, jalJeevan: 62, ujjwala: 72, overall: 48 },
    { district: 'Dibrugarh', state: 'AS', lat: 27.472, lng: 94.912, mgnrega: 35, pmKisan: 52, ayushman: 48, jalJeevan: 58, ujjwala: 75, overall: 54 },
    // Kerala
    { district: 'Thiruvananthapuram', state: 'KL', lat: 8.524, lng: 76.937, mgnrega: 52, pmKisan: 68, ayushman: 82, jalJeevan: 95, ujjwala: 92, overall: 85 },
    { district: 'Wayanad', state: 'KL', lat: 11.685, lng: 76.132, mgnrega: 48, pmKisan: 72, ayushman: 78, jalJeevan: 92, ujjwala: 90, overall: 82 },
    // Delhi
    { district: 'New Delhi', state: 'DL', lat: 28.614, lng: 77.210, mgnrega: 5, pmKisan: 8, ayushman: 72, jalJeevan: 95, ujjwala: 88, overall: 72 },
    { district: 'North East Delhi', state: 'DL', lat: 28.690, lng: 77.280, mgnrega: 8, pmKisan: 5, ayushman: 65, jalJeevan: 90, ujjwala: 82, overall: 65 },
  ];

  private getSchemeColor(implementation: number): string {
    if (implementation >= 75) return '#00ff88';
    if (implementation >= 55) return '#ffcc00';
    if (implementation >= 35) return '#ff9800';
    return '#ff3355';
  }

  private getOverallColor(overall: number): string {
    if (overall >= 75) return '#00ff88';
    if (overall >= 55) return '#ffcc00';
    if (overall >= 40) return '#ff9800';
    return '#ff3355';
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const d of this.districts) {
      const color = this.getOverallColor(d.overall);

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(d.lng, d.lat, 0),
        point: {
          pixelSize: Math.max(8, d.overall / 6),
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new NearFarScalar(1.0, 1.0, 1.2e7, 0.1),
        },
        description: `
          <h3>📋 ${d.district}, ${d.state}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Overall Implementation</td><td style="color:${color};font-weight:bold">${d.overall}%</td></tr>
            <tr><td colspan="2" style="padding-top:8px"><strong>Scheme-wise Breakdown:</strong></td></tr>
            <tr><td>🟢 MGNREGA (Employment)</td><td style="color:${this.getSchemeColor(d.mgnrega)}">${d.mgnrega}%</td></tr>
            <tr><td>🌾 PM-KISAN (Farmer Income)</td><td style="color:${this.getSchemeColor(d.pmKisan)}">${d.pmKisan}%</td></tr>
            <tr><td>🏥 Ayushman Bharat (Health)</td><td style="color:${this.getSchemeColor(d.ayushman)}">${d.ayushman}%</td></tr>
            <tr><td>💧 Jal Jeevan (Water)</td><td style="color:${this.getSchemeColor(d.jalJeevan)}">${d.jalJeevan}%</td></tr>
            <tr><td>🔥 Ujjwala (LPG)</td><td style="color:${this.getSchemeColor(d.ujjwala)}">${d.ujjwala}%</td></tr>
            <tr><td colspan="2" style="padding-top:4px">
              ${d.overall >= 70 ? '✅ On Track' : d.overall >= 50 ? '⚠️ Needs Attention' : '🚨 Critical Gap'}
            </td></tr>
          </table>
        `,
      });
    }
  }

  // Expose scheme metadata for dashboard display
  getSchemes(): SchemeData[] {
    return this.schemes;
  }
}
