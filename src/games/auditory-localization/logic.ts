import {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import { GameResult } from "@/shared/types";
import {
  AuditoryRawData,
  Point,
  RevealInfo,
  SoundType,
  Trial,
} from "./types";

/**
 * Logic ของเกม Auditory Localization & Reaction
 *  - สร้างเสียง footstep / reload จาก noise + sine ผ่าน Web Audio API
 *  - เล่นเสียงผ่าน PannerNode (HRTF) เพื่อให้รู้สึกถึงตำแหน่ง 3D จริง
 *  - Pure helpers (angleErrorDeg, summarize ...)
 *  - buildResult() แปลง state ภายในเกม -> GameResult ตาม contract
 *  - useAuditoryGame() — hook ที่ห่อ logic ทั้งหมด
 */

export const GAME_ID = "auditory-localization";
export const GAME_NAME = "Auditory Localization & Reaction";

// ============================================================
// Audio buffer creation
// ============================================================

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

/** สร้างเสียง reload: 3 click ติดกัน metallic */
export function createReloadBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.4;
  const length = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);

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
  return {
    ctx,
    footstep: createFootstepBuffer(ctx),
    reload: createReloadBuffer(ctx),
  };
}

/** เล่นเสียง 3D ในตำแหน่ง angleDeg + distance (0-1) */
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

  const r = 1 + distance * 5;
  const rad = (angleDeg * Math.PI) / 180;
  panner.positionX.value = Math.cos(rad) * r;
  panner.positionY.value = 0;
  panner.positionZ.value = Math.sin(rad) * r;

  const gain = ctx.createGain();
  gain.gain.value = 1 - distance * 0.6;

  src.connect(panner).connect(gain).connect(ctx.destination);
  src.start();
}

// ============================================================
// Pure Helpers
// ============================================================

