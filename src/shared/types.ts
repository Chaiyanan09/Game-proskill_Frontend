/**
 * Game Module Contract
 * --------------------
 * สัญญาเชื่อมต่อระหว่าง "เกมโมดูลของนิสิต" กับ "เว็บหลักของอาจารย์"
 *
 * กฎ:
 *  1. เกมห้ามเชื่อมต่อ database โดยตรง
 *  2. เกมต้องรับ props ตาม GameProps
 *  3. เมื่อจบเกม ต้องเรียก onGameComplete(result) โดย result เป็นรูปแบบ GameResult
 *  4. ใช้ performance.now() สำหรับการวัดเวลาที่ต้องการความละเอียดสูง
 */

export interface GameResult {
  /** รหัสเกม (kebab-case) เช่น "peripheral-awareness" */
  gameId: string;

  /** ชื่อเกม (สำหรับแสดงผล) */
  gameName: string;

  /** รหัสผู้เล่น - ระบบหลักส่งมาให้ */
  playerId: string;

  /** รหัสเซสชันการทดสอบ - ระบบหลักส่งมาให้ */
  sessionId: string;

  /** คะแนนรวม (สเกลที่แต่ละเกมกำหนด แนะนำ 0-100) */
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

  /**
   * ข้อมูลดิบเฉพาะของเกมแต่ละตัว
   * ระบบหลักจะเก็บลง column raw_data_json เพื่อใช้วิเคราะห์ภายหลัง
   */
  rawData: unknown;
}

export interface GameProps {
  playerId: string;
  sessionId: string;
  onGameComplete: (result: GameResult) => void;
}
