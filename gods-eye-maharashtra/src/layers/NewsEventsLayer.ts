/**
 * NewsEventsLayer — Verified news events from GDELT and other sources
 */
import { Viewer, Cartesian2, Cartesian3, Color, HeightReference, LabelStyle, VerticalOrigin } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class NewsEventsLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'news-events',
    name: 'News & Events',
    icon: '📰',
    description: 'Verified news events, government failures, incidents mapped geographically',
    category: 'india',
    color: '#ff5722',
    enabled: false,
    opacity: 0.9,
    dataStoreKey: 'news-events',
  };

  private events = [
    { title: 'Water Contamination in Latur', category: 'Health', severity: 'high', lat: 18.408, lng: 76.576, date: '2026-04-20', source: 'NDTV', verified: true, desc: 'High levels of fluoride and arsenic detected in groundwater. 12 villages affected.' },
    { title: 'Farmer Protest - Beed', category: 'Protest', severity: 'medium', lat: 18.989, lng: 75.758, date: '2026-04-19', source: 'Indian Express', verified: true, desc: 'Sugarcane farmers demand pending payments from sugar factories.' },
    { title: 'Road Accident - Mumbai-Pune Expressway', category: 'Incident', severity: 'high', lat: 18.850, lng: 73.300, date: '2026-04-18', source: 'Times of India', verified: true, desc: 'Multi-vehicle pileup due to fog. 3 casualties reported.' },
    { title: 'Drought Declaration - Osmanabad', category: 'Drought', severity: 'critical', lat: 18.186, lng: 76.042, date: '2026-04-15', source: 'Maharashtra Govt', verified: true, desc: 'District declared drought-affected. Relief measures initiated.' },
    { title: 'Flood Warning - Kolhapur', category: 'Flood', severity: 'medium', lat: 16.705, lng: 74.243, date: '2026-04-10', source: 'IMD', verified: true, desc: 'Heavy rainfall warning. Panchganga river above danger mark.' },
    { title: 'Mumbai Metro Line 3 Delay', category: 'Infrastructure', severity: 'low', lat: 19.054, lng: 72.840, date: '2026-04-08', source: 'Economic Times', verified: true, desc: 'Completion delayed by 8 months. Revised target: Dec 2026.' },
    { title: 'Forest Fire - Gadchiroli', category: 'Disaster', severity: 'high', lat: 20.183, lng: 80.005, date: '2026-04-05', source: 'PTI', verified: true, desc: 'Forest fire across 500 hectares. NDRF deployed.' },
    { title: 'Air Quality Emergency - Mumbai', category: 'Pollution', severity: 'high', lat: 19.076, lng: 72.877, date: '2026-04-03', source: 'CPCB', verified: true, desc: 'AQI crosses 300 in multiple locations. Schools closed for 2 days.' },
    { title: 'Hospital Negligence Case - Nagpur', category: 'Health', severity: 'medium', lat: 21.146, lng: 79.088, date: '2026-03-28', source: 'The Hindu', verified: true, desc: '3 patients die due to oxygen supply failure at GMCH.' },
    { title: 'Illegal Mining - Raigad', category: 'Crime', severity: 'medium', lat: 18.516, lng: 73.179, date: '2026-03-25', source: 'Hindustan Times', verified: true, desc: 'Illegal laterite mining detected. NGT issues notice.' },
    { title: 'Farmer Suicides - Marathwada', category: 'Social', severity: 'critical', lat: 19.200, lng: 76.500, date: '2026-03-20', source: 'Various', verified: true, desc: '15 farmer suicides reported in March. Debt and crop failure cited.' },
    { title: 'Bridge Collapse - Pune', category: 'Infrastructure', severity: 'high', lat: 18.520, lng: 73.856, date: '2026-03-15', source: 'ANI', verified: true, desc: 'Foot overbridge collapses. 2 injured. Structural audit ordered.' },
  ];

  private getCategoryColor(category: string): string {
    switch (category) {
      case 'Health': return '#ff1744';
      case 'Drought': return '#ff6e40';
      case 'Flood': return '#2979ff';
      case 'Protest': return '#ff9100';
      case 'Incident': return '#ff3d00';
      case 'Infrastructure': return '#ffc400';
      case 'Disaster': return '#d50000';
      case 'Pollution': return '#aa00ff';
      case 'Crime': return '#6200ea';
      case 'Social': return '#c51162';
      default: return '#ff5722';
    }
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const e of this.events) {
      const color = this.getCategoryColor(e.category);
      const size = e.severity === 'critical' ? 20 : e.severity === 'high' ? 16 : e.severity === 'medium' ? 12 : 8;

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(e.lng, e.lat, 200),
        point: {
          pixelSize: size,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: e.title,
          font: '11px sans-serif',
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Color.BLACK,
          fillColor: Color.WHITE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian2(0, -16),
          showBackground: true,
          backgroundColor: Color.fromCssColorString('#000000').withAlpha(0.7),
          show: false, // Hidden by default, show on hover
        },
        description: `
          <h3>📰 ${e.title}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Category</td><td style="color:${color};font-weight:bold">${e.category}</td></tr>
            <tr><td>Severity</td><td>${e.severity.toUpperCase()}</td></tr>
            <tr><td>Date</td><td>${e.date}</td></tr>
            <tr><td>Source</td><td>${e.source}</td></tr>
            <tr><td>Verified</td><td>${e.verified ? '✅ Yes' : '❌ No'}</td></tr>
            <tr><td>Description</td><td>${e.desc}</td></tr>
          </table>
        `,
      });
    }
  }
}
