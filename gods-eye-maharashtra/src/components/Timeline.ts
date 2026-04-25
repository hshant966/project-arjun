/**
 * Timeline — Time navigation, animation controls, and historical data playback
 * Supports speed controls (0.5x–30x), step intervals, loop mode, and date-change callbacks
 */
import { Viewer, JulianDate, ClockRange, ClockStep, Clock } from 'cesium';
import { LayerManager } from '../layers/LayerManager';
import { DataStore } from '../data/DataStore';

export interface TimelinePlaybackOptions {
  speeds: number[];      // Available speed multipliers
  defaultSpeed: number;  // Starting speed
  stepDays: number;      // Days per step (forward/back)
  loop: boolean;         // Loop at end of range
}

export type DateChangeCallback = (date: Date, mode: 'manual' | 'playback' | 'slider') => void;

export class Timeline {
  private viewer: Viewer;
  private layerManager: LayerManager;
  private dataStore: DataStore;
  private container: HTMLElement;
  private isPlaying = false;
  private currentDate: Date;
  private startDate: Date;
  private endDate: Date;
  private speed = 1;
  private loop = true;
  private animationFrameId: number | null = null;

  // Speed control config
  private speeds = [0.5, 1, 2, 5, 10, 30];
  private speedIdx = 1; // default 1x
  private stepDays = 7;

  // Date change listeners
  private dateChangeCallbacks: DateChangeCallback[] = [];

  constructor(viewer: Viewer, layerManager: LayerManager, dataStore: DataStore, options?: Partial<TimelinePlaybackOptions>) {
    this.viewer = viewer;
    this.layerManager = layerManager;
    this.dataStore = dataStore;

    if (options?.speeds) this.speeds = options.speeds;
    if (options?.defaultSpeed) {
      const idx = this.speeds.indexOf(options.defaultSpeed);
      this.speedIdx = idx >= 0 ? idx : 1;
      this.speed = this.speeds[this.speedIdx];
    }
    if (options?.stepDays) this.stepDays = options.stepDays;
    if (options?.loop !== undefined) this.loop = options.loop;

    this.endDate = new Date();
    this.startDate = new Date('2024-01-01');
    this.currentDate = new Date();

    this.container = document.createElement('div');
    this.container.id = 'timeline-container';
    document.getElementById('ui-overlay')!.appendChild(this.container);

    this.render();
    this.attachListeners();
  }

  private render() {
    const speedOptionsHtml = this.speeds.map((s, i) =>
      `<div class="tl-speed-opt ${i === this.speedIdx ? 'active' : ''}" data-speed-idx="${i}">${s}x</div>`
    ).join('');

    this.container.innerHTML = `
      <style>
        #timeline-container {
          position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
          width: min(92%, 900px);
          background: rgba(10,10,15,0.94); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px; backdrop-filter: blur(20px);
          padding: 12px 20px;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .tl-btn {
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
          color: #aaa; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; transition: all 0.2s; flex-shrink: 0;
        }
        .tl-btn:hover { background: rgba(0,212,255,0.15); color: #00d4ff; border-color: rgba(0,212,255,0.3); }
        .tl-btn.active { background: rgba(0,212,255,0.25); color: #00d4ff; border-color: rgba(0,212,255,0.5); }
        .tl-btn.disabled { opacity: 0.3; pointer-events: none; }
        .tl-slider-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .tl-slider {
          width: 100%; height: 6px; -webkit-appearance: none; appearance: none;
          background: rgba(255,255,255,0.08); border-radius: 3px; outline: none;
          cursor: pointer;
        }
        .tl-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: #00d4ff; cursor: pointer; border: 2px solid #fff;
          box-shadow: 0 0 8px rgba(0,212,255,0.5);
        }
        .tl-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: #00d4ff; cursor: pointer; border: 2px solid #fff;
        }
        .tl-info {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.6rem; color: #555; padding: 0 2px;
        }
        .tl-date {
          font-size: 0.82rem; color: #00d4ff; font-weight: 600;
          min-width: 110px; text-align: center; flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
        /* Speed controls */
        .tl-speed-group {
          display: flex; align-items: center; gap: 2px; flex-shrink: 0;
          background: rgba(255,255,255,0.04); border-radius: 8px;
          padding: 3px; border: 1px solid rgba(255,255,255,0.08);
        }
        .tl-speed-opt {
          padding: 4px 7px; border-radius: 5px; font-size: 0.65rem;
          color: #666; cursor: pointer; transition: all 0.15s;
          text-align: center; min-width: 30px; user-select: none;
        }
        .tl-speed-opt:hover { color: #aaa; background: rgba(255,255,255,0.06); }
        .tl-speed-opt.active {
          background: rgba(0,212,255,0.2); color: #00d4ff; font-weight: 600;
        }
        /* Loop toggle */
        .tl-loop-btn {
          width: 28px; height: 28px; border-radius: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; transition: all 0.2s; flex-shrink: 0;
        }
        .tl-loop-btn:hover { color: #aaa; }
        .tl-loop-btn.active { background: rgba(0,212,255,0.15); color: #00d4ff; border-color: rgba(0,212,255,0.3); }
        /* Status indicator */
        .tl-status {
          width: 6px; height: 6px; border-radius: 50%;
          background: #333; flex-shrink: 0; transition: background 0.3s;
        }
        .tl-status.playing { background: #00ff88; box-shadow: 0 0 6px #00ff88; }
      </style>

      <div class="tl-status" id="tl-status" title="Playback status"></div>

      <button class="tl-btn" id="tl-back" title="Step Back (${this.stepDays}d)">⏪</button>
      <button class="tl-btn" id="tl-play" title="Play / Pause">▶</button>
      <button class="tl-btn" id="tl-forward" title="Step Forward (${this.stepDays}d)">⏩</button>

      <div class="tl-slider-wrap">
        <input type="range" class="tl-slider" id="tl-slider" min="0" max="1000" value="1000" step="1" />
        <div class="tl-info">
          <span id="tl-start">Jan 2024</span>
          <span id="tl-range-label" style="color:#00d4ff;opacity:0.5">|</span>
          <span id="tl-end">Apr 2026</span>
        </div>
      </div>

      <div class="tl-date" id="tl-date">Apr 2026</div>

      <div class="tl-speed-group" id="tl-speed-group">
        ${speedOptionsHtml}
      </div>

      <button class="tl-loop-btn ${this.loop ? 'active' : ''}" id="tl-loop" title="Loop playback">🔁</button>
    `;
  }

