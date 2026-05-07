/** Internal types ของเกม Peripheral Awareness */

export type Corner = "TL" | "TR" | "BL" | "BR";
export type CueSymbol = 1 | 2 | 3 | 4;
export type FeedbackType = "" | "correct" | "wrong";

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

/** rawData ที่จะถูกส่งกลับใน GameResult.rawData */
export interface PeripheralRawData extends Record<string, unknown> {
  totalCues: number;
  correctCount: number;
  missedCount: number;
  wrongCount: number;
  falsePressCount: number;
  avgTrackingDeviationPx: number;
  cues: Array<{
    corner: Corner;
    symbol: CueSymbol;
    correct: boolean | null;
    responseMs: number | null;
    trackingDevAtSpawn: number | null;
  }>;
}

export const KEY_TO_SYMBOL: Record<string, CueSymbol> = {
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
};

export const CORNERS: Corner[] = ["TL", "TR", "BL", "BR"];
