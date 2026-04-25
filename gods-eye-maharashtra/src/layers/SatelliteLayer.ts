/**
 * SatelliteLayer — Satellite tracking and imagery availability
 */
import { Viewer, Cartesian3, Color, HeightReference, SampledPositionProperty, JulianDate, ClockRange, ClockStep } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

export class SatelliteLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'satellites',
    name: 'Satellite Coverage',
    icon: '🛰️',
    description: 'Satellite passes over Maharashtra - optical, SAR, and weather satellites',
    category: 'global',
    color: '#e040fb',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'satellites',
  };

  // Notable satellites and their characteristics
  private satellites = [
    { name: 'Sentinel-2A', type: 'Optical', provider: 'ESA', resolution: '10m', revisit: '5 days', purpose: 'Land monitoring, vegetation' },
    { name: 'Sentinel-2B', type: 'Optical', provider: 'ESA', resolution: '10m', revisit: '5 days', purpose: 'Land monitoring, vegetation' },
    { name: 'Sentinel-1A', type: 'SAR', provider: 'ESA', resolution: '5m', revisit: '12 days', purpose: 'All-weather, flood mapping' },
    { name: 'Landsat-9', type: 'Optical', provider: 'NASA/USGS', resolution: '30m', revisit: '16 days', purpose: 'Land use change' },
    { name: 'MODIS (Terra)', type: 'Multispectral', provider: 'NASA', resolution: '250m', revisit: 'Daily', purpose: 'Fire detection, weather' },
    { name: 'VIIRS (Suomi NPP)', type: 'Multispectral', provider: 'NASA/NOAA', resolution: '375m', revisit: 'Daily', purpose: 'Night lights, fire, weather' },
    { name: 'Resourcesat-2A', type: 'Optical', provider: 'ISRO', resolution: '5.8m', revisit: '24 days', purpose: 'Resource mapping' },
    { name: 'Cartosat-3', type: 'Optical', provider: 'ISRO', resolution: '0.25m', revisit: '15 days', purpose: 'High-res mapping' },
    { name: 'RISAT-2B', type: 'SAR', provider: 'ISRO', resolution: '1m', revisit: 'Variable', purpose: 'All-weather surveillance' },
    { name: 'GSAT-30', type: 'Communication', provider: 'ISRO', resolution: 'N/A', revisit: 'N/A', purpose: 'Telecom broadcast' },
  ];

  protected async loadData(): Promise<void> {
    this.clear();

    // Display satellite info as clickable markers at Maharashtra center
    const mhCenter = { lat: 19.66, lng: 75.7 };

    for (let i = 0; i < this.satellites.length; i++) {
      const sat = this.satellites[i];
      const angle = (i / this.satellites.length) * 2 * Math.PI;
      const radius = 1.5; // degrees
      const lat = mhCenter.lat + Math.sin(angle) * radius;
      const lng = mhCenter.lng + Math.cos(angle) * radius;

      const color = sat.type === 'Optical' ? '#00e5ff' :
                    sat.type === 'SAR' ? '#ff4081' :
                    sat.type === 'Multispectral' ? '#76ff03' : '#ffc107';

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(lng, lat, 500000),
        point: {
          pixelSize: 10,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          outlineColor: Color.WHITE,
          outlineWidth: 1,
        },
        description: `
          <h3>🛰️ ${sat.name}</h3>
          <table class="cesium-infoBox-defaultTable">
            <tr><td>Type</td><td>${sat.type}</td></tr>
            <tr><td>Provider</td><td>${sat.provider}</td></tr>
            <tr><td>Resolution</td><td>${sat.resolution}</td></tr>
            <tr><td>Revisit Period</td><td>${sat.revisit}</td></tr>
            <tr><td>Purpose</td><td>${sat.purpose}</td></tr>
          </table>
        `,
      });
    }

    // Add coverage circle for Maharashtra
    const positions: Cartesian3[] = [];
    for (let i = 0; i <= 360; i += 5) {
      const rad = (i * Math.PI) / 180;
      positions.push(Cartesian3.fromDegrees(
        mhCenter.lng + Math.cos(rad) * 4,
        mhCenter.lat + Math.sin(rad) * 4,
        0
      ));
    }

    this.dataSource.entities.add({
      polyline: {
        positions,
        width: 1,
        material: Color.fromCssColorString('#e040fb').withAlpha(0.3),
        clampToGround: true,
      },
    });
  }
}
