import { useState } from "react";

import { GameResult } from "./shared/types";
import PeripheralAwarenessGame from "./games/peripheral-awareness/PeripheralAwarenessGame";
import AuditoryLocalizationGame from "./games/auditory-localization/AuditoryLocalizationGame";

type GameKey = "peripheral" | "auditory" | null;

interface GameCardInfo {
  key: Exclude<GameKey, null>;
  badge: string;
  title: string;
  description: string;
  tags: string[];
  gradient: string;
  metrics: string[];
}

const gameCards: GameCardInfo[] = [
  {
    key: "peripheral",
    badge: "Test 01",
    title: "Peripheral Awareness",
    description:
      "โฟกัสเป้าหมายกลางจอไปพร้อมกับตรวจจับ cue ตามมุม เหมาะกับ FPS / MOBA / mini-map awareness",
    tags: ["60 sec", "Focus", "Reaction", "Tracking"],
    gradient: "from-primary/30 via-accent/14 to-success/8",
    metrics: ["tracking deviation", "false press", "reaction"],
  },
  {
    key: "auditory",
    badge: "Test 02",
    title: "Auditory Localization",
    description:
      "ใส่หูฟัง ฟังเสียง 3D แล้วคลิกทิศทางที่ได้ยิน วัด sound cue awareness และ reaction time",
    tags: ["3D Audio", "HRTF", "Reaction", "Angle Error"],
    gradient: "from-accent/26 via-primary/18 to-danger/8",
    metrics: ["angle error", "timeout", "accuracy"],
  },
];

function generateId(prefix: string): string {
  return `${prefix}_${Math.floor(Math.random() * 9000 + 1000)}`;
}

function MiniRadar() {
  return (
    <div className="relative h-24 w-24 rounded-full border border-accent/35 bg-bg-0/50 shadow-[inset_0_0_32px_rgba(139,233,253,0.2),0_0_34px_rgba(139,233,253,0.14)]">
      <div className="radar-sweep opacity-80" />
      <div className="absolute inset-[18%] rounded-full border border-accent/20" />
      <div className="absolute inset-[36%] rounded-full border border-accent/20" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-accent/16" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-accent/16" />
      <div className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-glow-accent" />
    </div>
  );
}

