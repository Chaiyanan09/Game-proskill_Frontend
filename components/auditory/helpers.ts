/**
 * Pure helpers ของเกม Auditory Localization Test
 */

import { AuditoryResult, Point, SoundType, Trial } from "./types";

/** แปลงมุม (degrees) -> จุดบนวงกลมที่มี radius กำหนด */
export function angleToPoint(angleDeg: number, radius: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

/** แปลงจุดเทียบกับ origin -> มุม (degrees, 0-360) */
export function pointToAngleDeg(p: Point): number {
  let angle = (Math.atan2(p.y, p.x) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

/** คำนวณความคลาดเคลื่อนเชิงมุมระหว่างสองมุม (0-180) */
export function angleErrorDeg(trueAngle: number, guessAngle: number): number {
  let diff = Math.abs(guessAngle - trueAngle) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/** สุ่ม trial ใหม่ (มุม + ระยะ + ประเภทเสียง) */
export function makeRandomTrial(index: number): Trial {
  return {
    index,
    angleDeg: Math.random() * 360,
    distance: Math.random(),
    soundType: Math.random() < 0.5 ? "footstep" : "reload",
    playedAt: 0,
  };
}

/** สุ่มเวลา delay ก่อนเล่นเสียง (ms) - กัน reaction-cheat */
export function randomPreDelayMs(): number {
  return 600 + Math.random() * 900;
}

/** สำหรับแยก trials ตามระยะ near/mid/far */
function bucket(t: Trial): "near" | "mid" | "far" {
  if (t.distance < 0.34) return "near";
  if (t.distance < 0.67) return "mid";
  return "far";
}

function successRate(trials: Trial[]): number {
  if (trials.length === 0) return 0;
  return (trials.filter((t) => t.success).length / trials.length) * 100;
}

/** สรุปผลทุก trial */
export function summarize(trials: Trial[]): AuditoryResult {
  const completed = trials.filter((t) => t.angleErrorDeg !== undefined);
  const total = completed.length;

  const avgErr =
    total > 0
      ? completed.reduce((s, t) => s + (t.angleErrorDeg ?? 0), 0) / total
      : 0;
  const avgRt =
    total > 0
      ? completed.reduce((s, t) => s + (t.reactionMs ?? 0), 0) / total
      : 0;

  const near = completed.filter((t) => bucket(t) === "near");
  const mid = completed.filter((t) => bucket(t) === "mid");
  const far = completed.filter((t) => bucket(t) === "far");

  return {
    totalTrials: total,
    avgAngleErrorDeg: avgErr,
    avgReactionMs: avgRt,
    successRateOverall: successRate(completed),
    successRateNear: successRate(near),
    successRateMid: successRate(mid),
    successRateFar: successRate(far),
  };
}

/** ใช้สำหรับ debug / log */
export function describeSound(type: SoundType): string {
  return type === "footstep" ? "ฝีเท้า" : "รีโหลด";
}
