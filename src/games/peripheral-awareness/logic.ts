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
  CORNERS,
  CornerCue,
  Corner,
  CueSymbol,
  FeedbackType,
  KEY_TO_SYMBOL,
  PeripheralRawData,
  Point,
} from "./types";

/**
 * Logic ของเกม Peripheral Awareness
 *  - Pure helpers (calc target position, distance, summarize ...)
 *  - buildResult() แปลง state ภายในเกม -> GameResult ตาม contract
 *  - usePeripheralGame() — hook ที่ห่อ logic ทั้งหมด ให้ ComponentName.tsx เรียกใช้
 */

export const GAME_ID = "peripheral-awareness";
export const GAME_NAME = "Peripheral Awareness Test";

// ============================================================
// Pure Helpers
// ============================================================

/** คำนวณตำแหน่งเป้าหมายแบบ Lissajous (วงโคจรซ้อน) ทำให้ track ยาก */
export function calcTargetPosition(
  width: number,
  height: number,
  elapsedSec: number
): Point {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.08;
  const x =
    cx +
    Math.cos(elapsedSec * 1.4) * radius +
    Math.sin(elapsedSec * 0.7) * radius * 0.4;
  const y =
    cy +
    Math.sin(elapsedSec * 1.1) * radius +
    Math.cos(elapsedSec * 0.5) * radius * 0.4;
  return { x, y };
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pickRandomCorner(): Corner {
  return CORNERS[Math.floor(Math.random() * CORNERS.length)];
}

export function pickRandomSymbol(): CueSymbol {
  return (Math.floor(Math.random() * 4) + 1) as CueSymbol;
}

export function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min);
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

export function buildResult(
  meta: ResultMeta,
  cues: CornerCue[],
  trackingSamples: number[]
): GameResult {
  const total = cues.length;
  const responded = cues.filter((c) => c.responseMs !== undefined);
  const correct = cues.filter((c) => c.correct === true);
  const wrong = responded.filter((c) => c.correct === false);
  const missed = cues.filter((c) => c.responseMs === undefined);
  const avgRt = average(responded.map((c) => c.responseMs ?? 0));
  const avgDev = average(trackingSamples);
  const accuracy = total > 0 ? (correct.length / total) * 100 : 0;

  // คะแนน 0-100 ผสม accuracy (น้ำหนัก 70%) + tracking score (30%)
  const trackingScore = Math.max(0, 100 - avgDev);
  const score = accuracy * 0.7 + trackingScore * 0.3;

  const rawData: PeripheralRawData = {
    totalCues: total,
    correctCount: correct.length,
    missedCount: missed.length,
    wrongCount: wrong.length,
    avgTrackingDeviationPx: avgDev,
    cues: cues.map((c) => ({
      corner: c.corner,
      symbol: c.symbol,
      correct: c.correct ?? null,
      responseMs: c.responseMs ?? null,
      trackingDevAtSpawn: c.trackingDevAtSpawn ?? null,
    })),
  };

  return {
    gameId: GAME_ID,
    gameName: GAME_NAME,
    playerId: meta.playerId,
    sessionId: meta.sessionId,
    score,
    accuracy,
    reactionTimeMs: avgRt,
    responseTimesMs: responded.map((c) => c.responseMs ?? 0),
    startedAt: meta.startedAtIso,
    endedAt: meta.endedAtIso,
    durationMs: meta.durationMs,
    rawData,
  };
}

// ============================================================
// Game Hook
// ============================================================

export interface UsePeripheralOptions {
  durationSec: number;
  cueLifeMs: number;
  cueIntervalMs: [number, number];
  playerId: string;
  sessionId: string;
  onGameComplete: (r: GameResult) => void;
}

const FEEDBACK_DURATION_MS = 200;
const FIRST_CUE_DELAY_MS = 800;
const TICK_MS = 100;

