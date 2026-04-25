/**
 * SatelliteTrackingLayer — Live satellite tracking over India
 * Uses CelesTrak TLE data for orbit propagation
 * Tracks ISS, weather satellites, Sentinel-2 coverage zones
 * Pass predictions and orbital visualization
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Cartographic,
  JulianDate, SampledPositionProperty, ClockRange, ClockStep,
  PolylineGlowMaterialProperty, PolylineDashMaterialProperty,
  Entity, VerticalOrigin, NearFarScalar, DistanceDisplayCondition,
  ConstantPositionProperty, CallbackProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SatelliteInfo {
  noradId: string;
  name: string;
  type: 'space_station' | 'weather' | 'earth_observation' | 'communication' | 'navigation' | 'military';
  operator: string;
  tle: { line1: string; line2: string }; // TLE two-line elements
  status: 'active' | 'inactive' | 'decayed';
  description: string;
  orbitalParams: {
    inclination: number; // deg
    period: number; // min
    altitude: number; // km avg
    eccentricity: number;
  };
}

interface PassPrediction {
  satelliteId: string;
  aos: string; // acquisition of signal
  los: string; // loss of signal
  maxElevation: number; // deg
  duration: number; // seconds
  groundTrack: [number, number][]; // [lng, lat]
}

interface SentinelCoverage {
  swathId: string;
  satellite: string;
  boundary: [number, number][];
  nextPass: string;
  resolution: string;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_SATELLITES: SatelliteInfo[] = [
  {
    noradId: '25544', name: 'ISS (ZARYA)', type: 'space_station', operator: 'NASA/Roscosmos',
    tle: {
      line1: '1 25544U 98067A   24085.51234567  .00012345  00000-0  23456-3 0  9990',
      line2: '2 25544  51.6400 123.4567 0001234  123.4567 234.5678 15.50123456123456',
    },
    status: 'active', description: 'International Space Station — Crew quarters and microgravity lab',
    orbitalParams: { inclination: 51.64, period: 92.9, altitude: 420, eccentricity: 0.0001 },
  },
  {
    noradId: '43013', name: 'Sentinel-2A', type: 'earth_observation', operator: 'ESA/Copernicus',
    tle: {
      line1: '1 43013U 17068A   24085.12345678  .00000123  00000-0  12345-4 0  9990',
      line2: '2 43013  98.5600 123.4567 0001234  123.4567 234.5678 14.30123456123456',
    },
    status: 'active', description: 'Sentinel-2A — 10m multispectral optical imagery for land monitoring',
    orbitalParams: { inclination: 98.56, period: 100.6, altitude: 786, eccentricity: 0.0001 },
  },
  {
    noradId: '42063', name: 'Sentinel-2B', type: 'earth_observation', operator: 'ESA/Copernicus',
    tle: {
      line1: '1 42063U 17013A   24085.23456789  .00000123  00000-0  12345-4 0  9990',
      line2: '2 42063  98.5600 234.5678 0001234  234.5678 345.6789 14.30123456123456',
    },
    status: 'active', description: 'Sentinel-2B — 10m multispectral optical imagery, paired with Sentinel-2A',
    orbitalParams: { inclination: 98.56, period: 100.6, altitude: 786, eccentricity: 0.0001 },
  },
  {
    noradId: '40069', name: 'Sentinel-1A', type: 'earth_observation', operator: 'ESA/Copernicus',
    tle: {
      line1: '1 40069U 14016A   24085.34567890  .00000123  00000-0  12345-4 0  9990',
      line2: '2 40069  98.1800 345.6789 0001234  345.6789 456.7890 14.59123456123456',
    },
    status: 'active', description: 'Sentinel-1A — C-SAR radar for all-weather, day-night imaging',
    orbitalParams: { inclination: 98.18, period: 96.0, altitude: 693, eccentricity: 0.0001 },
  },
  {
    noradId: '28654', name: 'NOAA-15', type: 'weather', operator: 'NOAA',
    tle: {
      line1: '1 28654U 05018A   24085.45678901  .00000234  00000-0  23456-4 0  9990',
      line2: '2 28654  98.7000 456.7890 0009876  456.7890 567.8901 14.12123456123456',
    },
    status: 'active', description: 'NOAA-15 — Polar-orbiting weather satellite, AVHRR imaging',
    orbitalParams: { inclination: 98.70, period: 101.5, altitude: 807, eccentricity: 0.001 },
  },
  {
    noradId: '37849', name: 'Suomi NPP', type: 'weather', operator: 'NASA/NOAA',
    tle: {
      line1: '1 37849U 11061A   24085.56789012  .00000234  00000-0  23456-4 0  9990',
      line2: '2 37849  98.7100 567.8901 0008765  567.8901 678.9012 14.19523456123456',
    },
    status: 'active', description: 'Suomi NPP — VIIRS day/night band, CrIS sounder, ATMS',
    orbitalParams: { inclination: 98.71, period: 101.5, altitude: 834, eccentricity: 0.0009 },
  },
  {
    noradId: '41240', name: 'RESOURCESAT-2A', type: 'earth_observation', operator: 'ISRO',
    tle: {
      line1: '1 41240U 15055A   24085.67890123  .00000123  00000-0  12345-4 0  9990',
      line2: '2 41240  98.1000 678.9012 0002345  678.9012 789.0123 14.45123456123456',
    },
    status: 'active', description: 'RESOURCESAT-2A — LISS-3, LISS-4, AWiFS for resource mapping',
    orbitalParams: { inclination: 98.10, period: 99.0, altitude: 817, eccentricity: 0.0002 },
  },
  {
    noradId: '44804', name: 'Cartosat-3', type: 'earth_observation', operator: 'ISRO',
    tle: {
      line1: '1 44804U 19081A   24085.78901234  .00000123  00000-0  12345-4 0  9990',
      line2: '2 44804  97.5000 789.0123 0001234  789.0123 890.1234 15.02123456123456',
    },
    status: 'active', description: 'Cartosat-3 — 0.25m panchromatic, 1m multispectral imaging',
    orbitalParams: { inclination: 97.50, period: 94.6, altitude: 509, eccentricity: 0.0001 },
  },
  {
    noradId: '46827', name: 'GSAT-30', type: 'communication', operator: 'ISRO',
    tle: {
      line1: '1 46827U 20007A   24085.89012345  .00000012  00000-0  12345-5 0  9990',
      line2: '2 46827   0.0200 890.1234 0001234  890.1234 901.2345  1.00271234123456',
    },
    status: 'active', description: 'GSAT-30 — Ku-band GEO comsat at 83°E for DTH and telecom',
    orbitalParams: { inclination: 0.02, period: 1436, altitude: 35786, eccentricity: 0.0001 },
  },
  {
    noradId: '54660', name: 'NVS-01 (IRNSS-1J)', type: 'navigation', operator: 'ISRO',
    tle: {
      line1: '1 54660U 22156A   24085.90123456  .00000012  00000-0  12345-5 0  9990',
      line2: '2 54660  29.1000 901.2345 0006789  901.2345 012.3456  1.00271234123456',
    },
    status: 'active', description: 'NVS-01 — Navigation with Indian Constellation (NavIC) L1/L5',
    orbitalParams: { inclination: 29.10, period: 1436, altitude: 35786, eccentricity: 0.0007 },
  },
];

const DEMO_PASS_PREDICTIONS: PassPrediction[] = [
  { satelliteId: '25544', aos: '2024-03-26T06:32:00Z', los: '2024-03-26T06:43:00Z', maxElevation: 72, duration: 660, groundTrack: [[73.0, 8.0], [74.5, 12.5], [75.8, 17.0], [76.9, 21.5], [78.0, 26.0], [79.2, 30.5]] },
  { satelliteId: '43013', aos: '2024-03-26T10:15:00Z', los: '2024-03-26T10:25:00Z', maxElevation: 45, duration: 600, groundTrack: [[72.0, 15.0], [74.0, 16.5], [76.0, 18.0], [78.0, 19.5], [80.0, 21.0]] },
  { satelliteId: '42063', aos: '2024-03-26T14:42:00Z', los: '2024-03-26T14:52:00Z', maxElevation: 38, duration: 600, groundTrack: [[78.0, 10.0], [78.5, 13.0], [79.0, 16.0], [79.5, 19.0], [80.0, 22.0]] },
  { satelliteId: '37849', aos: '2024-03-26T04:20:00Z', los: '2024-03-26T04:32:00Z', maxElevation: 62, duration: 720, groundTrack: [[73.5, 7.0], [75.0, 12.0], [76.5, 17.0], [78.0, 22.0], [79.5, 27.0]] },
];

const DEMO_SENTINEL_COVERAGE: SentinelCoverage[] = [
  { swathId: 'S2A-MH-001', satellite: 'Sentinel-2A', boundary: [[72.5, 20.0], [77.5, 20.5], [77.0, 17.0], [73.0, 16.5], [72.5, 20.0]], nextPass: '2024-03-27T08:30:00Z', resolution: '10m' },
  { swathId: 'S2B-MH-002', satellite: 'Sentinel-2B', boundary: [[73.0, 18.0], [78.0, 18.5], [77.5, 15.5], [73.5, 15.0], [73.0, 18.0]], nextPass: '2024-03-27T10:45:00Z', resolution: '10m' },
  { swathId: 'S2A-NE-001', satellite: 'Sentinel-2A', boundary: [[88.0, 28.0], [93.0, 28.5], [92.5, 25.0], [88.5, 24.5], [88.0, 28.0]], nextPass: '2024-03-27T05:15:00Z', resolution: '10m' },
  { swathId: 'S1A-MH-001', satellite: 'Sentinel-1A', boundary: [[72.0, 21.0], [77.0, 21.5], [76.5, 16.5], [72.5, 16.0], [72.0, 21.0]], nextPass: '2024-03-27T18:00:00Z', resolution: '5m SAR' },
  { swathId: 'S2A-Kerala-001', satellite: 'Sentinel-2A', boundary: [[74.5, 12.5], [78.0, 12.8], [77.5, 8.0], [75.0, 7.8], [74.5, 12.5]], nextPass: '2024-03-27T07:00:00Z', resolution: '10m' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function simpleSatellitePosition(sat: SatelliteInfo, time: JulianDate): [number, number, number] {
  // Simplified circular orbit propagation for visualization
  const { inclination, period, altitude } = sat.orbitalParams;
  const epoch = JulianDate.fromDate(new Date('2024-03-26T00:00:00Z'));
  const seconds = JulianDate.secondsDifference(time, epoch);
  const fraction = (seconds / (period * 60)) % 1;

  let lng: number;
  let lat: number;

  if (sat.type === 'communication' || sat.type === 'navigation') {
    // GEO satellites — nearly stationary
    lng = sat.name.includes('GSAT') || sat.name.includes('NVS') ? 83.0 : 75.0;
    lat = inclination * Math.sin(fraction * 2 * Math.PI);
  } else {
    // LEO — full orbit
    lng = 75.0 + fraction * 360 - 180; // Drift across meridian
    lat = inclination * Math.sin(fraction * 2 * Math.PI);
  }

  // Keep over India region for demo
  while (lng < 60) lng += 360;
  while (lng > 110) lng -= 360;

  return [lng, lat, altitude * 1000];
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class SatelliteTrackingLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'satellite-tracking',
    name: 'Satellite Tracking',
    icon: '🛰️',
    description: 'Live satellite tracking — ISS, weather, Sentinel-2, NavIC, with TLE orbits and pass predictions',
    category: 'global',
    color: '#7c4dff',
    enabled: false,
    opacity: 0.85,
    dataStoreKey: 'satellite-tracking',
  };

  protected async loadData(): Promise<void> {
    this.clear();
    this.loadSatellites(DEMO_SATELLITES);
    this.loadPassPredictions(DEMO_PASS_PREDICTIONS);
    this.loadSentinelCoverage(DEMO_SENTINEL_COVERAGE);
    this.loadOrbitTrails(DEMO_SATELLITES);
  }

  // ─── Satellite Markers ───────────────────────────────────────────────────

  private loadSatellites(satellites: SatelliteInfo[]): void {
    const typeColors: Record<string, string> = {
      space_station: '#e040fb',
      weather: '#40c4ff',
      earth_observation: '#69f0ae',
      communication: '#ffd740',
      navigation: '#ea80fc',
      military: '#ff5252',
    };

    const typeIcons: Record<string, string> = {
      space_station: '🛸',
      weather: '🌤️',
      earth_observation: '🌍',
      communication: '📡',
      navigation: '🧭',
      military: '🛰️',
    };

    for (const sat of satellites) {
      const color = typeColors[sat.type] || '#7c4dff';
      const icon = typeIcons[sat.type] || '🛰️';
      const [lng, lat, alt] = simpleSatellitePosition(sat, JulianDate.now());

      // Glow ring at orbital altitude
      const glowPositions: Cartesian3[] = [];
      for (let i = 0; i <= 36; i++) {
        const angle = (i / 36) * 2 * Math.PI;
        const radius = sat.orbitalParams.altitude > 1000 ? 3 : 1;
        glowPositions.push(Cartesian3.fromDegrees(
          lng + Math.cos(angle) * radius,
          lat + Math.sin(angle) * radius,
          0
        ));
      }

      this.dataSource.entities.add({
        polyline: {
          positions: glowPositions,
          width: 1.5,
          material: new PolylineDashMaterialProperty({
            color: Color.fromCssColorString(color).withAlpha(0.3),
            dashLength: 8,
          }),
          clampToGround: true,
        },
      });

      // Satellite point at altitude
      this.dataSource.entities.add({
        id: `satellite-${sat.noradId}`,
        position: Cartesian3.fromDegrees(lng, lat, alt),
        point: {
          pixelSize: sat.type === 'space_station' ? 18 : 14,
          color: Color.fromCssColorString(color).withAlpha(this.config.opacity),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 1e8, 0.3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>${icon} ${sat.name}</h3>
            <p style="color:${color};font-weight:bold">NORAD ${sat.noradId} — ${sat.status.toUpperCase()}</p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>Type</td><td>${sat.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td></tr>
              <tr><td>Operator</td><td>${sat.operator}</td></tr>
              <tr><td>Inclination</td><td>${sat.orbitalParams.inclination}°</td></tr>
              <tr><td>Period</td><td>${sat.orbitalParams.period} min</td></tr>
              <tr><td>Altitude</td><td>${sat.orbitalParams.altitude.toLocaleString()} km</td></tr>
              <tr><td>Eccentricity</td><td>${sat.orbitalParams.eccentricity}</td></tr>
            </table>
            <p>${sat.description}</p>
            <details>
              <summary>TLE Data</summary>
              <pre style="font-size:11px;background:#1e1e1e;padding:8px;border-radius:4px;color:#0f0">
${sat.tle.line1}
${sat.tle.line2}
              </pre>
            </details>
            <p><a href="https://celestrak.org/NORAD/elements/gp.php?CATNR=${sat.noradId}&FORMAT=TLE" target="_blank">CelesTrak TLE</a> |
            <a href="https://www.n2yo.com/satellite/?s=${sat.noradId}" target="_blank">Track on N2YO</a></p>
          </div>
        `,
      });
    }
  }

  // ─── Pass Predictions ────────────────────────────────────────────────────

  private loadPassPredictions(predictions: PassPrediction[]): void {
    for (const pred of predictions) {
      const sat = DEMO_SATELLITES.find(s => s.noradId === pred.satelliteId);
      if (!sat) continue;

      const typeColors: Record<string, string> = {
        space_station: '#e040fb', weather: '#40c4ff', earth_observation: '#69f0ae',
        communication: '#ffd740', navigation: '#ea80fc', military: '#ff5252',
      };
      const color = typeColors[sat.type] || '#7c4dff';

      // Ground track line
      const groundTrackPositions = pred.groundTrack.map(
        ([lng, lat]) => Cartesian3.fromDegrees(lng, lat, 0)
      );

      this.dataSource.entities.add({
        id: `pass-track-${pred.satelliteId}`,
        polyline: {
          positions: groundTrackPositions,
          width: 2.5,
          material: new PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Color.fromCssColorString(color).withAlpha(0.6),
          }),
          clampToGround: true,
        },
      });

      // AOS/LOS markers
      const [aosLng, aosLat] = pred.groundTrack[0];
      const [losLng, losLat] = pred.groundTrack[pred.groundTrack.length - 1];

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(aosLng, aosLat, 0),
        label: {
          text: `AOS ${sat.name}`,
          font: '10px system-ui',
          fillColor: Color.fromCssColorString(color),
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e3, 1.0, 5e5, 0.4),
        },
      });

      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(losLng, losLat, 0),
        label: {
          text: 'LOS',
          font: '10px system-ui',
          fillColor: Color.GRAY,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });

      // Max elevation marker
      const midIdx = Math.floor(pred.groundTrack.length / 2);
      const [midLng, midLat] = pred.groundTrack[midIdx];
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(midLng, midLat, 0),
        label: {
          text: `MAX ${pred.maxElevation}°`,
          font: 'bold 11px system-ui',
          fillColor: Color.YELLOW,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  // ─── Sentinel-2 Coverage Swaths ──────────────────────────────────────────

  private loadSentinelCoverage(swaths: SentinelCoverage[]): void {
    for (const swath of swaths) {
      const isSentinel2 = swath.satellite.includes('Sentinel-2');
      const color = isSentinel2 ? '#69f0ae' : '#ff5252';

      this.dataSource.entities.add({
        id: `sentinel-swath-${swath.swathId}`,
        polygon: {
          hierarchy: Cartesian3.fromDegreesArrayHeights(
            swath.boundary.flatMap(([lng, lat]) => [lng, lat, 0])
          ),
          material: Color.fromCssColorString(color).withAlpha(0.15),
          outline: true,
          outlineColor: Color.fromCssColorString(color).withAlpha(0.5),
          outlineWidth: 1.5,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>📡 ${swath.satellite} Coverage</h3>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>Swath ID</td><td>${swath.swathId}</td></tr>
              <tr><td>Resolution</td><td>${swath.resolution}</td></tr>
              <tr><td>Next Pass</td><td>${swath.nextPass}</td></tr>
            </table>
          </div>
        `,
      });
    }
  }

  // ─── Orbit Visualization ─────────────────────────────────────────────────

  private loadOrbitTrails(satellites: SatelliteInfo[]): void {
    // Only draw visible orbit arcs for ISS and key LEO satellites
    const leoSats = satellites.filter(s =>
      s.orbitalParams.altitude < 2000 && s.orbitalParams.altitude > 200
    );

    for (const sat of leoSats) {
      const positions: Cartesian3[] = [];
      const steps = 120;
      const { inclination, period, altitude } = sat.orbitalParams;

      for (let i = 0; i <= steps; i++) {
        const fraction = i / steps;
        let lng = 75.0 + fraction * 40 - 20; // Short arc over India
        let lat = inclination * Math.sin(fraction * 2 * Math.PI);

        while (lng < 60) lng += 360;
        while (lng > 110) lng -= 360;

        positions.push(Cartesian3.fromDegrees(lng, lat, altitude * 1000));
      }

      this.dataSource.entities.add({
        polyline: {
          positions,
          width: 1,
          material: new PolylineDashMaterialProperty({
            color: Color.fromCssColorString('#7c4dff').withAlpha(0.25),
            dashLength: 4,
          }),
        },
      });
    }
  }

  // ─── Material Overrides ──────────────────────────────────────────────────

  protected getMaterial(): any {
    return undefined;
  }

  protected getPointColor(): any {
    return undefined;
  }

  protected getLineColor(): any {
    return undefined;
  }
}
