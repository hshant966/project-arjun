/**
 * EnhancedShaderEffects — Bilawal's exact shaders made more realistic
 * CRT scanlines with artifacts + vignette, NVG phosphor glow + grain,
 * FLIR black-hot/white-hot, Military HUD animated crosshair
 */
import { Viewer, PostProcessStage } from 'cesium';

// ─── Enhanced CRT Scanlines ──────────────────────────────────────────────────
const CRT_ENHANCED_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;
uniform float u_time;

void main() {
  vec2 uv = v_textureCoordinates;
  vec4 color = texture(colorTexture, uv);

  // CRT scanline artifacts — thick lines with blur
  float scanFreq = 600.0;
  float scanLine = sin(uv.y * scanFreq * 3.14159) * 0.5 + 0.5;
  scanLine = pow(scanLine, 1.5) * 0.12 * u_intensity;
  color.rgb -= scanLine;

  // Horizontal jitter (rolling artifact)
  float jitter = sin(u_time * 3.0 + uv.y * 50.0) * 0.0005 * u_intensity;
  vec4 jittered = texture(colorTexture, uv + vec2(jitter, 0.0));
  color.rgb = mix(color.rgb, jittered.rgb, 0.3);

  // RGB subpixel separation
  float offset = 0.001 * u_intensity;
  color.r = texture(colorTexture, uv + vec2(offset, 0.0)).r;
  color.b = texture(colorTexture, uv - vec2(offset, 0.0)).b;

  // Phosphor glow bloom
  vec4 bloom = vec4(0.0);
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      bloom += texture(colorTexture, uv + vec2(float(i), float(j)) * 0.002);
    }
  }
  bloom /= 25.0;
  color.rgb = mix(color.rgb, bloom.rgb, 0.08 * u_intensity);

  // Vignette — strong dark corners
  vec2 vig = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vig * 0.55, vig * 0.55);
  vignette = smoothstep(0.0, 1.0, vignette);
  color.rgb *= vignette;

  // Slight warm tint (CRT phosphor)
  color.r += 0.01 * u_intensity;
  color.g += 0.02 * u_intensity;

  // Random noise dots (static)
  float noise = fract(sin(dot(uv + u_time * 0.001, vec2(12.9898, 78.233))) * 43758.5453);
  color.rgb += (noise - 0.5) * 0.02 * u_intensity;

  out_FragColor = color;
}
`;

// ─── Enhanced NVG Night Vision ───────────────────────────────────────────────
const NVG_ENHANCED_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;
uniform float u_time;

// Noise function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec2 uv = v_textureCoordinates;
  vec4 color = texture(colorTexture, uv);

  // Luminance
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Green phosphor glow — P43 phosphor spectrum
  vec3 phosphorGreen = vec3(0.0, 0.95, 0.3);
  vec3 nvgColor = phosphorGreen * lum * 1.5;

  // Secondary glow from bright areas (blooming)
  float bloom = smoothstep(0.6, 1.0, lum) * 0.4;
  nvgColor += phosphorGreen * bloom;

  // Noise grain — temporal film grain
  float grain1 = hash(uv * 500.0 + u_time * 10.0) * 0.08;
  float grain2 = hash(uv * 200.0 - u_time * 5.0) * 0.05;
  nvgColor += (grain1 + grain2 - 0.065) * u_intensity;

  // Scanning line artifact (horizontal)
  float scanLine = sin(uv.y * 1200.0 + u_time * 20.0) * 0.02;
  nvgColor += scanLine * u_intensity;

  // Vignette — circular scope effect
  vec2 vig = uv * 2.0 - 1.0;
  float vigDist = length(vig);
  float vignette = 1.0 - smoothstep(0.6, 1.0, vigDist);
  nvgColor *= vignette;

  // Slight falloff at edges (goggle distortion)
  float distortion = 1.0 - vigDist * vigDist * 0.15;
  nvgColor *= distortion;

  // Mix with original based on intensity
  vec3 final_color = mix(color.rgb, nvgColor, u_intensity);

  out_FragColor = vec4(final_color, 1.0);
}
`;

// ─── Enhanced FLIR Thermal ───────────────────────────────────────────────────
const FLIR_ENHANCED_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;
uniform float u_time;

