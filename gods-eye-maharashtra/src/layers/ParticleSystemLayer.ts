/**
 * ParticleSystemLayer — Flowing particle visualization
 * Vehicle flow on highways, river flow, traffic density as flowing dots
 * Inspired by Bilawal's WorldView particle system approach
 */
import {
  Viewer, Cartesian3, Color, Entity, CallbackProperty,
  HeightReference, Cartesian2, PolylineGlowMaterialProperty,
  PolylineMaterialAppearance, Material,
} from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';
import { DataStore } from '../data/DataStore';

// Major Indian highway corridors for vehicle flow
const HIGHWAY_CORRIDORS = [
  { name: 'NH-44 (Delhi-Mumbai)', points: [[77.2, 28.6], [76.3, 27.0], [75.8, 26.9], [74.2, 24.6], [72.9, 19.1]], density: 0.9 },
  { name: 'NH-48 (Delhi-Bangalore)', points: [[77.2, 28.6], [76.8, 26.4], [75.8, 24.6], [74.9, 21.2], [73.9, 18.5], [77.6, 13.0]], density: 0.85 },
  { name: 'NH-44 (Delhi-Kolkata)', points: [[77.2, 28.6], [80.9, 26.8], [84.0, 25.6], [86.4, 23.8], [88.4, 22.6]], density: 0.7 },
  { name: 'NH-44 (Srinagar-Kanyakumari)', points: [[74.8, 34.1], [77.2, 28.6], [78.5, 17.4], [77.6, 13.0], [76.5, 8.1]], density: 0.6 },
  { name: 'Mumbai-Pune Expressway', points: [[72.9, 19.1], [73.2, 18.8], [73.6, 18.5], [73.9, 18.5]], density: 0.95 },
  { name: 'NH-47 (Ahmedabad-Vadodara)', points: [[72.6, 23.0], [73.0, 22.3], [73.2, 22.0]], density: 0.75 },
  { name: 'Yamuna Expressway', points: [[77.2, 28.6], [77.5, 27.5], [78.0, 27.2]], density: 0.8 },
];

// Indian rivers for flow visualization
const RIVERS = [
  { name: 'Ganges', points: [[78.0, 31.0], [79.0, 29.4], [80.5, 27.2], [82.0, 25.3], [84.0, 25.6], [86.0, 25.2], [87.5, 24.5], [88.0, 22.5]], color: '#4488FF', flow: 0.8 },
  { name: 'Yamuna', points: [[77.5, 31.0], [77.5, 30.0], [77.3, 28.6], [78.0, 27.0], [79.0, 26.5]], color: '#5599FF', flow: 0.6 },
  { name: 'Brahmaputra', points: [[92.0, 27.5], [91.5, 26.5], [91.0, 25.8], [90.5, 25.0], [90.0, 23.5]], color: '#3377EE', flow: 0.9 },
  { name: 'Godavari', points: [[73.5, 20.0], [75.0, 19.5], [77.0, 18.5], [79.0, 17.0], [81.0, 16.5], [82.3, 16.0]], color: '#4488DD', flow: 0.5 },
  { name: 'Krishna', points: [[73.8, 18.0], [75.0, 17.0], [77.0, 16.0], [79.5, 15.5], [80.0, 15.8]], color: '#55AAEE', flow: 0.5 },
  { name: 'Narmada', points: [[73.5, 22.5], [74.0, 22.0], [75.0, 21.8], [76.5, 21.5], [78.0, 21.7]], color: '#4499CC', flow: 0.4 },
];

interface Particle {
  pathIndex: number;
  progress: number;  // 0-1 along current segment
  speed: number;
  offset: number;    // lateral offset for multi-lane
}

export class ParticleSystemLayer extends BaseLayer {
  config: LayerConfig = {
    id: 'particle-system',
    name: 'Particle Flow',
    icon: '✨',
    description: 'Vehicle flow on highways & river flow as animated particles',
    category: 'intelligence',
    color: '#00FFAA',
    enabled: false,
    opacity: 0.8,
    dataStoreKey: 'particle-system',
  };

  private particles: Map<string, Particle[]> = new Map();
  private animFrame: number | null = null;

