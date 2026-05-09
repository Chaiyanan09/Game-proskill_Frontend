import { useMemo, useState } from "react";
import type { GameResult } from "./shared/types";
import SprayControlGame from "./games/spray-control/SparyControlGame";
import AuditoryLocalizationGame from "./games/auditory-localization/AuditoryLocalizationGame";

type GameKey = "menu" | "spray" | "auditory";

function GameCard({
  eyebrow,
  title,
  description,
  tags,
  accent,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tags: string[];
  accent: "cyan" | "violet";
  onClick: () => void;
}) {
  const accentClasses = accent === "cyan"
    ? "from-cyan-300/25 via-emerald-300/10 to-transparent border-cyan-200/25 hover:border-cyan-200/60"
    : "from-violet-300/25 via-cyan-300/10 to-transparent border-violet-200/25 hover:border-violet-200/60";

  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[2rem] border bg-slate-950/80 p-6 text-left shadow-[0_0_50px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 ${accentClasses}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClasses}`} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl transition group-hover:bg-white/20" />
      <div className="relative z-10">
        <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100">
          {eyebrow}
        </div>
        <h2 className="mt-5 text-3xl font-black tracking-tight text-white">{title}</h2>
        <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-300">{description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs font-bold text-slate-200">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-7 rounded-2xl bg-white px-4 py-3 text-center font-black text-slate-950 transition group-hover:bg-cyan-100">
          เริ่มทดสอบ →
        </div>
      </div>
    </button>
  );
}

export default function App() {
  const [activeGame, setActiveGame] = useState<GameKey>("menu");
  const [lastResult, setLastResult] = useState<GameResult | null>(null);

  const playerId = useMemo(() => "demo-player-001", []);
  const sessionId = useMemo(() => `session-${Date.now()}`, []);

  const handleGameComplete = (result: GameResult) => {
    setLastResult(result);
    console.log("GameResult:", result);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.16),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0),rgba(2,6,23,1))]" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_0_50px_rgba(15,23,42,0.4)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">E-Sport Skill Tester</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white md:text-5xl">Game Proskill Frontend</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              เกมทดสอบทักษะที่ทำเป็น Game Module รับ playerId/sessionId และส่งผลลัพธ์กลับผ่าน onGameComplete(result)
            </p>
          </div>

          {activeGame !== "menu" ? (
            <button
              onClick={() => setActiveGame("menu")}
              className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
            >
              ← กลับหน้าเลือกเกม
            </button>
          ) : null}
        </header>

        {activeGame === "menu" ? (
          <>
            <section className="grid gap-5 lg:grid-cols-2">
              <GameCard
                eyebrow="Test 01"
                title="Spray Control Test"
                description="ทดสอบการคุมเมาส์ตอนสเปรย์ ยิงค้างหนึ่งแม็กแล้วลากเมาส์สวน recoil เพื่อให้กลุ่มกระสุนเกาะเป้า เหมาะกับเกม FPS"
                tags={["Spray Control", "Recoil Pattern", "Mouse Control"]}
                accent="cyan"
                onClick={() => {
                  setLastResult(null);
                  setActiveGame("spray");
                }}
              />

              <GameCard
                eyebrow="Test 02"
                title="Auditory Localization & Reaction"
                description="ทดสอบการฟังทิศทางเสียงแบบ 3D แล้วคลิกตำแหน่งที่คิดว่าเสียงมาจาก เหมาะกับการรับรู้ตำแหน่งศัตรูจากเสียง"
                tags={["Sound Direction", "Reaction", "Accuracy"]}
                accent="violet"
                onClick={() => {
                  setLastResult(null);
                  setActiveGame("auditory");
                }}
              />
            </section>

            {lastResult ? (
              <section className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 backdrop-blur">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200/70">Last Result</div>
                <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-black/35 p-4 text-xs text-slate-200">
                  {JSON.stringify(lastResult, null, 2)}
                </pre>
              </section>
            ) : null}
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
