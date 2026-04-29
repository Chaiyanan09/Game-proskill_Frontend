/**
 * Pure helper functions ของเกม Peripheral Awareness Test
 * แต่ละฟังก์ชันแยกอิสระ ทดสอบและแก้ได้ง่าย
 */

import {
  CornerCue,
  Corner,
  CueSymbol,
  PeripheralResult,
  Point,
  CORNERS,
} from "./types";

/** คำนวณตำแหน่งเป้าหมายแบบ Lissajous (วงโคจรซ้อน) ทำให้ track ยากขึ้น */
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

/** ระยะห่างระหว่าง 2 จุด */
export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** สุ่มมุมจอ */
export function pickRandomCorner(): Corner {
  return CORNERS[Math.floor(Math.random() * CORNERS.length)];
}

/** สุ่มสัญลักษณ์ 1-4 */
export function pickRandomSymbol(): CueSymbol {
  return (Math.floor(Math.random() * 4) + 1) as CueSymbol;
}

/** สุ่มค่า delay ระหว่าง min-max */
export function randomDelay(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** ค่าเฉลี่ยของ array (ถ้าว่างเปล่าคืน 0) */
function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/** สรุปผลการทดสอบจาก cues และ tracking samples */
export function summarize(
  cues: CornerCue[],
  trackingSamples: number[]
): PeripheralResult {
  const total = cues.length;
  const responded = cues.filter((c) => c.responseMs !== undefined);
  const correct = cues.filter((c) => c.correct === true);
  const wrong = responded.filter((c) => c.correct === false);
  const missed = cues.filter((c) => c.responseMs === undefined);

  return {
    totalCues: total,
    correctCount: correct.length,
    missedCount: missed.length,
    wrongCount: wrong.length,
    accuracyPct: total > 0 ? (correct.length / total) * 100 : 0,
    avgDetectionMs: average(responded.map((c) => c.responseMs ?? 0)),
    avgTrackingDeviationPx: average(trackingSamples),
  };
}
