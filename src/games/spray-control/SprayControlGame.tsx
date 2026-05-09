import { useMemo, useRef } from "react";
import type { GameProps } from "../../shared/types";
import { useSprayControlGame } from "./logic";

interface Props extends GameProps {
  magazineSize?: number;
  targetRadiusPx?: number;
}

function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_0_28px_rgba(15,23,42,0.4)] backdrop-blur">
      <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-orange-300/10 blur-2xl" />
      <div className="relative">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-200/70">{label}</div>
        <div className={`mt-1 font-mono text-2xl font-black ${accent ?? "text-white"}`}>{value}</div>
        {hint ? <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{hint}</div> : null}
      </div>
    </div>
  );
}

function gradeFromScore(score: number): { letter: string; color: string; ring: string } {
  if (score >= 90) return { letter: "S", color: "text-amber-200", ring: "border-amber-300/60 shadow-[0_0_45px_rgba(251,191,36,0.55)]" };
  if (score >= 80) return { letter: "A", color: "text-emerald-200", ring: "border-emerald-300/60 shadow-[0_0_45px_rgba(52,211,153,0.5)]" };
  if (score >= 65) return { letter: "B", color: "text-cyan-200", ring: "border-cyan-300/60 shadow-[0_0_40px_rgba(34,211,238,0.45)]" };
  if (score >= 50) return { letter: "C", color: "text-violet-200", ring: "border-violet-300/60 shadow-[0_0_40px_rgba(167,139,250,0.45)]" };
  return { letter: "D", color: "text-rose-200", ring: "border-rose-300/60 shadow-[0_0_40px_rgba(251,113,133,0.45)]" };
}

