/** Internal types ของเกม Auditory Localization & Reaction */

export type SoundType = "footstep" | "reload";

export interface Point {
  x: number;
  y: number;
}

export interface Trial {
  index: number;
  /** 0 = ขวา, 90 = ล่าง, 180 = ซ้าย, 270 = บน */
  angleDeg: number;
  /** 0 = ใกล้/ดัง, 1 = ไกล/เบา */
  distance: number;
  soundType: SoundType;
  playedAt: number;
  clickedAt?: number;
  clickAngleDeg?: number;
  angleErrorDeg?: number;
  reactionMs?: number;
  success?: boolean;
  timedOut?: boolean;
}

export interface RevealInfo {
  trueAngle: number;
  clickAngle: number | null;
  error: number | null;
  success: boolean;
  timedOut: boolean;
}

/** rawData ที่จะถูกส่งใน GameResult.rawData */
export interface AuditoryRawData extends Record<string, unknown> {
  totalTrials: number;
  successCount: number;
  missedCount: number;
  wrongCount: number;
  avgAngleErrorDeg: number;
  successRateNear: number;
  successRateMid: number;
  successRateFar: number;
  trials: Array<{
    index: number;
    angleDeg: number;
    clickAngleDeg: number | null;
    angleErrorDeg: number | null;
    reactionMs: number | null;
    distance: number;
    soundType: SoundType;
    success: boolean | null;
    timedOut: boolean;
  }>;
}
