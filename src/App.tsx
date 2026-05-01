import { useState } from "react";
import { GameResult } from "./shared/types";
import PeripheralAwarenessGame from "./games/peripheral-awareness/PeripheralAwarenessGame";
import AuditoryLocalizationGame from "./games/auditory-localization/AuditoryLocalizationGame";

/**
 * Demo Harness
 * ------------
 * เลียนแบบ "เว็บหลักของอาจารย์" ที่จะเป็นคน:
 *  1. สร้าง playerId / sessionId
 *  2. Mount เกมแต่ละตัว พร้อมส่ง props ตาม Game Module Contract
 *  3. รับ GameResult จาก onGameComplete แล้วเก็บไว้ (จำลองการบันทึก database)
 *
 * เมื่อจะเอาเกมไปใช้จริง อาจารย์ก็ import เกมจาก src/games/<name>/<Component>
 * แล้วทำงานเหมือนใน harness นี้เป๊ะ
 */

type GameKey = "peripheral" | "auditory" | null;

function generateId(prefix: string): string {
  return `${prefix}_${Math.floor(Math.random() * 9000 + 1000)}`;
}

export default function App() {
  const [active, setActive] = useState<GameKey>(null);
  const [results, setResults] = useState<GameResult[]>([]);
  const [playerId] = useState(() => generateId("player"));
  const [sessionId] = useState(() => `session_${Date.now()}`);

  // จำลองการที่ระบบหลักรับผลแล้วเก็บลง database
  const handleComplete = (result: GameResult) => {
    setResults((prev) => [...prev, result]);
    console.log("[harness] saving GameResult to (mock) database:", result);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-[18px] py-[14px] sm:px-8 sm:py-[18px] border-b border-border flex flex-wrap items-center justify-between gap-4 bg-bg-0/85 backdrop-blur-md sticky top-0 z-50">
        <div className="text-lg font-bold tracking-wide">
          <span className="text-primary">E-Sport</span> Skill Tester
        </div>
        <div className="flex gap-[14px] text-xs text-text-2">
          <span>
            player: <code>{playerId}</code>
          </span>
          <span>
            session: <code>{sessionId}</code>
          </span>
        </div>
      </header>

      <main className="flex-1 p-[18px] sm:p-8 max-w-[1280px] w-full mx-auto">
        {!active && (
          <>
            <section className="text-center pt-[60px] pb-10 px-5">
              <h1 className="text-[clamp(28px,5vw,44px)] mb-3 bg-title-gradient bg-clip-text text-transparent">
                Game Module Playground
              </h1>
              <p className="text-text-1 max-w-[720px] mx-auto text-base leading-[1.6]">
                Demo harness สำหรับทดสอบเกมก่อนส่งให้อาจารย์ — เลียนแบบการทำงานของเว็บหลัก ที่จะส่ง <code>playerId</code>,{" "}
                <code>sessionId</code> และ <code>onGameComplete</code> ให้แต่ละเกม
              </p>
            </section>

            <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mt-10">
              <button
                className="group bg-bg-1 border border-border rounded-xl p-6 transition-[transform,border-color,background-color] duration-150 flex flex-col gap-3 text-left text-inherit hover:-translate-y-[3px] hover:border-primary hover:bg-bg-2"
                onClick={() => setActive("peripheral")}
              >
                <span className="inline-block self-start px-[10px] py-1 bg-primary/15 text-primary rounded-full text-[11px] font-semibold tracking-wide uppercase">
                  Test 01
                </span>
                <h3 className="text-xl">Peripheral Awareness Test</h3>
                <p className="text-text-1 text-sm leading-[1.5] flex-1">
                  ฝึกการประมวลผลข้อมูลรอบนอก โฟกัสเป้าหมายกลางจอ พร้อมกับสังเกตสัญลักษณ์ที่โผล่ตามมุมจอ
                </p>
                <span className="mt-2 px-4 py-[10px] bg-primary text-white rounded-lg font-semibold text-sm text-center transition-colors duration-150 group-hover:bg-primary-hover">
                  เริ่มทดสอบ →
                </span>
              </button>

              <button
                className="group bg-bg-1 border border-border rounded-xl p-6 transition-[transform,border-color,background-color] duration-150 flex flex-col gap-3 text-left text-inherit hover:-translate-y-[3px] hover:border-primary hover:bg-bg-2"
                onClick={() => setActive("auditory")}
              >
                <span className="inline-block self-start px-[10px] py-1 bg-primary/15 text-primary rounded-full text-[11px] font-semibold tracking-wide uppercase">
                  Test 02
                </span>
                <h3 className="text-xl">Auditory Localization & Reaction</h3>
                <p className="text-text-1 text-sm leading-[1.5] flex-1">
                  ฝึกระบุทิศทางจากเสียง 3D ในเกม FPS / Tactical Shooter สะบัดเมาส์ไปทิศที่ได้ยินแล้วคลิกยืนยัน
                </p>
                <span className="mt-2 px-4 py-[10px] bg-primary text-white rounded-lg font-semibold text-sm text-center transition-colors duration-150 group-hover:bg-primary-hover">
                  เริ่มทดสอบ →
                </span>
              </button>
            </section>

            {results.length > 0 && (
              <section className="mt-12 pt-8 border-t border-border">
                <h2 className="mb-1 text-xl">ผลทดสอบที่ระบบหลักจะได้รับ</h2>
                <p className="text-text-2 text-[13px] mb-4 leading-[1.5]">
                  ในระบบจริง object ด้านล่างจะถูกส่งไปยัง backend ของอาจารย์ผ่าน{" "}
                  <code>onGameComplete</code> เพื่อเก็บลงตาราง <code>game_results</code>
                </p>
                {results.map((r, i) => (
                  <details
                    key={i}
                    className="bg-bg-1 border border-border rounded-[10px] px-4 py-3 mb-[10px]"
                    open={i === results.length - 1}
                  >
                    <summary className="cursor-pointer flex justify-between items-center gap-3 flex-wrap text-sm">
                      <strong>{r.gameName}</strong>
                      <span className="font-mono text-text-2 text-xs">
                        score {r.score.toFixed(1)}
                        {r.accuracy !== undefined && ` · acc ${r.accuracy.toFixed(1)}%`}
                        {r.reactionTimeMs !== undefined && ` · rt ${r.reactionTimeMs.toFixed(0)}ms`}
                      </span>
                    </summary>
                    <pre className="mt-3 p-3 bg-bg-0 border border-border rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-words text-text-1">
                      {JSON.stringify(r, null, 2)}
                    </pre>
                  </details>
                ))}
              </section>
            )}
          </>
        )}

        {active === "peripheral" && (
          <div className="flex flex-col gap-4">
            <button
              className="self-start px-4 py-2 bg-bg-1 border border-border text-text-1 rounded-lg text-[13px] transition-colors duration-150 hover:bg-bg-2 hover:text-text-0"
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
              className="self-start px-4 py-2 bg-bg-1 border border-border text-text-1 rounded-lg text-[13px] transition-colors duration-150 hover:bg-bg-2 hover:text-text-0"
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

      <footer className="px-8 py-5 text-center text-text-2 text-xs border-t border-border">
        Built with React + Vite + TypeScript + Tailwind CSS • Demo Harness for Game Module Contract
      </footer>
    </div>
  );
}
