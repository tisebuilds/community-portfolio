/**
 * Soft film-sprocket ticks driven by horizontal strip scroll.
 * Prefers Web Audio; falls back to a short WAV via HTMLAudioElement for
 * environments that keep AudioContext suspended (some embedded browsers).
 */

const STEP_PX = 26;
const MIN_INTERVAL_MS = 24;
const BASE_GAIN = 0.28;

export type FilmScrollSound = {
  unlock: () => void;
  handleScroll: (el: HTMLElement) => void;
  dispose: () => void;
};

/** Tiny mono click (~25ms) as a WAV data URI. */
function buildClickDataUri(): string {
  const sampleRate = 22050;
  const duration = 0.025;
  const n = Math.floor(sampleRate * duration);
  const data = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 90);
    const tone = Math.sin(2 * Math.PI * 1600 * t) * 0.7;
    const grit = (Math.random() * 2 - 1) * 0.25;
    data[i] = Math.max(-1, Math.min(1, (tone + grit) * env)) * 0x7fff;
  }

  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const buffer = new ArrayBuffer(44 + data.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + data.length * bytesPerSample, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, data.length * bytesPerSample, true);
  for (let i = 0; i < data.length; i++) {
    view.setInt16(44 + i * 2, data[i], true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

export function createFilmScrollSound(): FilmScrollSound {
  let ctx: AudioContext | null = null;
  let clickUrl: string | null = null;
  let unlocked = false;
  let lastPlayMs = 0;
  const lastLeft = new WeakMap<HTMLElement, number>();
  const accum = new WeakMap<HTMLElement, number>();
  const pool: HTMLAudioElement[] = [];

  function getAudioContextCtor(): typeof AudioContext | null {
    if (typeof window === "undefined") return null;
    return (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext ||
      null
    );
  }

  function ensureClickUrl() {
    if (!clickUrl) clickUrl = buildClickDataUri();
    return clickUrl;
  }

  function unlock() {
    unlocked = true;

    const AC = getAudioContextCtor();
    if (AC) {
      if (!ctx) ctx = new AC();
      if (ctx.state === "suspended") void ctx.resume();
    }

    // Prime HTMLAudioElement playback during the gesture.
    try {
      const prime = new Audio(ensureClickUrl());
      prime.volume = 0.001;
      void prime.play().then(() => {
        prime.pause();
        prime.currentTime = 0;
        pool.push(prime);
      });
    } catch {
      /* ignore */
    }
  }

  function playHtmlTick(volume: number) {
    const url = ensureClickUrl();
    let node = pool.pop();
    if (!node) node = new Audio(url);
    node.volume = Math.min(1, volume);
    node.currentTime = 0;
    void node.play().finally(() => {
      pool.push(node!);
    });
  }

  function playWebAudioTick(velocity: number) {
    const audio = ctx;
    if (!audio || audio.state !== "running") return false;

    const intensity = Math.min(1, 0.45 + velocity / 45);
    const t = audio.currentTime;
    const peak = BASE_GAIN * intensity;

    const osc = audio.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1850 + intensity * 400, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.04);

    const clickGain = audio.createGain();
    clickGain.gain.setValueAtTime(0.0001, t);
    clickGain.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

    osc.connect(clickGain);
    clickGain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.05);

    const length = Math.floor(audio.sampleRate * 0.018);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const env = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }
    const noise = audio.createBufferSource();
    noise.buffer = buffer;

    const filter = audio.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 900;

    const noiseGain = audio.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(peak * 0.4, t + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(audio.destination);
    noise.start(t);
    noise.stop(t + 0.025);
    return true;
  }

  function playTick(velocity: number) {
    const nowMs = performance.now();
    if (nowMs - lastPlayMs < MIN_INTERVAL_MS) return;
    lastPlayMs = nowMs;

    if (playWebAudioTick(velocity)) return;

    const intensity = Math.min(1, 0.45 + velocity / 45);
    playHtmlTick(0.35 * intensity);
  }

  return {
    unlock,

    handleScroll(el: HTMLElement) {
      if (!unlocked) return;

      const left = el.scrollLeft;
      const prev = lastLeft.get(el);
      lastLeft.set(el, left);
      if (prev === undefined) return;

      const delta = left - prev;
      if (delta === 0) return;

      let remaining = (accum.get(el) ?? 0) + Math.abs(delta);
      const velocity = Math.abs(delta);
      while (remaining >= STEP_PX) {
        remaining -= STEP_PX;
        playTick(velocity);
      }
      accum.set(el, remaining);
    },

    dispose() {
      unlocked = false;
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
      pool.length = 0;
      clickUrl = null;
    },
  };
}
