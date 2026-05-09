export type SprayPhase = "idle" | "countdown" | "ready" | "spraying" | "finished";

export interface SprayControlConfig {
  magazineSize: number;
  fireRateMs: number;
  targetRadiusPx: number;
  perfectRadiusPx: number;
  readyTimeoutSec: number;
}

export interface SprayShot {
  shotIndex: number;
  firedAtMs: number;
  aimX: number;
  aimY: number;
  shotX: number;
  shotY: number;
  targetX: number;
  targetY: number;
  recoilX: number;
  recoilY: number;
  distancePx: number;
  hit: boolean;
  perfect: boolean;
}

export interface SprayRawData {
  magazineSize: number;
  fireRateMs: number;
  targetRadiusPx: number;
  perfectRadiusPx: number;
  totalShots: number;
  hitCount: number;
  perfectCount: number;
  missedCount: number;
  hitRatePct: number;
  perfectRatePct: number;
  avgShotErrorPx: number;
  maxShotErrorPx: number;
  groupingRadiusPx: number;
  verticalControlScore: number;
  horizontalControlScore: number;
  sprayControlScore: number;
  timeToFirstShotMs: number | null;
  shots: SprayShot[];
}
