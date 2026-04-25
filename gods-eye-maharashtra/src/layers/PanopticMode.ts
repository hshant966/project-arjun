/**
 * PanopticMode — God's Eye all-seeing mode
 * Toggles ALL intelligence layers simultaneously
 * Military-style HUD overlay with enhanced data density
 */
import { Viewer, Color, PostProcessStage, Cartesian3, Entity, LabelStyle, Cartesian2, VerticalOrigin } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── HUD Shader ──────────────────────────────────────────────────────────────

const PANOPTIC_HUD_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;
uniform float u_time;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  vec2 uv = v_textureCoordinates;
  vec3 hudGreen = vec3(0.0, 1.0, 0.4);

  // Scan line effect
  float scan = sin(uv.y * 1200.0 + u_time * 2.0) * 0.015 * u_intensity;
  color.rgb -= scan;

  // Edge glow
  float edge = 0.0;
  edge += smoothstep(0.0, 0.02, uv.x) * smoothstep(0.02, 0.0, uv.x - 0.98);
  edge += smoothstep(0.0, 0.02, uv.y) * smoothstep(0.02, 0.0, uv.y - 0.98);
  color.rgb += hudGreen * edge * 0.3 * u_intensity;

  // Corner brackets
  float bracket = 0.0;
  float bSize = 0.06;
  float bThick = 0.002;
  // Top-left
  if (uv.x < bSize && abs(uv.y - 0.03) < bThick && uv.x > 0.01) bracket = 1.0;
  if (uv.y < bSize && abs(uv.x - 0.03) < bThick && uv.y > 0.01) bracket = 1.0;
  // Top-right
  if (uv.x > 1.0-bSize && abs(uv.y - 0.03) < bThick && uv.x < 0.99) bracket = 1.0;
  if (uv.y < bSize && abs(uv.x - 0.97) < bThick && uv.y > 0.01) bracket = 1.0;
  // Bottom-left
  if (uv.x < bSize && abs(uv.y - 0.97) < bThick && uv.x > 0.01) bracket = 1.0;
  if (uv.y > 1.0-bSize && abs(uv.x - 0.03) < bThick && uv.y < 0.99) bracket = 1.0;
  // Bottom-right
  if (uv.x > 1.0-bSize && abs(uv.y - 0.97) < bThick && uv.x < 0.99) bracket = 1.0;
  if (uv.y > 1.0-bSize && abs(uv.x - 0.97) < bThick && uv.y < 0.99) bracket = 1.0;

  // Center reticle
  vec2 center = vec2(0.5, 0.5);
  float dist = length(uv - center);
  float crosshair = 0.0;
  if (abs(uv.x - 0.5) < 0.0008 && abs(uv.y - 0.5) < 0.08) crosshair = 1.0;
  if (abs(uv.y - 0.5) < 0.0008 && abs(uv.x - 0.5) < 0.08) crosshair = 1.0;
  float ring = abs(dist - 0.06) < 0.001 ? 1.0 : 0.0;
  float ring2 = abs(dist - 0.1) < 0.0008 ? 1.0 : 0.0;

  // Rotating tick marks
  float ticks = 0.0;
  for (int i = 0; i < 36; i++) {
    float angle = float(i) * 0.1745 + u_time * 0.3;
    vec2 tickPos = center + vec2(cos(angle), sin(angle)) * 0.08;
    if (length(uv - tickPos) < 0.002) ticks = 1.0;
  }

  float overlay = max(max(bracket, crosshair), max(ring, max(ring2, ticks)));
  color.rgb = mix(color.rgb, hudGreen, overlay * u_intensity * 0.7);

  // Bottom bar (data readout simulation)
  if (uv.y > 0.95) {
    color.rgb = mix(color.rgb, hudGreen * 0.15, u_intensity * 0.5);
    // Thin line
    if (abs(uv.y - 0.955) < 0.001) color.rgb = mix(color.rgb, hudGreen, u_intensity * 0.6);
  }

  // Top bar
  if (uv.y < 0.03) {
    color.rgb = mix(color.rgb, hudGreen * 0.1, u_intensity * 0.4);
  }

  // Slight color enhancement
  color.rgb *= 1.0 + u_intensity * 0.1;

  out_FragColor = color;
}
`;

// ─── Layer Implementation ────────────────────────────────────────────────────

export class PanopticMode {
  private viewer: Viewer;
  private active = false;
  private hudStage: PostProcessStage | null = null;
  private hudEntity: Entity | null = null;
  private animFrame: number | null = null;
  private timeOffset = 0;

  // Callbacks to enable/disable other layers
  private layerToggleCallback: ((layerIds: string[], enable: boolean) => void) | null = null;

  // Layer IDs to manage
  private readonly PANOPTIC_LAYERS = [
    'live-air-traffic',
    'satellite-constellation',
    'gps-jamming',
    'maritime-traffic',
    'no-fly-zones',
  ];

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  setLayerToggleCallback(cb: (layerIds: string[], enable: boolean) => void): void {
    this.layerToggleCallback = cb;
  }

  isActive(): boolean {
    return this.active;
  }

  /** Toggle panoptic mode */
  toggle(): void {
    if (this.active) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /** Activate all layers + HUD */
  activate(): void {
    if (this.active) return;
    this.active = true;

    // Enable all intelligence layers
    if (this.layerToggleCallback) {
      this.layerToggleCallback(this.PANOPTIC_LAYERS, true);
    }

    // Enable HUD post-processing
    this.hudStage = new PostProcessStage({
      fragmentShader: PANOPTIC_HUD_SHADER,
      uniforms: {
        u_intensity: 0.6,
        u_time: 0.0,
      },
    });
    this.viewer.postProcessStages.add(this.hudStage);

    // Add HUD overlay text entities
    this.addHUDOverlay();

    // Start animation
    this.startAnimation();
  }

  /** Deactivate panoptic mode */
  deactivate(): void {
    if (!this.active) return;
    this.active = false;

    // Disable HUD
    if (this.hudStage) {
      this.viewer.postProcessStages.remove(this.hudStage);
      this.hudStage = null;
    }

    // Remove HUD entities
    if (this.hudEntity) {
      this.viewer.entities.remove(this.hudEntity);
      this.hudEntity = null;
    }

    // Stop animation
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  private addHUDOverlay(): void {
    // Add persistent HUD text overlay
    this.hudEntity = this.viewer.entities.add({
      position: Cartesian3.fromDegrees(78.9629, 20.5937, 0),
      label: {
        text: '◆ GOD\'S EYE — PANOPTIC MODE ◆',
        font: 'bold 14px monospace',
        fillColor: Color.fromCssColorString('#00ff66'),
        outlineColor: Color.BLACK,
        outlineWidth: 2,
        style: LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: VerticalOrigin.TOP,
        pixelOffset: new Cartesian2(0, 10),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: Color.fromCssColorString('rgba(0,0,0,0.8)'),
      },
    } as any);
  }

  private startAnimation(): void {
    const animate = () => {
      if (!this.active || !this.hudStage) return;
      this.timeOffset += 0.016;
      (this.hudStage as any).uniforms.u_time = this.timeOffset;
      this.animFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  /** Get list of layer IDs managed by panoptic mode */
  getManagedLayerIds(): string[] {
    return [...this.PANOPTIC_LAYERS];
  }
}
