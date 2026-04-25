/**
 * HeatmapLayer — Population density and air quality heatmap visualization
 * Renders heat gradients over Maharashtra districts using point-based intensity mapping
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  CallbackProperty, ConstantProperty, ColorMaterialProperty,
  NearFarScalar, DistanceDisplayCondition, CustomDataSource,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export type HeatmapMode = 'population' | 'air-quality' | 'crime-rate' | 'rainfall';

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
  label: string;
  value: string;
}

export class HeatmapLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'heatmap',
    name: 'Heatmap Overlay',
    icon: '🔥',
    description: 'Population density, air quality, crime, and rainfall heat visualization',
    category: 'maharashtra',
    color: '#ff4444',
    enabled: false,
    opacity: 0.7,
    dataStoreKey: 'heatmap',
  };

  private currentMode: HeatmapMode = 'population';
  private modeColors: Record<HeatmapMode, { low: string; mid: string; high: string }> = {
    'population': { low: '#000033', mid: '#0066ff', high: '#ff0000' },
    'air-quality': { low: '#00e400', mid: '#ffcc00', high: '#ff0000' },
    'crime-rate':  { low: '#3366ff', mid: '#ff9900', high: '#ff0033' },
    'rainfall':    { low: '#ffffcc', mid: '#41b6c4', high: '#045a8d' },
  };

  // Maharashtra district centroids with data for each mode
  private districtData: Array<{
    name: string; lat: number; lng: number;
    population: number;   // people/km²
    aqi: number;          // AQI value
    crimeRate: number;    // per 100k
    rainfall: number;     // mm annual
  }> = [
    { name: 'Mumbai',           lat: 19.076, lng: 72.877, population: 20566, aqi: 156, crimeRate: 482, rainfall: 2400 },
    { name: 'Mumbai Suburban',  lat: 19.050, lng: 72.830, population: 13550, aqi: 132, crimeRate: 395, rainfall: 2350 },
    { name: 'Pune',             lat: 18.520, lng: 73.856, population: 601,   aqi: 112, crimeRate: 310, rainfall: 740 },
    { name: 'Nagpur',           lat: 21.146, lng: 79.088, population: 466,   aqi: 88,  crimeRate: 275, rainfall: 1200 },
    { name: 'Thane',            lat: 19.218, lng: 72.978, population: 1161,  aqi: 138, crimeRate: 340, rainfall: 2600 },
    { name: 'Nashik',           lat: 19.997, lng: 73.789, population: 393,   aqi: 76,  crimeRate: 195, rainfall: 680 },
    { name: 'Aurangabad',       lat: 19.876, lng: 75.343, population: 366,   aqi: 105, crimeRate: 220, rainfall: 720 },
    { name: 'Solapur',          lat: 17.660, lng: 75.906, population: 290,   aqi: 95,  crimeRate: 180, rainfall: 560 },
    { name: 'Kolhapur',         lat: 16.705, lng: 74.243, population: 495,   aqi: 65,  crimeRate: 165, rainfall: 1100 },
    { name: 'Amravati',         lat: 20.937, lng: 77.759, population: 229,   aqi: 82,  crimeRate: 190, rainfall: 980 },
    { name: 'Nanded',           lat: 19.138, lng: 77.321, population: 313,   aqi: 90,  crimeRate: 170, rainfall: 850 },
    { name: 'Sangli',           lat: 16.852, lng: 74.581, population: 327,   aqi: 72,  crimeRate: 155, rainfall: 620 },
    { name: 'Satara',           lat: 17.680, lng: 74.018, population: 286,   aqi: 58,  crimeRate: 140, rainfall: 1200 },
    { name: 'Ahmednagar',       lat: 19.094, lng: 74.739, population: 264,   aqi: 85,  crimeRate: 175, rainfall: 520 },
    { name: 'Dhule',            lat: 20.902, lng: 74.775, population: 247,   aqi: 78,  crimeRate: 160, rainfall: 600 },
    { name: 'Jalgaon',          lat: 21.008, lng: 75.563, population: 357,   aqi: 92,  crimeRate: 185, rainfall: 680 },
    { name: 'Latur',            lat: 18.408, lng: 76.576, population: 335,   aqi: 88,  crimeRate: 165, rainfall: 720 },
    { name: 'Parbhani',         lat: 19.268, lng: 76.771, population: 276,   aqi: 82,  crimeRate: 150, rainfall: 800 },
    { name: 'Akola',            lat: 20.709, lng: 77.007, population: 332,   aqi: 85,  crimeRate: 175, rainfall: 850 },
    { name: 'Yavatmal',         lat: 20.389, lng: 78.120, population: 199,   aqi: 78,  crimeRate: 155, rainfall: 980 },
    { name: 'Chandrapur',       lat: 19.962, lng: 79.296, population: 192,   aqi: 185, crimeRate: 195, rainfall: 1350 },
    { name: 'Wardha',           lat: 20.745, lng: 78.602, population: 206,   aqi: 72,  crimeRate: 145, rainfall: 1050 },
    { name: 'Gondia',           lat: 21.460, lng: 80.196, population: 240,   aqi: 62,  crimeRate: 130, rainfall: 1300 },
    { name: 'Bhandara',         lat: 21.167, lng: 79.650, population: 294,   aqi: 68,  crimeRate: 140, rainfall: 1250 },
    { name: 'Gadchiroli',       lat: 20.183, lng: 80.005, population: 69,    aqi: 45,  crimeRate: 120, rainfall: 1400 },
    { name: 'Raigad',           lat: 18.516, lng: 73.179, population: 363,   aqi: 95,  crimeRate: 200, rainfall: 3200 },
    { name: 'Ratnagiri',        lat: 16.990, lng: 73.298, population: 195,   aqi: 52,  crimeRate: 125, rainfall: 3500 },
    { name: 'Sindhudurg',       lat: 16.167, lng: 73.667, population: 154,   aqi: 42,  crimeRate: 95,  rainfall: 3200 },
    { name: 'Beed',             lat: 18.989, lng: 75.758, population: 243,   aqi: 92,  crimeRate: 170, rainfall: 550 },
    { name: 'Osmanabad',        lat: 18.186, lng: 76.042, population: 211,   aqi: 88,  crimeRate: 160, rainfall: 580 },
    { name: 'Buldhana',         lat: 20.530, lng: 76.184, population: 269,   aqi: 82,  crimeRate: 165, rainfall: 780 },
    { name: 'Washim',           lat: 20.101, lng: 77.152, population: 233,   aqi: 78,  crimeRate: 150, rainfall: 820 },
    { name: 'Hingoli',          lat: 19.716, lng: 77.147, population: 265,   aqi: 80,  crimeRate: 155, rainfall: 800 },
    { name: 'Jalna',            lat: 19.835, lng: 75.881, population: 246,   aqi: 88,  crimeRate: 165, rainfall: 700 },
    { name: 'Palghar',          lat: 19.697, lng: 72.765, population: 543,   aqi: 105, crimeRate: 220, rainfall: 2800 },
    { name: 'Nagpur (Rural)',   lat: 21.300, lng: 79.200, population: 282,   aqi: 72,  crimeRate: 145, rainfall: 1150 },
  ];

  async initialize(): Promise<void> {
    // Don't auto-enable
  }

  protected async loadData(): Promise<void> {
    this.clear();
    const points = this.getHeatmapPoints();

    // Sort by intensity descending so high-intensity points render on top
    points.sort((a, b) => a.intensity - b.intensity);

    for (const pt of points) {
      const color = this.getColorForIntensity(pt.intensity);
      const radius = 12 + pt.intensity * 28; // 12-40px based on intensity

      // Main glow circle
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(pt.lng, pt.lat, 0),
        ellipse: {
          semiMajorAxis: 8000 + pt.intensity * 15000,
          semiMinorAxis: 8000 + pt.intensity * 15000,
          material: color.withAlpha(this.config.opacity * (0.3 + pt.intensity * 0.5)),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outline: false,
        } as any,
      });

      // Core point
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(pt.lng, pt.lat, 0),
        point: {
          pixelSize: radius,
          color: color.withAlpha(this.config.opacity * (0.5 + pt.intensity * 0.5)),
          heightReference: HeightReference.CLAMP_TO_GROUND,
          outlineColor: Color.WHITE.withAlpha(0.6),
          outlineWidth: 1,
          scaleByDistance: new NearFarScalar(1e3, 1.2, 5e6, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${pt.label}\n${pt.value}`,
          font: '11px monospace',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 2, // FILL_AND_OUTLINE
          verticalOrigin: 1, // BOTTOM
          pixelOffset: new Cartesian3(0, -(radius + 8), 0),
          scaleByDistance: new NearFarScalar(1e3, 1.0, 5e6, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.BLACK.withAlpha(0.6),
          backgroundPadding: new Cartesian3(4, 2, 0),
        } as any,
      });
    }
  }

  private getHeatmapPoints(): HeatmapPoint[] {
    const popValues = this.districtData.map(d => d.population);
    const aqiValues = this.districtData.map(d => d.aqi);
    const crimeValues = this.districtData.map(d => d.crimeRate);
    const rainValues = this.districtData.map(d => d.rainfall);

    return this.districtData.map(d => {
      let intensity: number;
      let value: string;

      switch (this.currentMode) {
        case 'population':
          intensity = this.normalize(d.population, Math.min(...popValues), Math.max(...popValues));
          value = `${d.population.toLocaleString()} /km²`;
          break;
        case 'air-quality':
          intensity = this.normalize(d.aqi, 0, 200);
          value = `AQI ${d.aqi}`;
          break;
        case 'crime-rate':
          intensity = this.normalize(d.crimeRate, Math.min(...crimeValues), Math.max(...crimeValues));
          value = `${d.crimeRate} /100k`;
          break;
        case 'rainfall':
          intensity = this.normalize(d.rainfall, Math.min(...rainValues), Math.max(...rainValues));
          value = `${d.rainfall} mm`;
          break;
      }

      return { lat: d.lat, lng: d.lng, intensity, label: d.name, value };
    });
  }

  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private getColorForIntensity(t: number): Color {
    const colors = this.modeColors[this.currentMode];
    const low = Color.fromCssColorString(colors.low);
    const mid = Color.fromCssColorString(colors.mid);
    const high = Color.fromCssColorString(colors.high);

    if (t < 0.5) {
      return Color.lerp(low, mid, t * 2, new Color());
    }
    return Color.lerp(mid, high, (t - 0.5) * 2, new Color());
  }

  setMode(mode: HeatmapMode): void {
    this.currentMode = mode;
    if (this._enabled) {
      this.loadData();
    }
  }

  getMode(): HeatmapMode {
    return this.currentMode;
  }

  getAvailableModes(): Array<{ mode: HeatmapMode; label: string; icon: string }> {
    return [
      { mode: 'population', label: 'Population Density', icon: '👥' },
      { mode: 'air-quality', label: 'Air Quality Index', icon: '🌬️' },
      { mode: 'crime-rate',  label: 'Crime Rate', icon: '🚨' },
      { mode: 'rainfall',    label: 'Annual Rainfall', icon: '🌧️' },
    ];
  }
}
