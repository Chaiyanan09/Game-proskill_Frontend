import { useEffect, useRef, useState } from "react";

import { GameProps, GameResult } from "@/shared/types";
import { useAuditoryGame } from "./logic";
import { AuditoryRawData, RevealInfo } from "./types";

interface Props extends GameProps {
  /** จำนวนรอบทดสอบ - default 10 */
  trials?: number;

  /** ถือว่าสำเร็จเมื่อ error น้อยกว่าหรือเท่ากับค่านี้ - default 25 องศา */
  successThresholdDeg?: number;

  /** เวลากดตอบต่อรอบ ถ้าไม่กดถือว่า miss - default 3000ms */
  responseTimeoutMs?: number;
}

const btnPrimary =
  "rounded-2xl bg-primary px-7 py-3 text-base font-extrabold text-white shadow-glow-primary transition duration-200 hover:-translate-y-0.5 hover:bg-primary-hover active:translate-y-0";
const btnGhost =
  "rounded-2xl border border-border bg-bg-1/80 px-5 py-3 text-sm font-bold text-text-1 transition hover:-translate-y-0.5 hover:border-primary/70 hover:text-text-0";
const overlay =
  "absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-bg-0/86 p-8 text-center backdrop-blur-md";

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
    <div className="hud-card min-w-[132px] rounded-2xl px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-2">
        {label}
      </div>
      <div className={`mt-1 font-mono text-2xl font-black ${valueClass}`}>{value}</div>
    </div>
  );
}

function HUD({
  trialIdx,
  trialCount,
  waitingForClick,
  audioReady,
}: {
  trialIdx: number;
  trialCount: number;
  waitingForClick: boolean;
  audioReady: boolean;
}) {
  const displayRound = Math.min(trialIdx + 1, trialCount);
  const progress = Math.max(0, Math.min(100, (trialIdx / trialCount) * 100));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <StatPill label="รอบ" value={`${displayRound}/${trialCount}`} />
        <StatPill label="สถานะ" value={waitingForClick ? "CLICK" : "LISTEN"} tone={waitingForClick ? "good" : "normal"} />
        <StatPill label="Audio" value={audioReady ? "READY" : "LOCKED"} tone={audioReady ? "good" : "warn"} />
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-border bg-bg-1 shadow-[inset_0_0_16px_rgba(0,0,0,0.45)]">
        <div
          className="shimmer-line h-full rounded-full bg-gradient-to-r from-primary via-accent to-success transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function DirectionLine({
  angle,
  className,
  label,
}: {
  angle: number;
  className: string;
  label?: string;
}) {
  return (
    <div
      className={`absolute left-1/2 top-1/2 h-[4px] w-[42%] origin-left rounded-full ${className}`}
      style={{ transform: `rotate(${angle}deg)` }}
    >
      {label && (
        <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full rounded-full bg-bg-0/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]">
          {label}
        </span>
      )}
    </div>
  );
}

function SoundBars({ active }: { active: boolean }) {
  return (
    <div className="flex h-12 items-center justify-center gap-1.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={`w-2 rounded-full bg-accent shadow-glow-accent ${active ? "sound-wave" : "h-3 opacity-40"}`}
          style={{ animationDelay: `${index * 0.08}s` }}
        />
      ))}
    </div>
  );
}