export function usePeripheralGame(
  arenaRef: RefObject<HTMLDivElement>,
  opts: UsePeripheralOptions
) {
  const { durationSec, cueLifeMs, playerId, sessionId, onGameComplete } = opts;
  const [minIntervalMs, maxIntervalMs] = opts.cueIntervalMs;

  // refs ที่อัปเดตบ่อย ไม่ trigger render
  const targetPosRef = useRef<Point>({ x: 0, y: 0 });
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const trackingSamplesRef = useRef<number[]>([]);
  const cuesRef = useRef<CornerCue[]>([]);
  const cueIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const startTimeIsoRef = useRef("");

  // state ที่ต้อง render
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeCues, setActiveCues] = useState<CornerCue[]>([]);
  const [targetPos, setTargetPos] = useState<Point>({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>("");

  const flashFeedback = (type: "correct" | "wrong") => {
    setFeedback(type);
    setTimeout(() => setFeedback(""), FEEDBACK_DURATION_MS);
  };

  const updateTarget = useCallback(() => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const t = (performance.now() - startTimeRef.current) / 1000;
    const pos = calcTargetPosition(rect.width, rect.height, t);
    targetPosRef.current = pos;
    setTargetPos(pos);
  }, [arenaRef]);

  const expireCues = (now: number): boolean => {
    let needRender = false;
    cuesRef.current.forEach((c) => {
      if (!c.resolved && now >= c.expiresAt) {
        c.resolved = true;
        c.correct = false;
        needRender = true;
      }
    });
    return needRender;
  };

  const loop = useCallback(() => {
    updateTarget();
    if (running) {
      const dist = distance(mousePosRef.current, targetPosRef.current);
      trackingSamplesRef.current.push(dist);
    }
    if (expireCues(performance.now())) {
      setActiveCues(cuesRef.current.filter((c) => !c.resolved));
    }
    animationRef.current = requestAnimationFrame(loop);
  }, [running, updateTarget]);

  const spawnCue = useCallback(() => {
    if (!running) return;
    const now = performance.now();
    const cue: CornerCue = {
      id: cueIdRef.current++,
      corner: pickRandomCorner(),
      symbol: pickRandomSymbol(),
      spawnedAt: now,
      expiresAt: now + cueLifeMs,
      resolved: false,
      trackingDevAtSpawn: distance(mousePosRef.current, targetPosRef.current),
    };
    cuesRef.current.push(cue);
    setActiveCues(cuesRef.current.filter((c) => !c.resolved));

    cueTimeoutRef.current = setTimeout(
      spawnCue,
      randomDelay(minIntervalMs, maxIntervalMs)
    );
  }, [running, cueLifeMs, minIntervalMs, maxIntervalMs]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!running) return;
      const sym = KEY_TO_SYMBOL[e.key];
      if (!sym) return;
      const active = cuesRef.current.filter((c) => !c.resolved);
      if (active.length === 0) {
        flashFeedback("wrong");
        return;
      }
      const cue = active[active.length - 1];
      cue.resolved = true;
      cue.responseMs = performance.now() - cue.spawnedAt;
      cue.correct = cue.symbol === sym;
      flashFeedback(cue.correct ? "correct" : "wrong");
      setActiveCues(cuesRef.current.filter((c) => !c.resolved));
    },
    [running]
  );

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const finalize = useCallback(() => {
    setRunning(false);
    setFinished(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);

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
      cuesRef.current,
      trackingSamplesRef.current
    );
    setLastResult(result);
    onGameComplete(result);
  }, [playerId, sessionId, onGameComplete]);

  const start = () => {
    cuesRef.current = [];
    cueIdRef.current = 0;
    trackingSamplesRef.current = [];
    setActiveCues([]);
    setLastResult(null);
    setFinished(false);
    setTimeLeft(durationSec);
    startTimeRef.current = performance.now();
    startTimeIsoRef.current = new Date().toISOString();
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    animationRef.current = requestAnimationFrame(loop);
    cueTimeoutRef.current = setTimeout(spawnCue, FIRST_CUE_DELAY_MS);
    window.addEventListener("keydown", handleKey);

    const timerId = setInterval(() => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, durationSec - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerId);
        finalize();
      }
    }, TICK_MS);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
      clearInterval(timerId);
      window.removeEventListener("keydown", handleKey);
    };
  }, [running, loop, spawnCue, handleKey, durationSec, finalize]);

  return {
    running,
    finished,
    activeCues,
    targetPos,
    timeLeft,
    feedback,
    lastResult,
    cues: cuesRef.current,
    start,
    handleMouseMove,
  };
}
