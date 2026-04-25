/**
 * OSM Buildings Layer — FREE 3D building extrusions
 * Workaround for Google Photorealistic 3D Tiles (paid)
 * Uses Cesium OSM Buildings via Cesium ion (free tier) or simulated extrusions
 */
import {
  Viewer, Cartesian3, Color, HeightReference,
  Cesium3DTileset, Cesium3DTileStyle,
  Entity, PolygonGraphics, CallbackProperty,
  EllipsoidTerrainProvider,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

// Major Indian city building clusters (simulated 3D extrusions)
const INDIAN_CITIES = [
  { name: 'Delhi', lon: 77.2090, lat: 28.6139, buildings: 85, radius: 0.08 },
  { name: 'Mumbai', lon: 72.8777, lat: 19.0760, buildings: 95, radius: 0.06 },
  { name: 'Bangalore', lon: 77.5946, lat: 12.9716, buildings: 70, radius: 0.07 },
  { name: 'Chennai', lon: 80.2707, lat: 13.0827, buildings: 55, radius: 0.06 },
  { name: 'Kolkata', lon: 88.3639, lat: 22.5726, buildings: 60, radius: 0.07 },
  { name: 'Hyderabad', lon: 78.4867, lat: 17.3850, buildings: 50, radius: 0.06 },
  { name: 'Ahmedabad', lon: 72.5714, lat: 23.0225, buildings: 40, radius: 0.05 },
  { name: 'Pune', lon: 73.8567, lat: 18.5204, buildings: 45, radius: 0.05 },
  { name: 'Jaipur', lon: 75.7873, lat: 26.9124, buildings: 35, radius: 0.05 },
  { name: 'Lucknow', lon: 80.9462, lat: 26.8467, buildings: 30, radius: 0.04 },
];

export class OSMBuildingsLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'osm-buildings',
    name: '3D Buildings (OSM)',
    icon: '🏙️',
    description: 'Free 3D building extrusions for major Indian cities — no paid tiles needed',
    category: 'intelligence',
    color: '#8B9DC3',
    enabled: false,
    opacity: 0.7,
    dataStoreKey: 'osm-buildings',
  };

  private tiles: Cesium3DTileset | null = null;

  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore);
  }

  protected async loadData(): Promise<void> {
    // Try loading Cesium OSM Buildings (free with default ion token)
    try {
      this.tiles = await Cesium3DTileset.fromIonAssetId(96188);
      this.tiles.style = new Cesium3DTileStyle({
        color: {
          conditions: [
            ['${height} > 200', 'color("#4A90D9", 0.8)'],
            ['${height} > 100', 'color("#5BA0E0", 0.7)'],
            ['${height} > 50', 'color("#7CB8E8", 0.6)'],
            ['true', 'color("#9CCCF0", 0.5)'],
          ],
        },
      });
      this.viewer.scene.primitives.add(this.tiles);
    } catch {
      // Fallback: generate simulated building extrusions for Indian cities
      console.log('[OSMBuildings] Ion tileset unavailable, generating simulated buildings');
      this.generateSimulatedBuildings();
    }
  }

  private generateSimulatedBuildings(): void {
    const seed = 42;
    let rng = seed;
    const pseudoRandom = () => {
      rng = (rng * 16807) % 2147483647;
      return (rng - 1) / 2147483646;
    };

    for (const city of INDIAN_CITIES) {
      for (let i = 0; i < city.buildings; i++) {
        const angle = pseudoRandom() * Math.PI * 2;
        const dist = pseudoRandom() * city.radius;
        const lon = city.lon + Math.cos(angle) * dist;
        const lat = city.lat + Math.sin(angle) * dist;
        const height = 10 + pseudoRandom() * 200;
        const width = 0.0005 + pseudoRandom() * 0.002;
        const depth = 0.0005 + pseudoRandom() * 0.002;

        const color = height > 150
          ? Color.fromCssColorString('#4A90D9').withAlpha(0.7)
          : height > 80
            ? Color.fromCssColorString('#7CB8E8').withAlpha(0.6)
            : Color.fromCssColorString('#B0C4DE').withAlpha(0.5);

        this.dataSource.entities.add({
          name: `${city.name} Building #${i}`,
          position: Cartesian3.fromDegrees(lon, lat, height / 2),
          box: {
            dimensions: new Cartesian3(width * 111000, depth * 111000, height),
            material: color,
            outline: true,
            outlineColor: Color.WHITE.withAlpha(0.2),
          },
        });
      }
    }
  }

  async enable(): Promise<void> {
    await super.enable();
  }

  async disable(): Promise<void> {
    if (this.tiles) {
      this.viewer.scene.primitives.remove(this.tiles);
      this.tiles = null;
    }
    await super.disable();
  }
}
