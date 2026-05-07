/**
 * Game Module Contract
 * --------------------
 * สัญญาเชื่อมต่อระหว่าง "เกมโมดูลของนิสิต" กับ "เว็บหลักของอาจารย์"
 *
 * กฎหลัก:
 * 1. เกมห้ามเชื่อมต่อ database โดยตรง
 * 2. เกมต้องรับ props ตาม GameProps
 * 3. เมื่อจบเกม ต้องเรียก onGameComplete(result) โดย result เป็นรูปแบบ GameResult
 * 4. ใช้ performance.now() สำหรับการวัดเวลาที่ต้องการความละเอียดสูง
 */

export const GAME_RESULT_SCHEMA_VERSION = "1.0.0" as const;

export type GameResultSchemaVersion = typeof GAME_RESULT_SCHEMA_VERSION;

export type GameStatus = "completed" | "aborted" | "failed";

export type GameConfig = Record<string, unknown>;

export type GameRawData = Record<string, unknown>;

export interface GameResult {
  /** version ของ contract เพื่อกันปัญหา format เปลี่ยนในอนาคต */
  schemaVersion: GameResultSchemaVersion;

  /** รหัสเกม (kebab-case) เช่น "peripheral-awareness" */
  gameId: string;

  /** ชื่อเกม (สำหรับแสดงผล) */
  gameName: string;

  /** รหัสผู้เล่น - ระบบหลักส่งมาให้ */
  playerId: string;

  /** รหัสเซสชันการทดสอบ - ระบบหลักส่งมาให้ */
  sessionId: string;

  /** สถานะการจบเกม ใช้แยก completed / aborted / failed */
  status: GameStatus;

  /** คะแนนรวม (แนะนำ 0-100) */
  score: number;

  /** ความแม่นยำเป็น % (ถ้ามี) */
  accuracy?: number;

  /** เวลาตอบสนองเฉลี่ย (ms) */
  reactionTimeMs?: number;

  /** array ของเวลาตอบสนองทุกครั้ง (ms) — ใช้สำหรับวิเคราะห์เชิงลึก */
  responseTimesMs?: number[];

  /** ISO timestamp ตอนเริ่มเกม */
  startedAt: string;

  /** ISO timestamp ตอนจบเกม */
  endedAt: string;

  /** ระยะเวลาที่เล่นทั้งหมด (ms) — ใช้ performance.now() ภายในเกม */
  durationMs: number;

  /** config ที่ใช้ในการทดสอบรอบนั้น เช่น duration, trials, threshold */
  config?: GameConfig;

  /** ข้อมูลดิบเฉพาะของเกมแต่ละตัว เก็บลง raw_data_json ได้ */
  rawData: GameRawData;
}

export interface GameProps {
  playerId: string;
  sessionId: string;
  onGameComplete: (result: GameResult) => void;
}
