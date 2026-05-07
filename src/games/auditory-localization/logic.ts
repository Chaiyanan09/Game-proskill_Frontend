import {
  RefObject,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GAME_RESULT_SCHEMA_VERSION,
  GameResult,
  GameStatus,
} from "@/shared/types";

import {
  AudioBundle,
  ensureAudioReady,
  playSpatialSound,
} from "./audio";
import { AuditoryRawData, Point, RevealInfo, SoundType, Trial } from "./types";

export const GAME_ID = "auditory-localization";
export const GAME_NAME = "Auditory Localization & Reaction";

export interface AuditoryGameConfig extends Record<string, unknown> {
  trials: number;
  successThresholdDeg: number;
  responseTimeoutMs: number;
}

export interface ResultMeta {
  playerId: string;
  sessionId: string;
  status: GameStatus;
  startedAtIso: string;
  endedAtIso: string;
  durationMs: number;
  config: AuditoryGameConfig;
}

export interface UseAuditoryOptions extends AuditoryGameConfig {
  playerId: string;
  sessionId: string;
  onGameComplete: (result: GameResult) => void;
}

const PRE_DELAY_MIN_MS = 700;
const PRE_DELAY_MAX_MS = 1450;
const REVEAL_DURATION_MS = 1000;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0;
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomAngle(): number {
  return Math.floor(Math.random() * 360);
}

function randomSoundType(): SoundType {
  return Math.random() > 0.5 ? "footstep" : "reload";
}

export function angularDistanceDeg(a: number, b: number): number {
  const diff = Math.abs((((a - b) % 360) + 540) % 360 - 180);
  return diff;
}

export function pointToAngleDeg(point: Point, center: Point): number {
  const radians = Math.atan2(point.y - center.y, point.x - center.x);
  return (((radians * 180) / Math.PI) + 360) % 360;
}

export function calculateClickAngle(point: Point, center: Point): number {
  const radians = Math.atan2(point.y - center.y, point.x - center.x);
  return ((radians * 180) / Math.PI + 360) % 360;
}

function successRateByDistance(trials: Trial[], min: number, max: number): number {
  const bucket = trials.filter((trial) => trial.distance >= min && trial.distance < max);
  const success = bucket.filter((trial) => trial.success === true);
  return percent(success.length, bucket.length);
}

