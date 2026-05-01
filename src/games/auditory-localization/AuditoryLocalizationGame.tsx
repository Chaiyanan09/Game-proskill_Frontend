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

// ---------- shared style snippets ----------

const btnPrimary =
  "px-7 py-3 bg-primary text-white rounded-[10px] text-base font-bold mt-2 transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.97]";

const overlay =
  "absolute inset-0 bg-[rgba(6,8,15,0.94)] flex flex-col items-center justify-center text-center p-10 gap-3.5";

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
    <div className="flex gap-3 flex-wrap">
      <div className="bg-bg-1 border border-border rounded-[10px] px-4 py-[10px] min-w-[130px] flex flex-col gap-0.5">
        <span className="text-[11px] text-text-2 uppercase tracking-wide">
          รอบ
        </span>
        <span className="text-base font-bold font-mono">
          {Math.min(trialIdx + (running ? 1 : 0), totalTrials)} / {totalTrials}
        </span>
      </div>
      <div className="bg-bg-1 border border-border rounded-[10px] px-4 py-[10px] min-w-[130px] flex flex-col gap-0.5">
        <span className="text-[11px] text-text-2 uppercase tracking-wide">
          สถานะ
        </span>
        <span className="text-base font-bold font-mono">{status}</span>
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
    <div className={overlay}>
      <h2 className="text-[28px]">Auditory Localization & Reaction</h2>
      <p className="max-w-[560px] text-text-1 leading-[1.6]">
        สวมหูฟังเพื่อประสบการณ์ที่ดีที่สุด ฟังเสียง footstep / reload
        แล้วใช้เมาส์คลิกไปทิศทางที่ได้ยิน
      </p>
      <p className="text-text-2 text-[13px]">
        จำนวนรอบ: {trials} | เกณฑ์สำเร็จ: ภายใน {successThresholdDeg}°
      </p>
      <button className={btnPrimary} onClick={onStart}>
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
    <div className="bg-bg-2 border border-border rounded-[10px] p-[14px] text-center">
      <div className="text-xs text-text-2 uppercase tracking-wide mb-1.5">
        {label}
      </div>
      <div
        className={`${small ? "text-base" : "text-[22px]"} font-extrabold font-mono text-accent`}
      >
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
    <div className={overlay}>
      <h2 className="text-[28px]">ผลการทดสอบ</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[14px] my-5 w-[min(560px,100%)]">
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
      <button className={btnPrimary} onClick={onRestart}>
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
        className="absolute w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-marker-in bg-success shadow-glow-success text-[#04220c]"
        style={{
          left: `calc(50% + ${truePt.x}px)`,
          top: `calc(50% + ${truePt.y}px)`,
        }}
      >
        <span>เสียง</span>
      </div>
      <div
        className="absolute w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-marker-in bg-warn shadow-glow-warn text-[#2c2a04]"
        style={{
          left: `calc(50% + ${clickPt.x}px)`,
          top: `calc(50% + ${clickPt.y}px)`,
        }}
      >
        <span>คลิก</span>
      </div>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary/95 text-white px-[18px] py-2 rounded-full font-bold font-mono text-sm shadow-elevated">
        Error: {reveal.error.toFixed(1)}°
      </div>
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
    <div className="flex flex-col gap-3">
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
        className={`relative w-full h-[60vh] min-h-[420px] sm:h-[70vh] sm:min-h-[500px] bg-arena-al border border-border rounded-xl overflow-hidden ${
          game.waitingForClick ? "cursor-crosshair" : "cursor-default"
        }`}
        onClick={game.handleClick}
      >
        {game.running && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-[14px] h-[14px] rounded-full bg-accent shadow-[0_0_18px_rgba(139,233,253,0.7)]" />
            <div className="absolute top-1/2 left-1/2 w-[30vmin] h-[30vmin] rounded-full border border-dashed border-accent/20 -translate-x-1/2 -translate-y-1/2" />
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
