/**
 * ShaderEffects — Post-processing visual effects for God's Eye
 * CRT scanlines, Night Vision (NVG), FLIR thermal, Military HUD
 */
import { Viewer, Color, PostProcessStage, PostProcessStageComposite } from 'cesium';
import { BaseLayer, LayerConfig } from './BaseLayer';

// ─── Shader Code ─────────────────────────────────────────────────────────────

const CRT_SCANLINE_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float scanline = sin(v_textureCoordinates.y * 800.0) * 0.04 * u_intensity;
  color.rgb -= scanline;
  // Vignette
  vec2 uv = v_textureCoordinates * 2.0 - 1.0;
  float vignette = 1.0 - dot(uv * 0.5, uv * 0.5);
  color.rgb *= vignette;
  // Slight green tint
  color.g += 0.02 * u_intensity;
  out_FragColor = color;
}
`;

const NVG_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  // Convert to luminance
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  // Green phosphor
  vec3 nvgColor = vec3(0.0, lum * 1.4, lum * 0.2) * u_intensity;
  // Add slight noise
  float noise = fract(sin(dot(v_textureCoordinates, vec2(12.9898, 78.233))) * 43758.5453);
  nvgColor += noise * 0.03;
  // Vignette
  vec2 uv = v_textureCoordinates * 2.0 - 1.0;
  float vignette = 1.0 - dot(uv * 0.4, uv * 0.4);
  out_FragColor = vec4(nvgColor * vignette, 1.0);
}
`;

const FLIR_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  // FLIR thermal palette: black → purple → red → yellow → white
  vec3 thermalColor;
  if (lum < 0.25) {
    thermalColor = mix(vec3(0.0, 0.0, 0.1), vec3(0.3, 0.0, 0.5), lum * 4.0);
  } else if (lum < 0.5) {
    thermalColor = mix(vec3(0.3, 0.0, 0.5), vec3(0.8, 0.0, 0.0), (lum - 0.25) * 4.0);
  } else if (lum < 0.75) {
    thermalColor = mix(vec3(0.8, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (lum - 0.5) * 4.0);
  } else {
    thermalColor = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), (lum - 0.75) * 4.0);
  }
  out_FragColor = vec4(mix(color.rgb, thermalColor, u_intensity), 1.0);
}
`;

const HUD_OVERLAY_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  vec2 uv = v_textureCoordinates;

  // HUD color (military green)
  vec3 hudColor = vec3(0.0, 1.0, 0.4);

  // Center crosshair
  vec2 center = vec2(0.5, 0.5);
  float dist = length(uv - center);

  // Crosshair lines
  float crosshair = 0.0;
  if (abs(uv.x - 0.5) < 0.001 && abs(uv.y - 0.5) < 0.12) crosshair = 1.0;
  if (abs(uv.y - 0.5) < 0.001 && abs(uv.x - 0.5) < 0.12) crosshair = 1.0;

  // Targeting circle
  float circle = abs(dist - 0.1) < 0.002 ? 1.0 : 0.0;
  float circle2 = abs(dist - 0.15) < 0.001 ? 1.0 : 0.0;

  // Corner brackets
  float bracket = 0.0;
  // Top-left
  if (uv.x < 0.08 && abs(uv.y - 0.05) < 0.002 && uv.x > 0.02) bracket = 1.0;
  if (uv.y < 0.08 && abs(uv.x - 0.05) < 0.002 && uv.y > 0.02) bracket = 1.0;
  // Top-right
  if (uv.x > 0.92 && abs(uv.y - 0.05) < 0.002 && uv.x < 0.98) bracket = 1.0;
  if (uv.y < 0.08 && abs(uv.x - 0.95) < 0.002 && uv.y > 0.02) bracket = 1.0;
  // Bottom-left
  if (uv.x < 0.08 && abs(uv.y - 0.95) < 0.002 && uv.x > 0.02) bracket = 1.0;
  if (uv.y > 0.92 && abs(uv.x - 0.05) < 0.002 && uv.y < 0.98) bracket = 1.0;
  // Bottom-right
  if (uv.x > 0.92 && abs(uv.y - 0.95) < 0.002 && uv.x < 0.98) bracket = 1.0;
  if (uv.y > 0.92 && abs(uv.x - 0.95) < 0.002 && uv.y < 0.98) bracket = 1.0;

  // Tick marks around circle
  float ticks = 0.0;
  for (int i = 0; i < 12; i++) {
    float angle = float(i) * 3.14159 / 6.0;
    vec2 tickPos = center + vec2(cos(angle), sin(angle)) * 0.12;
    if (length(uv - tickPos) < 0.003) ticks = 1.0;
  }

  float overlay = max(max(crosshair, circle), max(circle2, max(bracket, ticks)));
  vec3 final_color = mix(color.rgb, hudColor, overlay * u_intensity * 0.8);

  // Scan line at bottom (data readout area)
  if (uv.y > 0.92 && u_intensity > 0.5) {
    final_color = mix(final_color, hudColor * 0.3, 0.3);
  }

  out_FragColor = vec4(final_color, 1.0);
}
`;

// ─── Layer Implementation ────────────────────────────────────────────────────

export type EffectType = 'crt' | 'nvg' | 'flir' | 'hud';

export class ShaderEffects {
  private viewer: Viewer;
  private stages: Map<EffectType, PostProcessStage> = new Map();
  private activeEffect: EffectType | null = null;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  initialize(): void {
    this.createStages();
  }

  private createStages(): void {
    // CRT Scanlines
    this.stages.set('crt', new PostProcessStage({
      fragmentShader: CRT_SCANLINE_SHADER,
      uniforms: { u_intensity: 0.8 },
    }));

    // Night Vision (NVG)
    this.stages.set('nvg', new PostProcessStage({
      fragmentShader: NVG_SHADER,
      uniforms: { u_intensity: 0.9 },
    }));

    // FLIR Thermal
    this.stages.set('flir', new PostProcessStage({
      fragmentShader: FLIR_SHADER,
      uniforms: { u_intensity: 0.85 },
    }));

    // Military HUD
    this.stages.set('hud', new PostProcessStage({
      fragmentShader: HUD_OVERLAY_SHADER,
      uniforms: { u_intensity: 0.7 },
    }));
  }

  enableEffect(type: EffectType): void {
    // Disable current effect
    if (this.activeEffect) {
      this.disableEffect();
    }

    const stage = this.stages.get(type);
    if (stage) {
      this.viewer.postProcessStages.add(stage);
      this.activeEffect = type;
    }
  }

  disableEffect(): void {
    if (this.activeEffect) {
      const stage = this.stages.get(this.activeEffect);
      if (stage) {
        this.viewer.postProcessStages.remove(stage);
      }
      this.activeEffect = null;
    }
  }

  getActiveEffect(): EffectType | null {
    return this.activeEffect;
  }

  setIntensity(type: EffectType, value: number): void {
    const stage = this.stages.get(type);
    if (stage) {
      (stage as any).uniforms.u_intensity = Math.max(0, Math.min(1, value));
    }
  }

  destroy(): void {
    this.disableEffect();
    this.stages.clear();
  }
}
