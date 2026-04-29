/**
 * Types & constants ของเกม Peripheral Awareness Test
 */

export type Corner = "TL" | "TR" | "BL" | "BR";
export type CueSymbol = 1 | 2 | 3 | 4;

export interface Point {
  x: number;
  y: number;
}

export interface CornerCue {
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

export interface PeripheralResult {
  totalCues: number;
  correctCount: number;
  missedCount: number;
  wrongCount: number;
  accuracyPct: number;
  avgDetectionMs: number;
  avgTrackingDeviationPx: number;
}

export type FeedbackType = "" | "correct" | "wrong";

/** map คีย์บอร์ด -> สัญลักษณ์ */
export const KEY_TO_SYMBOL: Record<string, CueSymbol> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
};

export const CORNERS: Corner[] = ["TL", "TR", "BL", "BR"];