export function angleToPoint(angleDeg: number, radius: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

export function pointToAngleDeg(p: Point): number {
  let angle = (Math.atan2(p.y, p.x) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

export function angleErrorDeg(
  trueAngle: number,
  guessAngle: number
): number {
  let diff = Math.abs(guessAngle - trueAngle) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function makeRandomTrial(index: number): Trial {
  return {
    index,
    angleDeg: Math.random() * 360,
    distance: Math.random(),
    soundType: Math.random() < 0.5 ? "footstep" : "reload",
    playedAt: 0,
  };
}

export function randomPreDelayMs(): number {
  return 600 + Math.random() * 900;
}

function bucket(t: Trial): "near" | "mid" | "far" {
  if (t.distance < 0.34) return "near";
  if (t.distance < 0.67) return "mid";
  return "far";
}

function successRatePct(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  return (trials.filter((t) => t.success).length / trials.length) * 100;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ============================================================
// Result building (ตาม Game Module Contract)
// ============================================================

export interface ResultMeta {
  playerId: string;
  sessionId: string;
  startedAtIso: string;
  endedAtIso: string;
  durationMs: number;
}

export function buildResult(meta: ResultMeta, trials: Trial[]): GameResult {
  const completed = trials.filter((t) => t.angleErrorDeg !== undefined);
  const total = completed.length;
  const avgErr = average(completed.map((t) => t.angleErrorDeg ?? 0));
  const avgRt = average(completed.map((t) => t.reactionMs ?? 0));
  const succ = completed.filter((t) => t.success).length;
  const overall = successRatePct(completed);
  const near = completed.filter((t) => bucket(t) === "near");
  const mid = completed.filter((t) => bucket(t) === "mid");
  const far = completed.filter((t) => bucket(t) === "far");

  // คะแนน 0-100 ผสม success rate (70%) + accuracy score (30%)
  const accuracyScore = Math.max(0, 100 - avgErr * 1.1);
  const score = overall * 0.7 + accuracyScore * 0.3;

  const rawData: AuditoryRawData = {
    totalTrials: total,
    successCount: succ,
    avgAngleErrorDeg: avgErr,
    successRateNear: successRatePct(near),
    successRateMid: successRatePct(mid),
    successRateFar: successRatePct(far),
    trials: completed.map((t) => ({
      angleDeg: t.angleDeg,
      clickAngleDeg: t.clickAngleDeg ?? null,
      angleErrorDeg: t.angleErrorDeg ?? null,
      reactionMs: t.reactionMs ?? null,
      distance: t.distance,
      soundType: t.soundType,
      success: t.success ?? null,
    })),
  };

  return {
    gameId: GAME_ID,
    gameName: GAME_NAME,
    playerId: meta.playerId,
    sessionId: meta.sessionId,
    score,
    accuracy: overall,
    reactionTimeMs: avgRt,
    responseTimesMs: completed.map((t) => t.reactionMs ?? 0),
    startedAt: meta.startedAtIso,
    endedAt: meta.endedAtIso,
    durationMs: meta.durationMs,
    rawData,
  };
}

// ============================================================
// Game Hook
// ============================================================

export interface UseAuditoryOptions {
  trials: number;
  successThresholdDeg: number;
  playerId: string;
  sessionId: string;
  onGameComplete: (r: GameResult) => void;
}

export function useAuditoryGame(
  arenaRef: RefObject<HTMLDivElement>,
  opts: UseAuditoryOptions
) {
  const {
    trials,
    successThresholdDeg,
    playerId,
    sessionId,
    onGameComplete,
  } = opts;

  const audioBundleRef = useRef<AudioBundle | null>(null);
  const trialsRef = useRef<Trial[]>([]);
  const currentTrialRef = useRef<Trial | null>(null);
  const startTimeRef = useRef(0);
  const startTimeIsoRef = useRef("");

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [trialIdx, setTrialIdx] = useState(0);
  const [showReveal, setShowReveal] = useState<RevealInfo | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [waitingForClick, setWaitingForClick] = useState(false);

  const finalize = useCallback(() => {
    setRunning(false);
    setFinished(true);
    setWaitingForClick(false);
    const endTime = performance.now();
    const endIso = new Date().toISOString();
    const result = buildResult(
      {
        playerId,
        sessionId,
        startedAtIso: startTimeIsoRef.current,
        endedAtIso: endIso,
        durationMs: endTime - startTimeRef.current,
      },
      trialsRef.current
    );
    setLastResult(result);
    onGameComplete(result);
  }, [playerId, sessionId, onGameComplete]);

  const startTrial = useCallback((idx: number) => {
    const trial = makeRandomTrial(idx);
    setWaitingForClick(false);
    setShowReveal(null);

    setTimeout(() => {
      trial.playedAt = performance.now();
      currentTrialRef.current = trial;
      trialsRef.current.push(trial);
      if (audioBundleRef.current) {
        playSpatialSound(
          audioBundleRef.current,
          trial.angleDeg,
          trial.distance,
          trial.soundType
        );
      }
      setWaitingForClick(true);
    }, randomPreDelayMs());
  }, []);

  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!waitingForClick || !arenaRef.current) return;
    const trial = currentTrialRef.current;
    if (!trial) return;

    const rect = arenaRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const clickAngle = pointToAngleDeg({
      x: e.clientX - rect.left - cx,
      y: e.clientY - rect.top - cy,
    });
    let trueAngle = trial.angleDeg;
    if (trueAngle < 0) trueAngle += 360;
    const errorDeg = angleErrorDeg(trueAngle, clickAngle);

    trial.clickedAt = performance.now();
    trial.clickAngleDeg = clickAngle;
    trial.angleErrorDeg = errorDeg;
    trial.reactionMs = trial.clickedAt - trial.playedAt;
    trial.success = errorDeg <= successThresholdDeg;

    setShowReveal({ trueAngle, clickAngle, error: errorDeg });
    setWaitingForClick(false);

    setTimeout(() => {
      const nextIdx = trial.index + 1;
      if (nextIdx >= trials) {
        finalize();
      } else {
        setTrialIdx(nextIdx);
        startTrial(nextIdx);
      }
    }, 1300);
  };

  const start = async () => {
    audioBundleRef.current = await ensureAudioBundle(audioBundleRef.current);
    trialsRef.current = [];
    currentTrialRef.current = null;
    setLastResult(null);
    setFinished(false);
    setShowReveal(null);
    setTrialIdx(0);
    startTimeRef.current = performance.now();
    startTimeIsoRef.current = new Date().toISOString();
    setRunning(true);
    startTrial(0);
  };

  useEffect(() => {
    if (running) {
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
    };
  }, [running]);

  return {
    running,
    finished,
    trialIdx,
    showReveal,
    lastResult,
    waitingForClick,
    start,
    handleClick,
  };
}
