import { useRef } from "react";
import { GameProps, GameResult } from "@/shared/types";
import { usePeripheralGame } from "./logic";
import { CornerCue, PeripheralRawData } from "./types";

/**
 * Peripheral Awareness Game
 *  - รับ props ตาม GameProps (playerId, sessionId, onGameComplete)
 *  - เมื่อจบเกมจะเรียก onGameComplete(result) ตาม Game Module Contract
 */

interface Props extends GameProps {
  /** ระยะเวลาทดสอบ (วินาที) - default 60 */
  durationSec?: number;
  /** ระยะเวลาที่สัญลักษณ์โผล่ (ms) - default 700 */
  cueLifeMs?: number;
  /** ช่วงห่างระหว่าง cue (ms min, max) - default [900, 2100] */
  cueIntervalMs?: [number, number];
}

// ---------- sub-components ----------

function CornerCueView({ cue }: { cue: CornerCue }) {
  return (
    <div className={`pa-cue pa-cue-${cue.corner}`}>
      <span className="pa-cue-symbol">{cue.symbol}</span>
    </div>
  );
}

function HUD({ timeLeft, cues }: { timeLeft: number; cues: CornerCue[] }) {
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

function StartOverlay({
  durationSec,
  onStart,
}: {
  durationSec: number;
  onStart: () => void;
}) {
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

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="pa-result-label">{label}</div>
      <div className="pa-result-value">{value}</div>
    </div>
  );
}

function ResultOverlay({
  result,
  onRestart,
}: {
  result: GameResult;
  onRestart: () => void;
}) {
  const raw = result.rawData as PeripheralRawData;
  return (
    <div className="pa-overlay">
      <h2>ผลการทดสอบ</h2>
      <div className="pa-result-grid">
        <ResultCard label="Score" value={result.score.toFixed(1)} />
        <ResultCard
          label="Accuracy"
          value={`${(result.accuracy ?? 0).toFixed(1)}%`}
        />
        <ResultCard
          label="Tracking Deviation"
          value={`${raw.avgTrackingDeviationPx.toFixed(1)} px`}
        />
        <ResultCard
          label="Detection Speed"
          value={`${(result.reactionTimeMs ?? 0).toFixed(0)} ms`}
        />
      </div>
      <button className="pa-btn" onClick={onRestart}>
        ทดสอบอีกครั้ง
      </button>
    </div>
  );
}

// ---------- main component ----------

export default function PeripheralAwarenessGame({
  playerId,
  sessionId,
  onGameComplete,
  durationSec = 60,
  cueLifeMs = 700,
  cueIntervalMs = [900, 2100],
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const game = usePeripheralGame(arenaRef, {
    durationSec,
    cueLifeMs,
    cueIntervalMs,
    playerId,
    sessionId,
    onGameComplete,
  });

  return (
    <div className="pa-wrapper">
      <HUD timeLeft={game.timeLeft} cues={game.cues} />

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
          <StartOverlay durationSec={durationSec} onStart={game.start} />
        )}

        {game.finished && game.lastResult && (
          <ResultOverlay result={game.lastResult} onRestart={game.start} />
        )}
      </div>
    </div>
  );
}
