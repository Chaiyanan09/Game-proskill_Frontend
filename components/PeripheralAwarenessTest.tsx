"use client";

import { useRef } from "react";
import { CornerCue, PeripheralResult } from "./peripheral/types";
import { usePeripheralGame } from "./peripheral/usePeripheralGame";
import { PeripheralHUD } from "./peripheral/PeripheralHUD";
import {
  PeripheralStartOverlay,
  PeripheralResultOverlay,
} from "./peripheral/PeripheralOverlay";

/**
 * Peripheral Awareness Test
 * --------------------------
 * วัดความสามารถในการโฟกัสเป้าหมายหลัก (กลางจอ) ไปพร้อมกับสังเกตสิ่งผิดปกติรอบขอบจอ
 *
 * ไฟล์นี้ทำหน้าที่ orchestrate ส่วนต่างๆ:
 *  - usePeripheralGame  -> game logic ทั้งหมด
 *  - PeripheralHUD      -> ตัวเลข HUD ด้านบน
 *  - PeripheralOverlay  -> หน้า start / result
 *  - helpers/types      -> pure functions และ types
 */

interface Props {
  /** ระยะเวลาทดสอบ (วินาที) - default 60 */
  durationSec?: number;
  /** ระยะเวลาที่สัญลักษณ์โผล่ (ms) - default 700 */
  cueLifeMs?: number;
  /** ช่วงห่างระหว่าง cue (ms min, max) - default [900, 2100] */
  cueIntervalMs?: [number, number];
  /** callback เมื่อจบเกม รับผลลัพธ์ไปใช้ต่อ */
  onFinish?: (result: PeripheralResult) => void;
}

/** วาด cue ที่มุมจอ */
function CornerCueView({ cue }: { cue: CornerCue }) {
  return (
    <div className={`pa-cue pa-cue-${cue.corner}`}>
      <span className="pa-cue-symbol">{cue.symbol}</span>
    </div>
  );
}

export default function PeripheralAwarenessTest({
  durationSec = 60,
  cueLifeMs = 700,
  cueIntervalMs = [900, 2100],
  onFinish,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const game = usePeripheralGame(arenaRef, {
    durationSec,
    cueLifeMs,
    cueIntervalMs,
    onFinish,
  });

  return (
    <div className="pa-wrapper">
      <PeripheralHUD timeLeft={game.timeLeft} cues={game.cues} />

      <div
        ref={arenaRef}
        className={`pa-arena ${game.feedback ? `pa-flash-${game.feedback}` : ""}`}
        onMouseMove={game.handleMouseMove}
      >
        {game.activeCues.map((cue) => (
          <CornerCueView key={cue.id} cue={cue} />
        ))}

        {game.running && (
          <div
            className="pa-target"
            style={{
              transform: `translate(${game.targetPos.x}px, ${game.targetPos.y}px) translate(-50%, -50%)`,
            }}
          />
        )}

        {!game.running && !game.finished && (
          <PeripheralStartOverlay
            durationSec={durationSec}
            onStart={game.start}
          />
        )}

        {game.finished && game.result && (
          <PeripheralResultOverlay
            result={game.result}
            onRestart={game.start}
          />
        )}
      </div>
    </div>
  );
}
