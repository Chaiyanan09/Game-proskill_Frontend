import { useEffect, useRef, useState } from "react";

import { GameProps, GameResult } from "@/shared/types";
import { usePeripheralGame } from "./logic";
import { CornerCue, PeripheralRawData } from "./types";

interface Props extends GameProps {
  /** ระยะเวลาทดสอบ (วินาที) - default 60 */
  durationSec?: number;

  /** ระยะเวลาที่สัญลักษณ์โผล่ (ms) - default 700 */
  cueLifeMs?: number;

  /** ช่วงห่างระหว่าง cue (ms min, max) - default [900, 2100] */
  cueIntervalMs?: [number, number];
}

const DEFAULT_CUE_INTERVAL_MS: [number, number] = [900, 2100];

const btnPrimary =
  "rounded-2xl bg-primary px-7 py-3 text-base font-extrabold text-white shadow-glow-primary transition duration-200 hover:-translate-y-0.5 hover:bg-primary-hover active:translate-y-0";

const overlay =
  "absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-bg-0/86 p-8 text-center backdrop-blur-md";

const cornerPos: Record<"TL" | "TR" | "BL" | "BR", string> = {
  TL: "top-6 left-6",
  TR: "top-6 right-6",
  BL: "bottom-6 left-6",
  BR: "bottom-6 right-6",
};

const cornerLabel: Record<"TL" | "TR" | "BL" | "BR", string> = {
  TL: "TOP LEFT",
  TR: "TOP RIGHT",
  BL: "BOTTOM LEFT",
  BR: "BOTTOM RIGHT",
};

function CornerGuide() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {(["TL", "TR", "BL", "BR"] as const).map((corner) => (
        <div
          key={corner}
          className={`absolute rounded-full border border-accent/10 bg-accent/5 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-accent/45 ${cornerPos[corner]}`}
        >
          {cornerLabel[corner]}
        </div>
      ))}
    </div>
  );
}

