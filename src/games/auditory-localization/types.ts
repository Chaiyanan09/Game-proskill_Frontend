/**
 * Internal types ของเกม Auditory Localization & Reaction
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

export interface RevealInfo {
  trueAngle: number;
  clickAngle: number;
  error: number;
}

/** rawData ที่จะถูกส่งใน GameResult.rawData */
export interface AuditoryRawData {
  totalTrials: number;
  successCount: number;
  avgAngleErrorDeg: number;
  successRateNear: number;
  successRateMid: number;
  successRateFar: number;
  trials: Array<{
    angleDeg: number;
    clickAngleDeg: number | null;
    angleErrorDeg: number | null;
    reactionMs: number | null;
    distance: number;
    soundType: SoundType;
    success: boolean | null;
  }>;
}