function Radar({
  reveal,
  waitingForClick,
  message,
}: {
  reveal: RevealInfo | null;
  waitingForClick: boolean;
  message: string;
}) {
  const statusText = reveal
    ? reveal.timedOut
      ? "TIMEOUT"
      : reveal.success
        ? "LOCKED"
        : "MISS ANGLE"
    : waitingForClick
      ? "CLICK DIRECTION"
      : "LISTEN";

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative aspect-square w-[min(75vh,84vw)] rounded-full border border-accent/25 bg-bg-0/25 shadow-[inset_0_0_90px_rgba(91,141,239,0.14)]">
        <div className="radar-sweep opacity-80" />
        <div className="absolute inset-[10%] rounded-full border border-accent/12" />
        <div className="absolute inset-[22%] rounded-full border border-accent/14" />
        <div className="absolute inset-[34%] rounded-full border border-accent/16" />
        <div className="absolute inset-[46%] rounded-full border border-accent/20" />
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-accent/12" />
        <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-accent/12" />
        <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-accent/20 shadow-glow-accent" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15 target-orbit" />

        {waitingForClick && (
          <div className="absolute inset-[32%] animate-pulse rounded-full border-2 border-primary/50 shadow-glow-primary" />
        )}

        {reveal && (
          <>
            <DirectionLine angle={reveal.trueAngle} className="bg-success text-success shadow-glow-success" label="true" />
            {reveal.clickAngle !== null && (
              <DirectionLine angle={reveal.clickAngle} className="bg-danger text-danger shadow-[0_0_18px_rgba(255,85,85,0.55)]" label="click" />
            )}
          </>
        )}

        <div className="absolute inset-x-8 top-10 text-center">
          <div className="mx-auto inline-flex rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
            {statusText}
          </div>
        </div>

        <div className="absolute inset-x-8 bottom-10 text-center">
          <SoundBars active={waitingForClick} />
          <div className="mt-2 text-sm font-bold text-text-1">{message}</div>
          {reveal?.error !== null && reveal?.error !== undefined && (
            <div className="mt-1 font-mono text-xs text-text-2">
              angle error: {reveal.error.toFixed(1)}°
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className={overlay}>
      <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">
        เตรียมฟังเสียง
      </div>
      <div key={value} className="countdown-pop font-mono text-[clamp(84px,14vw,180px)] font-black text-accent drop-shadow-[0_0_35px_rgba(139,233,253,0.55)]">
        {value}
      </div>
      <p className="text-sm font-bold uppercase tracking-[0.26em] text-text-2">
        wear headphones • locate sound direction
      </p>
    </div>
  );
}

function StartOverlay({
  trials,
  threshold,
  responseTimeoutMs,
  onStart,
  onTestLeft,
  onTestRight,
}: {
  trials: number;
  threshold: number;
  responseTimeoutMs: number;
  onStart: () => void;
  onTestLeft: () => void;
  onTestRight: () => void;
}) {
  return (
    <div className={overlay}>
      <div className="float-soft absolute left-[12%] top-[18%] h-28 w-28 rounded-full bg-primary/15 blur-3xl" />
      <div className="float-soft absolute bottom-[16%] right-[14%] h-32 w-32 rounded-full bg-accent/15 blur-3xl [animation-delay:1.2s]" />
      <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">
        Test 02 • 3D Audio Reaction
      </div>
      <h2 className="max-w-[820px] bg-title-gradient bg-clip-text text-[clamp(34px,5vw,64px)] font-black leading-tight text-transparent">
        Auditory Localization & Reaction
      </h2>
      <p className="max-w-[720px] text-base leading-7 text-text-1">
        ใส่หูฟัง ฟังเสียง 3D แล้วคลิกทิศทางที่ได้ยินให้ไวที่สุด ระบบจะเฉลยเส้นสีเขียว
        เป็นทิศจริง และเส้นสีแดงเป็นตำแหน่งที่คลิก
      </p>
      <div className="grid w-[min(800px,100%)] grid-cols-1 gap-3 text-left text-sm text-text-1 sm:grid-cols-3">
        <div className="pro-card rounded-2xl bg-bg-1/80 p-4">
          <b className="text-text-0">Trials</b>
          <p className="mt-1">ทั้งหมด {trials} รอบ</p>
        </div>
        <div className="pro-card rounded-2xl bg-bg-1/80 p-4">
          <b className="text-text-0">Success</b>
          <p className="mt-1">คลาดเคลื่อนไม่เกิน {threshold}°</p>
        </div>
        <div className="pro-card rounded-2xl bg-bg-1/80 p-4">
          <b className="text-text-0">Timeout</b>
          <p className="mt-1">{(responseTimeoutMs / 1000).toFixed(1)} วินาที/รอบ</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button className={btnGhost} onClick={onTestLeft}>
          ← ทดสอบเสียงซ้าย
        </button>
        <button className={btnGhost} onClick={onTestRight}>
          ทดสอบเสียงขวา →
        </button>
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
  const raw = result.rawData as AuditoryRawData;

  return (
    <div className={`${overlay} result-enter`}>
      <div className="rounded-full border border-success/30 bg-success/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-success">
        completed • schema {result.schemaVersion}
      </div>
      <h2 className="text-[clamp(32px,4vw,54px)] font-black">ผลการทดสอบเสียง</h2>
      <div className="grid w-[min(960px,100%)] grid-cols-2 gap-3 md:grid-cols-6">
        <ResultCard label="Score" value={result.score.toFixed(1)} />
        <ResultCard label="Accuracy" value={`${(result.accuracy ?? 0).toFixed(1)}%`} />
        <ResultCard label="Wrong" value={`${raw.wrongCount}`} />
        <ResultCard label="Timeout" value={`${raw.missedCount}`} />
        <ResultCard label="Avg Error" value={`${raw.avgAngleErrorDeg.toFixed(1)}°`} />
        <ResultCard label="Reaction" value={`${(result.reactionTimeMs ?? 0).toFixed(0)}ms`} />
      </div>
      <p className="max-w-[760px] text-sm leading-6 text-text-2">
        เส้นสีเขียวคือทิศเสียงจริง เส้นสีแดงคือทิศที่ผู้เล่นคลิก ถ้าคลิกผิดจะนับเป็น Wrong
        ส่วน Timeout คือไม่ได้คลิกภายในเวลาที่กำหนด
      </p>
      <button className={btnPrimary} onClick={onRestart}>
        ทดสอบอีกครั้ง
      </button>
    </div>
  );
}

export default function AuditoryLocalizationGame({
  playerId,
  sessionId,
  onGameComplete,
  trials = 10,
  successThresholdDeg = 25,
  responseTimeoutMs = 3000,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const game = useAuditoryGame(arenaRef, {
    trials,
    successThresholdDeg,
    responseTimeoutMs,
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

  const revealClass = game.showReveal
    ? game.showReveal.success
      ? "shadow-[inset_0_0_120px_rgba(80,250,123,0.2)]"
      : "shadow-[inset_0_0_120px_rgba(255,85,85,0.2)]"
    : "";

  return (
    <div className="flex flex-col gap-4">
      <HUD
        trialIdx={game.trialIdx}
        trialCount={game.trialCount}
        waitingForClick={game.waitingForClick}
        audioReady={game.audioReady}
      />

      <div
        ref={arenaRef}
        className={`arena-scanline arena-vignette relative h-[62vh] min-h-[460px] w-full cursor-crosshair overflow-hidden rounded-[32px] border border-border bg-arena-al shadow-elevated transition-shadow duration-150 sm:h-[70vh] ${revealClass}`}
        onClick={game.handleArenaClick}
      >
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,233,253,0.13),transparent_32%),linear-gradient(rgba(139,233,253,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,233,253,0.05)_1px,transparent_1px)] bg-[size:100%_100%,48px_48px,48px_48px]" />
        <Radar
          reveal={game.showReveal}
          waitingForClick={game.waitingForClick}
          message={game.message}
        />

        {game.running && game.waitingForClick && (
          <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-primary shadow-glow-primary">
            click direction
          </div>
        )}

        {!game.running && !game.finished && countdown === null && (
          <StartOverlay
            trials={trials}
            threshold={successThresholdDeg}
            responseTimeoutMs={responseTimeoutMs}
            onStart={handleStart}
            onTestLeft={() => game.testSound("left")}
            onTestRight={() => game.testSound("right")}
          />
        )}

        {countdown !== null && <CountdownOverlay value={Math.max(1, countdown)} />}

        {game.finished && game.lastResult && (
          <ResultOverlay result={game.lastResult} onRestart={handleStart} />
        )}
      </div>
    </div>
  );
}