void main() {
  vec2 uv = v_textureCoordinates;
  vec4 color = texture(colorTexture, uv);
  float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

  // Add subtle heat shimmer
  float shimmer = sin(uv.y * 300.0 + u_time * 5.0) * 0.002;
  lum += shimmer;

  // Black-hot mode: hotter = brighter (inverse for cold objects)
  float thermal = lum;

  // FLIR ironbow palette (industrial thermal standard)
  vec3 thermalColor;
  if (thermal < 0.1) {
    thermalColor = vec3(0.0, 0.0, 0.0); // Black — cold
  } else if (thermal < 0.25) {
    thermalColor = mix(vec3(0.0, 0.0, 0.0), vec3(0.2, 0.0, 0.4), (thermal - 0.1) * 6.67);
  } else if (thermal < 0.4) {
    thermalColor = mix(vec3(0.2, 0.0, 0.4), vec3(0.6, 0.0, 0.2), (thermal - 0.25) * 6.67);
  } else if (thermal < 0.55) {
    thermalColor = mix(vec3(0.6, 0.0, 0.2), vec3(0.9, 0.2, 0.0), (thermal - 0.4) * 6.67);
  } else if (thermal < 0.7) {
    thermalColor = mix(vec3(0.9, 0.2, 0.0), vec3(1.0, 0.6, 0.0), (thermal - 0.55) * 6.67);
  } else if (thermal < 0.85) {
    thermalColor = mix(vec3(1.0, 0.6, 0.0), vec3(1.0, 1.0, 0.3), (thermal - 0.7) * 6.67);
  } else {
    thermalColor = mix(vec3(1.0, 1.0, 0.3), vec3(1.0, 1.0, 1.0), (thermal - 0.85) * 6.67);
  }

  // Noise for sensor grain
  float noise = fract(sin(dot(uv * 800.0, vec2(12.9898, 78.233))) * 43758.5453);
  thermalColor += (noise - 0.5) * 0.03;

  // Slight vignette
  vec2 vig = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vig * 0.3, vig * 0.3);
  thermalColor *= vignette;

  // Border frame (FLIR camera UI)
  float border = 0.0;
  if (uv.x < 0.02 || uv.x > 0.98 || uv.y < 0.02 || uv.y > 0.98) border = 1.0;
  thermalColor = mix(thermalColor, vec3(0.3), border * 0.5);

  out_FragColor = vec4(mix(color.rgb, thermalColor, u_intensity), 1.0);
}
`;

// ─── Enhanced Military HUD ───────────────────────────────────────────────────
const HUD_ENHANCED_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float u_intensity;
uniform float u_time;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  vec2 uv = v_textureCoordinates;
  vec2 center = vec2(0.5, 0.5);
  float dist = length(uv - center);

  // HUD green — brighter, more saturated
  vec3 hudColor = vec3(0.0, 1.0, 0.4);
  vec3 hudDim = vec3(0.0, 0.4, 0.15);

  float overlay = 0.0;

  // Animated crosshair — pulsing
  float pulse = sin(u_time * 3.0) * 0.001 + 0.001;
  if (abs(uv.x - 0.5) < pulse && abs(uv.y - 0.5) < 0.15) overlay = 1.0;
  if (abs(uv.y - 0.5) < pulse && abs(uv.x - 0.5) < 0.15) overlay = 1.0;

  // Crosshair gap (hollow center)
  float centerDist = length(uv - center);
  if (centerDist < 0.02) overlay = 0.0;

  // Targeting circle — animated rotation
  float angle = atan(uv.y - 0.5, uv.x - 0.5);
  float rotationOffset = u_time * 0.5;
  float rotatedAngle = mod(angle + rotationOffset, 3.14159 * 2.0);

  // Primary targeting ring
  float circle1 = abs(dist - 0.12) < 0.0015 ? 1.0 : 0.0;
  // Break the circle into segments
  if (rotatedAngle > 1.0 && rotatedAngle < 2.0) circle1 = 0.0;
  if (rotatedAngle > 4.0 && rotatedAngle < 5.0) circle1 = 0.0;
  overlay = max(overlay, circle1);

  // Secondary ring (larger, thinner)
  float circle2 = abs(dist - 0.2) < 0.001 ? 1.0 : 0.0;
  overlay = max(overlay, circle2 * 0.6);

  // Corner brackets — animated expansion
  float bracketExpand = sin(u_time * 2.0) * 0.005 + 0.07;
  float bracketThick = 0.002;
  // Top-left
  if (uv.x < bracketExpand && abs(uv.y - bracketExpand * 0.5) < bracketThick && uv.x > 0.01) overlay = max(overlay, 0.8);
  if (uv.y < bracketExpand && abs(uv.x - bracketExpand * 0.5) < bracketThick && uv.y > 0.01) overlay = max(overlay, 0.8);
  // Top-right
  if (uv.x > 1.0 - bracketExpand && abs(uv.y - bracketExpand * 0.5) < bracketThick && uv.x < 0.99) overlay = max(overlay, 0.8);
  if (uv.y < bracketExpand && abs(uv.x - (1.0 - bracketExpand * 0.5)) < bracketThick && uv.y > 0.01) overlay = max(overlay, 0.8);
  // Bottom-left
  if (uv.x < bracketExpand && abs(uv.y - (1.0 - bracketExpand * 0.5)) < bracketThick && uv.x > 0.01) overlay = max(overlay, 0.8);
  if (uv.y > 1.0 - bracketExpand && abs(uv.x - bracketExpand * 0.5) < bracketThick && uv.y < 0.99) overlay = max(overlay, 0.8);
  // Bottom-right
  if (uv.x > 1.0 - bracketExpand && abs(uv.y - (1.0 - bracketExpand * 0.5)) < bracketThick && uv.x < 0.99) overlay = max(overlay, 0.8);
  if (uv.y > 1.0 - bracketExpand && abs(uv.x - (1.0 - bracketExpand * 0.5)) < bracketThick && uv.y < 0.99) overlay = max(overlay, 0.8);

  // Tick marks around targeting circle (rotating)
  float ticks = 0.0;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 3.14159 / 6.0 + u_time * 0.3;
    vec2 tickPos = center + vec2(cos(a), sin(a)) * 0.16;
    if (length(uv - tickPos) < 0.003) ticks = 1.0;
  }
  overlay = max(overlay, ticks * 0.7);

  // Distance markers on crosshair
  float markers = 0.0;
  for (int i = 1; i <= 3; i++) {
    float d = float(i) * 0.05;
    if (abs(uv.x - 0.5) < 0.001 && abs(abs(uv.y - 0.5) - d) < 0.003) markers = 1.0;
    if (abs(uv.y - 0.5) < 0.001 && abs(abs(uv.x - 0.5) - d) < 0.003) markers = 1.0;
  }
  overlay = max(overlay, markers * 0.5);

  // Data readout bar at bottom
  if (uv.y > 0.93 && u_intensity > 0.5) {
    overlay = max(overlay, 0.3);
  }

  // Scanning line (horizontal sweep)
  float scanY = fract(u_time * 0.15);
  if (abs(uv.y - scanY) < 0.003) overlay = max(overlay, 0.4);

  vec3 final_color = mix(color.rgb, hudColor, overlay * u_intensity * 0.85);
  out_FragColor = vec4(final_color, 1.0);
}
`;