export function buildResult(
  meta: ResultMeta,
  trials: Trial[]
): GameResult {
  const responded = trials.filter((trial) => trial.reactionMs !== undefined);
  const success = trials.filter((trial) => trial.success === true);
  const missed = trials.filter((trial) => trial.timedOut === true);
  const wrong = trials.filter(
    (trial) => trial.success === false && trial.timedOut !== true
  );
  const angleErrors = trials
    .map((trial) => trial.angleErrorDeg)
    .filter((value): value is number => value !== undefined);
  const avgError = average(angleErrors);
  const avgRt = average(responded.map((trial) => trial.reactionMs ?? 0));
  const accuracy = percent(success.length, trials.length);

  // คะแนน 0-100: สำเร็จตาม threshold 70% + ความคลาดเคลื่อนมุม 30%
  const angleScore = Math.max(0, 100 - avgError);
  const timeoutPenalty = Math.min(20, missed.length * 4);
  const score = Math.max(
    0,
    Math.min(100, accuracy * 0.7 + angleScore * 0.3 - timeoutPenalty)
  );

  const rawData: AuditoryRawData = {
    totalTrials: trials.length,
    successCount: success.length,
    missedCount: missed.length,
    wrongCount: wrong.length,
    avgAngleErrorDeg: avgError,
    successRateNear: successRateByDistance(trials, 0, 0.34),
    successRateMid: successRateByDistance(trials, 0.34, 0.67),
    successRateFar: successRateByDistance(trials, 0.67, 1.01),
    trials: trials.map((trial) => ({
      index: trial.index,
      angleDeg: trial.angleDeg,
      clickAngleDeg: trial.clickAngleDeg ?? null,
      angleErrorDeg: trial.angleErrorDeg ?? null,
      reactionMs: trial.reactionMs ?? null,
      distance: trial.distance,
      soundType: trial.soundType,
      success: trial.success ?? null,
      timedOut: trial.timedOut === true,
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
    responseTimesMs: responded.map((trial) => trial.reactionMs ?? 0),
    startedAt: meta.startedAtIso,
    endedAt: meta.endedAtIso,
    durationMs: meta.durationMs,
    config: meta.config,
    rawData,
  };
}

export function useAuditoryGame(
  arenaRef: RefObject<HTMLDivElement>,
  options: UseAuditoryOptions
) {
  const {
    trials,
    successThresholdDeg,
    responseTimeoutMs,
    playerId,
    sessionId,
    onGameComplete,
  } = options;

  const audioBundleRef = useRef<AudioBundle | null>(null);
  const trialsRef = useRef<Trial[]>([]);
  const currentTrialRef = useRef<Trial | null>(null);
  const preDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const startTimeIsoRef = useRef("");
  const finalizedRef = useRef(false);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [trialIdx, setTrialIdx] = useState(0);
  const [showReveal, setShowReveal] = useState<RevealInfo | null>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [message, setMessage] = useState("กดเริ่มเพื่อเปิดระบบเสียง 3D");
  const [audioReady, setAudioReady] = useState(false);

  const clearTrialTimers = useCallback(() => {
    if (preDelayTimeoutRef.current) {
      clearTimeout(preDelayTimeoutRef.current);
      preDelayTimeoutRef.current = null;
    }
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  const prepareAudio = useCallback(async () => {
    audioBundleRef.current = await ensureAudioReady(audioBundleRef.current);
    setAudioReady(true);
    return audioBundleRef.current;
  }, []);

  const finalize = useCallback(
    (status: GameStatus = "completed") => {
      if (finalizedRef.current) return;

      finalizedRef.current = true;
      clearTrialTimers();
      setRunning(false);
      setWaitingForClick(false);
      setFinished(true);
      setMessage("ทดสอบเสร็จแล้ว");

      const endTime = performance.now();
      const result = buildResult(
        {
          playerId,
          sessionId,
          status,
          startedAtIso: startTimeIsoRef.current,
          endedAtIso: new Date().toISOString(),
          durationMs: endTime - startTimeRef.current,
          config: { trials, successThresholdDeg, responseTimeoutMs },
        },
        trialsRef.current
      );

      setLastResult(result);
      onGameComplete(result);
    },
    [
      clearTrialTimers,
      onGameComplete,
      playerId,
      responseTimeoutMs,
      sessionId,
      successThresholdDeg,
      trials,
    ]
  );

  const scheduleNextTrial = useCallback(
    (nextIndex: number) => {
      clearTrialTimers();

      if (nextIndex >= trials) {
        finalize("completed");
        return;
      }

      setTrialIdx(nextIndex);
      setWaitingForClick(false);
      setShowReveal(null);
      setMessage("เตรียมฟังเสียง...");

      preDelayTimeoutRef.current = setTimeout(async () => {
        const bundle = await prepareAudio();
        const trial: Trial = {
          index: nextIndex,
          angleDeg: randomAngle(),
          distance: randomRange(0.08, 0.95),
          soundType: randomSoundType(),
          playedAt: performance.now(),
        };

        currentTrialRef.current = trial;
        trialsRef.current.push(trial);
        playSpatialSound(bundle, trial.angleDeg, trial.distance, trial.soundType);
        setWaitingForClick(true);
        setMessage("คลิกตำแหน่งที่คุณได้ยินเสียง");

        responseTimeoutRef.current = setTimeout(() => {
          if (currentTrialRef.current !== trial || trial.reactionMs !== undefined) {
            return;
          }

          trial.clickedAt = performance.now();
          trial.success = false;
          trial.timedOut = true;
          setWaitingForClick(false);
          setShowReveal({
            trueAngle: trial.angleDeg,
            clickAngle: null,
            error: null,
            success: false,
            timedOut: true,
          });
          setMessage("หมดเวลาในรอบนี้");

          revealTimeoutRef.current = setTimeout(() => {
            scheduleNextTrial(nextIndex + 1);
          }, REVEAL_DURATION_MS);
        }, responseTimeoutMs);
      }, randomRange(PRE_DELAY_MIN_MS, PRE_DELAY_MAX_MS));
    },
    [clearTrialTimers, finalize, prepareAudio, responseTimeoutMs, trials]
  );

  const start = useCallback(() => {
    void (async () => {
      clearTrialTimers();
      finalizedRef.current = false;
      trialsRef.current = [];
      currentTrialRef.current = null;
      setFinished(false);
      setLastResult(null);
      setShowReveal(null);
      setTrialIdx(0);
      setRunning(true);
      setWaitingForClick(false);
      setMessage("กำลังเปิดระบบเสียง...");

      await prepareAudio();
      startTimeRef.current = performance.now();
      startTimeIsoRef.current = new Date().toISOString();
      scheduleNextTrial(0);
    })();
  }, [clearTrialTimers, prepareAudio, scheduleNextTrial]);

  const testSound = useCallback(
    (side: "left" | "right") => {
      void (async () => {
        const bundle = await prepareAudio();
        playSpatialSound(bundle, side === "left" ? 180 : 0, 0.25, "footstep");
      })();
    },
    [prepareAudio]
  );

  const handleArenaClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!waitingForClick || !arenaRef.current || !currentTrialRef.current) return;

      const trial = currentTrialRef.current;
      const rect = arenaRef.current.getBoundingClientRect();
      const clickPoint: Point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      const center: Point = { x: rect.width / 2, y: rect.height / 2 };
      const clickAngle = calculateClickAngle(clickPoint, center);
      const error = angularDistanceDeg(trial.angleDeg, clickAngle);
      const now = performance.now();

      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
        responseTimeoutRef.current = null;
      }

      trial.clickedAt = now;
      trial.clickAngleDeg = clickAngle;
      trial.angleErrorDeg = error;
      trial.reactionMs = now - trial.playedAt;
      trial.success = error <= successThresholdDeg;
      trial.timedOut = false;

      setWaitingForClick(false);
      setShowReveal({
        trueAngle: trial.angleDeg,
        clickAngle,
        error,
        success: trial.success,
        timedOut: false,
      });
      setMessage(trial.success ? "แม่นมาก!" : "ทิศทางยังคลาดเคลื่อน");

      revealTimeoutRef.current = setTimeout(() => {
        scheduleNextTrial(trial.index + 1);
      }, REVEAL_DURATION_MS);
    },
    [arenaRef, scheduleNextTrial, successThresholdDeg, waitingForClick]
  );

  useEffect(() => {
    return () => {
      clearTrialTimers();
      void audioBundleRef.current?.context.close();
    };
  }, [clearTrialTimers]);

  return {
    running,
    finished,
    waitingForClick,
    trialIdx,
    trialCount: trials,
    showReveal,
    lastResult,
    message,
    audioReady,
    start,
    testSound,
    handleArenaClick,
  };
}