  private attachListeners() {
    const slider = document.getElementById('tl-slider') as HTMLInputElement;
    const playBtn = document.getElementById('tl-play')!;
    const backBtn = document.getElementById('tl-back')!;
    const forwardBtn = document.getElementById('tl-forward')!;
    const dateEl = document.getElementById('tl-date')!;
    const speedGroup = document.getElementById('tl-speed-group')!;
    const loopBtn = document.getElementById('tl-loop')!;
    const statusEl = document.getElementById('tl-status')!;

    // Slider
    let sliderDragging = false;
    slider.addEventListener('mousedown', () => { sliderDragging = true; });
    slider.addEventListener('mouseup', () => { sliderDragging = false; });
    slider.addEventListener('input', () => {
      const pct = parseInt(slider.value) / 1000;
      const range = this.endDate.getTime() - this.startDate.getTime();
      this.currentDate = new Date(this.startDate.getTime() + range * pct);
      this.updateDisplay(dateEl);
      this.notifyDateChange('slider');
    });

    // Play/Pause
    playBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      playBtn.textContent = this.isPlaying ? '⏸' : '▶';
      playBtn.classList.toggle('active', this.isPlaying);
      statusEl.classList.toggle('playing', this.isPlaying);

      if (this.isPlaying) {
        this.startAnimation(slider, dateEl);
      } else {
        this.stopAnimation();
      }
    });

    // Step back
    backBtn.addEventListener('click', () => {
      this.currentDate = new Date(this.currentDate.getTime() - this.stepDays * 86400000);
      if (this.currentDate < this.startDate) this.currentDate = new Date(this.startDate);
      this.syncSlider(slider);
      this.updateDisplay(dateEl);
      this.notifyDateChange('manual');
    });

    // Step forward
    forwardBtn.addEventListener('click', () => {
      this.currentDate = new Date(this.currentDate.getTime() + this.stepDays * 86400000);
      if (this.currentDate > this.endDate) this.currentDate = new Date(this.endDate);
      this.syncSlider(slider);
      this.updateDisplay(dateEl);
      this.notifyDateChange('manual');
    });

    // Speed selector
    speedGroup.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.tl-speed-opt') as HTMLElement;
      if (!target) return;
      const idx = parseInt(target.dataset.speedIdx!);
      this.speedIdx = idx;
      this.speed = this.speeds[idx];

      // Update active class
      speedGroup.querySelectorAll('.tl-speed-opt').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });
    });

    // Loop toggle
    loopBtn.addEventListener('click', () => {
      this.loop = !this.loop;
      loopBtn.classList.toggle('active', this.loop);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          playBtn.click();
          break;
        case 'ArrowLeft':
          backBtn.click();
          break;
        case 'ArrowRight':
          forwardBtn.click();
          break;
      }
    });
  }

  private startAnimation(slider: HTMLInputElement, dateEl: HTMLElement) {
    this.stopAnimation();

    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!this.isPlaying) return;

      const elapsed = now - lastTime;
      lastTime = now;

      const rangeMs = this.endDate.getTime() - this.startDate.getTime();
      // speed = 1x means 1 simulated day per ~100ms real time
      const msPerDay = 86400000;
      const advance = (elapsed / 100) * this.speed; // days to advance
      const advanceMs = advance * msPerDay * 0.02; // scale down for visual comfort

      this.currentDate = new Date(this.currentDate.getTime() + advanceMs);

      if (this.currentDate >= this.endDate) {
        if (this.loop) {
          this.currentDate = new Date(this.startDate);
        } else {
          this.currentDate = new Date(this.endDate);
          this.isPlaying = false;
          const playBtn = document.getElementById('tl-play')!;
          playBtn.textContent = '▶';
          playBtn.classList.remove('active');
          document.getElementById('tl-status')!.classList.remove('playing');
        }
      }

      this.syncSlider(slider);
      this.updateDisplay(dateEl);
      this.notifyDateChange('playback');

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopAnimation() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private syncSlider(slider: HTMLInputElement) {
    const range = this.endDate.getTime() - this.startDate.getTime();
    const pct = ((this.currentDate.getTime() - this.startDate.getTime()) / range) * 1000;
    slider.value = String(Math.max(0, Math.min(1000, Math.round(pct))));
  }

  private updateDisplay(dateEl: HTMLElement) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = this.currentDate;
    dateEl.textContent = `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private notifyDateChange(mode: 'manual' | 'playback' | 'slider') {
    for (const cb of this.dateChangeCallbacks) {
      try {
        cb(this.currentDate, mode);
      } catch (err) {
        console.warn('Timeline date change callback error:', err);
      }
    }
  }

  // ─── Public API ──────────────────────────────────────────────

  getCurrentDate(): Date {
    return this.currentDate;
  }

  setRange(start: Date, end: Date) {
    this.startDate = start;
    this.endDate = end;

    const startEl = document.getElementById('tl-start');
    const endEl = document.getElementById('tl-end');
    if (startEl && endEl) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      startEl.textContent = `${months[start.getMonth()]} ${start.getFullYear()}`;
      endEl.textContent = `${months[end.getMonth()]} ${end.getFullYear()}`;
    }
  }

  setDate(date: Date) {
    this.currentDate = new Date(
      Math.max(this.startDate.getTime(), Math.min(this.endDate.getTime(), date.getTime()))
    );
    const slider = document.getElementById('tl-slider') as HTMLInputElement;
    const dateEl = document.getElementById('tl-date')!;
    if (slider) this.syncSlider(slider);
    this.updateDisplay(dateEl);
  }

  /** Register a callback that fires when the date changes */
  onDateChange(callback: DateChangeCallback): () => void {
    this.dateChangeCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const idx = this.dateChangeCallbacks.indexOf(callback);
      if (idx >= 0) this.dateChangeCallbacks.splice(idx, 1);
    };
  }

  play(): void {
    if (!this.isPlaying) {
      const playBtn = document.getElementById('tl-play');
      if (playBtn) playBtn.click();
    }
  }

  pause(): void {
    if (this.isPlaying) {
      const playBtn = document.getElementById('tl-play');
      if (playBtn) playBtn.click();
    }
  }

  setSpeed(speed: number): void {
    const idx = this.speeds.indexOf(speed);
    if (idx >= 0) {
      this.speedIdx = idx;
      this.speed = speed;
      // Update UI
      const group = document.getElementById('tl-speed-group');
      if (group) {
        group.querySelectorAll('.tl-speed-opt').forEach((el, i) => {
          el.classList.toggle('active', i === idx);
        });
      }
    }
  }

  getSpeed(): number {
    return this.speed;
  }

  getAvailableSpeeds(): number[] {
    return [...this.speeds];
  }

  isLooping(): boolean {
    return this.loop;
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
    const btn = document.getElementById('tl-loop');
    if (btn) btn.classList.toggle('active', loop);
  }

  destroy(): void {
    this.stopAnimation();
    // Remove keyboard listener (will be GC'd with the instance)
    this.dateChangeCallbacks = [];
    this.container.remove();
  }
}
