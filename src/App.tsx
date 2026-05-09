import { useMemo, useState } from "react";
import type { GameResult } from "./shared/types";
import SprayControlGame from "./games/spray-control/SprayControlGame";
import AuditoryLocalizationGame from "./games/auditory-localization/AuditoryLocalizationGame";

type GameKey = "menu" | "spray" | "auditory";

interface GameMeta {
  key: Exclude<GameKey, "menu">;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: string;
  category: string;
  accent: "orange" | "violet";
}

const GAMES: GameMeta[] = [
  {
    key: "spray",
    code: "PS-01",
    title: "SPRAY CONTROL",
    subtitle: "Recoil Pattern Mastery",
    description:
      "ทดสอบการคุมเมาส์ตอนสเปรย์ ยิงค้างหนึ่งแม็กแล้วลากเมาส์สวน recoil ให้กระสุนเกาะกลุ่มในวงเป้า เป็นพื้นฐานของผู้เล่น FPS ระดับ Pro",
    tags: ["FPS", "Mouse Control", "Recoil", "Precision"],
    difficulty: 4,
    duration: "~30s / mag",
    category: "Mechanical Skill",
    accent: "orange",
  },
  {
    key: "auditory",
    code: "PS-02",
    title: "AUDITORY LOCALIZATION",
    subtitle: "3D Sound Direction & Reaction",
    description:
      "ฟังเสียง 3D ผ่านหูฟัง แล้วคลิกทิศทางที่ได้ยินให้แม่นและเร็วที่สุด วัดทักษะการระบุตำแหน่งศัตรูจากเสียงในเกม FPS / Battle Royale",
    tags: ["Audio", "Reaction", "Spatial", "Awareness"],
    difficulty: 3,
    duration: "~60s / 10 trials",
    category: "Sensory Skill",
    accent: "violet",
  },
];

function DifficultyBars({ value, accent }: { value: number; accent: "orange" | "violet" }) {
  const onColor = accent === "orange" ? "bg-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.65)]" : "bg-violet-300 shadow-[0_0_10px_rgba(167,139,250,0.65)]";
  return (
    <div className="flex items-end gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`w-1.5 rounded-sm transition ${i <= value ? onColor : "bg-white/15"}`}
          style={{ height: 6 + i * 3 }}
        />
      ))}
    </div>
  );
}

function GameCard({ meta, onClick }: { meta: GameMeta; onClick: () => void }) {
  const isOrange = meta.accent === "orange";
  const accentBorder = isOrange
    ? "border-orange-300/30 hover:border-orange-200/70"
    : "border-violet-300/30 hover:border-violet-200/70";
  const accentGlow = isOrange
    ? "shadow-[0_0_45px_rgba(251,146,60,0.18)] hover:shadow-[0_0_75px_rgba(251,146,60,0.32)]"
    : "shadow-[0_0_45px_rgba(167,139,250,0.18)] hover:shadow-[0_0_75px_rgba(167,139,250,0.32)]";
  const accentBg = isOrange
    ? "from-orange-400/30 via-rose-300/10 to-transparent"
    : "from-violet-400/30 via-cyan-300/10 to-transparent";
  const ctaText = isOrange ? "text-orange-200" : "text-violet-200";
  const ctaBorder = isOrange ? "border-orange-300/40" : "border-violet-300/40";
  const codeText = isOrange ? "text-orange-200" : "text-violet-200";

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[1.7rem] border bg-slate-950/85 p-6 text-left transition duration-300 hover:-translate-y-1 ${accentBorder} ${accentGlow}`}
    >
      <div className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br ${accentBg} blur-2xl opacity-70 transition group-hover:opacity-100`} />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-2 rounded-full border ${ctaBorder} bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.3em] ${codeText}`}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            {meta.code}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
            <DifficultyBars value={meta.difficulty} accent={meta.accent} />
            <span>LVL {meta.difficulty}</span>
          </div>
        </div>

        <div className="mt-5 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400">
          {meta.category}
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white md:text-4xl">
          {meta.title}
        </h2>
        <div className={`mt-1 text-sm font-bold uppercase tracking-[0.2em] ${codeText}`}>
          {meta.subtitle}
        </div>

        <p className="mt-4 min-h-[88px] text-sm leading-6 text-slate-300">
          {meta.description}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Duration</span>
            <span className="font-mono font-bold text-slate-200">{meta.duration}</span>
          </div>
          <div
            className={`group/cta inline-flex items-center gap-2 rounded-2xl border ${ctaBorder} bg-white/5 px-5 py-2.5 font-black uppercase tracking-[0.22em] ${ctaText} transition group-hover:bg-white/10`}
          >
            ENGAGE
            <span className="transition group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function HeaderStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur">
      <div className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">{label}</div>
      <div className={`mt-1 font-mono text-lg font-black ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