// ─── Public API ──────────────────────────────────────────────────────────────

export type EnhancedEffectType = 'crt-enhanced' | 'nvg-enhanced' | 'flir-enhanced' | 'hud-enhanced';

export class EnhancedShaderEffects {
  private viewer: Viewer;
  private stages: Map<EnhancedEffectType, PostProcessStage> = new Map();
  private activeEffect: EnhancedEffectType | null = null;
  private timeUniform = { u_time: 0.0 };
  private animFrame: number | null = null;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  initialize(): void {
    // CRT Enhanced
    this.stages.set('crt-enhanced', new PostProcessStage({
      fragmentShader: CRT_ENHANCED_SHADER,
      uniforms: {
        u_intensity: () => 0.85,
        u_time: () => this.timeUniform.u_time,
      },
    }));

    // NVG Enhanced
    this.stages.set('nvg-enhanced', new PostProcessStage({
      fragmentShader: NVG_ENHANCED_SHADER,
      uniforms: {
        u_intensity: () => 0.9,
        u_time: () => this.timeUniform.u_time,
      },
    }));

    // FLIR Enhanced
    this.stages.set('flir-enhanced', new PostProcessStage({
      fragmentShader: FLIR_ENHANCED_SHADER,
      uniforms: {
        u_intensity: () => 0.85,
        u_time: () => this.timeUniform.u_time,
      },
    }));

    // HUD Enhanced
    this.stages.set('hud-enhanced', new PostProcessStage({
      fragmentShader: HUD_ENHANCED_SHADER,
      uniforms: {
        u_intensity: () => 0.75,
        u_time: () => this.timeUniform.u_time,
      },
    }));

    this.startTimeAnimation();
  }

  private startTimeAnimation(): void {
    const tick = () => {
      this.timeUniform.u_time += 0.016;
      this.animFrame = requestAnimationFrame(tick);
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  enableEffect(type: EnhancedEffectType): void {
    if (this.activeEffect) this.disableEffect();
    const stage = this.stages.get(type);
    if (stage) {
      this.viewer.postProcessStages.add(stage);
      this.activeEffect = type;
    }
  }

  disableEffect(): void {
    if (this.activeEffect) {
      const stage = this.stages.get(this.activeEffect);
      if (stage) this.viewer.postProcessStages.remove(stage);
      this.activeEffect = null;
    }
  }

  getActiveEffect(): EnhancedEffectType | null {
    return this.activeEffect;
  }

  cycleEffect(): EnhancedEffectType | null {
    const effects: EnhancedEffectType[] = ['crt-enhanced', 'nvg-enhanced', 'flir-enhanced', 'hud-enhanced'];
    if (!this.activeEffect) {
      this.enableEffect(effects[0]);
      return effects[0];
    }
    const idx = effects.indexOf(this.activeEffect);
    const next = (idx + 1) % effects.length;
    if (next === effects.length - 1 && idx === effects.length - 1) {
      this.disableEffect();
      return null;
    }
    this.enableEffect(effects[next]);
    return effects[next];
  }

  destroy(): void {
    this.disableEffect();
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.stages.clear();
  }
}
