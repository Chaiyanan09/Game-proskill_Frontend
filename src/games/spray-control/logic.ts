import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameProps, GameResult } from "../../shared/types";
import type { SprayControlConfig, SprayPhase, SprayRawData, SprayShot } from "./types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface UseSprayControlOptions extends GameProps, Partial<SprayControlConfig> {}

interface DisplayState {
  phase: SprayPhase;
  countdown: number;
  readyTimeLeftMs: number;
  progressPct: number;
  targetX: number;
  targetY: number;
  aimX: number;
  aimY: number;
  recoilX: number;
  recoilY: number;
  currentShot: number;
  hitCount: number;
  perfectCount: number;
  avgErrorPx: number;
  lastShot: SprayShot | null;
  shots: SprayShot[];
  result: GameResult | null;
  isPointerDown: boolean;
}

const DEFAULT_CONFIG: SprayControlConfig = {
  magazineSize: 30,
  fireRateMs: 105,
  targetRadiusPx: 58,
  perfectRadiusPx: 24,
  readyTimeoutSec: 10,
};

const initialDisplay: DisplayState = {
  phase: "idle",
  countdown: 3,
  readyTimeLeftMs: DEFAULT_CONFIG.readyTimeoutSec * 1000,
  progressPct: 0,
  targetX: 450,
  targetY: 270,
  aimX: 450,
  aimY: 270,
  recoilX: 0,
  recoilY: 0,
  currentShot: 0,
  hitCount: 0,
  perfectCount: 0,
  avgErrorPx: 0,
  lastShot: null,
  shots: [],
  result: null,
  isPointerDown: false,
};

// Pattern ถูกออกแบบให้คล้าย spray ของเกม FPS:
// ช่วงแรกดีดขึ้นแรง จากนั้นเริ่มแกว่งซ้าย-ขวา ผู้เล่นต้องลากเมาส์ลงและแก้ด้านข้าง
function getRecoilPattern(index: number) {
  const i = index + 1;
  const vertical = -Math.min(210, i * 8.4 + Math.pow(i, 1.18) * 1.85);
  const horizontal =
    Math.sin(i * 0.85) * Math.min(48, i * 2.2) +
    Math.sin(i * 0.27 + 1.4) * Math.min(28, i * 1.15);
  return { x: horizontal, y: vertical };
}

function getDistanceFromCenter(values: number[]) {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + Math.abs(value - avg), 0) / values.length;
}

