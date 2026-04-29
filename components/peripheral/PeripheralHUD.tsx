import { CornerCue } from "./types";

interface Props {
  timeLeft: number;
  cues: CornerCue[];
}

/**
 * แสดงตัวเลข HUD ด้านบนของเกม: เวลาที่เหลือ, จำนวน cue, จำนวนที่ตอบถูก
 */
export function PeripheralHUD({ timeLeft, cues }: Props) {
  const correctCount = cues.filter((c) => c.correct === true).length;

  return (
    <div className="pa-hud">
      <div className="pa-hud-item">
        <span className="pa-hud-label">เวลา</span>
        <span className="pa-hud-value">{timeLeft.toFixed(1)}s</span>
      </div>
      <div className="pa-hud-item">
        <span className="pa-hud-label">สัญลักษณ์</span>
        <span className="pa-hud-value">{cues.length}</span>
      </div>
      <div className="pa-hud-item">
        <span className="pa-hud-label">ถูก</span>
        <span className="pa-hud-value pa-correct">{correctCount}</span>
      </div>
    </div>
  );
}
