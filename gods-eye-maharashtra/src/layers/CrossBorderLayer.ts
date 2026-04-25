/**
 * CrossBorderLayer — India's international borders, disputed areas, and cross-border incidents
 * LoC, LAC, border posts, checkpoints, and recent incidents
 */
import {
  Viewer, Cartesian3, Color, HeightReference, Entity,
  PolylineGlowMaterialProperty, PolylineDashMaterialProperty,
  VerticalOrigin, NearFarScalar, LabelStyle, Cartesian2,
  PolygonHierarchy, Ellipsoid, CallbackProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BorderSegment {
  name: string;
  country: string;
  type: 'international' | 'loc' | 'lac' | 'disputed';
  color: string;
  coordinates: [number, number][];
  status: 'active' | 'tense' | 'normal';
}

interface BorderPost {
  name: string;
  lat: number;
  lng: number;
  type: 'checkpoint' | 'post' | 'gate' | 'fence';
  country: string;
  status: 'active' | 'closed' | 'restricted';
  personnel: number;
}

interface CrossBorderIncident {
  title: string;
  lat: number;
  lng: number;
  type: 'infiltration' | 'ceasefire_violation' | 'smuggling' | 'drone' | 'other';
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// ─── Border Data ─────────────────────────────────────────────────────────────

const BORDER_SEGMENTS: BorderSegment[] = [
  // India-Pakistan border (LoC + International Border)
  {
    name: 'Line of Control (LoC)',
    country: 'Pakistan',
    type: 'loc',
    color: '#ff4444',
    status: 'tense',
    coordinates: [
      [74.0, 35.0], [74.5, 34.8], [74.8, 34.5], [75.0, 34.2],
      [74.7, 33.8], [74.5, 33.5], [74.8, 33.2], [75.0, 33.0],
      [75.2, 32.8], [75.0, 32.5], [74.8, 32.3],
    ],
  },
  {
    name: 'India-Pakistan International Border',
    country: 'Pakistan',
    type: 'international',
    color: '#ff8800',
    status: 'active',
    coordinates: [
      [74.8, 32.3], [74.5, 32.0], [74.0, 31.5], [73.5, 31.0],
      [73.0, 30.5], [72.5, 30.0], [72.0, 29.5], [71.5, 29.0],
      [71.0, 28.5], [70.5, 28.0], [70.0, 27.5], [69.5, 27.0],
      [69.0, 26.5], [68.5, 26.0], [68.0, 25.5], [68.5, 24.5],
      [69.0, 24.0], [69.5, 23.5],
    ],
  },
  // India-China border (LAC)
  {
    name: 'Line of Actual Control (LAC)',
    country: 'China',
    type: 'lac',
    color: '#ff0066',
    status: 'tense',
    coordinates: [
      [78.0, 35.5], [78.5, 35.3], [79.0, 35.0], [79.5, 34.8],
      [80.0, 34.5], [80.5, 34.2], [81.0, 34.0], [81.5, 33.8],
      [82.0, 33.5], [82.5, 33.0], [83.0, 32.5], [84.0, 32.0],
      [85.0, 31.5], [86.0, 31.0], [87.0, 30.5], [88.0, 30.0],
      [89.0, 29.5], [90.0, 29.0], [91.0, 28.5], [92.0, 28.0],
      [93.0, 27.5], [94.0, 27.8], [95.0, 28.0], [96.0, 28.5],
      [97.0, 28.0], [97.5, 27.5],
    ],
  },
  // India-Nepal border
  {
    name: 'India-Nepal Border',
    country: 'Nepal',
    type: 'international',
    color: '#00cc66',
    status: 'normal',
    coordinates: [
      [80.0, 29.0], [80.5, 28.8], [81.0, 28.5], [81.5, 28.3],
      [82.0, 28.0], [83.0, 27.5], [84.0, 27.0], [85.0, 26.8],
      [86.0, 26.5], [87.0, 26.3], [88.0, 26.5], [88.5, 26.8],
    ],
  },
  // India-Bangladesh border
  {
    name: 'India-Bangladesh Border',
    country: 'Bangladesh',
    type: 'international',
    color: '#00aaff',
    status: 'active',
    coordinates: [
      [88.5, 26.8], [88.8, 26.5], [89.0, 26.0], [89.2, 25.5],
      [89.5, 25.0], [89.8, 24.5], [90.0, 24.0], [90.5, 23.5],
      [91.0, 23.0], [91.5, 22.5], [92.0, 22.0], [92.5, 21.5],
    ],
  },
  // India-Myanmar border
  {
    name: 'India-Myanmar Border',
    country: 'Myanmar',
    type: 'international',
    color: '#aa66ff',
    status: 'active',
    coordinates: [
      [93.0, 28.0], [93.5, 27.5], [94.0, 27.0], [94.5, 26.5],
      [95.0, 26.0], [95.5, 25.5], [96.0, 25.0], [96.5, 24.5],
      [97.0, 24.0], [97.0, 23.0],
    ],
  },
];

const BORDER_POSTS: BorderPost[] = [
  // Pakistan border posts
  { name: 'Wagah Border', lat: 31.6047, lng: 74.5734, type: 'gate', country: 'Pakistan', status: 'active', personnel: 200 },
  { name: 'Attari Check Post', lat: 31.6100, lng: 74.5650, type: 'checkpoint', country: 'Pakistan', status: 'active', personnel: 150 },
  { name: 'Munabao Post', lat: 25.7333, lng: 70.2833, type: 'post', country: 'Pakistan', status: 'active', personnel: 80 },
  { name: 'Hussainiwala Post', lat: 30.9667, lng: 74.5500, type: 'post', country: 'Pakistan', status: 'active', personnel: 100 },
  // LoC posts
  { name: 'Uri Sector', lat: 34.0833, lng: 74.0333, type: 'post', country: 'Pakistan', status: 'active', personnel: 300 },
  { name: 'Poonch Sector', lat: 33.7667, lng: 74.0833, type: 'post', country: 'Pakistan', status: 'active', personnel: 250 },
  { name: 'Kargil Post', lat: 34.5553, lng: 76.1317, type: 'post', country: 'Pakistan', status: 'active', personnel: 400 },
  // China border posts
  { name: 'Nathu La Pass', lat: 27.3833, lng: 88.8333, type: 'gate', country: 'China', status: 'active', personnel: 200 },
  { name: 'Shipki La', lat: 31.8833, lng: 78.6667, type: 'post', country: 'China', status: 'active', personnel: 120 },
  { name: 'Lipulekh Pass', lat: 30.4333, lng: 81.0167, type: 'post', country: 'China', status: 'active', personnel: 150 },
  { name: 'Daulat Beg Oldi', lat: 35.3833, lng: 77.8333, type: 'post', country: 'China', status: 'active', personnel: 500 },
  { name: 'Pangong Tso Post', lat: 33.7500, lng: 78.6667, type: 'post', country: 'China', status: 'active', personnel: 300 },
  // Nepal border posts
  { name: 'Sunauli Border', lat: 27.4667, lng: 83.4500, type: 'gate', country: 'Nepal', status: 'active', personnel: 100 },
  { name: 'Raxaul Border', lat: 26.9833, lng: 84.8500, type: 'gate', country: 'Nepal', status: 'active', personnel: 80 },
  { name: 'Birgunj Post', lat: 27.0167, lng: 84.8667, type: 'checkpoint', country: 'Nepal', status: 'active', personnel: 60 },
  // Bangladesh border posts
  { name: 'Petrapole Border', lat: 22.8167, lng: 88.8000, type: 'gate', country: 'Bangladesh', status: 'active', personnel: 150 },
  { name: 'Benapole Post', lat: 23.0500, lng: 88.8833, type: 'checkpoint', country: 'Bangladesh', status: 'active', personnel: 100 },
  { name: 'Dawki Border', lat: 25.1833, lng: 92.0167, type: 'gate', country: 'Bangladesh', status: 'active', personnel: 80 },
  // Myanmar border posts
  { name: 'Moreh Border', lat: 24.3500, lng: 94.3667, type: 'gate', country: 'Myanmar', status: 'active', personnel: 100 },
  { name: 'Tamu Post', lat: 24.2167, lng: 94.3500, type: 'post', country: 'Myanmar', status: 'active', personnel: 80 },
];

const CROSS_BORDER_INCIDENTS: CrossBorderIncident[] = [
  { title: 'Ceasefire violation — Poonch sector', lat: 33.77, lng: 74.10, type: 'ceasefire_violation', date: '2026-04-24', severity: 'high', description: 'Multiple ceasefire violations reported along LoC' },
  { title: 'Drone sighting near border', lat: 31.55, lng: 74.60, type: 'drone', date: '2026-04-23', severity: 'medium', description: 'Unidentified drone detected near international border' },
  { title: 'Infiltration attempt foiled', lat: 34.10, lng: 74.05, type: 'infiltration', date: '2026-04-22', severity: 'critical', description: 'Security forces intercepted infiltration attempt' },
  { title: 'Smuggling network busted', lat: 22.82, lng: 88.81, type: 'smuggling', date: '2026-04-21', severity: 'medium', description: 'Cross-border smuggling ring dismantled' },
  { title: 'LAC standoff resolved', lat: 33.75, lng: 78.67, type: 'other', date: '2026-04-20', severity: 'high', description: 'Troop standoff at Pangong Tso resolved through dialogue' },
  { title: 'Border fencing progress', lat: 25.18, lng: 92.02, type: 'other', date: '2026-04-19', severity: 'low', description: 'Smart fencing installation completed along Bangladesh border' },
  { title: 'Tunnel detected', lat: 32.35, lng: 74.90, type: 'infiltration', date: '2026-04-18', severity: 'critical', description: 'Cross-border tunnel detected by BSF' },
  { title: 'Nathu La trade suspended', lat: 27.38, lng: 88.83, type: 'other', date: '2026-04-17', severity: 'medium', description: 'Border trade suspended due to weather conditions' },
];

// ─── Color helpers ───────────────────────────────────────────────────────────

function borderTypeColor(type: BorderSegment['type']): Color {
  switch (type) {
    case 'loc': return Color.fromCssColorString('#ff4444');
    case 'lac': return Color.fromCssColorString('#ff0066');
    case 'international': return Color.fromCssColorString('#ffaa00');
    case 'disputed': return Color.fromCssColorString('#ff00ff');
  }
}

function incidentColor(severity: CrossBorderIncident['severity']): Color {
  switch (severity) {
    case 'low': return Color.YELLOW;
    case 'medium': return Color.ORANGE;
    case 'high': return Color.RED;
    case 'critical': return Color.fromCssColorString('#ff0044');
  }
}

function incidentSize(severity: CrossBorderIncident['severity']): number {
  switch (severity) {
    case 'low': return 8;
    case 'medium': return 10;
    case 'high': return 14;
    case 'critical': return 18;
  }
}

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class CrossBorderLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'cross-border',
    name: 'Cross-Border Intelligence',
    icon: '🗺️',
    description: 'India\'s international borders, LoC, LAC, border posts, and cross-border incidents',
    category: 'intelligence',
    color: '#ff4444',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'crossborder',
  };

  protected async loadData(): Promise<void> {
    this.renderBorders();
    this.renderBorderPosts();
    this.renderIncidents();
  }

  private renderBorders(): void {
    for (const seg of BORDER_SEGMENTS) {
      const positions = seg.coordinates.map(([lng, lat]) =>
        Cartesian3.fromDegrees(lng, lat, 500)
      );

      // Main border line
      const isDisputed = seg.type === 'loc' || seg.type === 'lac';
      this.dataSource.entities.add({
        name: seg.name,
        polyline: {
          positions,
          width: isDisputed ? 4 : 2,
          material: isDisputed
            ? new PolylineGlowMaterialProperty({
                color: borderTypeColor(seg.type),
                glowPower: 0.3,
              })
            : borderTypeColor(seg.type),
          clampToGround: true,
        },
        description: `
          <h3>🗺️ ${seg.name}</h3>
          <table>
            <tr><td><b>Country</b></td><td>${seg.country}</td></tr>
            <tr><td><b>Type</b></td><td>${seg.type.toUpperCase()}</td></tr>
            <tr><td><b>Status</b></td><td>${seg.status}</td></tr>
          </table>
        `,
      });

      // Label at midpoint
      if (seg.coordinates.length > 2) {
        const midIdx = Math.floor(seg.coordinates.length / 2);
        const [mlng, mlat] = seg.coordinates[midIdx];
        this.dataSource.entities.add({
          position: Cartesian3.fromDegrees(mlng, mlat, 5000),
          label: {
            text: seg.name,
            font: '11px sans-serif',
            fillColor: borderTypeColor(seg.type),
            outlineColor: Color.BLACK,
            outlineWidth: 2,
            style: LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cartesian2(0, -15),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.5),
          },
        });
      }
    }
  }

  private renderBorderPosts(): void {
    for (const post of BORDER_POSTS) {
      const color = post.status === 'active' ? Color.GREEN : post.status === 'closed' ? Color.RED : Color.YELLOW;
      const size = post.type === 'gate' ? 12 : post.type === 'checkpoint' ? 10 : 8;

      this.dataSource.entities.add({
        name: post.name,
        position: Cartesian3.fromDegrees(post.lng, post.lat, 1000),
        point: {
          pixelSize: size,
          color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.NONE,
          scaleByDistance: new NearFarScalar(1e5, 1.5, 1e7, 0.5),
        },
        label: {
          text: post.name,
          font: '11px sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 1,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(14, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 5e6, 0.4),
        },
        description: `
          <h3>🏛️ ${post.name}</h3>
          <table>
            <tr><td><b>Type</b></td><td>${post.type}</td></tr>
            <tr><td><b>Country</b></td><td>${post.country}</td></tr>
            <tr><td><b>Status</b></td><td>${post.status}</td></tr>
            <tr><td><b>Personnel</b></td><td>${post.personnel}</td></tr>
            <tr><td><b>Coordinates</b></td><td>${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}</td></tr>
          </table>
        `,
      });
    }
  }

  private renderIncidents(): void {
    for (const inc of CROSS_BORDER_INCIDENTS) {
      const color = incidentColor(inc.severity);
      const size = incidentSize(inc.severity);

      this.dataSource.entities.add({
        name: inc.title,
        position: Cartesian3.fromDegrees(inc.lng, inc.lat, 2000),
        point: {
          pixelSize: size,
          color: color.withAlpha(0.9),
          outlineColor: Color.WHITE,
          outlineWidth: 2,
          heightReference: HeightReference.NONE,
          scaleByDistance: new NearFarScalar(1e5, 2, 1e7, 0.5),
        },
        label: {
          text: `⚠️ ${inc.title}`,
          font: '12px sans-serif',
          fillColor: color,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cartesian2(16, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e5, 1, 3e6, 0.4),
        },
        description: `
          <h3>⚠️ ${inc.title}</h3>
          <table>
            <tr><td><b>Type</b></td><td>${inc.type}</td></tr>
            <tr><td><b>Severity</b></td><td style="color:${color.toCssColorString()};font-weight:bold">${inc.severity.toUpperCase()}</td></tr>
            <tr><td><b>Date</b></td><td>${inc.date}</td></tr>
            <tr><td><b>Description</b></td><td>${inc.description}</td></tr>
            <tr><td><b>Coordinates</b></td><td>${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}</td></tr>
          </table>
        `,
      });
    }
  }
}
