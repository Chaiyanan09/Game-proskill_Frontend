/**
 * Audio utilities สำหรับเกม Auditory Localization Test
 *  - สร้างเสียง footstep / reload จาก noise + sine ผ่าน Web Audio API
 *  - เล่นเสียงผ่าน PannerNode (HRTF) เพื่อให้รู้สึกถึงตำแหน่ง 3D จริง
 */

import { SoundType } from "./types";

/** สร้างเสียงฝีเท้า: noise burst + low thump */
export function createFootstepBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.18;
  const length = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 25);
    const noise = (Math.random() * 2 - 1) * env;
    const thump = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 30) * 0.5;
    data[i] = (noise * 0.6 + thump) * 0.8;
  }
  return buf;
}

/** สร้างเสียง reload: 3 click ติดกันแบบ metallic */
export function createReloadBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.4;
  const length = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);

  // 3 จังหวะ click - แต่ละครั้งเป็น noise + sine wave decay
  const clicks: Array<{ start: number; freq: number; gain: number }> = [
    { start: 0.0, freq: 1200, gain: 0.6 },
    { start: 0.18, freq: 1800, gain: 0.5 },
    { start: 0.3, freq: 1500, gain: 0.4 },
  ];

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let v = 0;
    for (const c of clicks) {
      const tt = t - c.start;
      if (tt < 0 || tt > 0.07) continue;
      const env = Math.exp(-tt * 70);
      v += (Math.random() * 2 - 1) * env * c.gain;
      v += Math.sin(2 * Math.PI * c.freq * tt) * env * (c.gain * 0.5);
    }
    data[i] = v * 0.8;
  }
  return buf;
}

export interface AudioBundle {
  ctx: AudioContext;
  footstep: AudioBuffer;
  reload: AudioBuffer;
}

/** เตรียม AudioContext + buffers (ครั้งแรกจะสร้าง, ครั้งหลังจะ resume) */
export async function ensureAudioBundle(
  current: AudioBundle | null
): Promise<AudioBundle> {
  if (current) {
    if (current.ctx.state === "suspended") await current.ctx.resume();
    return current;
  }
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctx();
  const footstep = createFootstepBuffer(ctx);
  const reload = createReloadBuffer(ctx);
  return { ctx, footstep, reload };
}

/** เล่นเสียงในตำแหน่ง 3D ตาม angleDeg + distance */
export function playSpatialSound(
  bundle: AudioBundle,
  angleDeg: number,
  distance: number,
  type: SoundType
): void {
  const { ctx } = bundle;
  const buffer = type === "footstep" ? bundle.footstep : bundle.reload;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 10;
  panner.rolloffFactor = 1;

  // ระยะ 1 (ใกล้) -> 6 (ไกล)
  const r = 1 + distance * 5;
  const rad = (angleDeg * Math.PI) / 180;
  panner.positionX.value = Math.cos(rad) * r;
  panner.positionY.value = 0;
  panner.positionZ.value = Math.sin(rad) * r;

  // เพิ่ม gain ตามระยะให้รู้สึกถึงความเบา-ดัง
  const gain = ctx.createGain();
  gain.gain.value = 1 - distance * 0.6;

  src.connect(panner).connect(gain).connect(ctx.destination);
  src.start();
}
