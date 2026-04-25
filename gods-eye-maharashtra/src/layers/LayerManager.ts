/**
 * LayerManager — Manages all map layers and their lifecycle
 */
import { Viewer } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

// Import all layers
import { MaharashtraDistrictsLayer } from './MaharashtraDistrictsLayer';
import { WaterQualityLayer } from './WaterQualityLayer';
import { AirQualityLayer } from './AirQualityLayer';
import { HealthInfrastructureLayer } from './HealthInfrastructureLayer';
import { AgricultureLayer } from './AgricultureLayer';
import { InfrastructureLayer } from './InfrastructureLayer';
import { GovtSchemesLayer } from './GovtSchemesLayer';
import { RainfallLayer } from './RainfallLayer';
import { NewsEventsLayer } from './NewsEventsLayer';
import { SatelliteLayer } from './SatelliteLayer';
// India-wide layers
import { IndiaStatesLayer } from './IndiaStatesLayer';
import { GovtSchemesIndiaLayer } from './GovtSchemesIndiaLayer';
import { NewsVerificationLayer } from './NewsVerificationLayer';
import { FailuresLayer } from './FailuresLayer';
import { HeatmapLayer } from './HeatmapLayer';
// Project Arjun — Critical disaster & surveillance layers
import { DisasterManagementLayer } from './DisasterManagementLayer';
import { TrafficCameraLayer } from './TrafficCameraLayer';
import { SatelliteTrackingLayer } from './SatelliteTrackingLayer';
import { AircraftTrackingLayer } from './AircraftTrackingLayer';
// New data layers
import { CrimeHeatmapLayer } from './CrimeHeatmapLayer';
import { EducationLayer } from './EducationLayer';
import { ElectionLayer } from './ElectionLayer';
import { WaterContaminationLayer } from './WaterContaminationLayer';
// Live data layer
import { LiveDataLayer } from './LiveDataLayer';
// God's Eye — Intelligence layers (Priority 1)
import { LiveAirTrafficLayer } from './LiveAirTrafficLayer';
import { SatelliteConstellationLayer } from './SatelliteConstellationLayer';
import { GPSJammingLayer } from './GPSJammingLayer';
import { MaritimeTrafficLayer } from './MaritimeTrafficLayer';
import { NoFlyZoneLayer } from './NoFlyZoneLayer';
// God's Eye — Visual effects & Panoptic mode (Priority 2-3)
import { ShaderEffects, EffectType } from './ShaderEffects';
import { TimelineReplay } from './TimelineReplay';
import { PanopticMode } from './PanopticMode';
// God's Eye — Extended intelligence layers (Priority 4)
import { RealTimeDataBridge } from './RealTimeDataBridge';
import { CrossBorderLayer } from './CrossBorderLayer';
import { NuclearFacilitiesLayer } from './NuclearFacilitiesLayer';
import { StrategicInfrastructureLayer } from './StrategicInfrastructureLayer';
import { RiverBasinLayer } from './RiverBasinLayer';
import { PowerGridLayer } from './PowerGridLayer';
import { NightMode } from './NightMode';
import { DataDensityOverlay } from './DataDensityOverlay';

export class LayerManager {
  private viewer: Viewer;
  private dataStore: DataStore;
  private layers: Map<string, BaseLayer> = new Map();
  // God's Eye visual effects
  public readonly shaderEffects: ShaderEffects;
  public readonly timeline: TimelineReplay;
  public readonly panoptic: PanopticMode;

  constructor(viewer: Viewer, dataStore: DataStore) {
    this.viewer = viewer;
    this.dataStore = dataStore;
    this.shaderEffects = new ShaderEffects(viewer);
    this.timeline = new TimelineReplay(viewer);
    this.panoptic = new PanopticMode(viewer);
  }

  async initialize(): Promise<void> {
    // Register all layers
    const layerClasses = [
      MaharashtraDistrictsLayer,
      WaterQualityLayer,
      AirQualityLayer,
      HealthInfrastructureLayer,
      AgricultureLayer,
      InfrastructureLayer,
      GovtSchemesLayer,
      RainfallLayer,
      NewsEventsLayer,
      SatelliteLayer,
      HeatmapLayer,
      // India-wide layers
      IndiaStatesLayer,
      GovtSchemesIndiaLayer,
      NewsVerificationLayer,
      FailuresLayer,
      // New data layers
      CrimeHeatmapLayer,
      EducationLayer,
      ElectionLayer,
      WaterContaminationLayer,
      // Project Arjun — Disaster & surveillance layers
      DisasterManagementLayer,
      TrafficCameraLayer,
      SatelliteTrackingLayer,
      AircraftTrackingLayer,
      // God's Eye — Intelligence layers
      LiveAirTrafficLayer,
      SatelliteConstellationLayer,
      GPSJammingLayer,
      MaritimeTrafficLayer,
      NoFlyZoneLayer,
      // God's Eye — Extended intelligence layers (Priority 4)
      RealTimeDataBridge,
      CrossBorderLayer,
      NuclearFacilitiesLayer,
      StrategicInfrastructureLayer,
      RiverBasinLayer,
      PowerGridLayer,
      NightMode,
      DataDensityOverlay,
    ];

    // Add live data layer separately (different constructor)
    const liveDataLayer = new LiveDataLayer(this.viewer, this.dataStore);
    this.layers.set(liveDataLayer.config.id, liveDataLayer);

    for (const LayerClass of layerClasses) {
      const layer = new LayerClass(this.viewer, this.dataStore);
      this.layers.set(layer.config.id, layer);
      try {
        await layer.initialize();
      } catch (err) {
        console.warn(`Failed to initialize layer ${layer.config.id}:`, err);
      }
    }

    // Initialize God's Eye visual effects
    this.shaderEffects.initialize();

    // Wire up PanopticMode to toggle layers
    this.panoptic.setLayerToggleCallback(async (layerIds: string[], enable: boolean) => {
      for (const id of layerIds) {
        const layer = this.layers.get(id);
        if (layer) {
          if (enable) await layer.enable();
          else await layer.disable();
        }
      }
    });
  }

  getLayer(id: string): BaseLayer | undefined {
    return this.layers.get(id);
  }

  getAllLayers(): BaseLayer[] {
    return Array.from(this.layers.values());
  }

  getLayersByCategory(category: LayerConfig['category']): BaseLayer[] {
    return this.getAllLayers().filter(l => l.config.category === category);
  }

  getEnabledLayers(): BaseLayer[] {
    return this.getAllLayers().filter(l => l.enabled);
  }

  async enableLayer(id: string): Promise<void> {
    const layer = this.layers.get(id);
    if (layer) await layer.enable();
  }

  async disableLayer(id: string): Promise<void> {
    const layer = this.layers.get(id);
    if (layer) await layer.disable();
  }

  async toggleLayer(id: string): Promise<void> {
    const layer = this.layers.get(id);
    if (layer) await layer.toggle();
  }

  async enableAll(): Promise<void> {
    for (const layer of this.layers.values()) {
      await layer.enable();
    }
  }

  async disableAll(): Promise<void> {
    for (const layer of this.layers.values()) {
      await layer.disable();
    }
  }

  getLayerConfigs(): LayerConfig[] {
    return this.getAllLayers().map(l => l.config);
  }
}
