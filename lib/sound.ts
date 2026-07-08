// 素材ファイルを使わない Web Audio 合成の音。モジュールシングルトンとして AudioContext を1つだけ持つ。
// ブラウザの自動再生制限があるため、実際に鳴るのはユーザー操作(pointerdown/keydown)で unlock された後だけ。
import { rand } from "./bubbles";

let audioCtx: AudioContext | null = null;
let master: GainNode | null = null;
let soundOn = true;

function ac(): AudioContext | null {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    master = audioCtx.createGain();
    master.gain.value = 0.5;
    master.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function ready(): boolean {
  return soundOn && audioCtx !== null && audioCtx.state === "running";
}

export function ensureAudioContext(): void {
  ac();
}

export function setSoundEnabled(enabled: boolean): void {
  soundOn = enabled;
  ac();
}

export function isSoundEnabled(): boolean {
  return soundOn;
}

/** pointerdown/keydown を一度だけ待ち、初回操作で AudioContext を起こす。 */
export function unlockAudioOnFirstInteraction(): () => void {
  const handler = () => {
    ac();
    cleanup();
  };
  function cleanup() {
    document.removeEventListener("pointerdown", handler);
    document.removeEventListener("keydown", handler);
  }
  document.addEventListener("pointerdown", handler);
  document.addEventListener("keydown", handler);
  return cleanup;
}

function tone(freq: number, dur: number, vol: number, when: number, glide?: number): void {
  if (!audioCtx || !master) return;
  const t = audioCtx.currentTime + when;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function playPop(): void {
  if (!ready()) return;
  tone(rand(480, 720), 0.1, 0.07, 0, rand(900, 1300));
}

export function playRise(): void {
  if (!ready()) return;
  for (let i = 0; i < 11; i++) {
    const p = i / 10;
    const f = 300 + p * 560 + rand(-30, 30);
    tone(f, rand(0.08, 0.12), 0.028 + p * 0.02, p * 1.5 + rand(0, 0.08), f * rand(1.5, 1.8));
  }
}

function bell(f: number, vol: number, when: number): void {
  if (!audioCtx || !master) return;
  const t = audioCtx.currentTime + when;
  const partials: [number, number][] = [
    [1, 0.5],
    [2.32, 0.42],
    [4.25, 0.28],
    [6.63, 0.1],
  ];
  for (const [m, g0] of partials) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = f * m;
    o.detune.value = rand(-5, 5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * g0, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4 / Math.sqrt(m));
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + 1.6);
  }
  const len = Math.floor(audioCtx.sampleRate * 0.06);
  const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const bp = audioCtx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = f * 3.2;
  bp.Q.value = 6;
  const ng = audioCtx.createGain();
  ng.gain.setValueAtTime(vol * 0.7, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(master);
  src.start(t);
}

export function playReveal(): void {
  if (!ready()) return;
  bell(880, 0.05, 0);
  bell(1318.5, 0.038, 0.18);
  bell(1760, 0.028, 0.36);
}