function GameCard({ card, onClick }: { card: GameCardInfo; onClick: () => void }) {
  return (
    <button
      className="menu-card-shell group relative min-h-[520px] overflow-hidden rounded-[34px] p-[1px] text-left text-inherit transition duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-accent/70"
      onClick={onClick}
    >
      <div className="menu-card-inner relative flex h-full flex-col overflow-hidden rounded-[33px] p-7 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-accent to-success opacity-90" />
        <div className="menu-card-grid absolute inset-0 opacity-45" />
        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-55 transition duration-300 group-hover:opacity-70`} />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/18 blur-3xl transition group-hover:bg-accent/28" />
        <div className="absolute -bottom-24 left-8 h-64 w-64 rounded-full bg-primary/20 blur-3xl transition group-hover:bg-primary/32" />

        <div className="relative flex items-start justify-between gap-5">
          <div>
            <span className="inline-flex rounded-full border border-primary/45 bg-primary/22 px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-primary shadow-[0_0_22px_rgba(91,141,239,0.18)]">
              {card.badge}
            </span>
            <div className="mt-5 inline-flex rounded-2xl border border-white/12 bg-white/[0.05] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
              Game Module
            </div>
          </div>

          <div className="rounded-[28px] border border-white/12 bg-black/18 p-3 shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
            <MiniRadar />
          </div>
        </div>

        <div className="relative mt-10 flex-1">
          <h3 className="max-w-[520px] text-[clamp(32px,4.2vw,46px)] font-black leading-[0.98] tracking-tight text-white drop-shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition group-hover:text-accent">
            {card.title}
          </h3>
          <p className="mt-5 max-w-[620px] text-base leading-7 text-slate-200/95">
            {card.description}
          </p>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-2.5">
          {card.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/12 bg-white/[0.07] px-3.5 py-1.5 text-xs font-extrabold text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="relative mt-6 grid grid-cols-1 gap-3 text-center text-[11px] font-black uppercase tracking-[0.14em] text-slate-100 sm:grid-cols-3">
          {card.metrics.map((metric) => (
            <div
              key={metric}
              className="rounded-2xl border border-white/12 bg-black/22 px-3 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <span className="block text-slate-400">วัดผล</span>
              <span className="mt-1 block text-slate-100">{metric}</span>
            </div>
          ))}
        </div>

        <div className="relative mt-7 rounded-2xl bg-gradient-to-r from-primary to-accent px-5 py-4 text-center text-base font-black text-white shadow-[0_18px_42px_rgba(91,141,239,0.34)] transition group-hover:scale-[1.01] group-hover:shadow-[0_22px_54px_rgba(139,233,253,0.28)]">
          เริ่มทดสอบ →
        </div>
      </div>
    </button>
  );
}

function ResultPreview({ results }: { results: GameResult[] }) {
  if (results.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">ผลทดสอบที่ระบบหลักจะได้รับ</h2>
          <p className="mt-1 text-sm leading-6 text-text-2">
            ในระบบจริง object ด้านล่างจะถูกส่งผ่าน <code>onGameComplete</code>{" "}
            แล้ว backend ของอาจารย์เป็นคนบันทึกลง database
          </p>
        </div>
        <span className="rounded-full border border-success/25 bg-success/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-success">
          {results.length} result{results.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <details
            key={`${result.sessionId}-${result.gameId}-${index}`}
            className="rounded-2xl border border-border bg-bg-1/80 p-4 shadow-elevated"
            open={index === results.length - 1}
          >
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 text-sm">
              <strong className="text-text-0">{result.gameName}</strong>
              <span className="font-mono text-xs text-text-2">
                status {result.status} · score {result.score.toFixed(1)}
                {result.accuracy !== undefined && ` · acc ${result.accuracy.toFixed(1)}%`}
                {result.reactionTimeMs !== undefined &&
                  ` · rt ${result.reactionTimeMs.toFixed(0)}ms`}
              </span>
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-bg-0 p-3 font-mono text-[11px] text-text-1">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState<GameKey>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [playerId] = useState(() => generateId("player"));
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const handleComplete = (result: GameResult) => {
    setResults((prev) => [...prev, result]);
    console.log("[harness] saving GameResult to (mock) database:", result);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(91,141,239,0.2),transparent_34%),#070b15] text-text-0">
      <div className="pointer-events-none fixed inset-0 bg-noise opacity-20" />
      <div className="pointer-events-none fixed -left-24 top-24 h-80 w-80 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none fixed -right-24 bottom-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-4 border-b border-border bg-bg-0/78 px-5 py-4 backdrop-blur-md sm:px-8">
        <div>
          <div className="text-lg font-black tracking-wide">
            <span className="text-primary">E-Sport</span> Skill Tester
          </div>
          <div className="mt-0.5 text-xs text-text-2">Game Module Contract Demo</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-text-2">
          <span className="rounded-full border border-border bg-bg-1 px-3 py-1.5">
            player: <code>{playerId}</code>
          </span>
          <span className="rounded-full border border-border bg-bg-1 px-3 py-1.5">
            session: <code>{sessionId}</code>
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1280px] px-5 py-8 sm:px-8">
        {!active && (
          <>
            <section className="px-2 pb-10 pt-10 text-center sm:pt-16">
              <div className="mx-auto mb-4 inline-flex rounded-full border border-primary/25 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.24em] text-primary">
                Production-ready game modules
              </div>
              <h1 className="mx-auto max-w-[980px] bg-title-gradient bg-clip-text text-[clamp(38px,6.4vw,82px)] font-black leading-[0.96] text-transparent">
                E-Sport Performance Lab
              </h1>
              <p className="mx-auto mt-5 max-w-[800px] text-base leading-7 text-text-1">
                Demo harness นี้เลียนแบบเว็บหลักของอาจารย์: ส่ง <code>playerId</code>,{" "}
                <code>sessionId</code> และ <code>onGameComplete</code> ให้เกม
                โดยเกมไม่ยุ่งกับ database โดยตรง
              </p>
            </section>

            <section className="grid grid-cols-1 gap-7 xl:grid-cols-2">
              {gameCards.map((card) => (
                <GameCard
                  key={card.key}
                  card={card}
                  onClick={() => setActive(card.key)}
                />
              ))}
            </section>

            <ResultPreview results={results} />
          </>
        )}

        {active === "peripheral" && (
          <div className="flex flex-col gap-4">
            <button
              className="self-start rounded-2xl border border-border bg-bg-1 px-4 py-2 text-sm font-bold text-text-1 transition hover:bg-bg-2 hover:text-text-0"
              onClick={() => setActive(null)}
            >
              ← กลับเมนู
            </button>
            <PeripheralAwarenessGame
              playerId={playerId}
              sessionId={sessionId}
              onGameComplete={handleComplete}
            />
          </div>
        )}

        {active === "auditory" && (
          <div className="flex flex-col gap-4">
            <button
              className="self-start rounded-2xl border border-border bg-bg-1 px-4 py-2 text-sm font-bold text-text-1 transition hover:bg-bg-2 hover:text-text-0"
              onClick={() => setActive(null)}
            >
              ← กลับเมนู
            </button>
            <AuditoryLocalizationGame
              playerId={playerId}
              sessionId={sessionId}
              onGameComplete={handleComplete}
            />
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-border px-8 py-5 text-center text-xs text-text-2">
        React + Vite + TypeScript + Tailwind CSS • Game Module Contract
      </footer>
    </div>
  );
}
