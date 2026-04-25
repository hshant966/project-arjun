/**
 * NightMode — City lights at night effect, light pollution overlay
 * Cities glow based on population
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CityLight {
  name: string;
  lat: number;
  lng: number;
  population: number; // in millions
  glowRadiusKm: number;
  brightness: number; // 0-1
  type: 'megacity' | 'metropolitan' | 'city' | 'town';
}

interface LightPollutionZone {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  level: 'severe' | 'high' | 'moderate' | 'low';
}

// ─── City Data ───────────────────────────────────────────────────────────────

const CITY_LIGHTS: CityLight[] = [
  // Megacities (10M+)
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, population: 20.7, glowRadiusKm: 60, brightness: 1.0, type: 'megacity' },
  { name: 'Delhi NCR', lat: 28.7041, lng: 77.1025, population: 32.9, glowRadiusKm: 70, brightness: 1.0, type: 'megacity' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, population: 15.1, glowRadiusKm: 50, brightness: 0.95, type: 'megacity' },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946, population: 13.2, glowRadiusKm: 45, brightness: 0.9, type: 'megacity' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, population: 11.5, glowRadiusKm: 40, brightness: 0.9, type: 'megacity' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, population: 10.5, glowRadiusKm: 40, brightness: 0.88, type: 'megacity' },

  // Metropolitan (5-10M)
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, population: 8.6, glowRadiusKm: 35, brightness: 0.85, type: 'metropolitan' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, population: 7.4, glowRadiusKm: 30, brightness: 0.82, type: 'metropolitan' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, population: 4.1, glowRadiusKm: 25, brightness: 0.78, type: 'metropolitan' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, population: 4.0, glowRadiusKm: 25, brightness: 0.75, type: 'metropolitan' },
  { name: 'Kanpur', lat: 26.4499, lng: 80.3319, population: 3.6, glowRadiusKm: 22, brightness: 0.72, type: 'metropolitan' },
  { name: 'Nagpur', lat: 21.1458, lng: 79.0882, population: 3.4, glowRadiusKm: 22, brightness: 0.7, type: 'metropolitan' },
  { name: 'Indore', lat: 22.7196, lng: 75.8577, population: 3.3, glowRadiusKm: 20, brightness: 0.7, type: 'metropolitan' },
  { name: 'Surat', lat: 21.1702, lng: 72.8311, population: 7.2, glowRadiusKm: 30, brightness: 0.8, type: 'metropolitan' },

  // Major Cities (1-5M)
  { name: 'Patna', lat: 25.6093, lng: 85.1376, population: 2.5, glowRadiusKm: 18, brightness: 0.65, type: 'city' },
  { name: 'Bhopal', lat: 23.2599, lng: 77.4126, population: 2.4, glowRadiusKm: 18, brightness: 0.65, type: 'city' },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, population: 2.3, glowRadiusKm: 18, brightness: 0.65, type: 'city' },
  { name: 'Vadodara', lat: 22.3072, lng: 73.1812, population: 2.2, glowRadiusKm: 16, brightness: 0.62, type: 'city' },
  { name: 'Coimbatore', lat: 11.0168, lng: 76.9558, population: 2.1, glowRadiusKm: 16, brightness: 0.62, type: 'city' },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, population: 2.1, glowRadiusKm: 16, brightness: 0.62, type: 'city' },
  { name: 'Chandigarh', lat: 30.7333, lng: 76.7794, population: 1.6, glowRadiusKm: 14, brightness: 0.58, type: 'city' },
  { name: 'Mysore', lat: 12.2958, lng: 76.6394, population: 1.5, glowRadiusKm: 14, brightness: 0.58, type: 'city' },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, population: 1.7, glowRadiusKm: 14, brightness: 0.58, type: 'city' },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362, population: 1.5, glowRadiusKm: 14, brightness: 0.58, type: 'city' },
  { name: 'Varanasi', lat: 25.3176, lng: 82.9739, population: 1.8, glowRadiusKm: 15, brightness: 0.6, type: 'city' },
  { name: 'Amritsar', lat: 31.6340, lng: 74.8723, population: 1.4, glowRadiusKm: 13, brightness: 0.55, type: 'city' },
  { name: 'Jodhpur', lat: 26.2389, lng: 73.0243, population: 1.6, glowRadiusKm: 14, brightness: 0.58, type: 'city' },
  { name: 'Raipur', lat: 21.2514, lng: 81.6296, population: 1.4, glowRadiusKm: 13, brightness: 0.55, type: 'city' },
  { name: 'Ranchi', lat: 23.3441, lng: 85.3096, population: 1.5, glowRadiusKm: 14, brightness: 0.58, type: 'city' },
  { name: 'Dehradun', lat: 30.3165, lng: 78.0322, population: 0.8, glowRadiusKm: 10, brightness: 0.5, type: 'city' },
  { name: 'Shimla', lat: 31.1048, lng: 77.1734, population: 0.2, glowRadiusKm: 6, brightness: 0.4, type: 'town' },
  { name: 'Srinagar', lat: 34.0837, lng: 74.7973, population: 1.5, glowRadiusKm: 14, brightness: 0.55, type: 'city' },
];

const LIGHT_POLLUTION_ZONES: LightPollutionZone[] = [
  // Industrial corridors
  { name: 'Delhi-Mumbai Industrial Corridor', lat: 25.0, lng: 76.0, radiusKm: 300, level: 'high' },
  { name: 'Mumbai-Pune Industrial Belt', lat: 18.8, lng: 73.3, radiusKm: 80, level: 'severe' },
  { name: 'Bangalore-Mysore Tech Corridor', lat: 12.6, lng: 77.0, radiusKm: 60, level: 'high' },
  { name: 'Ahmedabad-Vadodara Corridor', lat: 22.7, lng: 72.9, radiusKm: 70, level: 'high' },
  { name: 'Chennai-Bangalore Corridor', lat: 12.5, lng: 78.8, radiusKm: 100, level: 'moderate' },
  { name: 'Ganga Plains (UP-Bihar)', lat: 26.0, lng: 83.0, radiusKm: 250, level: 'moderate' },
  { name: 'Kolkata Metropolitan', lat: 22.5, lng: 88.5, radiusKm: 60, level: 'severe' },
  // Dark sky zones
  { name: 'Ladakh Dark Sky', lat: 34.5, lng: 77.0, radiusKm: 100, level: 'low' },
  { name: 'Spiti Valley Dark Sky', lat: 32.5, lng: 78.0, radiusKm: 60, level: 'low' },
  { name: 'Great Rann of Kutch', lat: 23.8, lng: 69.5, radiusKm: 80, level: 'low' },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function cityGlowColor(population: number, brightness: number): Color {
  const r = Math.min(1.0, 0.9 * brightness);
  const g = Math.min(1.0, (0.6 + population * 0.01) * brightness);
  const b = Math.min(1.0, 0.2 * brightness);
  return new Color(r, g, b, 0.3 * brightness);
}

function pollutionColor(level: LightPollutionZone['level']): Color {
  switch (level) {
    case 'severe': return Color.fromCssColorString('#ff4400').withAlpha(0.15);
    case 'high': return Color.fromCssColorString('#ffaa00').withAlpha(0.12);
    case 'moderate': return Color.fromCssColorString('#ffee00').withAlpha(0.08);
    case 'low': return Color.fromCssColorString('#0044ff').withAlpha(0.05);
  }
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class NightMode extends BaseLayer {
  config: LayerConfig = {
    id: 'night-mode',
    name: 'Night Mode / Light Pollution',
    icon: '🌙',
    description: 'City lights at night, light pollution overlay, population-based glow',
    category: 'intelligence',
    color: '#ffcc44',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'nightmode',
  };

  protected async loadData(): Promise<void> {
    this.renderCityLights();
    this.renderLightPollution();
  }

  private renderCityLights(): void {
    for (const city of CITY_LIGHTS) {
      const glowColor = cityGlowColor(city.population, city.brightness);

      // Outer glow
      this.dataSource.entities.add({
        name: `Night: ${city.name} (glow)`,
        position: Cartesian3.fromDegrees(city.lng, city.lat, 0),
        ellipse: {
          semiMajorAxis: city.glowRadiusKm * 1000,
          semiMinorAxis: city.glowRadiusKm * 1000,
          material: glowColor,
          outline: false,
          height: 0,
        },
      });

      // Inner bright core
      const coreColor = new Color(
        Math.min(1, glowColor.red * 1.5),
        Math.min(1, glowColor.green * 1.3),
        glowColor.blue,
        glowColor.alpha * 2,
      );
      this.dataSource.entities.add({
        name: `Night: ${city.name} (core)`,
        position: Cartesian3.fromDegrees(city.lng, city.lat, 0),
        ellipse: {
          semiMajorAxis: city.glowRadiusKm * 300,
          semiMinorAxis: city.glowRadiusKm * 300,
          material: coreColor,
          outline: false,
          height: 0,
        },
      });

      // City label
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(city.lng, city.lat, 2000),
        label: {
          text: `🌙 ${city.name}`,
          font: '12px sans-serif',
          fillColor: Color.fromCssColorString('#ffdd88'),
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(0, -18),
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
        },
        point: {
          pixelSize: 4 + city.population / 3,
          color: new Color(1, 0.9, 0.5, city.brightness),
          outlineColor: Color.WHITE,
          outlineWidth: 1,
        },
        description: `
          <h3>🌙 ${city.name}</h3>
          <table>
            <tr><td><b>Population</b></td><td>${city.population}M</td></tr>
            <tr><td><b>Type</b></td><td>${city.type}</td></tr>
            <tr><td><b>Glow Radius</b></td><td>${city.glowRadiusKm} km</td></tr>
            <tr><td><b>Brightness</b></td><td>${Math.round(city.brightness * 100)}%</td></tr>
            <tr><td><b>Coordinates</b></td><td>${city.lat.toFixed(4)}, ${city.lng.toFixed(4)}</td></tr>
          </table>
          <p><small>Population-based light simulation</small></p>
        `,
      });
    }
  }

  private renderLightPollution(): void {
    for (const zone of LIGHT_POLLUTION_ZONES) {
      const color = pollutionColor(zone.level);

      this.dataSource.entities.add({
        name: `Light Pollution: ${zone.name}`,
        position: Cartesian3.fromDegrees(zone.lng, zone.lat, 0),
        ellipse: {
          semiMajorAxis: zone.radiusKm * 1000,
          semiMinorAxis: zone.radiusKm * 1000,
          material: color,
          outline: true,
          outlineColor: color.withAlpha(0.3),
          outlineWidth: 1,
          height: 0,
        },
        description: `
          <h3>💡 ${zone.name}</h3>
          <table>
            <tr><td><b>Pollution Level</b></td><td>${zone.level}</td></tr>
            <tr><td><b>Radius</b></td><td>${zone.radiusKm} km</td></tr>
            <tr><td><b>Coordinates</b></td><td>${zone.lat.toFixed(2)}, ${zone.lng.toFixed(2)}</td></tr>
          </table>
        `,
      });
    }
  }
}