export function useSprayControlGame(arenaRef: React.RefObject<HTMLDivElement>, options: UseSprayControlOptions) {
  const config = useMemo<SprayControlConfig>(() => ({
    ...DEFAULT_CONFIG,
    magazineSize: options.magazineSize ?? DEFAULT_CONFIG.magazineSize,
    fireRateMs: options.fireRateMs ?? DEFAULT_CONFIG.fireRateMs,
    targetRadiusPx: options.targetRadiusPx ?? DEFAULT_CONFIG.targetRadiusPx,
    perfectRadiusPx: options.perfectRadiusPx ?? DEFAULT_CONFIG.perfectRadiusPx,
    readyTimeoutSec: options.readyTimeoutSec ?? DEFAULT_CONFIG.readyTimeoutSec,
  }), [options.magazineSize, options.fireRateMs, options.targetRadiusPx, options.perfectRadiusPx, options.readyTimeoutSec]);

  const [display, setDisplay] = useState<DisplayState>({
    ...initialDisplay,
    readyTimeLeftMs: config.readyTimeoutSec * 1000,
  });

  const phaseRef = useRef<SprayPhase>("idle");
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fireTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtIsoRef = useRef("");
  const startedAtPerfRef = useRef(0);
  const firstShotPerfRef = useRef<number | null>(null);
  const pointerRef = useRef({ x: 450, y: 270, hasPointer: false, isDown: false });
  const targetRef = useRef({ x: 450, y: 270 });
  const shotIndexRef = useRef(0);
  const shotsRef = useRef<SprayShot[]>([]);

  const getArenaSize = useCallback(() => {
    const rect = arenaRef.current?.getBoundingClientRect();
    return {
      width: rect?.width || 900,
      height: rect?.height || 560,
    };
  }, [arenaRef]);

  const resetTimers = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (readyTimerRef.current) clearInterval(readyTimerRef.current);
    if (fireTimerRef.current) clearInterval(fireTimerRef.current);
    countdownTimerRef.current = null;
    readyTimerRef.current = null;
    fireTimerRef.current = null;
  }, []);

  const buildResult = useCallback((): GameResult => {
    const endedAt = new Date();
    const shots = shotsRef.current;
    const totalShots = shots.length;
    const hitCount = shots.filter((shot) => shot.hit).length;
    const perfectCount = shots.filter((shot) => shot.perfect).length;
    const missedCount = Math.max(0, config.magazineSize - hitCount);
    const hitRatePct = totalShots > 0 ? (hitCount / totalShots) * 100 : 0;
    const perfectRatePct = totalShots > 0 ? (perfectCount / totalShots) * 100 : 0;
    const avgShotErrorPx = totalShots > 0 ? shots.reduce((sum, shot) => sum + shot.distancePx, 0) / totalShots : 0;
    const maxShotErrorPx = totalShots > 0 ? Math.max(...shots.map((shot) => shot.distancePx)) : 0;
    const groupingRadiusPx = totalShots > 0
      ? (getDistanceFromCenter(shots.map((shot) => shot.shotX)) + getDistanceFromCenter(shots.map((shot) => shot.shotY))) / 2
      : 0;

    const verticalMiss = totalShots > 0
      ? shots.reduce((sum, shot) => sum + Math.abs(shot.shotY - shot.targetY), 0) / totalShots
      : 0;
    const horizontalMiss = totalShots > 0
      ? shots.reduce((sum, shot) => sum + Math.abs(shot.shotX - shot.targetX), 0) / totalShots
      : 0;

    const verticalControlScore = clamp(100 - (verticalMiss / config.targetRadiusPx) * 58, 0, 100);
    const horizontalControlScore = clamp(100 - (horizontalMiss / config.targetRadiusPx) * 58, 0, 100);
    const sprayControlScore = clamp(100 - (avgShotErrorPx / config.targetRadiusPx) * 62, 0, 100);
    const groupingScore = clamp(100 - (groupingRadiusPx / config.targetRadiusPx) * 50, 0, 100);
    const score = Math.round(clamp(
      hitRatePct * 0.42 +
      perfectRatePct * 0.16 +
      sprayControlScore * 0.22 +
      groupingScore * 0.12 +
      ((verticalControlScore + horizontalControlScore) / 2) * 0.08,
      0,
      100,
    ));

    const rawData: SprayRawData = {
      magazineSize: config.magazineSize,
      fireRateMs: config.fireRateMs,
      targetRadiusPx: config.targetRadiusPx,
      perfectRadiusPx: config.perfectRadiusPx,
      totalShots,
      hitCount,
      perfectCount,
      missedCount,
      hitRatePct: Number(hitRatePct.toFixed(1)),
      perfectRatePct: Number(perfectRatePct.toFixed(1)),
      avgShotErrorPx: Number(avgShotErrorPx.toFixed(1)),
      maxShotErrorPx: Number(maxShotErrorPx.toFixed(1)),
      groupingRadiusPx: Number(groupingRadiusPx.toFixed(1)),
      verticalControlScore: Number(verticalControlScore.toFixed(1)),
      horizontalControlScore: Number(horizontalControlScore.toFixed(1)),
      sprayControlScore: Number(sprayControlScore.toFixed(1)),
      timeToFirstShotMs: firstShotPerfRef.current === null ? null : Math.round(firstShotPerfRef.current - startedAtPerfRef.current),
      shots,
    };

    return {
      schemaVersion: "1.0.0",
      gameId: "spray-control",
      gameName: "Spray Control Test",
      playerId: options.playerId,
      sessionId: options.sessionId,
      status: "completed",
      score,
      accuracy: Number(hitRatePct.toFixed(1)),
      reactionTimeMs: rawData.timeToFirstShotMs ?? undefined,
      responseTimesMs: shots.map((shot) => Math.round(shot.firedAtMs)),
      startedAt: startedAtIsoRef.current,
      endedAt: endedAt.toISOString(),
      durationMs: Math.round(performance.now() - startedAtPerfRef.current),
      config: {
        magazineSize: config.magazineSize,
        fireRateMs: config.fireRateMs,
        targetRadiusPx: config.targetRadiusPx,
        perfectRadiusPx: config.perfectRadiusPx,
        readyTimeoutSec: config.readyTimeoutSec,
      },
      rawData: rawData as unknown as Record<string, unknown>,
    };
  }, [config, options.playerId, options.sessionId]);

  const finish = useCallback(() => {
    if (phaseRef.current === "finished" || phaseRef.current === "idle") return;
    phaseRef.current = "finished";
    resetTimers();
    const result = buildResult();
    setDisplay((prev) => ({
      ...prev,
      phase: "finished",
      progressPct: 100,
      result,
      isPointerDown: false,
    }));
    options.onGameComplete(result);
  }, [buildResult, options, resetTimers]);

  const updateDisplayFromShots = useCallback((shot: SprayShot | null) => {
    const shots = shotsRef.current;
    const hitCount = shots.filter((item) => item.hit).length;
    const perfectCount = shots.filter((item) => item.perfect).length;
    const avgErrorPx = shots.length > 0 ? shots.reduce((sum, item) => sum + item.distancePx, 0) / shots.length : 0;

    setDisplay((prev) => ({
      ...prev,
      phase: phaseRef.current,
      targetX: targetRef.current.x,
      targetY: targetRef.current.y,
      aimX: pointerRef.current.x,
      aimY: pointerRef.current.y,
      recoilX: shot?.recoilX ?? prev.recoilX,
      recoilY: shot?.recoilY ?? prev.recoilY,
      currentShot: shots.length,
      progressPct: (shots.length / config.magazineSize) * 100,
      hitCount,
      perfectCount,
      avgErrorPx,
      lastShot: shot,
      shots: [...shots],
      isPointerDown: pointerRef.current.isDown,
    }));
  }, [config.magazineSize]);

  const fireShot = useCallback(() => {
    if (phaseRef.current !== "spraying") return;
    const index = shotIndexRef.current;
    if (index >= config.magazineSize) {
      finish();
      return;
    }

    if (firstShotPerfRef.current === null) firstShotPerfRef.current = performance.now();

    const recoil = getRecoilPattern(index);
    const pointer = pointerRef.current;
    const aimX = pointer.hasPointer ? pointer.x : targetRef.current.x;
    const aimY = pointer.hasPointer ? pointer.y : targetRef.current.y;
    const shotX = aimX + recoil.x;
    const shotY = aimY + recoil.y;
    const distancePx = Math.hypot(shotX - targetRef.current.x, shotY - targetRef.current.y);
    const hit = distancePx <= config.targetRadiusPx;
    const perfect = distancePx <= config.perfectRadiusPx;
    const shot: SprayShot = {
      shotIndex: index + 1,
      firedAtMs: Math.round(performance.now() - startedAtPerfRef.current),
      aimX: Number(aimX.toFixed(1)),
      aimY: Number(aimY.toFixed(1)),
      shotX: Number(shotX.toFixed(1)),
      shotY: Number(shotY.toFixed(1)),
      targetX: Number(targetRef.current.x.toFixed(1)),
      targetY: Number(targetRef.current.y.toFixed(1)),
      recoilX: Number(recoil.x.toFixed(1)),
      recoilY: Number(recoil.y.toFixed(1)),
      distancePx: Number(distancePx.toFixed(1)),
      hit,
      perfect,
    };

    shotsRef.current.push(shot);
    shotIndexRef.current += 1;
    updateDisplayFromShots(shot);

    if (shotIndexRef.current >= config.magazineSize) {
      finish();
    }
  }, [config.magazineSize, config.perfectRadiusPx, config.targetRadiusPx, finish, updateDisplayFromShots]);

  const beginSpray = useCallback(() => {
    if (phaseRef.current !== "ready") return;
    resetTimers();
    phaseRef.current = "spraying";
    pointerRef.current.isDown = true;
    fireShot();
    fireTimerRef.current = setInterval(fireShot, config.fireRateMs);
  }, [config.fireRateMs, fireShot, resetTimers]);

  const start = useCallback(() => {
    resetTimers();
    const { width, height } = getArenaSize();
    const target = { x: width / 2, y: height / 2 + 34 };
    targetRef.current = target;
    pointerRef.current = { x: target.x, y: target.y, hasPointer: false, isDown: false };
    shotsRef.current = [];
    shotIndexRef.current = 0;
    firstShotPerfRef.current = null;
    phaseRef.current = "countdown";

    setDisplay({
      ...initialDisplay,
      phase: "countdown",
      countdown: 3,
      readyTimeLeftMs: config.readyTimeoutSec * 1000,
      targetX: target.x,
      targetY: target.y,
      aimX: target.x,
      aimY: target.y,
      result: null,
      shots: [],
    });

    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        phaseRef.current = "ready";
        startedAtIsoRef.current = new Date().toISOString();
        startedAtPerfRef.current = performance.now();
        const readyStarted = performance.now();
        readyTimerRef.current = setInterval(() => {
          if (phaseRef.current !== "ready") return;
          const elapsed = performance.now() - readyStarted;
          const left = Math.max(0, config.readyTimeoutSec * 1000 - elapsed);
          setDisplay((prev) => ({ ...prev, phase: "ready", readyTimeLeftMs: left }));
          if (left <= 0) finish();
        }, 80);
        setDisplay((prev) => ({ ...prev, phase: "ready", countdown: 0 }));
      } else {
        setDisplay((prev) => ({ ...prev, countdown: count }));
      }
    }, 760);
  }, [config.readyTimeoutSec, finish, getArenaSize, resetTimers]);

  const abort = useCallback(() => {
    resetTimers();
    phaseRef.current = "idle";
    setDisplay({ ...initialDisplay, readyTimeLeftMs: config.readyTimeoutSec * 1000 });
  }, [config.readyTimeoutSec, resetTimers]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = event.clientX - rect.left;
    pointerRef.current.y = event.clientY - rect.top;
    pointerRef.current.hasPointer = true;
    setDisplay((prev) => ({
      ...prev,
      aimX: pointerRef.current.x,
      aimY: pointerRef.current.y,
      isPointerDown: pointerRef.current.isDown,
    }));
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== "ready") return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerRef.current.isDown = true;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRef.current.x = event.clientX - rect.left;
    pointerRef.current.y = event.clientY - rect.top;
    pointerRef.current.hasPointer = true;
    beginSpray();
  }, [beginSpray]);

  const handlePointerUp = useCallback(() => {
    pointerRef.current.isDown = false;
    if (phaseRef.current === "spraying") {
      finish();
    }
  }, [finish]);

  useEffect(() => () => resetTimers(), [resetTimers]);

  return {
    ...display,
    config,
    start,
    abort,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
  };
}
