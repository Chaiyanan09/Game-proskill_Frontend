import {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";

import {
  GAME_RESULT_SCHEMA_VERSION,
  GameResult,
  GameStatus,
} from "@/shared/types";

import {
  CORNERS,
  Corner,
  CornerCue,
  CueSymbol,
  FeedbackType,
  KEY_TO_SYMBOL,
  PeripheralRawData,
  Point,
} from "./types";

export const GAME_ID = "peripheral-awareness";
export const GAME_NAME = "Peripheral Awareness Test";

export interface PeripheralGameConfig extends Record<string, unknown> {
  durationSec: number;
  cueLifeMs: number;
  cueIntervalMs: [number, number];
}

export interface ResultMeta {
  playerId: string;
  sessionId: string;
  status: GameStatus;
  startedAtIso: string;
  endedAtIso: string;
  durationMs: number;
  config: PeripheralGameConfig;
}

export interface UsePeripheralOptions extends PeripheralGameConfig {
  playerId: string;
  sessionId: string;
  onGameComplete: (result: GameResult) => void;
}

const FEEDBACK_DURATION_MS = 200;
const FIRST_CUE_DELAY_MS = 800;
const TICK_MS = 100;

export function calcTargetPosition(
  width: number,
  height: number,
  elapsedSec: number
): Point {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.085;

  return {
    x:
      cx +
      Math.cos(elapsedSec * 1.45) * radius +
      Math.sin(elapsedSec * 0.72) * radius * 0.42,
    y:
      cy +
      Math.sin(elapsedSec * 1.12) * radius +
      Math.cos(elapsedSec * 0.52) * radius * 0.42,
  };
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
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildResult(
  meta: ResultMeta,
  cues: CornerCue[],
  trackingSamples: number[],
  falsePressCount: number
): GameResult {
  const total = cues.length;
  const responded = cues.filter((cue) => cue.responseMs !== undefined);
  const correct = cues.filter((cue) => cue.correct === true);
  const wrong = responded.filter((cue) => cue.correct === false);
  const missed = cues.filter((cue) => cue.responseMs === undefined);
  const avgRt = average(responded.map((cue) => cue.responseMs ?? 0));
  const avgDev = average(trackingSamples);
  const accuracy = total > 0 ? (correct.length / total) * 100 : 0;

  // คะแนน 0-100: accuracy 70% + tracking 30% และหักจากการกดมั่วเล็กน้อย
  const trackingScore = Math.max(0, 100 - avgDev);
  const falsePressPenalty = Math.min(15, falsePressCount * 1.5);
  const score = Math.max(
    0,
    Math.min(100, accuracy * 0.7 + trackingScore * 0.3 - falsePressPenalty)
  );

  const rawData: PeripheralRawData = {
    totalCues: total,
    correctCount: correct.length,
    missedCount: missed.length,
    wrongCount: wrong.length,
    falsePressCount,
    avgTrackingDeviationPx: avgDev,
    cues: cues.map((cue) => ({
      corner: cue.corner,
      symbol: cue.symbol,
      correct: cue.correct ?? null,
      responseMs: cue.responseMs ?? null,
      trackingDevAtSpawn: cue.trackingDevAtSpawn ?? null,
    })),
  };

  return {
    schemaVersion: GAME_RESULT_SCHEMA_VERSION,
    gameId: GAME_ID,
    gameName: GAME_NAME,
    playerId: meta.playerId,
    sessionId: meta.sessionId,
    status: meta.status,
    score,
    accuracy,
    reactionTimeMs: avgRt,
    responseTimesMs: responded.map((cue) => cue.responseMs ?? 0),
    startedAt: meta.startedAtIso,
    endedAt: meta.endedAtIso,
    durationMs: meta.durationMs,
    config: meta.config,
    rawData,
  };
}

export function usePeripheralGame(
  arenaRef: RefObject<HTMLDivElement>,
  options: UsePeripheralOptions
) {
  const {
    durationSec,
    cueLifeMs,
    cueIntervalMs,
    playerId,
    sessionId,
    onGameComplete,
  } = options;
  const [minIntervalMs, maxIntervalMs] = cueIntervalMs;

  const targetPosRef = useRef<Point>({ x: 0, y: 0 });
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const trackingSamplesRef = useRef<number[]>([]);
  const cuesRef = useRef<CornerCue[]>([]);
  const cueIdRef = useRef(0);
  const falsePressCountRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const startTimeIsoRef = useRef("");
  const finalizedRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeCues, setActiveCues] = useState<CornerCue[]>([]);
  const [targetPos, setTargetPos] = useState<Point>({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>("");
  const [falsePressCount, setFalsePressCount] = useState(0);

  const clearTimers = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (cueTimeoutRef.current) {
      clearTimeout(cueTimeoutRef.current);
      cueTimeoutRef.current = null;
    }
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  }, []);

  const flashFeedback = useCallback((type: "correct" | "wrong") => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedback(type);
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback("");
      feedbackTimeoutRef.current = null;
    }, FEEDBACK_DURATION_MS);
  }, []);

  const updateTarget = useCallback(() => {
    if (!arenaRef.current) return;

    const rect = arenaRef.current.getBoundingClientRect();
    const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
    const pos = calcTargetPosition(rect.width, rect.height, elapsedSec);

    targetPosRef.current = pos;
    setTargetPos(pos);
  }, [arenaRef]);

  const expireCues = (now: number): boolean => {
    let needRender = false;

    cuesRef.current.forEach((cue) => {
      if (!cue.resolved && now >= cue.expiresAt) {
        cue.resolved = true;
        cue.correct = false;
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
      setActiveCues(cuesRef.current.filter((cue) => !cue.resolved));
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
    setActiveCues(cuesRef.current.filter((activeCue) => !activeCue.resolved));

    cueTimeoutRef.current = setTimeout(
      spawnCue,
      randomDelay(minIntervalMs, maxIntervalMs)
    );
  }, [running, cueLifeMs, minIntervalMs, maxIntervalMs]);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (!running) return;

      const sym = KEY_TO_SYMBOL[event.key];
      if (!sym) return;

      event.preventDefault();
      const active = cuesRef.current.filter((cue) => !cue.resolved);

      if (active.length === 0) {
        falsePressCountRef.current += 1;
        setFalsePressCount(falsePressCountRef.current);
        flashFeedback("wrong");
        return;
      }

      const cue = active[active.length - 1];
      cue.resolved = true;
      cue.responseMs = performance.now() - cue.spawnedAt;
      cue.correct = cue.symbol === sym;

      flashFeedback(cue.correct ? "correct" : "wrong");
      setActiveCues(cuesRef.current.filter((activeCue) => !activeCue.resolved));
    },
    [running, flashFeedback]
  );

  const handleMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;

    const rect = arenaRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const finalize = useCallback(
    (status: GameStatus = "completed") => {
      if (finalizedRef.current) return;

      finalizedRef.current = true;
      setRunning(false);
      setFinished(true);
      clearTimers();

      const endTime = performance.now();
      const endIso = new Date().toISOString();
      const result = buildResult(
        {
          playerId,
          sessionId,
          status,
          startedAtIso: startTimeIsoRef.current,
          endedAtIso: endIso,
          durationMs: endTime - startTimeRef.current,
          config: { durationSec, cueLifeMs, cueIntervalMs: [minIntervalMs, maxIntervalMs] },
        },
        cuesRef.current,
        trackingSamplesRef.current,
        falsePressCountRef.current
      );

      setLastResult(result);
      onGameComplete(result);
    },
    [
      clearTimers,
      cueLifeMs,
      durationSec,
      maxIntervalMs,
      minIntervalMs,
      onGameComplete,
      playerId,
      sessionId,
    ]
  );

  const start = useCallback(() => {
    clearTimers();
    finalizedRef.current = false;
    cuesRef.current = [];
    cueIdRef.current = 0;
    falsePressCountRef.current = 0;
    trackingSamplesRef.current = [];

    setActiveCues([]);
    setFalsePressCount(0);
    setLastResult(null);
    setFinished(false);
    setTimeLeft(durationSec);
    setFeedback("");

    startTimeRef.current = performance.now();
    startTimeIsoRef.current = new Date().toISOString();
    setRunning(true);
  }, [clearTimers, durationSec]);

  useEffect(() => {
    if (!running) return undefined;

    animationRef.current = requestAnimationFrame(loop);
    cueTimeoutRef.current = setTimeout(spawnCue, FIRST_CUE_DELAY_MS);
    window.addEventListener("keydown", handleKey);

    const timerId = setInterval(() => {
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, durationSec - elapsedSec);
      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(timerId);
        finalize("completed");
      }
    }, TICK_MS);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (cueTimeoutRef.current) {
        clearTimeout(cueTimeoutRef.current);
        cueTimeoutRef.current = null;
      }
      clearInterval(timerId);
      window.removeEventListener("keydown", handleKey);
    };
  }, [durationSec, finalize, handleKey, loop, running, spawnCue]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    running,
    finished,
    activeCues,
    targetPos,
    timeLeft,
    feedback,
    falsePressCount,
    lastResult,
    cues: cuesRef.current,
    start,
    handleMouseMove,
  };
}
