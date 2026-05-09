import { useMemo, useRef } from "react";
import type { GameProps } from "../../shared/types";
import { useSprayControlGame } from "./logic";

interface Props extends GameProps {
  magazineSize?: number;
  targetRadiusPx?: number;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 shadow-[0_0_28px_rgba(15,23,42,0.3)] backdrop-blur">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-200/70">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

export default function PeripheralAwarenessGame({
  playerId,
  sessionId,
  onGameComplete,
  magazineSize = 30,
  targetRadiusPx = 58,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const game = useSprayControlGame(arenaRef, {
    playerId,
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
    if (game.phase === "idle") return "READY";
    if (game.phase === "countdown") return "LOAD MAG";
    if (game.phase === "ready") return "HOLD FIRE";
    if (game.phase === "spraying") return "SPRAYING";
    return "COMPLETE";
  }, [game.phase]);

  const lastShotState = game.lastShot?.perfect ? "PERFECT" : game.lastShot?.hit ? "HIT" : game.lastShot ? "MISS" : "-";
  const lastShotColor = game.lastShot?.perfect
    ? "text-emerald-200"
    : game.lastShot?.hit
      ? "text-cyan-200"
      : game.lastShot
        ? "text-rose-200"
        : "text-slate-300";

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-orange-300/20 bg-slate-950 p-5 text-white shadow-[0_0_70px_rgba(251,146,60,0.14)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(251,146,60,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.14),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(2,6,23,0.96))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative z-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-orange-100">
              <span className={`h-2 w-2 rounded-full ${game.phase === "spraying" ? "bg-rose-300 animate-pulse" : "bg-emerald-300"}`} />
              {statusLabel}
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Spray Control Test
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              ฝึกคุมเมาส์ตอนสเปรย์ ยิงค้างหนึ่งแม็กแล้วลากเมาส์สวน recoil ให้กระสุนเกาะวงเป้า เหมือนการคุมสเปรย์ในเกม FPS
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <StatCard label="Ammo" value={`${Math.max(0, magazineSize - game.currentShot)}/${magazineSize}`} />
            <StatCard label="Hits" value={`${game.hitCount}`} />
            <StatCard label="Avg Error" value={`${Math.round(game.avgErrorPx)}px`} />
          </div>
        </div>

        <div className="mb-4 h-3 overflow-hidden rounded-full border border-white/10 bg-slate-900/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-300 via-rose-300 to-cyan-300 transition-[width] duration-150"
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

          {game.phase === "idle" ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/68 backdrop-blur-sm">
              <div className="max-w-xl rounded-[2rem] border border-orange-200/20 bg-slate-950/85 p-8 text-center shadow-[0_0_60px_rgba(251,146,60,0.18)]">
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-orange-300/25 bg-orange-300/10 shadow-[0_0_40px_rgba(251,146,60,0.2)]">
                  <div className="relative h-12 w-12">
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-orange-100" />
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-orange-100" />
                    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-100" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-white">เตรียมฝึกสเปรย์</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  หลังนับถอยหลัง ให้วางเมาส์ที่เป้าแล้วกดคลิกซ้ายค้าง กระสุนจะดีดขึ้นและแกว่งซ้ายขวา ให้ลากเมาส์ลง/สวนทางเพื่อคุมกลุ่มกระสุนให้อยู่ในวง
                </p>
                <button
                  onClick={game.start}
                  className="mt-7 rounded-2xl bg-gradient-to-r from-orange-300 to-cyan-300 px-7 py-3 font-black text-slate-950 shadow-[0_0_30px_rgba(251,146,60,0.28)] transition hover:scale-[1.03]"
                >
                  เริ่มทดสอบ
                </button>
              </div>
            </div>
          ) : null}

          {game.phase === "countdown" ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-[8rem] font-black leading-none text-orange-100 drop-shadow-[0_0_35px_rgba(251,146,60,0.75)] animate-pulse">
                  {game.countdown}
                </div>
                <div className="mt-3 text-sm font-black uppercase tracking-[0.34em] text-orange-200/80">Ready to Spray</div>
              </div>
            </div>
          ) : null}

          {game.phase === "ready" ? (
            <div className="pointer-events-none absolute inset-x-0 top-7 z-20 flex justify-center">
              <div className="rounded-2xl border border-orange-200/25 bg-slate-950/70 px-5 py-3 text-center shadow-[0_0_30px_rgba(251,146,60,0.16)] backdrop-blur">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-orange-200/70">Instruction</div>
                <div className="mt-1 text-lg font-black text-white">กดคลิกซ้ายค้างเพื่อยิงสเปรย์ 1 แม็ก</div>
                <div className="mt-1 text-xs text-slate-400">พร้อมยิงภายใน {Math.ceil(game.readyTimeLeftMs / 1000)} วินาที</div>
              </div>
            </div>
          ) : null}

