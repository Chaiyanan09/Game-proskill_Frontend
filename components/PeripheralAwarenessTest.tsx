"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Peripheral Awareness Test
 * -------------------------
 * วัดความสามารถในการโฟกัสเป้าหมายหลัก (กลางจอ) ไปพร้อมกับสังเกตสิ่งผิดปกติรอบขอบจอ
 *
 * วิธีเล่น:
 *  - ใช้เมาส์ประคองเป้าหมายที่กำลังเคลื่อนที่ตรงกลางจอ
 *  - มีสัญลักษณ์ (1, 2, 3, 4) สุ่มโผล่ขึ้นมาตามมุมจอเสี้ยววินาที
 *  - กดปุ่มคีย์บอร์ดให้ตรงกับสัญลักษณ์ขณะที่เมาส์ยังประคองเป้าหมายตรงกลาง
 *
 * วัดผล:
 *  - Peripheral Accuracy (%)
 *  - Tracking Deviation (px) เฉลี่ย
 *  - Detection Speed (ms) เฉลี่ย
 */

type Corner = "TL" | "TR" | "BL" | "BR";
type CueSymbol = 1 | 2 | 3 | 4;

interface CornerCue {
  id: number;
  corner: Corner;
  symbol: CueSymbol;
  spawnedAt: number;
  expiresAt: number;
  resolved: boolean;
  responseMs?: number;
  correct?: boolean;
  trackingDevAtSpawn?: number;
}

interface SessionResult {
  totalCues: number;
  correctCount: number;
  missedCount: number;
  wrongCount: number;
  accuracyPct: number;
  avgDetectionMs: number;
  avgTrackingDeviationPx: number;
}

interface Props {
  /** ระยะเวลาทดสอบ (วินาที) - default 60 */
  durationSec?: number;
  /** ระยะเวลาที่สัญลักษณ์โผล่ (ms) - default 700 */
  cueLifeMs?: number;
  /** ช่วงห่างระหว่าง cue (ms min, max) - default [900, 2100] */
  cueIntervalMs?: [number, number];
  /** callback เมื่อจบเกม รับผลลัพธ์ไปใช้ต่อ */
  onFinish?: (result: SessionResult) => void;
}

const KEY_TO_SYMBOL: Record<string, CueSymbol> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
};

const CORNERS: Corner[] = ["TL", "TR", "BL", "BR"];