function AmmoStrip({ used, total }: { used: number; total: number }) {
  const remaining = Math.max(0, total - used);
  const cells = Math.min(total, 30);
  const usedCells = Math.min(cells, Math.round((used / total) * cells));

  return (
    <div className="flex items-center gap-3">
      <div className="font-mono text-2xl font-black text-orange-100">
        <span className="drop-shadow-[0_0_10px_rgba(251,146,60,0.7)]">{remaining}</span>
        <span className="ml-1 text-sm text-slate-500">/{total}</span>
      </div>
      <div className="flex h-6 items-end gap-[3px]">
        {Array.from({ length: cells }).map((_, idx) => {
          const isUsed = idx < usedCells;
          return (
            <span
              key={idx}
              className={`h-full w-1 rounded-sm transition ${
                isUsed
                  ? "bg-slate-700/70"
                  : "bg-gradient-to-t from-orange-400 to-orange-200 shadow-[0_0_6px_rgba(251,146,60,0.7)]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SprayControlGame({
  playerId: _playerId,
  sessionId,
  onGameComplete,
  magazineSize = 30,
  targetRadiusPx = 58,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const game = useSprayControlGame(arenaRef, {
    playerId: _playerId,
    sessionId,
    onGameComplete,
    magazineSize,
    targetRadiusPx,
  });

  const resultRaw = game.result?.rawData as
    | {
        hitRatePct?: number;
        perfectRatePct?: number;
        avgShotErrorPx?: number;
        maxShotErrorPx?: number;
        groupingRadiusPx?: number;
        verticalControlScore?: number;
        horizontalControlScore?: number;
        sprayControlScore?: number;
        timeToFirstShotMs?: number | null;
        hitCount?: number;
        totalShots?: number;
      }
    | undefined;

  const statusLabel = useMemo(() => {
    if (game.phase === "idle") return "STANDBY";
    if (game.phase === "countdown") return "LOAD MAG";
    if (game.phase === "ready") return "HOLD FIRE";
    if (game.phase === "spraying") return "FIRING";
    return "MATCH ENDED";
  }, [game.phase]);

  const statusDot =
    game.phase === "spraying"
      ? "bg-rose-300 animate-pulse shadow-[0_0_10px_rgba(251,113,133,0.85)]"
      : game.phase === "ready"
        ? "bg-amber-300 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.85)]"
        : game.phase === "countdown"
          ? "bg-cyan-300 animate-pulse shadow-[0_0_10px_rgba(103,232,249,0.85)]"
          : "bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.85)]";

  const lastShotState = game.lastShot?.perfect ? "PERFECT" : game.lastShot?.hit ? "HIT" : game.lastShot ? "MISS" : "—";
  const lastShotColor = game.lastShot?.perfect
    ? "text-emerald-200 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
    : game.lastShot?.hit
      ? "text-cyan-200 drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]"
      : game.lastShot
        ? "text-rose-200 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]"
        : "text-slate-400";

  const grade = game.result ? gradeFromScore(game.result.score) : null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-orange-300/25 bg-slate-950 p-5 text-white shadow-[0_0_70px_rgba(251,146,60,0.18)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(251,146,60,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(2,6,23,0.96))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute left-4 top-4 h-12 w-12 rounded-tl-2xl border-l border-t border-orange-300/40" />
      <div className="pointer-events-none absolute right-4 top-4 h-12 w-12 rounded-tr-2xl border-r border-t border-orange-300/40" />
      <div className="pointer-events-none absolute bottom-4 left-4 h-12 w-12 rounded-bl-2xl border-b border-l border-orange-300/40" />
      <div className="pointer-events-none absolute bottom-4 right-4 h-12 w-12 rounded-br-2xl border-b border-r border-orange-300/40" />

      <div className="relative z-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-orange-100">
                <span className={`h-2 w-2 rounded-full ${statusDot}`} />
                {statusLabel}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                MODULE PS-01
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                LOADOUT • 5.56 RIFLE
              </div>
            </div>
            <h2 className="mt-3 bg-gradient-to-r from-orange-200 via-white to-rose-200 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
              SPRAY CONTROL TEST
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              ฝึกคุมเมาส์ตอนสเปรย์ ยิงค้างหนึ่งแม็กแล้วลากเมาส์สวน recoil ให้กระสุนเกาะวงเป้า เหมือนการคุมสเปรย์ในเกม FPS แนวการแข่งขัน
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <StatCard label="Hits" value={`${game.hitCount}`} accent="text-cyan-200" />
            <StatCard label="Perfect" value={`${game.perfectCount}`} accent="text-emerald-200" />
            <StatCard label="Avg Err" value={`${Math.round(game.avgErrorPx)}px`} accent="text-orange-200" />
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-300 shadow-[0_0_6px_rgba(251,146,60,0.7)]" />
            AMMO
          </div>
          <AmmoStrip used={game.currentShot} total={magazineSize} />
        </div>

        <div className="mb-4 h-2.5 overflow-hidden rounded-full border border-white/10 bg-slate-900/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-300 via-rose-300 to-cyan-300 shadow-[0_0_18px_rgba(251,146,60,0.55)] transition-[width] duration-150"
            style={{ width: `${game.progressPct}%` }}
          />
        </div>

        <div
          ref={arenaRef}
          onPointerMove={game.handlePointerMove}
          onPointerDown={game.handlePointerDown}
          onPointerUp={game.handlePointerUp}
          onPointerCancel={game.handlePointerUp}
          className="relative h-[560px] cursor-none select-none overflow-hidden rounded-[1.7rem] border border-orange-100/15 bg-[radial-gradient(circle_at_center,rgba(30,41,59,0.28),rgba(2,6,23,0.98)),linear-gradient(135deg,rgba(251,146,60,0.12),rgba(14,165,233,0.08))] shadow-inner"
        >
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(251,191,36,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,.16)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-orange-200/10" />
          <div className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-orange-200/10" />
          <div className="pointer-events-none absolute left-3 top-3 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-orange-300/60" />
          <div className="pointer-events-none absolute right-3 top-3 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-orange-300/60" />
          <div className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-orange-300/60" />
          <div className="pointer-events-none absolute bottom-3 right-3 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-orange-300/60" />
          <div className="pointer-events-none absolute right-5 top-5 z-10 flex flex-col items-end gap-1">
            <span className="rounded-md border border-orange-200/30 bg-slate-950/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-orange-200/80 backdrop-blur">
              RANGE • TRAINING
            </span>
            <span className="rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-mono font-black text-slate-300 backdrop-blur">
              FOV 90°
            </span>
          </div>

          {game.phase === "idle" ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/72 backdrop-blur-sm">
              <div className="relative max-w-xl rounded-[2rem] border border-orange-200/25 bg-slate-950/90 p-8 text-center shadow-[0_0_70px_rgba(251,146,60,0.22)]">
                <div className="pointer-events-none absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-orange-300/60 to-transparent" />
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-orange-300/30 bg-orange-300/10 shadow-[0_0_45px_rgba(251,146,60,0.28)]">
                  <div className="relative h-12 w-12">
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-orange-100" />
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-orange-100" />
                    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-100" />
                    <div className="absolute -inset-2 animate-ping rounded-full border border-orange-300/40" />
                  </div>
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.32em] text-orange-200/80">Briefing</div>
                <h3 className="mt-2 text-2xl font-black text-white">เตรียมพร้อม • พรีเคลื่อนไหว</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  หลังนับถอยหลัง ให้วางเมาส์ที่เป้าแล้ว <b className="text-orange-200">กดคลิกซ้ายค้าง</b> กระสุนจะดีดขึ้นและแกว่งซ้าย/ขวา ลากเมาส์สวน recoil ให้กลุ่มกระสุนเกาะวงเป้า
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2 text-left">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Mag</div>
                    <div className="font-mono text-base font-black text-orange-200">{magazineSize}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Fire</div>
                    <div className="font-mono text-base font-black text-orange-200">FULL AUTO</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Target</div>
                    <div className="font-mono text-base font-black text-orange-200">{targetRadiusPx}px</div>
                  </div>
                </div>
                <button
                  onClick={game.start}
                  className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-300 to-rose-300 px-7 py-3 text-base font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_35px_rgba(251,146,60,0.4)] transition hover:scale-[1.03]"
                >
                  ENGAGE TARGET <span>→</span>
                </button>
              </div>
            </div>
          ) : null}

          {game.phase === "countdown" ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/72 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-3 inline-flex rounded-full border border-orange-300/30 bg-orange-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] text-orange-200">
                  LOAD MAG
                </div>
                <div className="font-mono text-[9rem] font-black leading-none text-orange-100 drop-shadow-[0_0_50px_rgba(251,146,60,0.85)] animate-pulse">
                  {game.countdown}
                </div>
                <div className="mt-3 text-sm font-black uppercase tracking-[0.34em] text-orange-200/80">Ready to Spray</div>
              </div>
            </div>
          ) : null}

          {game.phase === "ready" ? (
            <div className="pointer-events-none absolute inset-x-0 top-7 z-20 flex justify-center">
              <div className="rounded-2xl border border-orange-200/30 bg-slate-950/80 px-5 py-3 text-center shadow-[0_0_30px_rgba(251,146,60,0.25)] backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.32em] text-orange-200/80">INSTRUCTION</div>
                <div className="mt-1 text-lg font-black text-white">
                  กด <span className="rounded-md border border-orange-300/40 bg-orange-300/10 px-2 py-0.5 font-mono text-orange-200">L-CLICK</span> ค้างเพื่อยิง 1 แม็ก
                </div>
                <div className="mt-1 text-xs text-slate-400">เริ่มภายใน {Math.ceil(game.readyTimeLeftMs / 1000)}s</div>
              </div>
            </div>
          ) : null}

          {game.phase === "finished" && game.result ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/82 p-6 backdrop-blur-md">
              <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-orange-200/25 bg-slate-950/95 p-7 shadow-[0_0_80px_rgba(251,146,60,0.28)]">
                <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-orange-400/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 -bottom-24 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />

                <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      MATCH COMPLETE
                    </div>
                    <h3 className="mt-3 bg-gradient-to-r from-orange-200 via-white to-rose-200 bg-clip-text text-3xl font-black text-transparent">
                      SPRAY CONTROL
                    </h3>
                    <div className="mt-1 text-xs font-mono uppercase tracking-[0.22em] text-slate-400">
                      Module PS-01 • Session {sessionId.slice(-6).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    {grade ? (
                      <div className={`relative flex h-24 w-24 items-center justify-center rounded-2xl border-2 ${grade.ring} bg-slate-950/70`}>
                        <div className={`font-mono text-6xl font-black ${grade.color}`}>{grade.letter}</div>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-slate-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-slate-300">
                          GRADE
                        </div>
                      </div>
                    ) : null}
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Score</div>
                      <div className="font-mono text-6xl font-black text-orange-100 drop-shadow-[0_0_20px_rgba(251,146,60,0.55)]">
                        {game.result.score}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">/100</div>
                    </div>
                  </div>
                </div>

                <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard label="Hit Rate" value={`${resultRaw?.hitRatePct ?? 0}%`} accent="text-cyan-200" />
                  <StatCard label="Perfect" value={`${resultRaw?.perfectRatePct ?? 0}%`} accent="text-emerald-200" />
                  <StatCard label="Avg Error" value={`${resultRaw?.avgShotErrorPx ?? 0}px`} accent="text-orange-200" />
                  <StatCard label="Max Error" value={`${resultRaw?.maxShotErrorPx ?? 0}px`} accent="text-rose-200" />
                  <StatCard label="Grouping" value={`${resultRaw?.groupingRadiusPx ?? 0}px`} />
                  <StatCard label="Vertical" value={`${resultRaw?.verticalControlScore ?? 0}`} hint="control" />
                  <StatCard label="Horizontal" value={`${resultRaw?.horizontalControlScore ?? 0}`} hint="control" />
                  <StatCard label="First Shot" value={resultRaw?.timeToFirstShotMs == null ? "—" : `${resultRaw.timeToFirstShotMs}ms`} hint="reaction" />
                </div>

                <div className="relative mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={game.start}
                    className="rounded-2xl bg-gradient-to-r from-orange-300 to-rose-300 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_30px_rgba(251,146,60,0.35)] transition hover:scale-[1.03]"
                  >
                    REMATCH ↻
                  </button>
                  <button
                    onClick={game.abort}
                    className="rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/15"
                  >
                    EXIT TO LOBBY
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="pointer-events-none absolute rounded-full border-2 border-orange-200/85 bg-orange-300/10 shadow-[0_0_55px_rgba(251,146,60,0.42)]"
            style={{
              left: game.targetX,
              top: game.targetY,
              width: targetRadiusPx * 2,
              height: targetRadiusPx * 2,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 rounded-full border border-emerald-200/80 bg-emerald-300/10 shadow-[0_0_22px_rgba(110,231,183,0.55)]"
              style={{
                width: game.config.perfectRadiusPx * 2,
                height: game.config.perfectRadiusPx * 2,
                transform: "translate(-50%, -50%)",
              }}
            />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100 shadow-[0_0_22px_rgba(253,186,116,0.95)]" />
            <div className="absolute inset-[-16px] rounded-full border border-orange-200/15" />
            <div className="absolute inset-[-30px] rounded-full border border-orange-200/8" />
          </div>

          {game.shots.map((shot) => (
            <div
              key={shot.shotIndex}
              className={`pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                shot.perfect
                  ? "border-emerald-100 bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.95)]"
                  : shot.hit
                    ? "border-cyan-100 bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]"
                    : "border-rose-100 bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,0.8)]"
              }`}
              style={{ left: shot.shotX, top: shot.shotY }}
              title={`Shot ${shot.shotIndex}`}
            />
          ))}

          <div
            className="pointer-events-none absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 shadow-[0_0_24px_rgba(255,255,255,0.4)]"
            style={{ left: game.aimX, top: game.aimY }}
          >
            <div className="absolute left-1/2 top-[-14px] h-3 w-px -translate-x-1/2 bg-white/85" />
            <div className="absolute bottom-[-14px] left-1/2 h-3 w-px -translate-x-1/2 bg-white/85" />
            <div className="absolute left-[-14px] top-1/2 h-px w-3 -translate-y-1/2 bg-white/85" />
            <div className="absolute right-[-14px] top-1/2 h-px w-3 -translate-y-1/2 bg-white/85" />
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
            {game.phase === "spraying" ? (
              <div className="absolute -inset-3 animate-ping rounded-full border border-rose-300/60" />
            ) : null}
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-3 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">LAST SHOT</div>
              <div className={`mt-1 font-mono text-lg font-black ${lastShotColor}`}>{lastShotState}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-3 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">SPRAY TIP</div>
              <div className="mt-1 text-sm font-bold text-white">ลากเมาส์ <span className="text-orange-200">ลง</span> เพื่อสวน recoil — แก้ <span className="text-cyan-200">ซ้าย/ขวา</span> ตามกลุ่มกระสุน</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-3 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">FIRE MODE</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-lg font-black text-rose-200">FULL-AUTO</span>
                <span className="rounded-md border border-rose-300/40 bg-rose-300/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-rose-200">●REC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