          {game.phase === "finished" && game.result ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-md">
              <div className="w-full max-w-3xl rounded-[2rem] border border-orange-200/20 bg-slate-950/92 p-7 shadow-[0_0_70px_rgba(251,146,60,0.2)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.28em] text-orange-200/70">Result</div>
                    <h3 className="mt-2 text-3xl font-black text-white">Spray Control</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Score</div>
                    <div className="text-6xl font-black text-orange-100">{game.result.score}</div>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard label="Hit Rate" value={`${resultRaw?.hitRatePct ?? 0}%`} />
                  <StatCard label="Perfect" value={`${resultRaw?.perfectRatePct ?? 0}%`} />
                  <StatCard label="Avg Error" value={`${resultRaw?.avgShotErrorPx ?? 0}px`} />
                  <StatCard label="Max Error" value={`${resultRaw?.maxShotErrorPx ?? 0}px`} />
                  <StatCard label="Grouping" value={`${resultRaw?.groupingRadiusPx ?? 0}px`} />
                  <StatCard label="Vertical" value={`${resultRaw?.verticalControlScore ?? 0}`} />
                  <StatCard label="Horizontal" value={`${resultRaw?.horizontalControlScore ?? 0}`} />
                  <StatCard label="First Shot" value={resultRaw?.timeToFirstShotMs == null ? "-" : `${resultRaw.timeToFirstShotMs}ms`} />
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={game.start}
                    className="rounded-2xl bg-orange-300 px-6 py-3 font-black text-slate-950 transition hover:bg-orange-200"
                  >
                    เล่นอีกครั้ง
                  </button>
                  <button
                    onClick={game.abort}
                    className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-white transition hover:bg-white/10"
                  >
                    กลับหน้าเริ่ม
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className="pointer-events-none absolute rounded-full border-2 border-orange-200/85 bg-orange-300/10 shadow-[0_0_45px_rgba(251,146,60,0.36)]"
            style={{
              left: game.targetX,
              top: game.targetY,
              width: targetRadiusPx * 2,
              height: targetRadiusPx * 2,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 rounded-full border border-emerald-200/75 bg-emerald-300/10 shadow-[0_0_20px_rgba(110,231,183,0.5)]"
              style={{
                width: game.config.perfectRadiusPx * 2,
                height: game.config.perfectRadiusPx * 2,
                transform: "translate(-50%, -50%)",
              }}
            />
            <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-100 shadow-[0_0_20px_rgba(253,186,116,0.95)]" />
            <div className="absolute inset-[-16px] rounded-full border border-orange-200/12" />
          </div>

          {game.shots.map((shot) => (
            <div
              key={shot.shotIndex}
              className={`pointer-events-none absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${shot.perfect ? "border-emerald-100 bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)]" : shot.hit ? "border-cyan-100 bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.7)]" : "border-rose-100 bg-rose-400 shadow-[0_0_14px_rgba(251,113,133,0.7)]"}`}
              style={{ left: shot.shotX, top: shot.shotY }}
              title={`Shot ${shot.shotIndex}`}
            />
          ))}

          <div
            className="pointer-events-none absolute z-20 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/90 shadow-[0_0_24px_rgba(255,255,255,0.35)]"
            style={{ left: game.aimX, top: game.aimY }}
          >
            <div className="absolute left-1/2 top-[-14px] h-3 w-px -translate-x-1/2 bg-white/80" />
            <div className="absolute bottom-[-14px] left-1/2 h-3 w-px -translate-x-1/2 bg-white/80" />
            <div className="absolute left-[-14px] top-1/2 h-px w-3 -translate-y-1/2 bg-white/80" />
            <div className="absolute right-[-14px] top-1/2 h-px w-3 -translate-y-1/2 bg-white/80" />
            <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          </div>

          <div className="pointer-events-none absolute bottom-4 left-4 right-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/58 p-3 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Last Shot</div>
              <div className={`mt-1 text-lg font-black ${lastShotColor}`}>{lastShotState}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/58 p-3 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Spray Tip</div>
              <div className="mt-1 text-sm font-bold text-white">ลากเมาส์ลงเพื่อสวน recoil และแก้ซ้าย/ขวาตามกลุ่มกระสุน</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/58 p-3 backdrop-blur">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mode</div>
              <div className="mt-1 text-lg font-black text-white">Full Auto</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
