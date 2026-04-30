import { useRef } from "react";
import { GameProps, GameResult } from "@/shared/types";
import { angleToPoint, useAuditoryGame } from "./logic";
import { AuditoryRawData, RevealInfo } from "./types";

/**
 * Auditory Localization & Reaction Game
 *  - รับ props ตาม GameProps (playerId, sessionId, onGameComplete)
 *  - เมื่อจบเกมจะเรียก onGameComplete(result) ตาม Game Module Contract
 */

interface Props extends GameProps {
  /** จำนวนรอบ - default 10 */
  trials?: number;
  /** เกณฑ์องศาที่ถือว่าสำเร็จ - default 25 */
  successThresholdDeg?: number;
}

// ---------- sub-components ----------

function HUD({
  trialIdx,
  totalTrials,
  running,
  finished,
  waitingForClick,
  showReveal,
}: {
  trialIdx: number;
  totalTrials: number;
  running: boolean;
  finished: boolean;
  waitingForClick: boolean;
  showReveal: RevealInfo | null;
}) {
  let status = "พร้อมเริ่ม";
  if (running && waitingForClick) status = "ฟัง & คลิกตามทิศทาง";
  else if (running && !waitingForClick && !showReveal) status = "รอเสียง...";
  else if (showReveal) status = "เฉลย";
  else if (finished) status = "จบการทดสอบ";

  return (
    <div className="al-hud">
      <div className="al-hud-item">
        <span className="al-hud-label">รอบ</span>
        <span className="al-hud-value">
          {Math.min(trialIdx + (running ? 1 : 0), totalTrials)} / {totalTrials}
        </span>
      </div>
      <div className="al-hud-item">
        <span className="al-hud-label">สถานะ</span>
        <span className="al-hud-value">{status}</span>
      </div>
    </div>
  );
}

function StartOverlay({
  trials,
  successThresholdDeg,
  onStart,
}: {
  trials: number;
  successThresholdDeg: number;
  onStart: () => void;
}) {
  return (
    <div className="al-overlay">
      <h2>Auditory Localization & Reaction</h2>
      <p>
        สวมหูฟังเพื่อประสบการณ์ที่ดีที่สุด ฟังเสียง footstep / reload
        แล้วใช้เมาส์คลิกไปทิศทางที่ได้ยิน
      </p>
      <p className="al-hint">
        จำนวนรอบ: {trials} | เกณฑ์สำเร็จ: ภายใน {successThresholdDeg}°
      </p>
      <button className="al-btn" onClick={onStart}>
        เริ่มทดสอบ
      </button>
    </div>
  );
}

function ResultCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div>
      <div className="al-result-label">{label}</div>
      <div className={`al-result-value${small ? " al-small" : ""}`}>
        {value}
      </div>
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
  const raw = result.rawData as AuditoryRawData;
  return (
    <div className="al-overlay">
      <h2>ผลการทดสอบ</h2>
      <div className="al-result-grid">
        <ResultCard label="Score" value={result.score.toFixed(1)} />
        <ResultCard
          label="Avg Angle Error"
          value={`${raw.avgAngleErrorDeg.toFixed(1)}°`}
        />
        <ResultCard
          label="Audio Reaction"
          value={`${(result.reactionTimeMs ?? 0).toFixed(0)} ms`}
        />
        <ResultCard
          label="Success Overall"
          value={`${(result.accuracy ?? 0).toFixed(1)}%`}
        />
        <ResultCard
          label="Near / Mid / Far"
          small
          value={`${raw.successRateNear.toFixed(0)}% / ${raw.successRateMid.toFixed(0)}% / ${raw.successRateFar.toFixed(0)}%`}
        />
      </div>
      <button className="al-btn" onClick={onRestart}>
        ทดสอบอีกครั้ง
      </button>
    </div>
  );
}

function Markers({
  reveal,
  arenaRect,
}: {
  reveal: RevealInfo;
  arenaRect: DOMRect;
}) {
  const radius = Math.min(arenaRect.width, arenaRect.height) * 0.4;
  const truePt = angleToPoint(reveal.trueAngle, radius);
  const clickPt = angleToPoint(reveal.clickAngle, radius);
  return (
    <>
      <div
        className="al-marker al-marker-true"
        style={{
          left: `calc(50% + ${truePt.x}px)`,
          top: `calc(50% + ${truePt.y}px)`,
        }}
      >
        <span>เสียง</span>
      </div>
      <div
        className="al-marker al-marker-click"
        style={{
          left: `calc(50% + ${clickPt.x}px)`,
          top: `calc(50% + ${clickPt.y}px)`,
        }}
      >
        <span>คลิก</span>
      </div>
      <div className="al-error-badge">Error: {reveal.error.toFixed(1)}°</div>
    </>
  );
}

// ---------- main component ----------

export default function AuditoryLocalizationGame({
  playerId,
  sessionId,
  onGameComplete,
  trials = 10,
  successThresholdDeg = 25,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const game = useAuditoryGame(arenaRef, {
    trials,
    successThresholdDeg,
    playerId,
    sessionId,
    onGameComplete,
  });

  return (
    <div className="al-wrapper">
      <HUD
        trialIdx={game.trialIdx}
        totalTrials={trials}
        running={game.running}
        finished={game.finished}
        waitingForClick={game.waitingForClick}
        showReveal={game.showReveal}
      />

      <div
        ref={arenaRef}
        className={`al-arena ${game.waitingForClick ? "al-cursor-crosshair" : ""}`}
        onClick={game.handleClick}
      >
        {game.running && (
          <div className="al-center">
            <div className="al-center-dot" />
            <div className="al-center-ring" />
          </div>
        )}

        {game.showReveal && arenaRef.current && (
          <Markers
            reveal={game.showReveal}
            arenaRect={arenaRef.current.getBoundingClientRect()}
          />
        )}

        {!game.running && !game.finished && (
          <StartOverlay
            trials={trials}
            successThresholdDeg={successThresholdDeg}
            onStart={game.start}
          />
        )}

        {game.finished && game.lastResult && (
          <ResultOverlay result={game.lastResult} onRestart={game.start} />
        )}
      </div>
    </div>
  );
}
