import { SoundType } from "./types";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface AudioBundle {
  context: AudioContext;
  masterGain: GainNode;
}

export async function createAudioBundle(): Promise<AudioBundle> {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const context = new AudioContextClass();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.72;
  masterGain.connect(context.destination);

  if (context.state === "suspended") {
    await context.resume();
  }

  return { context, masterGain };
}

export async function ensureAudioReady(
  existing: AudioBundle | null
): Promise<AudioBundle> {
  const bundle = existing ?? (await createAudioBundle());

  if (bundle.context.state === "suspended") {
    await bundle.context.resume();
  }

  return bundle;
}

export function angleToPosition(angleDeg: number, distance01: number) {
  const radians = (angleDeg * Math.PI) / 180;
  const radius = 1.2 + distance01 * 2.4;

  return {
    x: Math.cos(radians) * radius,
    y: 0,
    z: Math.sin(radians) * radius,
  };
}

function connectSpatialChain(
  bundle: AudioBundle,
  angleDeg: number,
  distance01: number
) {
  const { context, masterGain } = bundle;
  const panner = context.createPanner();
  const gain = context.createGain();
  const position = angleToPosition(angleDeg, distance01);

  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 1;
  panner.maxDistance = 8;
  panner.rolloffFactor = 1.35;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 360;
  panner.positionX.value = position.x;
  panner.positionY.value = position.y;
  panner.positionZ.value = position.z;

  gain.gain.value = 0.92 - distance01 * 0.42;
  panner.connect(gain);
  gain.connect(masterGain);

  return { input: panner, gain };
}

function playFootstep(bundle: AudioBundle, angleDeg: number, distance01: number) {
  const { context } = bundle;
  const { input, gain } = connectSpatialChain(bundle, angleDeg, distance01);
  const now = context.currentTime;

  const osc = context.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);

  const thumpGain = context.createGain();
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.9, now + 0.012);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

  osc.connect(thumpGain);
  thumpGain.connect(input);
  osc.start(now);
  osc.stop(now + 0.17);

  gain.gain.setValueAtTime(0.9 - distance01 * 0.42, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
}

function playReload(bundle: AudioBundle, angleDeg: number, distance01: number) {
  const { context } = bundle;
  const { input, gain } = connectSpatialChain(bundle, angleDeg, distance01);
  const now = context.currentTime;

  const osc = context.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(650, now);
  osc.frequency.setValueAtTime(980, now + 0.045);

  const clickGain = context.createGain();
  clickGain.gain.setValueAtTime(0.0001, now);
  clickGain.gain.exponentialRampToValueAtTime(0.45, now + 0.006);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(clickGain);
  clickGain.connect(input);
  osc.start(now);
  osc.stop(now + 0.1);

  gain.gain.setValueAtTime(0.78 - distance01 * 0.36, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
}

export function playSpatialSound(
  bundle: AudioBundle,
  angleDeg: number,
  distance01: number,
  soundType: SoundType
) {
  if (soundType === "reload") {
    playReload(bundle, angleDeg, distance01);
  } else {
    playFootstep(bundle, angleDeg, distance01);
  }
}