export default function PeripheralAwarenessTest({
  durationSec = 60,
  cueLifeMs = 700,
  cueIntervalMs = [900, 2100],
  onFinish,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const targetPosRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  const trackingSamplesRef = useRef<number[]>([]);
  const cuesRef = useRef<CornerCue[]>([]);
  const cueIdRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const cueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [activeCues, setActiveCues] = useState<CornerCue[]>([]);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [feedback, setFeedback] = useState<"" | "correct" | "wrong" | "miss">("");

  // คำนวณตำแหน่งเป้าหมายตรงกลาง (เคลื่อนที่เป็นวงกลมแบบนุ่มๆ)
  const updateTarget = useCallback(() => {
    if (!arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const t = (performance.now() - startTimeRef.current) / 1000;
    // วงโคจรซ้อน 2 ความถี่ ทำให้ track ยากขึ้น
    const radius = Math.min(rect.width, rect.height) * 0.08;
    const x = cx + Math.cos(t * 1.4) * radius + Math.sin(t * 0.7) * radius * 0.4;
    const y = cy + Math.sin(t * 1.1) * radius + Math.cos(t * 0.5) * radius * 0.4;
    targetPosRef.current = { x, y };
    setTargetPos({ x, y });
  }, []);

  // วน loop หลัก: update target, sample tracking deviation
  const loop = useCallback(() => {
    updateTarget();
    if (running && arenaRef.current) {
      const dx = mousePosRef.current.x - targetPosRef.current.x;
      const dy = mousePosRef.current.y - targetPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      trackingSamplesRef.current.push(dist);
    }

    // เช็ค cue หมดอายุ -> mark missed
    const now = performance.now();
    let needRender = false;
    cuesRef.current.forEach((c) => {
      if (!c.resolved && now >= c.expiresAt) {
        c.resolved = true;
        c.correct = false;
        needRender = true;
      }
    });
    if (needRender) {
      setActiveCues(cuesRef.current.filter((c) => !c.resolved));
    }

    animationRef.current = requestAnimationFrame(loop);
  }, [running, updateTarget]);

  // เก็บ props เป็น scalar เพื่อกัน array ใหม่ทุก render
  const minIntervalMs = cueIntervalMs[0];
  const maxIntervalMs = cueIntervalMs[1];

  const spawnCue = useCallback(() => {
    if (!running) return;
    const corner = CORNERS[Math.floor(Math.random() * 4)];
    const symbol = (Math.floor(Math.random() * 4) + 1) as CueSymbol;
    const now = performance.now();
    const dx = mousePosRef.current.x - targetPosRef.current.x;
    const dy = mousePosRef.current.y - targetPosRef.current.y;
    const trackDev = Math.sqrt(dx * dx + dy * dy);

    const cue: CornerCue = {
      id: cueIdRef.current++,
      corner,
      symbol,
      spawnedAt: now,
      expiresAt: now + cueLifeMs,
      resolved: false,
      trackingDevAtSpawn: trackDev,
    };
    cuesRef.current.push(cue);
    setActiveCues(cuesRef.current.filter((c) => !c.resolved));

    const next = minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
    cueTimeoutRef.current = setTimeout(spawnCue, next);
  }, [running, cueLifeMs, minIntervalMs, maxIntervalMs]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!running) return;
    const sym = KEY_TO_SYMBOL[e.key];
    if (!sym) return;
    // ตอบ cue ที่ active ตัวล่าสุด
    const active = cuesRef.current.filter((c) => !c.resolved);
    if (active.length === 0) {
      setFeedback("wrong");
      setTimeout(() => setFeedback(""), 200);
      return;
    }
    const cue = active[active.length - 1];
    cue.resolved = true;
    cue.responseMs = performance.now() - cue.spawnedAt;
    cue.correct = cue.symbol === sym;
    setFeedback(cue.correct ? "correct" : "wrong");
    setTimeout(() => setFeedback(""), 200);
    setActiveCues(cuesRef.current.filter((c) => !c.resolved));
  }, [running]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

    const cues = cuesRef.current;
    const total = cues.length;
    const responded = cues.filter((c) => c.responseMs !== undefined);
    const correct = cues.filter((c) => c.correct === true);
    const wrong = responded.filter((c) => c.correct === false);
    const missed = cues.filter((c) => c.responseMs === undefined);
    const avgDetect =
      responded.length > 0
        ? responded.reduce((s, c) => s + (c.responseMs ?? 0), 0) / responded.length
        : 0;
    const samples = trackingSamplesRef.current;
    const avgDev =
      samples.length > 0 ? samples.reduce((s, v) => s + v, 0) / samples.length : 0;

    const r: SessionResult = {
      totalCues: total,
      correctCount: correct.length,
      missedCount: missed.length,
      wrongCount: wrong.length,
      accuracyPct: total > 0 ? (correct.length / total) * 100 : 0,
      avgDetectionMs: avgDetect,
      avgTrackingDeviationPx: avgDev,
    };
    setResult(r);
    onFinish?.(r);
  }, [onFinish]);

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

  // เริ่ม loop เมื่อ running
  useEffect(() => {
    if (running) {
      animationRef.current = requestAnimationFrame(loop);
      cueTimeoutRef.current = setTimeout(spawnCue, 800);
      window.addEventListener("keydown", handleKeyDown);

      const timerId = setInterval(() => {
        const elapsed = (performance.now() - startTimeRef.current) / 1000;
        const left = Math.max(0, durationSec - elapsed);
        setTimeLeft(left);
        if (left <= 0) {
          clearInterval(timerId);
          finalize();
        }
      }, 100);

      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (cueTimeoutRef.current) clearTimeout(cueTimeoutRef.current);
        clearInterval(timerId);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [running, loop, spawnCue, handleKeyDown, durationSec, finalize]);

  return (
    <div className="pa-wrapper">
      <div className="pa-hud">
        <div className="pa-hud-item">
          <span className="pa-hud-label">เวลา</span>
          <span className="pa-hud-value">{timeLeft.toFixed(1)}s</span>
        </div>
        <div className="pa-hud-item">
          <span className="pa-hud-label">สัญลักษณ์</span>
          <span className="pa-hud-value">{cuesRef.current.length}</span>
        </div>
        <div className="pa-hud-item">
          <span className="pa-hud-label">ถูก</span>
          <span className="pa-hud-value pa-correct">
            {cuesRef.current.filter((c) => c.correct === true).length}
          </span>
        </div>
      </div>

      <div
        ref={arenaRef}
        className={`pa-arena ${feedback ? `pa-flash-${feedback}` : ""}`}
        onMouseMove={handleMouseMove}
      >
        {/* corner zones */}
        {activeCues.map((cue) => (
          <div key={cue.id} className={`pa-cue pa-cue-${cue.corner}`}>
            <span className="pa-cue-symbol">{cue.symbol}</span>
          </div>
        ))}

        {/* center target */}
        {running && (
          <div
            className="pa-target"
            style={{
              transform: `translate(${targetPos.x}px, ${targetPos.y}px) translate(-50%, -50%)`,
            }}
          />
        )}

        {/* overlays */}
        {!running && !finished && (
          <div className="pa-overlay">
            <h2>Peripheral Awareness Test</h2>
            <p>
              ใช้เมาส์ประคองวงกลมตรงกลางจอ และกดปุ่มเลข <b>1 2 3 4</b>
              ให้ตรงกับสัญลักษณ์ที่โผล่ขึ้นมาตามมุมจอ
            </p>
            <p className="pa-hint">ระยะเวลาทดสอบ: {durationSec} วินาที</p>
            <button className="pa-btn" onClick={start}>
              เริ่มทดสอบ
            </button>
          </div>
        )}

        {finished && result && (
          <div className="pa-overlay">
            <h2>ผลการทดสอบ</h2>
            <div className="pa-result-grid">
              <div>
                <div className="pa-result-label">Peripheral Accuracy</div>
                <div className="pa-result-value">
                  {result.accuracyPct.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="pa-result-label">Tracking Deviation</div>
                <div className="pa-result-value">
                  {result.avgTrackingDeviationPx.toFixed(1)} px
                </div>
              </div>
              <div>
                <div className="pa-result-label">Detection Speed</div>
                <div className="pa-result-value">
                  {result.avgDetectionMs.toFixed(0)} ms
                </div>
              </div>
              <div>
                <div className="pa-result-label">ถูก / ทั้งหมด</div>
                <div className="pa-result-value">
                  {result.correctCount} / {result.totalCues}
                </div>
              </div>
            </div>
            <button className="pa-btn" onClick={start}>
              ทดสอบอีกครั้ง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
