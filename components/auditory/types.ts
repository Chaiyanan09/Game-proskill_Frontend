/**
 * Types ของเกม Auditory Localization & Reaction Test
 */

export type SoundType = "footstep" | "reload";

export interface Point {
  x: number;
  y: number;
}

export interface Trial {
  index: number;
  /** 0 = ขวา, 90 = ล่าง, 180 = ซ้าย, 270 = บน */
  angleDeg: number;
  /** 0 (ใกล้/ดัง) - 1 (ไกล/เบา) */
  distance: number;
  soundType: SoundType;
  playedAt: number;
  clickedAt?: number;
  clickAngleDeg?: number;
  angleErrorDeg?: number;
  reactionMs?: number;
  /** success ถ้า angleErrorDeg <= threshold */
  success?: boolean;
}

export interface AuditoryResult {
  totalTrials: number;
  avgAngleErrorDeg: number;
  avgReactionMs: number;
  successRateOverall: number;
  successRateNear: number;
  successRateMid: number;
  successRateFar: number;
}

export interface RevealInfo {
  trueAngle: number;
  clickAngle: number;
  error: number;
}