  constructor(viewer: Viewer, dataStore: DataStore) {
    super(viewer, dataStore);
  }

  protected async loadData(): Promise<void> {
    // Create highway flow particles
    for (const highway of HIGHWAY_CORRIDORS) {
      const particleCount = Math.floor(highway.density * 40) + 10;
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          pathIndex: 0,
          progress: Math.random(),
          speed: 0.001 + Math.random() * 0.002,
          offset: (Math.random() - 0.5) * 0.003,
        });
      }
      this.particles.set(`hw-${highway.name}`, particles);

      // Draw highway path
      const positions = highway.points.map(p => Cartesian3.fromDegrees(p[0], p[1], 500));
      this.dataSource.entities.add({
        name: highway.name,
        polyline: {
          positions,
          width: 3,
          material: Color.fromCssColorString('#FFAA00').withAlpha(0.3),
          clampToGround: true,
        },
      });

      // Create particle entities
      for (let i = 0; i < particleCount; i++) {
        const particle = particles[i];
        this.dataSource.entities.add({
          name: `${highway.name} vehicle #${i}`,
          position: new CallbackProperty(() => {
            return this.getParticlePosition(highway.points, particle);
          }, false) as any,
          point: {
            pixelSize: 4,
            color: new CallbackProperty(() => {
              const speed = particle.speed;
              if (speed > 0.0025) return Color.fromCssColorString('#FF4400').withAlpha(0.9);
              if (speed > 0.0015) return Color.fromCssColorString('#FFAA00').withAlpha(0.8);
              return Color.fromCssColorString('#00FF88').withAlpha(0.7);
            }, false) as any,
            heightReference: HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }
    }

    // Create river flow particles
    for (const river of RIVERS) {
      const particleCount = Math.floor(river.flow * 30) + 15;
      const particles: Particle[] = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          pathIndex: 0,
          progress: Math.random(),
          speed: 0.0005 + Math.random() * 0.001,
          offset: (Math.random() - 0.5) * 0.002,
        });
      }
      this.particles.set(`rv-${river.name}`, particles);

      // Draw river path (wider, blue)
      const positions = river.points.map(p => Cartesian3.fromDegrees(p[0], p[1], 100));
      this.dataSource.entities.add({
        name: river.name,
        polyline: {
          positions,
          width: 6,
          material: Color.fromCssColorString(river.color).withAlpha(0.35),
          clampToGround: true,
        },
      });

      // River particle entities
      for (let i = 0; i < particleCount; i++) {
        const particle = particles[i];
        this.dataSource.entities.add({
          name: `${river.name} flow #${i}`,
          position: new CallbackProperty(() => {
            return this.getParticlePosition(river.points, particle);
          }, false) as any,
          point: {
            pixelSize: 3,
            color: Color.fromCssColorString(river.color).withAlpha(0.8),
            heightReference: HeightReference.NONE,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
        });
      }
    }

    // Start animation loop
    this.startAnimation();
  }

  private getParticlePosition(points: number[][], particle: Particle): Cartesian3 {
    // Find current segment
    const totalSegments = points.length - 1;
    if (totalSegments <= 0) return Cartesian3.fromDegrees(points[0][0], points[0][1], 200);

    const segLen = 1.0 / totalSegments;
    const segIndex = Math.min(Math.floor(particle.progress / segLen), totalSegments - 1);
    const segProgress = (particle.progress - segIndex * segLen) / segLen;

    const p1 = points[segIndex];
    const p2 = points[segIndex + 1];

    const lon = p1[0] + (p2[0] - p1[0]) * segProgress;
    const lat = p1[1] + (p2[1] - p1[1]) * segProgress;

    return Cartesian3.fromDegrees(lon + particle.offset, lat, 300);
  }

  private startAnimation(): void {
    const tick = () => {
      for (const [, particles] of this.particles) {
        for (const p of particles) {
          p.progress += p.speed;
          if (p.progress >= 1.0) {
            p.progress -= 1.0;
          }
        }
      }
      this.animFrame = requestAnimationFrame(tick);
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  async disable(): Promise<void> {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    await super.disable();
  }
}