function CornerCueView({ cue }: { cue: CornerCue }) {
  return (
    <div
      className={`cue-pop absolute z-20 flex h-24 w-24 items-center justify-center rounded-[28px] border-2 border-white/80 bg-gradient-to-br from-primary via-primary to-accent shadow-glow-primary ${cornerPos[cue.corner]}`}
    >
      <div className="absolute -inset-3 rounded-[32px] border border-accent/25" />
      <div className="absolute inset-2 rounded-[22px] border border-white/20" />
      <span className="relative font-mono text-5xl font-black text-white drop-shadow-lg">
        {cue.symbol}
      </span>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "good" | "warn";
}) {
  const valueClass =
    tone === "good" ? "text-success" : tone === "warn" ? "text-danger" : "text-accent";

  return (
    <div className="hud-card min-w-[128px] rounded-2xl px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-2">
        {label}
      </div>
      <div className={`mt-1 font-mono text-2xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}

function HUD({
  timeLeft,
  durationSec,
  cues,
  falsePressCount,
}: {
  timeLeft: number;
  durationSec: number;
  cues: CornerCue[];
  falsePressCount: number;
}) {
  const correctCount = cues.filter((cue) => cue.correct === true).length;
  const progress = Math.max(0, Math.min(100, (timeLeft / durationSec) * 100));
  const activeCount = cues.filter((cue) => cue.resolved === false).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <StatPill label="เวลา" value={`${timeLeft.toFixed(1)}s`} />
        <StatPill label="cue ทั้งหมด" value={`${cues.length}`} />
        <StatPill label="ตอบถูก" value={`${correctCount}`} tone="good" />
        <StatPill label="active cue" value={`${activeCount}`} />
        <StatPill label="กดก่อน cue" value={`${falsePressCount}`} tone={falsePressCount > 0 ? "warn" : "normal"} />
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-border bg-bg-1 shadow-[inset_0_0_16px_rgba(0,0,0,0.45)]">
        <div
          className="shimmer-line h-full rounded-full bg-gradient-to-r from-primary via-accent to-success transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className={overlay}>
      <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">
        เตรียมพร้อม
      </div>
      <div key={value} className="countdown-pop font-mono text-[clamp(84px,14vw,180px)] font-black text-accent drop-shadow-[0_0_35px_rgba(139,233,253,0.55)]">
        {value}
      </div>
      <p className="text-sm font-bold uppercase tracking-[0.26em] text-text-2">
        keep cursor on target • read corners
      </p>
    </div>
  );
}

function StartOverlay({
  durationSec,
  cueLifeMs,
  onStart,
}: {
  durationSec: number;
  cueLifeMs: number;
  onStart: () => void;
}) {
  return (
    <div className={overlay}>
      <div className="float-soft absolute left-[12%] top-[18%] h-28 w-28 rounded-full bg-primary/15 blur-3xl" />
      <div className="float-soft absolute bottom-[16%] right-[14%] h-32 w-32 rounded-full bg-accent/15 blur-3xl [animation-delay:1.2s]" />
      <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">
        Test 01 • Focus + Peripheral Vision
      </div>
      <h2 className="max-w-[820px] bg-title-gradient bg-clip-text text-[clamp(34px,5vw,64px)] font-black leading-tight text-transparent">
        Peripheral Awareness Test
      </h2>
      <p className="max-w-[700px] text-base leading-7 text-text-1">
        ประคอง crosshair ให้อยู่ใกล้เป้าหมายกลางจอ พร้อมกดเลข <b>1 2 3 4</b>{" "}
        ให้ตรงกับ cue ที่โผล่ตามมุมจอ ยิ่งตอบเร็วและกดมั่วน้อย คะแนนยิ่งสูง
      </p>
      <div className="grid w-[min(760px,100%)] grid-cols-1 gap-3 text-left text-sm text-text-1 sm:grid-cols-3">
        <div className="pro-card rounded-2xl bg-bg-1/80 p-4">
          <b className="text-text-0">Tracking</b>
          <p className="mt-1">เคลื่อนเมาส์ตามเป้าหมายที่ drift ตลอดเวลา</p>
        </div>
        <div className="pro-card rounded-2xl bg-bg-1/80 p-4">
          <b className="text-text-0">Cue Life</b>
          <p className="mt-1">cue อยู่บนจอเพียง {(cueLifeMs / 1000).toFixed(1)} วิ</p>
        </div>
        <div className="pro-card rounded-2xl bg-bg-1/80 p-4">
          <b className="text-text-0">Duration</b>
          <p className="mt-1">ทดสอบทั้งหมด {durationSec} วินาที</p>
        </div>
      </div>
      <button className={btnPrimary} onClick={onStart}>
        เริ่มทดสอบ →
      </button>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-rise rounded-2xl border border-border bg-bg-2/85 p-4 text-center shadow-elevated">
      <div className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-text-2">
        {label}
      </div>
      <div className="font-mono text-2xl font-black text-accent">{value}</div>
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
    <div className={`${overlay} result-enter`}>
      <div className="rounded-full border border-success/30 bg-success/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-success">
        completed • schema {result.schemaVersion}
      </div>
      <h2 className="text-[clamp(32px,4vw,54px)] font-black">ผลการทดสอบ</h2>
      <div className="grid w-[min(920px,100%)] grid-cols-2 gap-3 md:grid-cols-5">
        <ResultCard label="Score" value={result.score.toFixed(1)} />
        <ResultCard label="Accuracy" value={`${(result.accuracy ?? 0).toFixed(1)}%`} />
        <ResultCard label="Correct" value={`${raw.correctCount}/${raw.totalCues}`} />
        <ResultCard label="Detection" value={`${(result.reactionTimeMs ?? 0).toFixed(0)}ms`} />
        <ResultCard label="False Press" value={`${raw.falsePressCount}`} />
      </div>
      <div className="grid w-[min(760px,100%)] grid-cols-1 gap-3 text-sm text-text-1 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-bg-1/70 p-4">
          <b className="text-text-0">Deviation</b>
          <p className="mt-1 font-mono text-accent">{raw.avgTrackingDeviationPx.toFixed(1)}px</p>
        </div>
        <div className="rounded-2xl border border-border bg-bg-1/70 p-4">
          <b className="text-text-0">Wrong</b>
          <p className="mt-1 font-mono text-danger">{raw.wrongCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-bg-1/70 p-4">
          <b className="text-text-0">Missed</b>
          <p className="mt-1 font-mono text-text-1">{raw.missedCount}</p>
        </div>
      </div>
      <p className="max-w-[720px] text-sm leading-6 text-text-2">
        ผลลัพธ์ส่งกลับผ่าน <code>onGameComplete(result)</code> พร้อม rawData ราย cue
        สำหรับบันทึกลง database หรือวิเคราะห์ต่อ
      </p>
      <button className={btnPrimary} onClick={onRestart}>
        ทดสอบอีกครั้ง
      </button>
    </div>
  );
}

export default function PeripheralAwarenessGame({
  playerId,
  sessionId,
  onGameComplete,
  durationSec = 60,
  cueLifeMs = 700,
  cueIntervalMs = DEFAULT_CUE_INTERVAL_MS,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const game = usePeripheralGame(arenaRef, {
    durationSec,
    cueLifeMs,
    cueIntervalMs,
    playerId,
    sessionId,
    onGameComplete,
  });

  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      setCountdown(null);
      game.start();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCountdown((value) => (value === null ? null : value - 1));
    }, 720);

    return () => window.clearTimeout(timeoutId);
  }, [countdown, game.start]);

  const handleStart = () => {
    if (countdown === null && !game.running) {
      setCountdown(3);
    }
  };

  const flashClass =
    game.feedback === "correct"
      ? "shadow-[inset_0_0_110px_rgba(80,250,123,0.22)]"
      : game.feedback === "wrong"
        ? "shadow-[inset_0_0_110px_rgba(255,85,85,0.22)]"
        : "";

  return (
    <div className="flex flex-col gap-4">
      <HUD
        timeLeft={game.timeLeft}
        durationSec={durationSec}
        cues={game.cues}
        falsePressCount={game.falsePressCount}
      />

      <div
        ref={arenaRef}
        className={`arena-scanline arena-vignette relative h-[62vh] min-h-[460px] w-full cursor-crosshair overflow-hidden rounded-[32px] border border-border bg-arena-pa shadow-elevated transition-shadow duration-150 sm:h-[70vh] ${flashClass}`}
        onMouseMove={game.handleMouseMove}
      >
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-35" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(139,233,253,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(139,233,253,0.065)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="pointer-events-none absolute inset-10 rounded-[26px] border border-primary/10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-24 -translate-x-1/2 -translate-y-1/2 bg-accent/10" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-accent/10" />
        <CornerGuide />

        {game.activeCues.map((cue) => (
          <CornerCueView key={cue.id} cue={cue} />
        ))}

        {game.running && (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-11 w-11 rounded-full border-2 border-accent bg-accent/20 shadow-glow-accent before:absolute before:inset-[14px] before:rounded-full before:bg-accent before:content-[''] after:absolute after:-inset-4 after:rounded-full after:border after:border-accent/40 after:content-['']"
            style={{
              transform: `translate(${game.targetPos.x}px, ${game.targetPos.y}px) translate(-50%, -50%)`,
            }}
          >
            <div className="target-orbit absolute -inset-8 rounded-full border border-primary/15" />
          </div>
        )}

        {game.running && game.feedback && (
          <div className={`pointer-events-none absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-full border px-5 py-2 text-sm font-black uppercase tracking-[0.2em] ${game.feedback === "correct" ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"}`}>
            {game.feedback === "correct" ? "clean hit" : "wrong input"}
          </div>
        )}

        {!game.running && !game.finished && countdown === null && (
          <StartOverlay durationSec={durationSec} cueLifeMs={cueLifeMs} onStart={handleStart} />
        )}

        {countdown !== null && <CountdownOverlay value={Math.max(1, countdown)} />}

        {game.finished && game.lastResult && (
          <ResultOverlay result={game.lastResult} onRestart={handleStart} />
        )}
      </div>
    </div>
  );
}
