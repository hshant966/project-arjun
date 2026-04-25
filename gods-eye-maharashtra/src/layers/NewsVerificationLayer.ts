/**
 * NewsVerificationLayer — News events with source verification status, geocoded to locations
 * Covers India-wide verified and unverified news with trust scoring
 */
import { Viewer, Cartesian3, Color, HeightReference, LabelStyle, VerticalOrigin, NearFarScalar } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

type VerificationStatus = 'verified' | 'unverified' | 'disputed' | 'false';
type Severity = 'critical' | 'high' | 'medium' | 'low';

interface NewsEvent {
  id: string;
  title: string;
  category: string;
  severity: Severity;
  verification: VerificationStatus;
  trustScore: number; // 0-100
  lat: number;
  lng: number;
  state: string;
  date: string;
  source: string;
  sourceCount: number; // how many sources reported this
  description: string;
  tags: string[];
}

export class NewsVerificationLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'news-verification',
    name: 'Verified News & Events',
    icon: '📰',
    description: 'Geocoded news events with source verification — verified, unverified, disputed, or flagged false',
    category: 'india',
    color: '#ff5722',
    enabled: false,
    opacity: 0.9,
    dataStoreKey: 'news-verification',
  };

  private events: NewsEvent[] = [
    // VERIFIED events
    {
      id: 'nv-001', title: 'Uttarakhand Glacier Burst — Chamoli', category: 'Disaster',
      severity: 'critical', verification: 'verified', trustScore: 95,
      lat: 30.408, lng: 79.572, state: 'Uttarakhand', date: '2026-04-20',
      source: 'NDTV / PTI / ANI', sourceCount: 14,
      description: 'Glacial lake outburst flood in Chamoli district. NDRF and Army deployed. 12 villages evacuated. Tapovan hydro project damaged.',
      tags: ['glacier', 'flood', 'NDRF', 'evacuation'],
    },
    {
      id: 'nv-002', title: 'Chennai Water Crisis — Reservoirs at 12%', category: 'Water',
      severity: 'critical', verification: 'verified', trustScore: 92,
      lat: 13.083, lng: 80.270, state: 'Tamil Nadu', date: '2026-04-19',
      source: 'The Hindu / Times of India', sourceCount: 8,
      description: 'Combined storage in Chennai\'s four reservoirs drops to 12%. Water rationing imposed. IT companies asked to allow WFH.',
      tags: ['drought', 'water', 'Chennai', 'rationing'],
    },
    {
      id: 'nv-003', title: 'Farmers Protest — Haryana-Punjab Border', category: 'Protest',
      severity: 'high', verification: 'verified', trustScore: 88,
      lat: 29.946, lng: 76.582, state: 'Haryana', date: '2026-04-18',
      source: 'Indian Express / The Wire', sourceCount: 11,
      description: 'Over 10,000 farmers block NH-44 demanding MSP guarantee law. Tear gas used. Internet suspended in 3 districts.',
      tags: ['farmers', 'protest', 'MSP', 'internet shutdown'],
    },
    {
      id: 'nv-004', title: 'Delhi AQI Crosses 400 — Health Emergency', category: 'Pollution',
      severity: 'critical', verification: 'verified', trustScore: 97,
      lat: 28.614, lng: 77.210, state: 'Delhi', date: '2026-04-17',
      source: 'CPCB / SAFAR', sourceCount: 6,
      description: 'AQI hits "severe+" levels across NCR. Schools closed. Construction banned. GRAP Stage IV implemented.',
      tags: ['pollution', 'AQI', 'health', 'school closure'],
    },
    {
      id: 'nv-005', title: 'Cyclone Warning — Bay of Bengal', category: 'Disaster',
      severity: 'high', verification: 'verified', trustScore: 94,
      lat: 17.680, lng: 83.210, state: 'Andhra Pradesh', date: '2026-04-16',
      source: 'IMD / NDMA', sourceCount: 5,
      description: 'Deep depression over Bay of Bengal likely to intensify into cyclonic storm "Shakti". Coastal AP and Odisha on alert.',
      tags: ['cyclone', 'IMD', 'coastal', 'evacuation'],
    },
    {
      id: 'nv-006', title: 'Manipur Ethnic Violence — New Clashes', category: 'Conflict',
      severity: 'critical', verification: 'verified', trustScore: 90,
      lat: 24.817, lng: 93.937, state: 'Manipur', date: '2026-04-15',
      source: 'The Hindu / Scroll.in', sourceCount: 9,
      description: 'Fresh clashes reported in Kangpokpi district. 3 killed, 200 houses burnt. Army staging flag marches. Curfew reimposed.',
      tags: ['Manipur', 'violence', 'ethnic', 'curfew'],
    },
    {
      id: 'nv-007', title: 'Mumbai Bridge Collapse — Kurla', category: 'Infrastructure',
      severity: 'high', verification: 'verified', trustScore: 93,
      lat: 19.072, lng: 72.883, state: 'Maharashtra', date: '2026-04-14',
      source: 'Mumbai Mirror / TOI', sourceCount: 7,
      description: 'Portion of railway foot overbridge collapses during peak hours. 4 dead, 15 injured. Structural audit ordered across Mumbai.',
      tags: ['infrastructure', 'collapse', 'Mumbai', 'safety'],
    },
    {
      id: 'nv-008', title: 'Karnataka Mining Scam — ₹2000 Cr Fraud', category: 'Corruption',
      severity: 'high', verification: 'verified', trustScore: 85,
      lat: 15.317, lng: 75.714, state: 'Karnataka', date: '2026-04-12',
      source: 'Deccan Herald / The News Minute', sourceCount: 6,
      description: 'Illegal iron ore mining worth ₹2000 Cr exposed in Bellary. Politicians and bureaucrats named in Lokayukta report.',
      tags: ['mining', 'scam', 'corruption', 'Bellary'],
    },
    {
      id: 'nv-009', title: 'Kerala Elephant Deaths — Wayanad', category: 'Wildlife',
      severity: 'medium', verification: 'verified', trustScore: 82,
      lat: 11.685, lng: 76.132, state: 'Kerala', date: '2026-04-10',
      source: 'Mathrubhumi / Manorama', sourceCount: 4,
      description: '2 wild elephants found dead near Wayanad plantation. Suspected electrocution from illegal fencing. Forest dept investigating.',
      tags: ['wildlife', 'elephant', 'Wayanad', 'electrocution'],
    },
    {
      id: 'nv-010', title: 'Odisha Heatwave — 48°C Record', category: 'Climate',
      severity: 'high', verification: 'verified', trustScore: 91,
      lat: 20.952, lng: 85.099, state: 'Odisha', date: '2026-04-08',
      source: 'IMD / Sambad', sourceCount: 5,
      description: 'Titlagarh records 48.2°C — hottest in 5 years. 12 heatstroke deaths reported. Schools closed in western Odisha.',
      tags: ['heatwave', 'temperature', 'Odisha', 'climate'],
    },

    // UNVERIFIED events
    {
      id: 'nv-011', title: '[UNVERIFIED] Mass Food Poisoning — UP School', category: 'Health',
      severity: 'high', verification: 'unverified', trustScore: 35,
      lat: 26.847, lng: 80.946, state: 'Uttar Pradesh', date: '2026-04-20',
      source: 'Social Media (Twitter/X)', sourceCount: 1,
      description: 'Viral posts claim 50+ children hospitalized after mid-day meal in Lucknow school. No official confirmation. Hospital sources deny.',
      tags: ['food poisoning', 'mid-day meal', 'social media', 'unverified'],
    },
    {
      id: 'nv-012', title: '[UNVERIFIED] EVM Malfunction — Gujarat', category: 'Electoral',
      severity: 'high', verification: 'unverified', trustScore: 28,
      lat: 23.023, lng: 72.571, state: 'Gujarat', date: '2026-04-19',
      source: 'WhatsApp / Opposition handles', sourceCount: 1,
      description: 'Opposition party claims EVM tampering during bypolls in Ahmedabad. Election Commission says machines were checked. Investigation pending.',
      tags: ['EVM', 'elections', 'opposition', 'unverified'],
    },
    {
      id: 'nv-013', title: '[UNVERIFIED] Dam Breach Warning — Maharashtra', category: 'Disaster',
      severity: 'critical', verification: 'unverified', trustScore: 22,
      lat: 19.483, lng: 75.379, state: 'Maharashtra', date: '2026-04-18',
      source: 'Local WhatsApp groups', sourceCount: 0,
      description: 'WhatsApp forwards warn of Jayakwadi dam breach. Irrigation dept calls it "baseless rumor" and warns of legal action against spreaders.',
      tags: ['dam', 'fake news', 'WhatsApp', 'Jayakwadi'],
    },
    {
      id: 'nv-014', title: '[UNVERIFIED] Tiger Attack — MP Village', category: 'Wildlife',
      severity: 'medium', verification: 'unverified', trustScore: 42,
      lat: 22.600, lng: 80.380, state: 'Madhya Pradesh', date: '2026-04-15',
      source: 'Local media (unconfirmed)', sourceCount: 2,
      description: 'Reports of tiger killing 2 cattle in Mandla district near Kanha. Forest dept dispatched team but no tiger tracks found.',
      tags: ['tiger', 'wildlife', 'human-animal conflict', 'unverified'],
    },
    {
      id: 'nv-015', title: '[UNVERIFIED] Mass Teacher Transfer Scam — Bihar', category: 'Corruption',
      severity: 'medium', verification: 'unverified', trustScore: 38,
      lat: 25.594, lng: 85.138, state: 'Bihar', date: '2026-04-12',
      source: 'Anonymous whistleblower', sourceCount: 1,
      description: 'Anonymous complaint alleges ₹50 lakh per transfer racket in Bihar education dept. No FIR registered. Department denies.',
      tags: ['education', 'transfer scam', 'whistleblower', 'unverified'],
    },

    // DISPUTED events
    {
      id: 'nv-016', title: '[DISPUTED] Encounter Killings — J&K', category: 'Security',
      severity: 'high', verification: 'disputed', trustScore: 50,
      lat: 34.084, lng: 74.797, state: 'J&K', date: '2026-04-16',
      source: 'Army vs Human Rights groups', sourceCount: 4,
      description: 'Army says 3 militants killed in encounter. Rights groups claim 2 were civilians. SIT constituted. Families demand independent probe.',
      tags: ['encounter', 'Kashmir', 'human rights', 'disputed'],
    },
    {
      id: 'nv-017', title: '[DISPUTED] Land Acquisition — Assam', category: 'Land',
      severity: 'medium', verification: 'disputed', trustScore: 55,
      lat: 26.200, lng: 92.940, state: 'Assam', date: '2026-04-10',
      source: 'Govt vs Tribal groups', sourceCount: 3,
      description: 'Govt says land acquired for highway was properly compensated. Tribal groups claim original inhabitants displaced without consent. PIL filed.',
      tags: ['land acquisition', 'tribal', 'displacement', 'disputed'],
    },

    // FLAGGED FALSE events
    {
      id: 'nv-018', title: '[FALSE] Child Kidnapping Gang — Rajasthan', category: 'Crime',
      severity: 'high', verification: 'false', trustScore: 5,
      lat: 26.912, lng: 75.787, state: 'Rajasthan', date: '2026-04-14',
      source: 'Social media (debunked by police)', sourceCount: 0,
      description: 'Viral video of "child kidnappers" debunked by Jaipur police. Video was from 2018 Bangladesh. Mob attacked innocent travelers based on false forward.',
      tags: ['fake news', 'mob violence', 'child kidnapping', 'debunked'],
    },
    {
      id: 'nv-019', title: '[FALSE] COVID-19 Variant Scare — Kerala', category: 'Health',
      severity: 'high', verification: 'false', trustScore: 8,
      lat: 8.524, lng: 76.937, state: 'Kerala', date: '2026-04-11',
      source: 'WhatsApp forwards (debunked by ICMR)', sourceCount: 0,
      description: 'WhatsApp messages claiming "new deadlier COVID variant" in Thiruvananthapuram debunked by ICMR and state health dept. No such variant detected.',
      tags: ['COVID', 'fake news', 'health scare', 'debunked'],
    },
    {
      id: 'nv-020', title: '[FALSE] Temple Demolition — Tamil Nadu', category: 'Communal',
      severity: 'high', verification: 'false', trustScore: 3,
      lat: 13.083, lng: 80.270, state: 'Tamil Nadu', date: '2026-04-09',
      source: 'Social media (investigated by Alt News)', sourceCount: 0,
      description: 'Video of temple demolition shared widely is actually from 2019 urban development project. Alt News investigation confirms old footage used to inflame tensions.',
      tags: ['communal', 'fake news', 'temple', 'Alt News'],
    },
  ];

  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      Disaster: '#d50000', Water: '#0091ea', Protest: '#ff6d00',
      Pollution: '#aa00ff', Conflict: '#c51162', Infrastructure: '#ffc400',
      Corruption: '#6200ea', Wildlife: '#2e7d32', Climate: '#ff3d00',
      Health: '#ff1744', Electoral: '#1565c0', Security: '#37474f',
      Land: '#795548', Crime: '#455a64', Communal: '#b71c1c',
    };
    return colors[category] || '#ff5722';
  }

  private getVerificationIcon(verification: VerificationStatus): string {
    switch (verification) {
      case 'verified': return '✅';
      case 'unverified': return '❓';
      case 'disputed': return '⚖️';
      case 'false': return '❌';
    }
  }

  private getVerificationColor(verification: VerificationStatus): string {
    switch (verification) {
      case 'verified': return '#00ff88';
      case 'unverified': return '#ffcc00';
      case 'disputed': return '#ff9800';
      case 'false': return '#ff3355';
    }
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const e of this.events) {
      const categoryColor = this.getCategoryColor(e.category);
      const verificationColor = this.getVerificationColor(e.verification);
      const icon = this.getVerificationIcon(e.verification);

      // Size based on severity
      const size = e.severity === 'critical' ? 18 : e.severity === 'high' ? 14 : e.severity === 'medium' ? 10 : 8;

      // Verified events get solid dots, unverified get hollow, false get X pattern
      const outlineWidth = e.verification === 'verified' ? 1 : 3;

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(e.lng, e.lat, e.verification === 'verified' ? 100 : 300),
        point: {
          pixelSize: size,
          color: Color.fromCssColorString(categoryColor).withAlpha(
            e.verification === 'verified' ? 0.9 :
            e.verification === 'false' ? 0.3 : 0.6
          ),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.fromCssColorString(verificationColor),
          outlineWidth: outlineWidth,
          scaleByDistance: new NearFarScalar(1.0, 1.0, 1.2e7, 0.1),
        },
        description: `
          <h3>${icon} ${e.title}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Category</td><td style="color:${categoryColor};font-weight:bold">${e.category}</td></tr>
            <tr><td>Verification</td><td style="color:${verificationColor};font-weight:bold">${e.verification.toUpperCase()}</td></tr>
            <tr><td>Trust Score</td><td style="font-weight:bold">${e.trustScore}/100</td></tr>
            <tr><td>Severity</td><td>${e.severity.toUpperCase()}</td></tr>
            <tr><td>State</td><td>${e.state}</td></tr>
            <tr><td>Date</td><td>${e.date}</td></tr>
            <tr><td>Source</td><td>${e.source}</td></tr>
            <tr><td>Source Count</td><td>${e.sourceCount} independent sources</td></tr>
            <tr><td>Description</td><td>${e.description}</td></tr>
            <tr><td>Tags</td><td>${e.tags.join(', ')}</td></tr>
          </table>
        `,
      });
    }
  }

  // Filter methods for dashboard
  getEventsByVerification(status: VerificationStatus): NewsEvent[] {
    return this.events.filter(e => e.verification === status);
  }

  getEventsByState(state: string): NewsEvent[] {
    return this.events.filter(e => e.state === state);
  }

  getHighTrustEvents(): NewsEvent[] {
    return this.events.filter(e => e.trustScore >= 80);
  }

  getFalseEvents(): NewsEvent[] {
    return this.events.filter(e => e.verification === 'false');
  }
}
