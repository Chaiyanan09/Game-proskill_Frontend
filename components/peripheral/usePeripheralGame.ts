"use client";

import {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import {
  CornerCue,
  FeedbackType,
  KEY_TO_SYMBOL,
  PeripheralResult,
  Point,
} from "./types";
import {
  calcTargetPosition,
  distance,
  pickRandomCorner,
  pickRandomSymbol,
  randomDelay,
  summarize,
} from "./helpers";

/**
 * Custom hook ที่ห่อ logic ทั้งหมดของเกม Peripheral Awareness Test
 * - คอมโพเนนต์ UI แค่เรียก hook นี้แล้ว render ค่าที่ได้กลับมา
 */

interface Options {
  durationSec: number;
  cueLifeMs: number;
  cueIntervalMs: [number, number];
  onFinish?: (r: PeripheralResult) => void;
}

const FEEDBACK_DURATION_MS = 200;
const FIRST_CUE_DELAY_MS = 800;
const TICK_MS = 100;

export function usePeripheralGame(
  arenaRef: RefObject<HTMLDivElement>,
  opts: Options
) {
  const { durationSec, cueLifeMs, onFinish } = opts;
  const [minIntervalMs, maxIntervalMs] = opts.cueIntervalMs;

  // refs สำหรับค่าที่อัปเดตบ่อยและไม่อยากให้ trigger render
  const targetPosRef = useRef<Point>({ x: 0, y: 0 });
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const trackingSamplesRef = useRef<number[]>([]);
  const cuesRef = useRef<CornerCue[]>([]);
  const cueIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);

  // states ที่ต้องการให้ UI re-render
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeCues, setActiveCues] = useState<CornerCue[]>([]);
  const [targetPos, setTargetPos] = useState<Point>({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [result, setResult] = useState<PeripheralResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackType>("");

  /** flash feedback สั้นๆ */
  const flashFeedback = (type: "correct" | "wrong") => {
    setFeedback(type);
    setTimeout(() => setFeedback(""), FEEDBACK_DURATION_MS);
  };

  /** อัปเดตตำแหน่งเป้าหมายตรงกลาง */
  const updateTarget = useCallback(() => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const t = (performance.now() - startTimeRef.current) / 1000;
    const pos = calcTargetPosition(rect.width, rect.height, t);
    targetPosRef.current = pos;
    setTargetPos(pos);
  }, [arenaRef]);

  /** mark cues ที่หมดอายุเป็น missed */
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

  /** loop หลักวน rAF */
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

  /** spawn cue ใหม่ และตั้ง timeout สำหรับ cue ถัดไป */
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

  /** ผู้เล่นกดคีย์ -> ตอบ cue ที่ active ตัวล่าสุด */
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

  /** อัปเดตตำแหน่งเมาส์ใน arena */
  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  /** จบเกม คำนวณผลและ callback */
  const finalize = useCallback(() => {
    setRunning(false);
    setFinished(true);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);

    const r = summarize(cuesRef.current, trackingSamplesRef.current);
    setResult(r);
    onFinish?.(r);
  }, [onFinish]);

  /** รีเซ็ตและเริ่มเกมใหม่ */
  const start = () => {
    cuesRef.current = [];
    cueIdRef.current = 0;
    trackingSamplesRef.current = [];
    setActiveCues([]);
    setResult(null);
    setFinished(false);
    setTimeLeft(durationSec);
    startTimeRef.current = performance.now();
    setRunning(true);
  };

  /** ติดตั้ง animation loop / spawn loop / timer countdown ตอน running */
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
    // state
    running,
    finished,
    activeCues,
    targetPos,
    timeLeft,
    result,
    feedback,
    cues: cuesRef.current,
    // actions
    start,
    handleMouseMove,
  };
}
