/**
 * DataDensityOverlay — Data coverage gaps, confidence scoring, source reliability
 * Shows areas with less monitoring and data quality indicators
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CoverageZone {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  coverage: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
  dataSources: number;
  lastUpdate: string;
  category: 'weather' | 'seismic' | 'air_quality' | 'satellite' | 'ground_sensor';
}

interface DataGap {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  type: 'no_coverage' | 'sparse' | 'outdated' | 'unreliable';
  description: string;
  affectedLayers: string[];
}

interface SourceReliability {
  name: string;
  lat: number;
  lng: number;
  reliability: number; // 0-100
  category: string;
  updateFrequency: string;
  sourceType: 'government' | 'satellite' | 'sensor' | 'crowdsource' | 'api';
}

// ─── Coverage Data ───────────────────────────────────────────────────────────

const COVERAGE_ZONES: CoverageZone[] = [
  // Weather stations
  { name: 'Delhi Weather Network', lat: 28.7, lng: 77.1, radiusKm: 80, coverage: 'excellent', dataSources: 45, lastUpdate: '2026-04-25', category: 'weather' },
  { name: 'Mumbai Weather Network', lat: 19.1, lng: 72.9, radiusKm: 70, coverage: 'excellent', dataSources: 38, lastUpdate: '2026-04-25', category: 'weather' },
  { name: 'Bangalore Weather Network', lat: 13.0, lng: 77.6, radiusKm: 60, coverage: 'good', dataSources: 28, lastUpdate: '2026-04-25', category: 'weather' },
  { name: 'NE India Weather', lat: 26.0, lng: 93.0, radiusKm: 200, coverage: 'poor', dataSources: 8, lastUpdate: '2026-04-24', category: 'weather' },
  { name: 'Rajasthan Desert Weather', lat: 27.0, lng: 71.0, radiusKm: 200, coverage: 'moderate', dataSources: 12, lastUpdate: '2026-04-25', category: 'weather' },
  { name: 'Central India Weather', lat: 22.0, lng: 79.0, radiusKm: 150, coverage: 'moderate', dataSources: 15, lastUpdate: '2026-04-25', category: 'weather' },

  // Seismic monitoring
  { name: 'Himalayan Seismic Zone', lat: 31.0, lng: 78.0, radiusKm: 200, coverage: 'good', dataSources: 32, lastUpdate: '2026-04-25', category: 'seismic' },
  { name: 'Koyna Seismic Zone', lat: 17.4, lng: 73.8, radiusKm: 50, coverage: 'excellent', dataSources: 15, lastUpdate: '2026-04-25', category: 'seismic' },
  { name: 'NE India Seismic', lat: 26.5, lng: 93.0, radiusKm: 150, coverage: 'moderate', dataSources: 10, lastUpdate: '2026-04-25', category: 'seismic' },
  { name: 'Kutch Seismic Zone', lat: 23.5, lng: 70.0, radiusKm: 80, coverage: 'good', dataSources: 18, lastUpdate: '2026-04-25', category: 'seismic' },

  // Air quality
  { name: 'Delhi NCR AQI', lat: 28.6, lng: 77.2, radiusKm: 60, coverage: 'excellent', dataSources: 85, lastUpdate: '2026-04-25', category: 'air_quality' },
  { name: 'Mumbai AQI', lat: 19.1, lng: 72.9, radiusKm: 50, coverage: 'good', dataSources: 42, lastUpdate: '2026-04-25', category: 'air_quality' },
  { name: 'Rural India AQI', lat: 23.0, lng: 80.0, radiusKm: 500, coverage: 'poor', dataSources: 5, lastUpdate: '2026-04-23', category: 'air_quality' },
  { name: 'Tribal Areas AQI', lat: 22.0, lng: 83.0, radiusKm: 200, coverage: 'critical', dataSources: 2, lastUpdate: '2026-04-20', category: 'air_quality' },

  // Satellite coverage
  { name: 'Full India Satellite', lat: 20.0, lng: 80.0, radiusKm: 1500, coverage: 'good', dataSources: 8, lastUpdate: '2026-04-25', category: 'satellite' },
  { name: 'High-res Urban Satellite', lat: 22.0, lng: 78.0, radiusKm: 800, coverage: 'excellent', dataSources: 12, lastUpdate: '2026-04-25', category: 'satellite' },

  // Ground sensors
  { name: 'Punjab Ground Sensors', lat: 31.0, lng: 75.5, radiusKm: 100, coverage: 'good', dataSources: 55, lastUpdate: '2026-04-25', category: 'ground_sensor' },
  { name: 'Kerala Ground Sensors', lat: 10.0, lng: 76.5, radiusKm: 80, coverage: 'good', dataSources: 40, lastUpdate: '2026-04-25', category: 'ground_sensor' },
  { name: 'Andaman Islands', lat: 12.0, lng: 92.5, radiusKm: 150, coverage: 'poor', dataSources: 5, lastUpdate: '2026-04-23', category: 'ground_sensor' },
];

const DATA_GAPS: DataGap[] = [
  { name: 'Ladakh Remote Areas', lat: 34.5, lng: 78.0, radiusKm: 150, type: 'sparse', description: 'Harsh terrain limits sensor deployment', affectedLayers: ['weather', 'air_quality', 'ground_sensor'] },
  { name: 'Arunachal Pradesh Border', lat: 28.5, lng: 96.0, radiusKm: 120, type: 'sparse', description: 'Restricted border area, limited access', affectedLayers: ['weather', 'seismic', 'ground_sensor'] },
  { name: 'Sundarbans Delta', lat: 21.8, lng: 89.0, radiusKm: 60, type: 'no_coverage', description: 'Dense mangrove, inaccessible terrain', affectedLayers: ['ground_sensor', 'air_quality'] },
  { name: 'Thar Desert Deep', lat: 26.5, lng: 70.0, radiusKm: 100, type: 'sparse', description: 'Vast desert with sparse population', affectedLayers: ['weather', 'air_quality'] },
  { name: 'Central Tribal Belt', lat: 22.5, lng: 83.5, radiusKm: 150, type: 'unreliable', description: 'Dense forest, connectivity issues', affectedLayers: ['weather', 'air_quality', 'ground_sensor'] },
  { name: 'Andaman Sea', lat: 10.0, lng: 93.0, radiusKm: 200, type: 'sparse', description: 'Ocean area, limited buoy network', affectedLayers: ['weather', 'seismic'] },
  { name: 'Lakshadweep Islands', lat: 10.5, lng: 72.5, radiusKm: 80, type: 'outdated', description: 'Remote islands, infrequent updates', affectedLayers: ['weather', 'satellite'] },
  { name: 'Siachen Glacier', lat: 35.5, lng: 77.0, radiusKm: 40, type: 'sparse', description: 'Extreme altitude, military zone', affectedLayers: ['weather', 'seismic'] },
];

const SOURCE_RELIABILITY: SourceReliability[] = [
  { name: 'IMD Headquarters', lat: 28.6, lng: 77.2, reliability: 98, category: 'Weather', updateFrequency: 'Hourly', sourceType: 'government' },
  { name: 'ISRO Bhuvan', lat: 13.0, lng: 77.6, reliability: 95, category: 'Satellite', updateFrequency: 'Daily', sourceType: 'satellite' },
  { name: 'IMD Doppler Radar Mumbai', lat: 19.1, lng: 72.9, reliability: 92, category: 'Weather', updateFrequency: '15 min', sourceType: 'government' },
  { name: 'CPCB Delhi', lat: 28.6, lng: 77.2, reliability: 90, category: 'Air Quality', updateFrequency: 'Hourly', sourceType: 'government' },
  { name: 'USGS Seismic Feed', lat: 20.0, lng: 80.0, reliability: 95, category: 'Seismic', updateFrequency: 'Real-time', sourceType: 'api' },
  { name: 'Open-Meteo Feed', lat: 20.0, lng: 80.0, reliability: 85, category: 'Weather', updateFrequency: 'Hourly', sourceType: 'api' },
  { name: 'GDELT News Feed', lat: 20.0, lng: 80.0, reliability: 70, category: 'News', updateFrequency: '15 min', sourceType: 'api' },
  { name: 'SAFAR AQI Network', lat: 19.0, lng: 73.0, reliability: 88, category: 'Air Quality', updateFrequency: 'Hourly', sourceType: 'government' },
  { name: 'Crowdsource Reports', lat: 22.0, lng: 78.0, reliability: 45, category: 'Various', updateFrequency: 'Random', sourceType: 'crowdsource' },
  { name: 'Private Sensor Network', lat: 25.0, lng: 77.0, reliability: 72, category: 'IoT Sensors', updateFrequency: '5 min', sourceType: 'sensor' },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function coverageColor(coverage: CoverageZone['coverage']): Color {
  switch (coverage) {
    case 'excellent': return Color.fromCssColorString('#00ff00').withAlpha(0.12);
    case 'good': return Color.fromCssColorString('#88ff00').withAlpha(0.1);
    case 'moderate': return Color.fromCssColorString('#ffcc00').withAlpha(0.08);
    case 'poor': return Color.fromCssColorString('#ff8800').withAlpha(0.1);
    case 'critical': return Color.fromCssColorString('#ff0000').withAlpha(0.12);
  }
}

function gapColor(type: DataGap['type']): Color {
  switch (type) {
    case 'no_coverage': return Color.fromCssColorString('#ff0000').withAlpha(0.15);
    case 'sparse': return Color.fromCssColorString('#ff8800').withAlpha(0.12);
    case 'outdated': return Color.fromCssColorString('#ffcc00').withAlpha(0.1);
    case 'unreliable': return Color.fromCssColorString('#ff44ff').withAlpha(0.1);
  }
}

function reliabilityColor(score: number): Color {
  if (score >= 90) return Color.GREEN;
  if (score >= 75) return Color.fromCssColorString('#88ff00');
  if (score >= 60) return Color.YELLOW;
  if (score >= 40) return Color.ORANGE;
  return Color.RED;
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class DataDensityOverlay extends BaseLayer {
  config: LayerConfig = {
    id: 'data-density',
    name: 'Data Coverage & Reliability',
    icon: '📊',
    description: 'Data coverage gaps, confidence scoring, source reliability indicators',
    category: 'intelligence',
    color: '#88aaff',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'datadensity',
  };

  protected async loadData(): Promise<void> {
    this.renderCoverageZones();
    this.renderDataGaps();
    this.renderSourceReliability();
  }

  private renderCoverageZones(): void {
    for (const zone of COVERAGE_ZONES) {
      const color = coverageColor(zone.coverage);

      this.dataSource.entities.add({
        name: `Coverage: ${zone.name}`,
        position: Cartesian3.fromDegrees(zone.lng, zone.lat, 0),
        ellipse: {
          semiMajorAxis: zone.radiusKm * 1000,
          semiMinorAxis: zone.radiusKm * 1000,
          material: color,
          outline: true,
          outlineColor: color.withAlpha(0.4),
          outlineWidth: 1,
          height: 0,
        },
        description: `
          <h3>📊 ${zone.name}</h3>
          <table>
            <tr><td><b>Coverage</b></td><td>${zone.coverage}</td></tr>
            <tr><td><b>Category</b></td><td>${zone.category}</td></tr>
            <tr><td><b>Data Sources</b></td><td>${zone.dataSources}</td></tr>
            <tr><td><b>Radius</b></td><td>${zone.radiusKm} km</td></tr>
            <tr><td><b>Last Update</b></td><td>${zone.lastUpdate}</td></tr>
          </table>
        `,
      });
    }
  }

  private renderDataGaps(): void {
    for (const gap of DATA_GAPS) {
      const color = gapColor(gap.type);
      const borderColor = color.withAlpha(0.5);

      this.dataSource.entities.add({
        name: `Data Gap: ${gap.name}`,
        position: Cartesian3.fromDegrees(gap.lng, gap.lat, 0),
        ellipse: {
          semiMajorAxis: gap.radiusKm * 1000,
          semiMinorAxis: gap.radiusKm * 1000,
          material: color,
          outline: true,
          outlineColor: borderColor,
          outlineWidth: 2,
          height: 0,
        },
        label: {
          text: `⚠️ ${gap.name}`,
          font: '11px sans-serif',
          fillColor: Color.fromCssColorString('#ff8888'),
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
        },
        description: `
          <h3>⚠️ Data Gap: ${gap.name}</h3>
          <table>
            <tr><td><b>Type</b></td><td>${gap.type.replace(/_/g, ' ')}</td></tr>
            <tr><td><b>Description</b></td><td>${gap.description}</td></tr>
            <tr><td><b>Radius</b></td><td>${gap.radiusKm} km</td></tr>
            <tr><td><b>Affected Layers</b></td><td>${gap.affectedLayers.join(', ')}</td></tr>
          </table>
        `,
      });
    }
  }

  private renderSourceReliability(): void {
    for (const src of SOURCE_RELIABILITY) {
      const color = reliabilityColor(src.reliability);

      this.dataSource.entities.add({
        name: `Source: ${src.name}`,
        position: Cartesian3.fromDegrees(src.lng, src.lat, 3000),
        point: {
          pixelSize: 8,
          color: color.withAlpha(0.9),
          outlineColor: Color.WHITE,
          outlineWidth: 1,
          heightReference: HeightReference.NONE,
        },
        label: {
          text: `${src.reliability}% ${src.name}`,
          font: '11px sans-serif',
          fillColor: color,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(14, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.3),
        },
        description: `
          <h3>📡 ${src.name}</h3>
          <table>
            <tr><td><b>Reliability</b></td><td style="color:${color.toCssColorString()};font-weight:bold">${src.reliability}%</td></tr>
            <tr><td><b>Category</b></td><td>${src.category}</td></tr>
            <tr><td><b>Source Type</b></td><td>${src.sourceType}</td></tr>
            <tr><td><b>Update Frequency</b></td><td>${src.updateFrequency}</td></tr>
          </table>
        `,
      });
    }
  }
}
