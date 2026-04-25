/**
 * ElectionLayer — Election results data for Maharashtra constituencies
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

interface Constituency {
  name: string;
  lat: number;
  lng: number;
  type: 'Loksabha' | 'VidhanSabha';
  district: string;
  winner: string;
  party: string;
  marginPercent: number;
  turnout: number;
  totalVotes: number;
  runnerUp: string;
  runnerUpParty: string;
  category: 'GEN' | 'SC' | 'ST';
}

export class ElectionLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'election',
    name: 'Election Results',
    icon: '🗳️',
    description: 'Lok Sabha & Vidhan Sabha election results — winners, margins, turnout by constituency',
    category: 'maharashtra',
    color: '#7c3aed',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'election',
  };

  private constituencies: Constituency[] = [
    // Lok Sabha 2024 — key constituencies
    { name: 'Mumbai North', lat: 19.230, lng: 72.860, type: 'Loksabha', district: 'Mumbai Suburban', winner: 'Piyush Goyal', party: 'BJP', marginPercent: 18.4, turnout: 55.2, totalVotes: 1120000, runnerUp: 'Bhushan Patil', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Mumbai North Central', lat: 19.150, lng: 72.840, type: 'Loksabha', district: 'Mumbai Suburban', winner: 'Ujjwal Nikam', party: 'BJP', marginPercent: 12.1, turnout: 52.8, totalVotes: 1050000, runnerUp: 'Varsha Gaikwad', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Mumbai South Central', lat: 19.050, lng: 72.860, type: 'Loksabha', district: 'Mumbai City', winner: 'Rahul Shewale', party: 'Shiv Sena (Shinde)', marginPercent: 6.3, turnout: 50.4, totalVotes: 980000, runnerUp: 'Anil Desai', runnerUpParty: 'Shiv Sena (UBT)', category: 'GEN' },
    { name: 'Mumbai South', lat: 18.960, lng: 72.820, type: 'Loksabha', district: 'Mumbai City', winner: 'Arvind Sawant', party: 'Shiv Sena (UBT)', marginPercent: 8.7, turnout: 49.6, totalVotes: 920000, runnerUp: 'Yamini Jadhav', runnerUpParty: 'Shiv Sena (Shinde)', category: 'GEN' },
    { name: 'Pune', lat: 18.530, lng: 73.850, type: 'Loksabha', district: 'Pune', winner: 'Murlidhar Mohol', party: 'BJP', marginPercent: 15.2, turnout: 54.3, totalVotes: 1350000, runnerUp: 'Ravindra Dhangekar', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Nagpur', lat: 21.150, lng: 79.090, type: 'Loksabha', district: 'Nagpur', winner: 'Nitin Gadkari', party: 'BJP', marginPercent: 22.5, turnout: 56.8, totalVotes: 1420000, runnerUp: 'Vikas Thakre', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Thane', lat: 19.220, lng: 72.980, type: 'Loksabha', district: 'Thane', winner: 'Naresh Mhaske', party: 'Shiv Sena (Shinde)', marginPercent: 11.8, turnout: 51.2, totalVotes: 1280000, runnerUp: 'Rajan Bhatkar', runnerUpParty: 'Shiv Sena (UBT)', category: 'GEN' },
    { name: 'Nashik', lat: 20.000, lng: 73.790, type: 'Loksabha', district: 'Nashik', winner: 'Hemant Godse', party: 'Shiv Sena (Shinde)', marginPercent: 9.4, turnout: 58.6, totalVotes: 1180000, runnerUp: 'Sameer Bhujbal', runnerUpParty: 'NCP (Sharad)', category: 'GEN' },
    { name: 'Aurangabad', lat: 19.880, lng: 75.340, type: 'Loksabha', district: 'Chhatrapati Sambhajinagar', winner: 'Imtiaz Jaleel', party: 'AIMIM', marginPercent: 2.1, turnout: 57.4, totalVotes: 1090000, runnerUp: 'Chandrakant Khaire', runnerUpParty: 'Shiv Sena (Shinde)', category: 'GEN' },
    { name: 'Baramati', lat: 18.150, lng: 74.580, type: 'Loksabha', district: 'Pune', winner: 'Supriya Sule', party: 'NCP (Sharad)', marginPercent: 4.8, turnout: 62.3, totalVotes: 1250000, runnerUp: 'Sunetra Pawar', runnerUpParty: 'NCP (Ajit)', category: 'GEN' },
    // SC/ST Reserved
    { name: 'Bhandara-Gondiya', lat: 21.170, lng: 80.000, type: 'Loksabha', district: 'Bhandara', winner: 'Prashant Padole', party: 'BJP', marginPercent: 14.6, turnout: 60.1, totalVotes: 1150000, runnerUp: 'Dr. Shrikant Bhartiya', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Ramtek (SC)', lat: 21.400, lng: 79.330, type: 'Loksabha', district: 'Nagpur', winner: 'Raju Parve', party: 'Shiv Sena (Shinde)', marginPercent: 7.3, turnout: 55.8, totalVotes: 1050000, runnerUp: 'Subodh Mohite', runnerUpParty: 'INC', category: 'SC' },
    { name: 'Gadchiroli-Chimur (ST)', lat: 19.800, lng: 80.200, type: 'Loksabha', district: 'Gadchiroli', winner: 'Ashok Nete', party: 'BJP', marginPercent: 19.2, turnout: 64.5, totalVotes: 980000, runnerUp: 'Namdeo Usendi', runnerUpParty: 'INC', category: 'ST' },
    { name: 'Amravati (SC)', lat: 20.940, lng: 77.760, type: 'Loksabha', district: 'Amravati', winner: 'Balwant Wankhade', party: 'INC', marginPercent: 3.5, turnout: 57.2, totalVotes: 1100000, runnerUp: 'Navneet Rana', runnerUpParty: 'BJP', category: 'SC' },
    { name: 'Wardha', lat: 20.740, lng: 78.600, type: 'Loksabha', district: 'Wardha', winner: 'Amar Sharadrao Kale', party: 'BJP', marginPercent: 16.8, turnout: 59.3, totalVotes: 1080000, runnerUp: 'Charulata Tokas', runnerUpParty: 'INC', category: 'GEN' },
    // Key Vidhan Sabha constituencies
    { name: 'Worli', lat: 19.017, lng: 72.817, type: 'VidhanSabha', district: 'Mumbai', winner: 'Aaditya Thackeray', party: 'Shiv Sena (UBT)', marginPercent: 21.4, turnout: 48.2, totalVotes: 225000, runnerUp: 'Dattaji Nalawade', runnerUpParty: 'Shiv Sena (Shinde)', category: 'GEN' },
    { name: 'Shivajinagar', lat: 18.531, lng: 73.844, type: 'VidhanSabha', district: 'Pune', winner: 'Siddharth Shirole', party: 'BJP', marginPercent: 8.9, turnout: 51.6, totalVotes: 310000, runnerUp: 'Dattatrey Bahirat', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Nagpur South West', lat: 21.110, lng: 79.050, type: 'VidhanSabha', district: 'Nagpur', winner: 'Devendra Fadnavis', party: 'BJP', marginPercent: 28.3, turnout: 55.4, totalVotes: 345000, runnerUp: 'Praful Gudadhe', runnerUpParty: 'INC', category: 'GEN' },
    { name: 'Karad South', lat: 17.280, lng: 74.180, type: 'VidhanSabha', district: 'Satara', winner: 'Prithviraj Chavan', party: 'INC', marginPercent: 12.5, turnout: 63.8, totalVotes: 285000, runnerUp: 'Atulbaba Bhosale', runnerUpParty: 'BJP', category: 'GEN' },
    { name: 'Parli', lat: 18.830, lng: 76.530, type: 'VidhanSabha', district: 'Beed', winner: 'Dhananjay Munde', party: 'NCP (Ajit)', marginPercent: 5.6, turnout: 67.2, totalVotes: 312000, runnerUp: 'Pankaja Munde', runnerUpParty: 'BJP', category: 'GEN' },
  ];

  private getPartyColor(party: string): Color {
    if (party.includes('BJP')) return Color.fromCssColorString('#ff9933');
    if (party.includes('INC')) return Color.fromCssColorString('#19aaed');
    if (party.includes('Shiv Sena (Shinde)')) return Color.fromCssColorString('#ff6600');
    if (party.includes('Shiv Sena (UBT)')) return Color.fromCssColorString('#e65100');
    if (party.includes('NCP (Sharad)')) return Color.fromCssColorString('#1565c0');
    if (party.includes('NCP (Ajit)')) return Color.fromCssColorString('#0d47a1');
    if (party.includes('AIMIM')) return Color.fromCssColorString('#2e7d32');
    if (party.includes('MNS')) return Color.fromCssColorString('#f9a825');
    return Color.fromCssColorString('#757575');
  }

  protected async loadData(): Promise<void> {
    this.clear();
    for (const c of this.constituencies) {
      const color = this.getPartyColor(c.party);
      const isLokSabha = c.type === 'Loksabha';
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(c.lng, c.lat, 0),
        point: {
          pixelSize: isLokSabha ? 20 : 14,
          color: color.withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🗳️ ${c.name} (${c.type})</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>District</td><td>${c.district}</td></tr>
            <tr><td>Category</td><td>${c.category}</td></tr>
            <tr><td colspan="2" style="font-weight:bold;background:#f5f3ff">Winner</td></tr>
            <tr><td>Candidate</td><td><strong>${c.winner}</strong></td></tr>
            <tr><td>Party</td><td style="color:${color.toCssColorString()};font-weight:bold">${c.party}</td></tr>
            <tr><td>Victory Margin</td><td style="color:#16a34a;font-weight:bold">${c.marginPercent}%</td></tr>
            <tr><td colspan="2" style="font-weight:bold;background:#fef2f2">Runner-up</td></tr>
            <tr><td>Candidate</td><td>${c.runnerUp}</td></tr>
            <tr><td>Party</td><td>${c.runnerUpParty}</td></tr>
            <tr><td colspan="2" style="font-weight:bold;background:#eff6ff">Voter Stats</td></tr>
            <tr><td>Voter Turnout</td><td>${c.turnout}%</td></tr>
            <tr><td>Total Votes Cast</td><td>${(c.totalVotes / 100000).toFixed(1)}L</td></tr>
          </table>
        `,
      });
    }
  }
}
