/**
 * EducationLayer — Schools, colleges, and education metrics by Maharashtra district
 */
import { Viewer, Cartesian3, Color, HeightReference } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

interface EducationDistrict {
  name: string;
  lat: number;
  lng: number;
  totalSchools: number;
  governmentSchools: number;
  privateSchools: number;
  colleges: number;
  universities: number;
  literacyRate: number;
  femaleLiteracy: number;
  studentTeacherRatio: number;
  dropoutRate: number;
  middayMealCoverage: number;
  digitalClassrooms: number;
}

export class EducationLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'education',
    name: 'Education Infrastructure',
    icon: '🎓',
    description: 'Schools, colleges, universities, literacy rates, and education quality metrics by district',
    category: 'maharashtra',
    color: '#2563eb',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'education',
  };

  private districts: EducationDistrict[] = [
    { name: 'Mumbai', lat: 19.076, lng: 72.877, totalSchools: 4250, governmentSchools: 1680, privateSchools: 2570, colleges: 320, universities: 12, literacyRate: 89.2, femaleLiteracy: 85.4, studentTeacherRatio: 28, dropoutRate: 3.2, middayMealCoverage: 94, digitalClassrooms: 1850 },
    { name: 'Pune', lat: 18.520, lng: 73.856, totalSchools: 5120, governmentSchools: 2340, privateSchools: 2780, colleges: 410, universities: 8, literacyRate: 87.6, femaleLiteracy: 82.1, studentTeacherRatio: 25, dropoutRate: 4.1, middayMealCoverage: 96, digitalClassrooms: 2100 },
    { name: 'Nagpur', lat: 21.146, lng: 79.088, totalSchools: 3890, governmentSchools: 1950, privateSchools: 1940, colleges: 245, universities: 5, literacyRate: 84.3, femaleLiteracy: 78.6, studentTeacherRatio: 30, dropoutRate: 5.8, middayMealCoverage: 92, digitalClassrooms: 980 },
    { name: 'Thane', lat: 19.218, lng: 72.978, totalSchools: 3650, governmentSchools: 1420, privateSchools: 2230, colleges: 195, universities: 3, literacyRate: 86.8, femaleLiteracy: 81.3, studentTeacherRatio: 27, dropoutRate: 3.8, middayMealCoverage: 93, digitalClassrooms: 1420 },
    { name: 'Nashik', lat: 19.997, lng: 73.789, totalSchools: 3420, governmentSchools: 1780, privateSchools: 1640, colleges: 168, universities: 3, literacyRate: 82.1, femaleLiteracy: 75.8, studentTeacherRatio: 31, dropoutRate: 6.2, middayMealCoverage: 90, digitalClassrooms: 720 },
    { name: 'Aurangabad', lat: 19.876, lng: 75.343, totalSchools: 2980, governmentSchools: 1560, privateSchools: 1420, colleges: 142, universities: 4, literacyRate: 79.5, femaleLiteracy: 71.2, studentTeacherRatio: 33, dropoutRate: 7.5, middayMealCoverage: 88, digitalClassrooms: 580 },
    { name: 'Solapur', lat: 17.660, lng: 75.906, totalSchools: 2180, governmentSchools: 1250, privateSchools: 930, colleges: 98, universities: 2, literacyRate: 77.3, femaleLiteracy: 68.4, studentTeacherRatio: 35, dropoutRate: 8.8, middayMealCoverage: 87, digitalClassrooms: 320 },
    { name: 'Kolhapur', lat: 16.705, lng: 74.243, totalSchools: 2540, governmentSchools: 1180, privateSchools: 1360, colleges: 135, universities: 3, literacyRate: 83.6, femaleLiteracy: 77.2, studentTeacherRatio: 26, dropoutRate: 4.5, middayMealCoverage: 95, digitalClassrooms: 680 },
    { name: 'Satara', lat: 17.680, lng: 74.000, totalSchools: 2120, governmentSchools: 1100, privateSchools: 1020, colleges: 105, universities: 2, literacyRate: 81.4, femaleLiteracy: 74.6, studentTeacherRatio: 29, dropoutRate: 5.2, middayMealCoverage: 91, digitalClassrooms: 450 },
    { name: 'Chandrapur', lat: 19.962, lng: 79.296, totalSchools: 1650, governmentSchools: 1080, privateSchools: 570, colleges: 62, universities: 1, literacyRate: 73.8, femaleLiteracy: 64.5, studentTeacherRatio: 38, dropoutRate: 10.2, middayMealCoverage: 85, digitalClassrooms: 180 },
    { name: 'Latur', lat: 18.408, lng: 76.560, totalSchools: 1890, governmentSchools: 1020, privateSchools: 870, colleges: 88, universities: 2, literacyRate: 76.2, femaleLiteracy: 67.8, studentTeacherRatio: 34, dropoutRate: 8.1, middayMealCoverage: 86, digitalClassrooms: 280 },
    { name: 'Amravati', lat: 20.937, lng: 77.760, totalSchools: 2340, governmentSchools: 1320, privateSchools: 1020, colleges: 112, universities: 2, literacyRate: 80.5, femaleLiteracy: 73.1, studentTeacherRatio: 32, dropoutRate: 6.8, middayMealCoverage: 89, digitalClassrooms: 420 },
    { name: 'Akola', lat: 20.710, lng: 77.000, totalSchools: 1780, governmentSchools: 980, privateSchools: 800, colleges: 78, universities: 1, literacyRate: 78.4, femaleLiteracy: 70.2, studentTeacherRatio: 33, dropoutRate: 7.3, middayMealCoverage: 88, digitalClassrooms: 310 },
    { name: 'Nanded', lat: 19.138, lng: 77.321, totalSchools: 2450, governmentSchools: 1420, privateSchools: 1030, colleges: 108, universities: 3, literacyRate: 75.6, femaleLiteracy: 66.3, studentTeacherRatio: 36, dropoutRate: 9.1, middayMealCoverage: 84, digitalClassrooms: 350 },
    { name: 'Ahmednagar', lat: 19.095, lng: 74.739, totalSchools: 2680, governmentSchools: 1450, privateSchools: 1230, colleges: 122, universities: 2, literacyRate: 80.8, femaleLiteracy: 73.5, studentTeacherRatio: 30, dropoutRate: 5.9, middayMealCoverage: 91, digitalClassrooms: 520 },
    { name: 'Dhule', lat: 20.902, lng: 74.775, totalSchools: 1420, governmentSchools: 820, privateSchools: 600, colleges: 55, universities: 1, literacyRate: 72.1, femaleLiteracy: 62.8, studentTeacherRatio: 37, dropoutRate: 11.3, middayMealCoverage: 82, digitalClassrooms: 150 },
    { name: 'Jalgaon', lat: 21.008, lng: 75.563, totalSchools: 2150, governmentSchools: 1180, privateSchools: 970, colleges: 95, universities: 2, literacyRate: 79.2, femaleLiteracy: 71.5, studentTeacherRatio: 31, dropoutRate: 6.5, middayMealCoverage: 89, digitalClassrooms: 380 },
    { name: 'Sangli', lat: 16.852, lng: 74.582, totalSchools: 1980, governmentSchools: 920, privateSchools: 1060, colleges: 102, universities: 2, literacyRate: 82.3, femaleLiteracy: 76.1, studentTeacherRatio: 27, dropoutRate: 4.8, middayMealCoverage: 93, digitalClassrooms: 520 },
    { name: 'Yavatmal', lat: 20.389, lng: 78.131, totalSchools: 1580, governmentSchools: 950, privateSchools: 630, colleges: 68, universities: 1, literacyRate: 74.5, femaleLiteracy: 65.2, studentTeacherRatio: 36, dropoutRate: 9.8, middayMealCoverage: 83, digitalClassrooms: 210 },
    { name: 'Navi Mumbai', lat: 19.033, lng: 73.029, totalSchools: 1280, governmentSchools: 380, privateSchools: 900, colleges: 85, universities: 2, literacyRate: 91.5, femaleLiteracy: 88.2, studentTeacherRatio: 22, dropoutRate: 2.1, middayMealCoverage: 97, digitalClassrooms: 920 },
  ];

  private getLiteracyColor(rate: number): Color {
    if (rate >= 85) return Color.fromCssColorString('#22c55e');
    if (rate >= 80) return Color.fromCssColorString('#84cc16');
    if (rate >= 75) return Color.fromCssColorString('#eab308');
    if (rate >= 70) return Color.fromCssColorString('#f97316');
    return Color.fromCssColorString('#ef4444');
  }

  protected async loadData(): Promise<void> {
    this.clear();
    for (const d of this.districts) {
      const color = this.getLiteracyColor(d.literacyRate);
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(d.lng, d.lat, 0),
        point: {
          pixelSize: Math.max(12, Math.min(28, d.totalSchools / 200)),
          color: color.withAlpha(this.config.opacity),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        },
        description: `
          <h3>🎓 ${d.name} District — Education Profile</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td colspan="2" style="font-weight:bold;background:#eff6ff">📊 Institutions</td></tr>
            <tr><td>Total Schools</td><td><strong>${d.totalSchools.toLocaleString()}</strong></td></tr>
            <tr><td>Government Schools</td><td>${d.governmentSchools.toLocaleString()}</td></tr>
            <tr><td>Private Schools</td><td>${d.privateSchools.toLocaleString()}</td></tr>
            <tr><td>Colleges</td><td>${d.colleges}</td></tr>
            <tr><td>Universities</td><td>${d.universities}</td></tr>
            <tr><td colspan="2" style="font-weight:bold;background:#eff6ff">📈 Metrics</td></tr>
            <tr><td>Literacy Rate</td><td style="color:${color.toCssColorString()};font-weight:bold">${d.literacyRate}%</td></tr>
            <tr><td>Female Literacy</td><td>${d.femaleLiteracy}%</td></tr>
            <tr><td>Student-Teacher Ratio</td><td>${d.studentTeacherRatio}:1</td></tr>
            <tr><td>Dropout Rate</td><td>${d.dropoutRate}%</td></tr>
            <tr><td>Mid-day Meal Coverage</td><td>${d.middayMealCoverage}%</td></tr>
            <tr><td>Digital Classrooms</td><td>${d.digitalClassrooms.toLocaleString()}</td></tr>
          </table>
        `,
      });
    }
  }
}
