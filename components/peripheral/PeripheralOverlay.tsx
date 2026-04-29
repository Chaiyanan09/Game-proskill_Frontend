import { PeripheralResult } from "./types";

/**
 * Overlay หน้าเริ่มและหน้าผลลัพธ์ของ Peripheral Awareness Test
 */

interface StartProps {
  durationSec: number;
  onStart: () => void;
}

export function PeripheralStartOverlay({ durationSec, onStart }: StartProps) {
  return (
    <div className="pa-overlay">
      <h2>Peripheral Awareness Test</h2>
      <p>
        ใช้เมาส์ประคองวงกลมตรงกลางจอ และกดปุ่มเลข <b>1 2 3 4</b>
        ให้ตรงกับสัญลักษณ์ที่โผล่ขึ้นมาตามมุมจอ
      </p>
      <p className="pa-hint">ระยะเวลาทดสอบ: {durationSec} วินาที</p>
      <button className="pa-btn" onClick={onStart}>
        เริ่มทดสอบ
      </button>
    </div>
  );
}

interface ResultProps {
  result: PeripheralResult;
  onRestart: () => void;
}

/** การ์ดสรุปผลแต่ละค่า แยกเป็น component เล็กๆ */
function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="pa-result-label">{label}</div>
      <div className="pa-result-value">{value}</div>
    </div>
  );
}

export function PeripheralResultOverlay({ result, onRestart }: ResultProps) {
  return (
    <div className="pa-overlay">
      <h2>ผลการทดสอบ</h2>
      <div className="pa-result-grid">
        <ResultCard
          label="Peripheral Accuracy"
          value={`${result.accuracyPct.toFixed(1)}%`}
        />
        <ResultCard
          label="Tracking Deviation"
          value={`${result.avgTrackingDeviationPx.toFixed(1)} px`}
        />
        <ResultCard
          label="Detection Speed"
          value={`${result.avgDetectionMs.toFixed(0)} ms`}
        />
        <ResultCard
          label="ถูก / ทั้งหมด"
          value={`${result.correctCount} / ${result.totalCues}`}
        />
      </div>
      <button className="pa-btn" onClick={onRestart}>
        ทดสอบอีกครั้ง
      </button>
    </div>
  );
}