export default function App() {
  const [activeGame, setActiveGame] = useState<GameKey>("menu");
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const playerId = useMemo(() => "demo-player-001", []);
  const sessionId = useMemo(() => `session-${Date.now()}`, []);
  const sessionTag = sessionId.slice(-6).toUpperCase();

  const handleGameComplete = (result: GameResult) => {
    setLastResult(result);
    console.log("GameResult:", result);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 text-white md:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_-5%,rgba(251,146,60,0.16),transparent_30%),radial-gradient(circle_at_85%_5%,rgba(167,139,250,0.16),transparent_30%),radial-gradient(circle_at_50%_120%,rgba(34,211,238,0.10),transparent_40%),linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,1))]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="relative mb-7 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_0_60px_rgba(15,23,42,0.5)] backdrop-blur md:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-orange-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 rounded-2xl border border-white/15 bg-gradient-to-br from-orange-400/30 to-violet-400/30 shadow-[0_0_30px_rgba(167,139,250,0.35)]">
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
                  PS
                </div>
                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    LIVE
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                    SEASON 01 • PRO TRYOUTS
                  </span>
                </div>
                <h1 className="mt-3 bg-gradient-to-r from-orange-200 via-white to-violet-200 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-5xl">
                  E-SPORT SKILL TESTER
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Game Module ทดสอบทักษะนักกีฬา E-sport — รวมแบบฝึกที่นัก Pro ใช้จริงในการอุ่นเครื่อง วัดผลแบบมาตรฐาน Tournament
                </p>
              </div>
            </div>

            {activeGame !== "menu" ? (
              <button
                onClick={() => setActiveGame("menu")}
                className="self-start rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:border-white/30 hover:bg-white/15"
              >
                ← BACK TO LOBBY
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <HeaderStat label="Player" value={playerId.toUpperCase()} accent="text-orange-200" />
                <HeaderStat label="Session" value={`#${sessionTag}`} accent="text-violet-200" />
                <HeaderStat label="Modules" value={`${GAMES.length}`} accent="text-cyan-200" />
              </div>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </header>

        {activeGame === "menu" ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
                <span className="text-xs font-black uppercase tracking-[0.32em] text-slate-300">SELECT MODULE</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{GAMES.length} TESTS AVAILABLE</span>
            </div>

            <section className="grid gap-5 lg:grid-cols-2">
              {GAMES.map((meta) => (
                <GameCard
                  key={meta.key}
                  meta={meta}
                  onClick={() => {
                    setLastResult(null);
                    setActiveGame(meta.key);
                  }}
                />
              ))}
            </section>

            {lastResult ? (
              <section className="mt-6 overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(52,211,153,0.15)] backdrop-blur">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      LAST MATCH RESULT
                    </div>
                    <h3 className="mt-2 text-2xl font-black text-white">{lastResult.gameName}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Score</div>
                    <div className="font-mono text-5xl font-black text-emerald-200 drop-shadow-[0_0_18px_rgba(52,211,153,0.55)]">
                      {Math.round(lastResult.score)}
                    </div>
                  </div>
                </div>
                <pre className="mt-4 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-slate-300">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              </section>
            ) : null}

            <footer className="mt-8 flex flex-col items-center gap-2 text-center text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span>Pro-Skill Engine • Game Module Contract v1.0.0</span>
            </footer>
          </>
        ) : null}

        {activeGame === "spray" ? (
          <SprayControlGame playerId={playerId} sessionId={sessionId} onGameComplete={handleGameComplete} />
        ) : null}

        {activeGame === "auditory" ? (
          <AuditoryLocalizationGame playerId={playerId} sessionId={sessionId} onGameComplete={handleGameComplete} />
        ) : null}
      </div>
    </main>
  );
}
