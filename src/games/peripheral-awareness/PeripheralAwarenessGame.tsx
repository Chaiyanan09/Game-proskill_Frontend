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

// ---------- shared style snippets ----------

const btnPrimary =
  "px-7 py-3 bg-primary text-white rounded-[10px] text-base font-bold mt-2 transition-[background-color,transform] duration-150 hover:bg-primary-hover active:scale-[0.97]";

const overlay =
  "absolute inset-0 bg-bg-0/[0.92] flex flex-col items-center justify-center text-center p-10 gap-4";

// ตำแหน่งของ cue ตามมุมจอ — ใช้คลาสคงที่ (literal) เพื่อให้ Tailwind JIT จับได้
const cornerPos: Record<"TL" | "TR" | "BL" | "BR", string> = {
  TL: "top-[18px] left-[18px]",
  TR: "top-[18px] right-[18px]",
  BL: "bottom-[18px] left-[18px]",
  BR: "bottom-[18px] right-[18px]",
};

// ---------- sub-components ----------

function CornerCueView({ cue }: { cue: CornerCue }) {
  return (
    <div
      className={`absolute w-16 h-16 rounded-xl bg-primary/95 border-2 border-white flex items-center justify-center shadow-glow-primary animate-cue-in ${cornerPos[cue.corner]}`}
    >
      <span className="text-3xl font-extrabold text-white font-mono">
        {cue.symbol}
      </span>
    </div>
  );
}

function HUD({ timeLeft, cues }: { timeLeft: number; cues: CornerCue[] }) {
  const correctCount = cues.filter((c) => c.correct === true).length;
  return (
    <div className="flex gap-3 flex-wrap">
      <div className="bg-bg-1 border border-border rounded-[10px] px-4 py-[10px] flex flex-col gap-0.5 min-w-[110px]">
        <span className="text-[11px] text-text-2 uppercase tracking-wide">
          เวลา
        </span>
        <span className="text-lg font-bold font-mono">
          {timeLeft.toFixed(1)}s
        </span>
      </div>
      <div className="bg-bg-1 border border-border rounded-[10px] px-4 py-[10px] flex flex-col gap-0.5 min-w-[110px]">
        <span className="text-[11px] text-text-2 uppercase tracking-wide">
          สัญลักษณ์
        </span>
        <span className="text-lg font-bold font-mono">{cues.length}</span>
      </div>
      <div className="bg-bg-1 border border-border rounded-[10px] px-4 py-[10px] flex flex-col gap-0.5 min-w-[110px]">
        <span className="text-[11px] text-text-2 uppercase tracking-wide">
          ถูก
        </span>
        <span className="text-lg font-bold font-mono text-success">
          {correctCount}
        </span>
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
    <div className={overlay}>
      <h2 className="text-[28px] mb-2">Peripheral Awareness Test</h2>
      <p className="max-w-[560px] text-text-1 leading-[1.6]">
        ใช้เมาส์ประคองวงกลมตรงกลางจอ และกดปุ่มเลข <b>1 2 3 4</b>
        ให้ตรงกับสัญลักษณ์ที่โผล่ขึ้นมาตามมุมจอ
      </p>
      <p className="text-text-2 text-[13px]">
        ระยะเวลาทดสอบ: {durationSec} วินาที
      </p>
      <button className={btnPrimary} onClick={onStart}>
        เริ่มทดสอบ
      </button>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-2 border border-border rounded-[10px] p-[14px] text-center">
      <div className="text-xs text-text-2 uppercase tracking-wide mb-1.5">
        {label}
      </div>
      <div className="text-[22px] font-extrabold font-mono text-accent">
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
  const raw = result.rawData as PeripheralRawData;
  return (
    <div className={overlay}>
      <h2 className="text-[28px] mb-2">ผลการทดสอบ</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[14px] my-5 w-[min(560px,100%)]">
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
      <button className={btnPrimary} onClick={onRestart}>
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

  const flashClass =
    game.feedback === "correct"
      ? "shadow-[inset_0_0_60px_rgba(80,250,123,0.25)]"
      : game.feedback === "wrong"
      ? "shadow-[inset_0_0_60px_rgba(255,85,85,0.25)]"
      : "";

  return (
    <div className="flex flex-col gap-3">
      <HUD timeLeft={game.timeLeft} cues={game.cues} />

      <div
        ref={arenaRef}
        className={`relative w-full h-[60vh] min-h-[420px] sm:h-[70vh] sm:min-h-[500px] bg-arena-pa border border-border rounded-xl overflow-hidden cursor-crosshair transition-shadow duration-150 ${flashClass}`}
        onMouseMove={game.handleMouseMove}
      >
        {game.activeCues.map((cue) => (
          <CornerCueView key={cue.id} cue={cue} />
        ))}

        {game.running && (
          <div
            className="absolute top-0 left-0 w-7 h-7 border-2 border-accent rounded-full bg-accent/20 pointer-events-none shadow-glow-accent before:content-[''] before:absolute before:inset-[10px] before:bg-accent before:rounded-full"
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
