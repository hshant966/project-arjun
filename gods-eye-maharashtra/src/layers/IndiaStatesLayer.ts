/**
 * IndiaStatesLayer — All Indian states and union territories with basic demographic/economic data
 */
import { Viewer, Cartesian3, Color, HeightReference, LabelStyle, VerticalOrigin, NearFarScalar } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

interface StateData {
  name: string;
  code: string;
  type: 'state' | 'ut';
  capital: string;
  lat: number;
  lng: number;
  pop: string;
  area: string;
  gdp: string;
  literacy: string;
  hdi: string;
  aqi: string;
  aqiStatus: 'good' | 'moderate' | 'poor' | 'severe';
  schemeCoverage: number;
  activeAlerts: number;
}

export class IndiaStatesLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'india-states',
    name: 'India States & UTs',
    icon: '🇮🇳',
    description: 'All 28 states and 8 union territories with population, GDP, HDI, and alert data',
    category: 'india',
    color: '#ff9800',
    enabled: false,
    opacity: 0.7,
    dataStoreKey: 'india-states',
  };

  private states: StateData[] = [
    // Major States
    { name: 'Uttar Pradesh', code: 'UP', type: 'state', capital: 'Lucknow', lat: 26.85, lng: 80.95, pop: '231M', area: '240,928 km²', gdp: '$250B', literacy: '67.7%', hdi: '0.596', aqi: '162', aqiStatus: 'poor', schemeCoverage: 62, activeAlerts: 24 },
    { name: 'Maharashtra', code: 'MH', type: 'state', capital: 'Mumbai', lat: 19.66, lng: 75.70, pop: '124.9M', area: '307,713 km²', gdp: '$400B', literacy: '82.3%', hdi: '0.696', aqi: '98', aqiStatus: 'moderate', schemeCoverage: 78, activeAlerts: 12 },
    { name: 'Bihar', code: 'BR', type: 'state', capital: 'Patna', lat: 25.59, lng: 85.14, pop: '127.2M', area: '94,163 km²', gdp: '$80B', literacy: '61.8%', hdi: '0.576', aqi: '145', aqiStatus: 'poor', schemeCoverage: 55, activeAlerts: 18 },
    { name: 'West Bengal', code: 'WB', type: 'state', capital: 'Kolkata', lat: 22.98, lng: 87.86, pop: '99.6M', area: '88,752 km²', gdp: '$170B', literacy: '76.3%', hdi: '0.641', aqi: '132', aqiStatus: 'poor', schemeCoverage: 71, activeAlerts: 9 },
    { name: 'Madhya Pradesh', code: 'MP', type: 'state', capital: 'Bhopal', lat: 23.47, lng: 77.94, pop: '85.4M', area: '308,252 km²', gdp: '$130B', literacy: '69.3%', hdi: '0.603', aqi: '118', aqiStatus: 'poor', schemeCoverage: 58, activeAlerts: 15 },
    { name: 'Tamil Nadu', code: 'TN', type: 'state', capital: 'Chennai', lat: 11.13, lng: 78.66, pop: '77.8M', area: '130,058 km²', gdp: '$300B', literacy: '80.1%', hdi: '0.708', aqi: '88', aqiStatus: 'moderate', schemeCoverage: 85, activeAlerts: 6 },
    { name: 'Rajasthan', code: 'RJ', type: 'state', capital: 'Jaipur', lat: 26.92, lng: 70.90, pop: '81.0M', area: '342,239 km²', gdp: '$130B', literacy: '66.1%', hdi: '0.621', aqi: '142', aqiStatus: 'poor', schemeCoverage: 53, activeAlerts: 21 },
    { name: 'Karnataka', code: 'KA', type: 'state', capital: 'Bengaluru', lat: 15.32, lng: 75.71, pop: '67.6M', area: '191,791 km²', gdp: '$280B', literacy: '77.2%', hdi: '0.683', aqi: '112', aqiStatus: 'poor', schemeCoverage: 80, activeAlerts: 8 },
    { name: 'Gujarat', code: 'GJ', type: 'state', capital: 'Gandhinagar', lat: 23.02, lng: 72.57, pop: '63.8M', area: '196,024 km²', gdp: '$260B', literacy: '78.0%', hdi: '0.672', aqi: '108', aqiStatus: 'poor', schemeCoverage: 75, activeAlerts: 10 },
    { name: 'Andhra Pradesh', code: 'AP', type: 'state', capital: 'Amaravati', lat: 15.91, lng: 79.74, pop: '52.2M', area: '162,975 km²', gdp: '$140B', literacy: '67.4%', hdi: '0.623', aqi: '78', aqiStatus: 'moderate', schemeCoverage: 68, activeAlerts: 7 },
    { name: 'Odisha', code: 'OD', type: 'state', capital: 'Bhubaneswar', lat: 20.95, lng: 85.10, pop: '46.8M', area: '155,707 km²', gdp: '$80B', literacy: '72.9%', hdi: '0.606', aqi: '72', aqiStatus: 'moderate', schemeCoverage: 61, activeAlerts: 11 },
    { name: 'Telangana', code: 'TG', type: 'state', capital: 'Hyderabad', lat: 18.11, lng: 79.02, pop: '38.5M', area: '112,077 km²', gdp: '$170B', literacy: '72.8%', hdi: '0.675', aqi: '95', aqiStatus: 'moderate', schemeCoverage: 82, activeAlerts: 5 },
    { name: 'Kerala', code: 'KL', type: 'state', capital: 'Thiruvananthapuram', lat: 10.85, lng: 76.27, pop: '35.7M', area: '38,863 km²', gdp: '$120B', literacy: '96.2%', hdi: '0.782', aqi: '52', aqiStatus: 'good', schemeCoverage: 92, activeAlerts: 3 },
    { name: 'Jharkhand', code: 'JH', type: 'state', capital: 'Ranchi', lat: 23.36, lng: 85.33, pop: '39.5M', area: '79,714 km²', gdp: '$55B', literacy: '66.4%', hdi: '0.581', aqi: '125', aqiStatus: 'poor', schemeCoverage: 48, activeAlerts: 16 },
    { name: 'Assam', code: 'AS', type: 'state', capital: 'Dispur', lat: 26.20, lng: 92.94, pop: '35.6M', area: '78,438 km²', gdp: '$55B', literacy: '72.2%', hdi: '0.613', aqi: '68', aqiStatus: 'moderate', schemeCoverage: 59, activeAlerts: 13 },
    { name: 'Punjab', code: 'PB', type: 'state', capital: 'Chandigarh', lat: 31.17, lng: 75.34, pop: '30.1M', area: '50,362 km²', gdp: '$80B', literacy: '75.8%', hdi: '0.675', aqi: '178', aqiStatus: 'poor', schemeCoverage: 73, activeAlerts: 8 },
    { name: 'Chhattisgarh', code: 'CG', type: 'state', capital: 'Raipur', lat: 21.28, lng: 81.87, pop: '29.5M', area: '135,191 km²', gdp: '$50B', literacy: '70.3%', hdi: '0.596', aqi: '65', aqiStatus: 'moderate', schemeCoverage: 52, activeAlerts: 14 },
    { name: 'Haryana', code: 'HR', type: 'state', capital: 'Chandigarh', lat: 29.06, lng: 76.09, pop: '29.1M', area: '44,212 km²', gdp: '$110B', literacy: '75.6%', hdi: '0.687', aqi: '185', aqiStatus: 'severe', schemeCoverage: 69, activeAlerts: 11 },
    { name: 'Delhi', code: 'DL', type: 'ut', capital: 'New Delhi', lat: 28.61, lng: 77.21, pop: '20.6M', area: '1,484 km²', gdp: '$120B', literacy: '86.2%', hdi: '0.746', aqi: '245', aqiStatus: 'severe', schemeCoverage: 72, activeAlerts: 19 },
    { name: 'Uttarakhand', code: 'UK', type: 'state', capital: 'Dehradun', lat: 30.07, lng: 79.02, pop: '11.3M', area: '53,483 km²', gdp: '$38B', literacy: '78.8%', hdi: '0.677', aqi: '58', aqiStatus: 'good', schemeCoverage: 65, activeAlerts: 7 },
    { name: 'Himachal Pradesh', code: 'HP', type: 'state', capital: 'Shimla', lat: 31.10, lng: 77.17, pop: '7.3M', area: '55,673 km²', gdp: '$22B', literacy: '82.8%', hdi: '0.715', aqi: '42', aqiStatus: 'good', schemeCoverage: 74, activeAlerts: 4 },
    { name: 'Tripura', code: 'TR', type: 'state', capital: 'Agartala', lat: 23.94, lng: 91.99, pop: '4.1M', area: '10,486 km²', gdp: '$8B', literacy: '87.2%', hdi: '0.658', aqi: '48', aqiStatus: 'good', schemeCoverage: 67, activeAlerts: 3 },
    { name: 'Meghalaya', code: 'ML', type: 'state', capital: 'Shillong', lat: 25.47, lng: 91.37, pop: '3.7M', area: '22,429 km²', gdp: '$6B', literacy: '74.4%', hdi: '0.618', aqi: '35', aqiStatus: 'good', schemeCoverage: 56, activeAlerts: 5 },
    { name: 'Manipur', code: 'MN', type: 'state', capital: 'Imphal', lat: 24.66, lng: 93.91, pop: '3.2M', area: '22,327 km²', gdp: '$5B', literacy: '76.9%', hdi: '0.638', aqi: '38', aqiStatus: 'good', schemeCoverage: 45, activeAlerts: 8 },
    { name: 'Nagaland', code: 'NL', type: 'state', capital: 'Kohima', lat: 26.16, lng: 94.56, pop: '2.2M', area: '16,579 km²', gdp: '$4B', literacy: '79.6%', hdi: '0.645', aqi: '32', aqiStatus: 'good', schemeCoverage: 49, activeAlerts: 4 },
    { name: 'Goa', code: 'GA', type: 'state', capital: 'Panaji', lat: 15.50, lng: 73.83, pop: '1.6M', area: '3,702 km²', gdp: '$12B', literacy: '88.7%', hdi: '0.761', aqi: '45', aqiStatus: 'good', schemeCoverage: 88, activeAlerts: 2 },
    { name: 'Arunachal Pradesh', code: 'AR', type: 'state', capital: 'Itanagar', lat: 28.22, lng: 94.73, pop: '1.6M', area: '83,743 km²', gdp: '$4B', literacy: '65.4%', hdi: '0.608', aqi: '28', aqiStatus: 'good', schemeCoverage: 42, activeAlerts: 6 },
    { name: 'Mizoram', code: 'MZ', type: 'state', capital: 'Aizawl', lat: 23.73, lng: 92.72, pop: '1.3M', area: '21,081 km²', gdp: '$3.5B', literacy: '91.3%', hdi: '0.705', aqi: '30', aqiStatus: 'good', schemeCoverage: 71, activeAlerts: 2 },
    { name: 'Sikkim', code: 'SK', type: 'state', capital: 'Gangtok', lat: 27.53, lng: 88.51, pop: '0.7M', area: '7,096 km²', gdp: '$3B', literacy: '81.4%', hdi: '0.716', aqi: '25', aqiStatus: 'good', schemeCoverage: 80, activeAlerts: 1 },
    // Union Territories
    { name: 'Jammu & Kashmir', code: 'JK', type: 'ut', capital: 'Srinagar/Jammu', lat: 34.08, lng: 74.80, pop: '14.2M', area: '101,387 km²', gdp: '$25B', literacy: '67.2%', hdi: '0.625', aqi: '65', aqiStatus: 'moderate', schemeCoverage: 55, activeAlerts: 12 },
    { name: 'Puducherry', code: 'PY', type: 'ut', capital: 'Puducherry', lat: 11.94, lng: 79.81, pop: '1.5M', area: '479 km²', gdp: '$6B', literacy: '85.8%', hdi: '0.738', aqi: '55', aqiStatus: 'good', schemeCoverage: 84, activeAlerts: 1 },
    { name: 'Chandigarh', code: 'CH', type: 'ut', capital: 'Chandigarh', lat: 30.73, lng: 76.77, pop: '1.1M', area: '114 km²', gdp: '$6B', literacy: '86.4%', hdi: '0.775', aqi: '155', aqiStatus: 'poor', schemeCoverage: 86, activeAlerts: 3 },
    { name: 'Andaman & Nicobar', code: 'AN', type: 'ut', capital: 'Port Blair', lat: 11.62, lng: 92.73, pop: '0.4M', area: '8,249 km²', gdp: '$1.5B', literacy: '86.3%', hdi: '0.721', aqi: '22', aqiStatus: 'good', schemeCoverage: 60, activeAlerts: 1 },
    { name: 'Ladakh', code: 'LA', type: 'ut', capital: 'Leh', lat: 34.15, lng: 77.58, pop: '0.3M', area: '59,146 km²', gdp: '$1B', literacy: '70.2%', hdi: '0.612', aqi: '20', aqiStatus: 'good', schemeCoverage: 38, activeAlerts: 4 },
    { name: 'Lakshadweep', code: 'LD', type: 'ut', capital: 'Kavaratti', lat: 10.57, lng: 72.64, pop: '0.07M', area: '32 km²', gdp: '$0.3B', literacy: '91.9%', hdi: '0.750', aqi: '18', aqiStatus: 'good', schemeCoverage: 78, activeAlerts: 0 },
    { name: 'Dadra & Nagar Haveli', code: 'DN', type: 'ut', capital: 'Silvassa', lat: 20.27, lng: 73.02, pop: '0.6M', area: '603 km²', gdp: '$2B', literacy: '76.2%', hdi: '0.645', aqi: '62', aqiStatus: 'moderate', schemeCoverage: 63, activeAlerts: 2 },
  ];



  private getAqiColor(status: string): string {
    switch (status) {
      case 'good': return '#00ff88';
      case 'moderate': return '#ffcc00';
      case 'poor': return '#ff9800';
      case 'severe': return '#ff3355';
      default: return '#888888';
    }
  }

  private getSchemeColor(coverage: number): string {
    if (coverage >= 80) return '#00ff88';
    if (coverage >= 65) return '#ffcc00';
    if (coverage >= 50) return '#ff9800';
    return '#ff3355';
  }

  protected async loadData(): Promise<void> {
    this.clear();

    for (const s of this.states) {
      const aqiColor = this.getAqiColor(s.aqiStatus);
      const schemeColor = this.getSchemeColor(s.schemeCoverage);
      const alertColor = s.activeAlerts > 15 ? '#ff3355' : s.activeAlerts > 8 ? '#ff9800' : '#00ff88';

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(s.lng, s.lat, 0),
        point: {
          pixelSize: s.type === 'ut' ? 8 : Math.max(10, s.schemeCoverage / 6),
          color: Color.fromCssColorString(aqiColor).withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: s.type === 'ut' ? Color.CYAN : Color.WHITE,
          outlineWidth: s.type === 'ut' ? 1 : 2,
          scaleByDistance: new NearFarScalar(1.0, 1.0, 1.5e7, 0.1),
        },
        label: {
          text: s.name,
          font: '11px sans-serif',
          style: LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Color.BLACK,
          fillColor: Color.WHITE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          pixelOffset: new Cartesian3(0, -14, 0),
          scaleByDistance: new NearFarScalar(1.0, 1.0, 8e6, 0.1),
        },
        description: `
          <h3>${s.type === 'ut' ? '🏛️' : '🗺️'} ${s.name} <small style="color:#888">(${s.code})</small></h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Type</td><td>${s.type === 'ut' ? 'Union Territory' : 'State'}</td></tr>
            <tr><td>Capital</td><td>${s.capital}</td></tr>
            <tr><td>Population</td><td>${s.pop}</td></tr>
            <tr><td>Area</td><td>${s.area}</td></tr>
            <tr><td>GDP</td><td>${s.gdp}</td></tr>
            <tr><td>Literacy Rate</td><td>${s.literacy}</td></tr>
            <tr><td>HDI</td><td style="font-weight:bold">${s.hdi}</td></tr>
            <tr><td>AQI</td><td style="color:${aqiColor};font-weight:bold">${s.aqi} (${s.aqiStatus.toUpperCase()})</td></tr>
            <tr><td>Scheme Coverage</td><td style="color:${schemeColor};font-weight:bold">${s.schemeCoverage}%</td></tr>
            <tr><td>Active Alerts</td><td style="color:${alertColor};font-weight:bold">${s.activeAlerts}</td></tr>
          </table>
        `,
      });
    }
  }
}
