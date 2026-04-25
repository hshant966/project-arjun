import {
  Viewer, Math as CesiumMath, Cartesian3, HeadingPitchRange,
  EllipsoidTerrainProvider, UrlTemplateImageryProvider,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import { LayerManager } from './layers/LayerManager';
import { MaharashtraDistrictsLayer } from './layers/MaharashtraDistrictsLayer';
import { Dashboard } from './components/Dashboard';
import { Timeline } from './components/Timeline';
import { MorningBriefing } from './components/MorningBriefing';
import { DataStore } from './data/DataStore';

// ─── Boot Sequence ──────────────────────────────────────────────
const statusEl = document.getElementById('loading-status')!;
const loadingScreen = document.getElementById('loading-screen')!;

function setStatus(msg: string) {
  statusEl.textContent = msg;
  console.log(`[God's Eye] ${msg}`);
}

async function init() {
  setStatus('Loading Cesium engine...');

  // Cesium viewer with OpenStreetMap base layer (no Ion token needed)
  const viewer = new Viewer('cesiumContainer', {
    terrainProvider: new EllipsoidTerrainProvider(),
    baseLayer: false, // Disable default Bing Maps (needs Ion token)
    animation: false,
    timeline: false,
    fullscreenButton: false,
    vrButton: false,
    geocoder: false,
    homeButton: false,
    infoBox: true,
    selectionIndicator: true,
    navigationHelpButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    shadows: true,
    shouldAnimate: true,
  });

  // Add OpenStreetMap as base imagery (free, no token needed)
  viewer.imageryLayers.addImageryProvider(
    new UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      credit: '© OpenStreetMap contributors',
      maximumLevel: 18,
    })
  );

  // Disable default Cesium credit
  (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';

  // Set initial camera position over India
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(78.9, 20.6, 4000000),
    orientation: {
      heading: CesiumMath.toRadians(0),
      pitch: CesiumMath.toRadians(-45),
      roll: 0,
    },
    duration: 0,
  });

  setStatus('Initializing data store...');
  const dataStore = new DataStore();

  setStatus('Loading layer manager...');
  const layerManager = new LayerManager(viewer, dataStore);

  setStatus('Building dashboard...');
  const dashboard = new Dashboard(viewer, layerManager, dataStore);

  setStatus('Initializing Morning Briefing...');
  const morningBriefing = new MorningBriefing(dataStore);

  // Add briefing toggle button to navbar
  const navRight = document.querySelector('.ge-navbar-right') || document.querySelector('.ge-navbar');
  if (navRight) {
    const briefingBtn = document.createElement('button');
    briefingBtn.className = 'ge-navbar-btn';
    briefingBtn.innerHTML = '🏛️ Briefing';
    briefingBtn.title = 'Open Morning Briefing';
    briefingBtn.addEventListener('click', () => morningBriefing.toggle());
    navRight.appendChild(briefingBtn);
  }

  setStatus('Initializing timeline...');
  const timeline = new Timeline(viewer, layerManager, dataStore);

  // Load all layers
  setStatus('Loading data layers...');
  await layerManager.initialize();

  // Auto-enable key layers so the user sees something immediately
  setStatus('Activating intelligence layers...');
  const defaultLayers = [
    'live-air-traffic',
    'satellite-constellation',
    'gps-jamming',
    'maritime-traffic',
    'no-fly-zones',
    'cross-border',
    'nuclear-facilities',
    'strategic-infrastructure',
    'river-basin',
    'power-grid',
    'india-states',
  ];
  for (const id of defaultLayers) {
    try {
      await layerManager.enableLayer(id);
    } catch (e) {
      console.warn(`Could not enable layer ${id}:`, e);
    }
  }

  // Setup district drill-down click handler
  const districtLayer = layerManager.getLayer('maharashtra-districts') as MaharashtraDistrictsLayer;
  if (districtLayer) {
    districtLayer.setupDrillDown(viewer);
  }

  // Hide loading screen
  setStatus('Ready!');
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    setTimeout(() => loadingScreen.remove(), 500);
  }, 500);

  // Store globals for debugging
  (window as any).godsEye = { viewer, layerManager, dashboard, timeline, dataStore, morningBriefing };
}

init().catch(err => {
  console.error('Failed to initialize God\'s Eye:', err);
  setStatus(`Error: ${err.message}`);
});
