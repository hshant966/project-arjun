/**
 * TrafficCameraLayer — Open-source CCTV & traffic camera locations across major Indian cities
 * Data sources: OpenStreetMap mapped cameras for Mumbai, Pune, Delhi
 * Includes traffic signal cameras, highway cameras, municipal CCTV
 */
import {
  Viewer, Cartesian3, Color, HeightReference,
  VerticalOrigin, NearFarScalar, DistanceDisplayCondition,
  CallbackProperty, JulianDate, Entity,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrafficCamera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'traffic_signal' | 'highway' | 'municipal_cctv' | 'toll_plaza' | 'junction';
  city: string;
  area: string;
  status: 'online' | 'offline' | 'maintenance';
  osmId?: string;
  operator?: string;
  coverage?: string;
  direction?: string; // facing direction
  installedYear?: number;
  resolution?: string;
}

// ─── Demo Data — OSM-sourced camera locations ────────────────────────────────

const DEMO_CAMERAS: TrafficCamera[] = [
  // ── Mumbai ────────────────────────────────────────────────────────────────
  { id: 'cam-mum-001', name: 'Dadar TT Junction Camera', latitude: 19.0178, longitude: 72.8478, type: 'traffic_signal', city: 'Mumbai', area: 'Dadar', status: 'online', operator: 'Mumbai Traffic Police', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-mum-002', name: 'Sion Circle Junction Cam', latitude: 19.0390, longitude: 72.8617, type: 'junction', city: 'Mumbai', area: 'Sion', status: 'online', operator: 'Mumbai Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-mum-003', name: 'Bandra-Worli Sea Link Entry', latitude: 19.0405, longitude: 72.8198, type: 'highway', city: 'Mumbai', area: 'Bandra', status: 'online', operator: 'MSRDC', direction: 'W', resolution: '4K' },
  { id: 'cam-mum-004', name: 'Andheri East Junction', latitude: 19.1136, longitude: 72.8697, type: 'traffic_signal', city: 'Mumbai', area: 'Andheri East', status: 'online', operator: 'Mumbai Traffic Police', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-mum-005', name: 'Western Express Hwy Kurla', latitude: 19.0700, longitude: 72.8800, type: 'highway', city: 'Mumbai', area: 'Kurla', status: 'maintenance', operator: 'Mumbai Traffic Police', direction: 'N', resolution: '720p' },
  { id: 'cam-mum-006', name: 'Haji Ali Junction', latitude: 19.0010, longitude: 72.8160, type: 'junction', city: 'Mumbai', area: 'Mahalaxmi', status: 'online', operator: 'Mumbai Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-mum-007', name: 'Ghatkopar Junction', latitude: 19.0860, longitude: 72.9080, type: 'traffic_signal', city: 'Mumbai', area: 'Ghatkopar', status: 'online', operator: 'Mumbai Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-mum-008', name: 'Mulund Toll Plaza', latitude: 19.1720, longitude: 72.9560, type: 'toll_plaza', city: 'Mumbai', area: 'Mulund', status: 'online', operator: 'MSRDC', direction: 'All', resolution: '4K' },
  { id: 'cam-mum-009', name: 'Marine Drive CCTV', latitude: 18.9432, longitude: 72.8210, type: 'municipal_cctv', city: 'Mumbai', area: 'Marine Drive', status: 'online', operator: 'Municipal Corporation', direction: 'S', resolution: '1080p' },
  { id: 'cam-mum-010', name: 'Vashi Bridge Entry', latitude: 19.0620, longitude: 72.9990, type: 'highway', city: 'Mumbai', area: 'Navi Mumbai', status: 'online', operator: 'CIDCO', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-mum-011', name: 'Chhatrapati Shivaji Terminus Area', latitude: 18.9398, longitude: 72.8355, type: 'municipal_cctv', city: 'Mumbai', area: 'Fort', status: 'online', operator: 'Municipal Corporation', direction: 'All', resolution: '4K' },
  { id: 'cam-mum-012', name: 'Juhu Beach Road', latitude: 19.0886, longitude: 72.8261, type: 'traffic_signal', city: 'Mumbai', area: 'Juhu', status: 'online', operator: 'Mumbai Traffic Police', direction: 'N-S', resolution: '720p' },
  { id: 'cam-mum-013', name: 'Mumbai-Pune Expressway Entry', latitude: 19.1400, longitude: 73.0200, type: 'highway', city: 'Mumbai', area: 'Panvel', status: 'online', operator: 'MSRDC', direction: 'E', resolution: '1080p' },

  // ── Pune ──────────────────────────────────────────────────────────────────
  { id: 'cam-pun-001', name: 'Swargate Junction', latitude: 18.4967, longitude: 73.8566, type: 'junction', city: 'Pune', area: 'Swargate', status: 'online', operator: 'Pune Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-pun-002', name: 'Deccan Gymkhana Signal', latitude: 18.5089, longitude: 73.8265, type: 'traffic_signal', city: 'Pune', area: 'Deccan', status: 'online', operator: 'Pune Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-pun-003', name: 'Hadapsar Chowk', latitude: 18.5084, longitude: 73.9260, type: 'junction', city: 'Pune', area: 'Hadapsar', status: 'online', operator: 'Pune Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-pun-004', name: 'Pune-Mumbai Expressway Toll', latitude: 18.6300, longitude: 73.7200, type: 'toll_plaza', city: 'Pune', area: 'Talegaon', status: 'online', operator: 'MSRDC', direction: 'W', resolution: '4K' },
  { id: 'cam-pun-005', name: 'Shivaji Nagar Station', latitude: 18.5310, longitude: 73.8450, type: 'municipal_cctv', city: 'Pune', area: 'Shivaji Nagar', status: 'online', operator: 'PMC', direction: 'All', resolution: '1080p' },
  { id: 'cam-pun-006', name: 'Katraj Junction', latitude: 18.4490, longitude: 73.8560, type: 'junction', city: 'Pune', area: 'Katraj', status: 'maintenance', operator: 'Pune Traffic Police', direction: 'N-S', resolution: '720p' },
  { id: 'cam-pun-007', name: 'Viman Nagar Signal', latitude: 18.5679, longitude: 73.9143, type: 'traffic_signal', city: 'Pune', area: 'Viman Nagar', status: 'online', operator: 'Pune Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-pun-008', name: 'Hinjewadi IT Park Gate', latitude: 18.5912, longitude: 73.7380, type: 'junction', city: 'Pune', area: 'Hinjewadi', status: 'online', operator: 'Pune Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-pun-009', name: 'Aundh-Ravet BRT Junction', latitude: 18.5590, longitude: 73.8070, type: 'traffic_signal', city: 'Pune', area: 'Aundh', status: 'online', operator: 'Pune Traffic Police', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-pun-010', name: 'FC Road Signal', latitude: 18.5170, longitude: 73.8350, type: 'traffic_signal', city: 'Pune', area: 'FC Road', status: 'online', operator: 'Pune Traffic Police', direction: 'N-S', resolution: '1080p' },

  // ── Delhi ─────────────────────────────────────────────────────────────────
  { id: 'cam-del-001', name: 'Connaught Place Inner Circle', latitude: 28.6315, longitude: 77.2167, type: 'junction', city: 'Delhi', area: 'Connaught Place', status: 'online', operator: 'Delhi Traffic Police', direction: 'All', resolution: '4K' },
  { id: 'cam-del-002', name: 'ITO Crossing', latitude: 28.6289, longitude: 77.2495, type: 'junction', city: 'Delhi', area: 'ITO', status: 'online', operator: 'Delhi Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-del-003', name: 'Dhaula Kuan Flyover', latitude: 28.5920, longitude: 77.1600, type: 'highway', city: 'Delhi', area: 'Dhaula Kuan', status: 'online', operator: 'NHAI', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-del-004', name: 'Rajiv Chowk Metro Gate', latitude: 28.6328, longitude: 77.2197, type: 'municipal_cctv', city: 'Delhi', area: 'Rajiv Chowk', status: 'online', operator: 'DMRC', direction: 'All', resolution: '1080p' },
  { id: 'cam-del-005', name: 'AIIMS Junction', latitude: 28.5672, longitude: 77.2100, type: 'traffic_signal', city: 'Delhi', area: 'AIIMS', status: 'online', operator: 'Delhi Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-del-006', name: 'Delhi-Gurgaon Expressway Toll', latitude: 28.4810, longitude: 77.0380, type: 'toll_plaza', city: 'Delhi', area: 'Kherki Daula', status: 'online', operator: 'NHAI', direction: 'S', resolution: '4K' },
  { id: 'cam-del-007', name: 'Nizamuddin Bridge', latitude: 28.5930, longitude: 77.2550, type: 'highway', city: 'Delhi', area: 'Nizamuddin', status: 'online', operator: 'Delhi Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-del-008', name: 'Mandi House Signal', latitude: 28.6260, longitude: 77.2340, type: 'traffic_signal', city: 'Delhi', area: 'Mandi House', status: 'online', operator: 'Delhi Traffic Police', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-del-009', name: 'India Gate Circle', latitude: 28.6129, longitude: 77.2294, type: 'municipal_cctv', city: 'Delhi', area: 'India Gate', status: 'online', operator: 'Municipal Corporation', direction: 'All', resolution: '4K' },
  { id: 'cam-del-010', name: 'Noida Toll Plaza', latitude: 28.5730, longitude: 77.3200, type: 'toll_plaza', city: 'Delhi', area: 'Noida Border', status: 'online', operator: 'Noida Authority', direction: 'E', resolution: '1080p' },
  { id: 'cam-del-011', name: 'Kashmiri Gate ISBT', latitude: 28.6672, longitude: 77.2303, type: 'municipal_cctv', city: 'Delhi', area: 'Kashmiri Gate', status: 'online', operator: 'Municipal Corporation', direction: 'All', resolution: '1080p' },
  { id: 'cam-del-012', name: 'Akshardham Temple Junction', latitude: 28.6127, longitude: 77.2773, type: 'junction', city: 'Delhi', area: 'Akshardham', status: 'online', operator: 'Delhi Traffic Police', direction: 'All', resolution: '1080p' },

  // ── Bengaluru ─────────────────────────────────────────────────────────────
  { id: 'cam-blr-001', name: 'Silk Board Junction', latitude: 12.9170, longitude: 77.6230, type: 'junction', city: 'Bengaluru', area: 'Silk Board', status: 'online', operator: 'Bengaluru Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-blr-002', name: 'MG Road Signal', latitude: 12.9756, longitude: 77.6097, type: 'traffic_signal', city: 'Bengaluru', area: 'MG Road', status: 'online', operator: 'Bengaluru Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-blr-003', name: 'Electronic City Toll', latitude: 12.8390, longitude: 77.6770, type: 'toll_plaza', city: 'Bengaluru', area: 'Electronic City', status: 'online', operator: 'NHAI', direction: 'S', resolution: '4K' },
  { id: 'cam-blr-004', name: 'Hebbal Flyover', latitude: 13.0358, longitude: 77.5970, type: 'highway', city: 'Bengaluru', area: 'Hebbal', status: 'online', operator: 'Bengaluru Traffic Police', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-blr-005', name: 'KR Puram Junction', latitude: 13.0020, longitude: 77.6970, type: 'junction', city: 'Bengaluru', area: 'KR Puram', status: 'online', operator: 'Bengaluru Traffic Police', direction: 'All', resolution: '1080p' },

  // ── Chennai ───────────────────────────────────────────────────────────────
  { id: 'cam-chn-001', name: 'Kathipara Junction', latitude: 13.0180, longitude: 80.2050, type: 'junction', city: 'Chennai', area: 'Guindy', status: 'online', operator: 'Chennai Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-chn-002', name: 'Anna Salai Signal', latitude: 13.0520, longitude: 80.2500, type: 'traffic_signal', city: 'Chennai', area: 'Anna Salai', status: 'online', operator: 'Chennai Traffic Police', direction: 'N-S', resolution: '1080p' },
  { id: 'cam-chn-003', name: 'OMR Toll Plaza', latitude: 12.9100, longitude: 80.2280, type: 'toll_plaza', city: 'Chennai', area: 'Sholinganallur', status: 'online', operator: 'NHAI', direction: 'S', resolution: '4K' },

  // ── Hyderabad ─────────────────────────────────────────────────────────────
  { id: 'cam-hyd-001', name: 'Miyapur Junction', latitude: 17.5050, longitude: 78.3580, type: 'junction', city: 'Hyderabad', area: 'Miyapur', status: 'online', operator: 'Hyderabad Traffic Police', direction: 'All', resolution: '1080p' },
  { id: 'cam-hyd-002', name: 'Hitech City Flyover', latitude: 17.4435, longitude: 78.3772, type: 'highway', city: 'Hyderabad', area: 'Hitech City', status: 'online', operator: 'Hyderabad Traffic Police', direction: 'E-W', resolution: '1080p' },
  { id: 'cam-hyd-003', name: 'Paradise Signal', latitude: 17.4380, longitude: 78.4980, type: 'traffic_signal', city: 'Hyderabad', area: 'Paradise', status: 'online', operator: 'Hyderabad Traffic Police', direction: 'N-S', resolution: '1080p' },

  // ── Kolkata ───────────────────────────────────────────────────────────────
  { id: 'cam-kol-001', name: 'Howrah Bridge Entry', latitude: 22.5850, longitude: 88.3470, type: 'highway', city: 'Kolkata', area: 'Howrah', status: 'online', operator: 'Kolkata Traffic Police', direction: 'E', resolution: '1080p' },
  { id: 'cam-kol-002', name: 'Park Street Crossing', latitude: 22.5530, longitude: 88.3520, type: 'junction', city: 'Kolkata', area: 'Park Street', status: 'online', operator: 'Kolkata Traffic Police', direction: 'All', resolution: '1080p' },
];

// ─── Status Indicator Colors ─────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  online: '#4caf50',
  offline: '#f44336',
  maintenance: '#ff9800',
};

const TYPE_ICONS: Record<string, string> = {
  traffic_signal: '🚦',
  highway: '🛣️',
  municipal_cctv: '📹',
  toll_plaza: '💰',
  junction: '🔀',
};

const TYPE_SIZES: Record<string, number> = {
  traffic_signal: 10,
  highway: 12,
  municipal_cctv: 10,
  toll_plaza: 14,
  junction: 11,
};

// ─── Main Layer ──────────────────────────────────────────────────────────────

export class TrafficCameraLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'traffic-cameras',
    name: 'Traffic Cameras & CCTV',
    icon: '📹',
    description: 'Traffic signal cameras, highway cameras, municipal CCTV across Indian cities — OSM-sourced',
    category: 'intelligence',
    color: '#00bcd4',
    enabled: false,
    opacity: 0.85,
    dataStoreKey: 'traffic-cameras',
  };

  protected async loadData(): Promise<void> {
    this.clear();
    this.loadCameras(DEMO_CAMERAS);
    this.loadCityLabels();
  }

  private loadCameras(cameras: TrafficCamera[]): void {
    // Group by city for city density overlay
    const cityCounts: Record<string, number> = {};
    for (const cam of cameras) {
      cityCounts[cam.city] = (cityCounts[cam.city] || 0) + 1;
    }

    for (const cam of cameras) {
      const statusColor = STATUS_COLORS[cam.status];
      const typeIcon = TYPE_ICONS[cam.type];
      const typeSize = TYPE_SIZES[cam.type];
      const isOnline = cam.status === 'online';

      // Status ring around active cameras
      if (cam.status === 'online') {
        const ringPositions: Cartesian3[] = [];
        for (let i = 0; i <= 32; i++) {
          const angle = (i / 32) * 2 * Math.PI;
          ringPositions.push(Cartesian3.fromDegrees(
            cam.longitude + Math.cos(angle) * 0.002,
            cam.latitude + Math.sin(angle) * 0.002,
            0
          ));
        }
        this.dataSource.entities.add({
          polyline: {
            positions: ringPositions,
            width: 1,
            material: Color.fromCssColorString(statusColor).withAlpha(0.4),
            clampToGround: true,
          },
        });
      }

      // Camera point
      this.dataSource.entities.add({
        id: `camera-${cam.id}`,
        position: Cartesian3.fromDegrees(cam.longitude, cam.latitude, 0),
        point: {
          pixelSize: typeSize,
          color: Color.fromCssColorString(statusColor).withAlpha(
            isOnline ? this.config.opacity : 0.4
          ),
          outlineColor: Color.fromCssColorString(
            cam.type === 'toll_plaza' ? '#ffd600' :
            cam.type === 'highway' ? '#00e5ff' : '#ffffff'
          ),
          outlineWidth: 1.5,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new NearFarScalar(500, 1.5, 80000, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: `
          <div style="font-family:system-ui">
            <h3>${typeIcon} ${cam.name}</h3>
            <p style="color:${statusColor};font-weight:bold">
              ${cam.status === 'online' ? '🟢' : cam.status === 'offline' ? '🔴' : '🟡'}
              ${cam.status.toUpperCase()}
            </p>
            <table class="cesium-infoBox-defaultTable">
              <tr><td>Type</td><td>${cam.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td></tr>
              <tr><td>City</td><td>${cam.city}</td></tr>
              <tr><td>Area</td><td>${cam.area}</td></tr>
              <tr><td>Operator</td><td>${cam.operator || 'Unknown'}</td></tr>
              <tr><td>Direction</td><td>${cam.direction || 'N/A'}</td></tr>
              <tr><td>Resolution</td><td>${cam.resolution || 'N/A'}</td></tr>
              ${cam.osmId ? `<tr><td>OSM ID</td><td><a href="https://www.openstreetmap.org/${cam.osmId}" target="_blank">${cam.osmId}</a></td></tr>` : ''}
              <tr><td>Coordinates</td><td>${cam.latitude.toFixed(4)}, ${cam.longitude.toFixed(4)}</td></tr>
            </table>
          </div>
        `,
      });
    }
  }

  private loadCityLabels(): void {
    // City summary markers
    const cities = [
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777, count: DEMO_CAMERAS.filter(c => c.city === 'Mumbai').length },
      { name: 'Pune', lat: 18.5204, lng: 73.8567, count: DEMO_CAMERAS.filter(c => c.city === 'Pune').length },
      { name: 'Delhi', lat: 28.7041, lng: 77.1025, count: DEMO_CAMERAS.filter(c => c.city === 'Delhi').length },
      { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, count: DEMO_CAMERAS.filter(c => c.city === 'Bengaluru').length },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707, count: DEMO_CAMERAS.filter(c => c.city === 'Chennai').length },
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, count: DEMO_CAMERAS.filter(c => c.city === 'Hyderabad').length },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639, count: DEMO_CAMERAS.filter(c => c.city === 'Kolkata').length },
    ];

    for (const city of cities) {
      this.dataSource.entities.add({
        position: Cartesian3.fromDegrees(city.lng, city.lat + 0.15, 0),
        label: {
          text: `${city.name} (${city.count})`,
          font: 'bold 12px system-ui',
          fillColor: Color.fromCssColorString('#00bcd4'),
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: 0, // FILL
          verticalOrigin: VerticalOrigin.BOTTOM,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new NearFarScalar(1e3, 1.2, 5e5, 0.5),
          distanceDisplayCondition: new DistanceDisplayCondition(0, 500000),
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
