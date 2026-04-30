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
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-title">
          <span>E-Sport</span> Skill Tester
        </div>
        <div className="app-meta">
          <span>
            player: <code>{playerId}</code>
          </span>
          <span>
            session: <code>{sessionId}</code>
          </span>
        </div>
      </header>

      <main className="app-main">
        {!active && (
          <>
            <section className="home-hero">
              <h1>Game Module Playground</h1>
              <p>
                Demo harness สำหรับทดสอบเกมก่อนส่งให้อาจารย์
                — เลียนแบบการทำงานของเว็บหลัก ที่จะส่ง <code>playerId</code>,{" "}
                <code>sessionId</code> และ <code>onGameComplete</code>
                ให้แต่ละเกม
              </p>
            </section>

            <section className="home-grid">
              <button
                className="home-card"
                onClick={() => setActive("peripheral")}
              >
                <span className="home-card-tag">Test 01</span>
                <h3>Peripheral Awareness Test</h3>
                <p>
                  ฝึกการประมวลผลข้อมูลรอบนอก โฟกัสเป้าหมายกลางจอ
                  พร้อมกับสังเกตสัญลักษณ์ที่โผล่ตามมุมจอ
                </p>
                <span className="home-card-cta">เริ่มทดสอบ →</span>
              </button>

              <button
                className="home-card"
                onClick={() => setActive("auditory")}
              >
                <span className="home-card-tag">Test 02</span>
                <h3>Auditory Localization & Reaction</h3>
                <p>
                  ฝึกระบุทิศทางจากเสียง 3D ในเกม FPS / Tactical Shooter
                  สะบัดเมาส์ไปทิศที่ได้ยินแล้วคลิกยืนยัน
                </p>
                <span className="home-card-cta">เริ่มทดสอบ →</span>
              </button>
            </section>

            {results.length > 0 && (
              <section className="results-section">
                <h2>ผลทดสอบที่ระบบหลักจะได้รับ</h2>
                <p className="results-hint">
                  ในระบบจริง object ด้านล่างจะถูกส่งไปยัง backend ของอาจารย์ผ่าน{" "}
                  <code>onGameComplete</code> เพื่อเก็บลงตาราง{" "}
                  <code>game_results</code>
                </p>
                {results.map((r, i) => (
                  <details key={i} className="result-card" open={i === results.length - 1}>
                    <summary>
                      <strong>{r.gameName}</strong>
                      <span className="result-meta">
                        score {r.score.toFixed(1)}
                        {r.accuracy !== undefined &&
                          ` · acc ${r.accuracy.toFixed(1)}%`}
                        {r.reactionTimeMs !== undefined &&
                          ` · rt ${r.reactionTimeMs.toFixed(0)}ms`}
                      </span>
                    </summary>
                    <pre>{JSON.stringify(r, null, 2)}</pre>
                  </details>
                ))}
              </section>
            )}
          </>
        )}

        {active === "peripheral" && (
          <div className="game-host">
            <button className="back-btn" onClick={() => setActive(null)}>
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
          <div className="game-host">
            <button className="back-btn" onClick={() => setActive(null)}>
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

      <footer className="app-footer">
        Built with React + Vite + TypeScript • Demo Harness for Game Module
        Contract
      </footer>
    </div>
  );
}
