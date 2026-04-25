/**
 * NoFlyZoneLayer — NOTAM/restricted airspace visualization
 * Red semi-transparent polygons for military and restricted zones
 * India FIR with detailed restricted areas
 */
import {
  Viewer, Cartesian3, Color, Entity, VerticalOrigin,
  PolygonHierarchy, HeightReference, NearFarScalar,
  CallbackProperty, LabelStyle, Cartesian2,
  PolylineGlowMaterialProperty,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NoFlyZone {
  id: string;
  name: string;
  type: 'prohibited' | 'restricted' | 'danger' | 'military' | 'temporary' | 'tfr';
  classification: string;
  altFloor: number; // feet
  altCeiling: number;
  boundary: [number, number][]; // [lat, lng]
  notamId: string | null;
  authority: string;
  description: string;
  active: boolean;
  color: string;
}

// ─── Demo Data — Indian restricted/prohibited airspace ───────────────────────

const NO_FLY_ZONES: NoFlyZone[] = [
  // Delhi - Prohibited
  { id: 'nfz-1', name: 'P-1 Delhi (Rashtrapati Bhavan)', type: 'prohibited', classification: 'P-1', altFloor: 0, altCeiling: 99999, boundary: [[28.65, 77.18], [28.65, 77.24], [28.60, 77.24], [28.60, 77.18]], notamId: null, authority: 'DGCA', description: 'Prohibited area around Rashtrapati Bhavan and Parliament. No overflight permitted.', active: true, color: '#ff0000' },
  { id: 'nfz-2', name: 'P-2 Delhi (Parliament)', type: 'prohibited', classification: 'P-2', altFloor: 0, altCeiling: 99999, boundary: [[28.63, 77.20], [28.63, 77.22], [28.61, 77.22], [28.61, 77.20]], notamId: null, authority: 'DGCA', description: 'Parliament House area. Strict no-fly zone.', active: true, color: '#ff0000' },

  // Mumbai - Restricted
  { id: 'nfz-3', name: 'R-1 Mumbai (Bhabha Atomic)', type: 'restricted', classification: 'R-1', altFloor: 0, altCeiling: 99999, boundary: [[19.08, 72.88], [19.08, 72.92], [19.04, 72.92], [19.04, 72.88]], notamId: 'NOTAM-MUM-2024-001', authority: 'AERB/DGCA', description: 'Restricted area around Bhabha Atomic Research Centre.', active: true, color: '#ff4400' },

  // Nuclear installations
  { id: 'nfz-4', name: 'R-2 Tarapur Nuclear', type: 'restricted', classification: 'R-2', altFloor: 0, altCeiling: 99999, boundary: [[19.85, 72.63], [19.85, 72.69], [19.81, 72.69], [19.81, 72.63]], notamId: null, authority: 'AERB', description: 'Tarapur Atomic Power Station restricted zone.', active: true, color: '#ff4400' },
  { id: 'nfz-5', name: 'R-3 Kalpakkam Nuclear', type: 'restricted', classification: 'R-3', altFloor: 0, altCeiling: 99999, boundary: [[12.55, 80.15], [12.55, 80.21], [12.51, 80.21], [12.51, 80.15]], notamId: null, authority: 'AERB', description: 'Madras Atomic Power Station, Kalpakkam.', active: true, color: '#ff4400' },
  { id: 'nfz-6', name: 'R-4 Kudankulam Nuclear', type: 'restricted', classification: 'R-4', altFloor: 0, altCeiling: 99999, boundary: [[8.18, 77.68], [8.18, 77.74], [8.14, 77.74], [8.14, 77.68]], notamId: null, authority: 'AERB', description: 'Kudankulam Nuclear Power Plant.', active: true, color: '#ff4400' },

  // Military zones
  { id: 'nfz-7', name: 'R-5 Pokhran Range', type: 'military', classification: 'R-5', altFloor: 0, altCeiling: 99999, boundary: [[27.2, 71.7], [27.2, 72.0], [27.0, 72.0], [27.0, 71.7]], notamId: null, authority: 'Indian Army', description: 'Pokhran Field Firing Range. Active during exercises.', active: true, color: '#880000' },
  { id: 'nfz-8', name: 'R-6 Jaisalmer Range', type: 'military', classification: 'R-6', altFloor: 0, altCeiling: 50000, boundary: [[27.0, 70.7], [27.0, 71.2], [26.7, 71.2], [26.7, 70.7]], notamId: null, authority: 'Indian Air Force', description: 'Jaisalmer Air Force Range. Live firing exercises.', active: true, color: '#880000' },
  { id: 'nfz-9', name: 'R-7 Siachen Sector', type: 'military', classification: 'R-7', altFloor: 0, altCeiling: 99999, boundary: [[35.5, 76.8], [35.5, 77.5], [35.0, 77.5], [35.0, 76.8]], notamId: null, authority: 'Indian Army', description: 'Siachen Glacier military zone. No civilian overflight.', active: true, color: '#880000' },
  { id: 'nfz-10', name: 'R-8 Pathankot AFS', type: 'military', classification: 'R-8', altFloor: 0, altCeiling: 30000, boundary: [[32.3, 75.5], [32.3, 75.8], [32.1, 75.8], [32.1, 75.5]], notamId: null, authority: 'Indian Air Force', description: 'Pathankot Air Force Station restricted zone.', active: true, color: '#880000' },

  // LoC / Border areas
  { id: 'nfz-11', name: 'D-1 LoC Corridor', type: 'danger', classification: 'D-1', altFloor: 0, altCeiling: 99999, boundary: [[34.5, 73.5], [34.5, 74.8], [34.2, 74.8], [34.2, 73.5]], notamId: null, authority: 'Indian Army', description: 'Line of Control danger zone. Active military operations possible.', active: true, color: '#cc0000' },
  { id: 'nfz-12', name: 'D-2 LAC Ladakh', type: 'danger', classification: 'D-2', altFloor: 0, altCeiling: 99999, boundary: [[35.5, 77.5], [35.5, 79.0], [35.0, 79.0], [35.0, 77.5]], notamId: null, authority: 'Indian Army', description: 'LAC Ladakh sector danger zone.', active: true, color: '#cc0000' },
  { id: 'nfz-13', name: 'D-3 LAC Arunachal', type: 'danger', classification: 'D-3', altFloor: 0, altCeiling: 99999, boundary: [[28.5, 94.0], [28.5, 96.0], [27.5, 96.0], [27.5, 94.0]], notamId: null, authority: 'Indian Army', description: 'LAC Arunachal Pradesh sector. Tension zone.', active: true, color: '#cc0000' },

  // TFR - Temporary
  { id: 'nfz-14', name: 'TFR-1 Republic Day Delhi', type: 'tfr', classification: 'TFR', altFloor: 0, altCeiling: 50000, boundary: [[28.75, 77.10], [28.75, 77.35], [28.55, 77.35], [28.55, 77.10]], notamId: 'NOTAM-DEL-TFR-2024-26JAN', authority: 'DGCA', description: 'Temporary flight restriction for Republic Day parade.', active: true, color: '#ff6600' },
  { id: 'nfz-15', name: 'TFR-2 Independence Day Delhi', type: 'tfr', classification: 'TFR', altFloor: 0, altCeiling: 50000, boundary: [[28.70, 77.15], [28.70, 77.30], [28.58, 77.30], [28.58, 77.15]], notamId: 'NOTAM-DEL-TFR-2024-15AUG', authority: 'DGCA', description: 'Temporary flight restriction for Independence Day.', active: false, color: '#ff6600' },

  // ISRO launch zones
  { id: 'nfz-16', name: 'R-9 SHAR Sriharikota', type: 'restricted', classification: 'R-9', altFloor: 0, altCeiling: 99999, boundary: [[13.75, 80.15], [13.75, 80.30], [13.60, 80.30], [13.60, 80.15]], notamId: null, authority: 'ISRO', description: 'Satish Dhawan Space Centre. Active during launches.', active: true, color: '#ff4400' },
  { id: 'nfz-17', name: 'D-4 Downrange Corridor', type: 'danger', classification: 'D-4', altFloor: 0, altCeiling: 99999, boundary: [[12.0, 80.3], [12.0, 82.0], [10.0, 82.0], [10.0, 80.3]], notamId: null, authority: 'ISRO', description: 'ISRO launch downrange danger zone. Active during launches.', active: false, color: '#cc0000' },
];

// ─── Zone Type Styling ───────────────────────────────────────────────────────

const ZONE_STYLES: Record<string, { fillColor: Color; outlineColor: Color; label: string; icon: string }> = {
  prohibited: { fillColor: Color.RED.withAlpha(0.25), outlineColor: Color.RED, label: '🚫 PROHIBITED', icon: '🚫' },
  restricted: { fillColor: Color.fromCssColorString('#ff4400').withAlpha(0.2), outlineColor: Color.fromCssColorString('#ff4400'), label: '⛔ RESTRICTED', icon: '⛔' },
  danger:     { fillColor: Color.fromCssColorString('#cc0000').withAlpha(0.2), outlineColor: Color.fromCssColorString('#cc0000'), label: '☠️ DANGER', icon: '☠️' },
  military:   { fillColor: Color.fromCssColorString('#880000').withAlpha(0.22), outlineColor: Color.fromCssColorString('#880000'), label: '🎖️ MILITARY', icon: '🎖️' },
  temporary:  { fillColor: Color.fromCssColorString('#ff6600').withAlpha(0.18), outlineColor: Color.fromCssColorString('#ff6600'), label: '⏳ TEMPORARY', icon: '⏳' },
  tfr:        { fillColor: Color.fromCssColorString('#ff6600').withAlpha(0.18), outlineColor: Color.fromCssColorString('#ff6600'), label: '📋 TFR', icon: '📋' },
};

// ─── Layer Implementation ────────────────────────────────────────────────────

export class NoFlyZoneLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'no-fly-zones',
    name: 'No-Fly Zones',
    icon: '🚫',
    description: 'NOTAM/restricted airspace over India. Prohibited, restricted, military, and danger zones.',
    category: 'intelligence',
    color: '#ff0000',
    enabled: false,
    opacity: 1.0,
    dataStoreKey: 'noFlyZones',
  };

  constructor(viewer: Viewer, dataStore: any) {
    super(viewer, dataStore);
    this.initDataSource();
  }

  protected async loadData(): Promise<void> {
    this.clear();
    this.renderZones();
  }

  private renderZones(): void {
    NO_FLY_ZONES.forEach(zone => {
      const style = ZONE_STYLES[zone.type] || ZONE_STYLES.restricted;
      if (!zone.active) return; // Skip inactive zones

      // Zone polygon
      const positions = zone.boundary.map(b => Cartesian3.fromDegrees(b[1], b[0], 0));

      this.dataSource.entities.add({
        id: `nfz-${zone.id}`,
        polygon: {
          hierarchy: new PolygonHierarchy(positions),
          material: style.fillColor,
          outline: true,
          outlineColor: style.outlineColor.withAlpha(0.7),
          outlineWidth: 2,
          height: 0,
          heightReference: HeightReference.RELATIVE_TO_GROUND,
        },
      });

      // Zone outline at altitude
      const altPositions = zone.boundary.map(b => Cartesian3.fromDegrees(b[1], b[0], zone.altCeiling === 99999 ? 15000 : zone.altCeiling * 0.3048));

      this.dataSource.entities.add({
        id: `nfz-alt-${zone.id}`,
        polygon: {
          hierarchy: new PolygonHierarchy(altPositions),
          material: style.fillColor.withAlpha(0.08),
          outline: true,
          outlineColor: style.outlineColor.withAlpha(0.3),
          outlineWidth: 1,
        },
      });

      // Vertical walls connecting ground to ceiling
      for (let i = 0; i < zone.boundary.length; i++) {
        const next = (i + 1) % zone.boundary.length;
        const p1 = zone.boundary[i];
        const p2 = zone.boundary[next];
        const alt = zone.altCeiling === 99999 ? 15000 : zone.altCeiling * 0.3048;

        this.dataSource.entities.add({
          id: `nfz-wall-${zone.id}-${i}`,
          polyline: {
            positions: [
              Cartesian3.fromDegrees(p1[1], p1[0], 0),
              Cartesian3.fromDegrees(p1[1], p1[0], alt),
              Cartesian3.fromDegrees(p2[1], p2[0], alt),
              Cartesian3.fromDegrees(p2[1], p2[0], 0),
            ],
            width: 1,
            material: style.outlineColor.withAlpha(0.2),
          },
        });
      }

      // Zone label at center
      const centerLat = zone.boundary.reduce((s, b) => s + b[0], 0) / zone.boundary.length;
      const centerLng = zone.boundary.reduce((s, b) => s + b[1], 0) / zone.boundary.length;

      this.dataSource.entities.add({
        id: `nfz-label-${zone.id}`,
        position: Cartesian3.fromDegrees(centerLng, centerLat, 5000),
        label: {
          text: `${style.icon} ${zone.classification} — ${zone.name}`,
          font: '11px monospace',
          fillColor: style.outlineColor,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.8)'),
        },
        description: `
<div style="font-family:monospace;color:#f00;background:#111;padding:12px;border-radius:4px;">
  <h3 style="color:${style.outlineColor.toCssColorString()};margin:0 0 8px 0;">${style.icon} ${zone.name}</h3>
  <table style="color:#eee;width:100%;font-size:13px;">
    <tr><td>Classification:</td><td style="color:#f00;">${zone.classification}</td></tr>
    <tr><td>Type:</td><td style="color:${style.outlineColor.toCssColorString()};">${style.label}</td></tr>
    <tr><td>Authority:</td><td style="color:#f00;">${zone.authority}</td></tr>
    <tr><td>Altitude:</td><td style="color:#f00;">${zone.altFloor} — ${zone.altCeiling === 99999 ? 'UNL' : zone.altCeiling} ft</td></tr>
    <tr><td>NOTAM:</td><td style="color:#ff0;">${zone.notamId || 'N/A'}</td></tr>
    <tr><td>Status:</td><td style="color:${zone.active ? '#f44' : '#4caf50'};">${zone.active ? 'ACTIVE' : 'INACTIVE'}</td></tr>
  </table>
  <p style="margin:8px 0 0;font-size:12px;color:#ccc;">${zone.description}</p>
</div>`,
      });
    });
  }
}
