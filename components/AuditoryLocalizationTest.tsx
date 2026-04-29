"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * Auditory Localization & Reaction Test
 * --------------------------------------
 * วัดความสามารถในการฟังเสียงเพื่อระบุตำแหน่งศัตรู (Sound Cue)
 *
 * วิธีเล่น:
 *  - หน้าจอจะมืดสนิท
 *  - ระบบจะส่งเสียง "Footstep" หรือ "Reload" ผ่านระบบเสียง 3D
 *  - ผู้เล่นต้องสะบัดเมาส์ (Flick) ไปยังทิศทางที่ได้ยินเสียง แล้วคลิกซ้าย 1 ครั้ง
 *  - ระบบจะเฉลยตำแหน่งจริงของต้นกำเนิดเสียง
 *
 * วัดผล:
 *  - Angle Error (°)
 *  - Audio Reaction Time (ms)
 *  - Success Rate by Distance (อัตราความสำเร็จเมื่อระดับเสียงเปลี่ยน)
 */

type SoundType = "footstep" | "reload";

interface Trial {
  index: number;
  angleDeg: number; // 0 = ขวา, 90 = ล่าง, 180 = ซ้าย, 270 = บน
  distance: number; // 0 (ใกล้/ดัง) - 1 (ไกล/เบา)
  soundType: SoundType;
  playedAt: number;
  clickedAt?: number;
  clickAngleDeg?: number;
  angleErrorDeg?: number;
  reactionMs?: number;
  success?: boolean; // success ถ้า angle error <= 25 deg
}

interface SessionResult {
  totalTrials: number;
  avgAngleErrorDeg: number;
  avgReactionMs: number;
  successRateOverall: number;
  successRateNear: number;
  successRateMid: number;
  successRateFar: number;
}

interface Props {
  /** จำนวน trial - default 10 */
  trials?: number;
  /** เกณฑ์องศาที่ถือว่าสำเร็จ - default 25 */
  successThresholdDeg?: number;
  onFinish?: (result: SessionResult) => void;
}

// สร้างเสียง footstep / reload ผ่าน Web Audio (ไม่ต้องโหลดไฟล์เสียง)
function createFootstepBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.18;
  const length = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // noise burst with fast decay
    const env = Math.exp(-t * 25);
    const noise = (Math.random() * 2 - 1) * env;
    // เพิ่ม low thump
    const thump = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 30) * 0.5;
    data[i] = (noise * 0.6 + thump) * 0.8;
  }
  return buf;
}

function createReloadBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const duration = 0.4;
  const length = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(1, length, sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Click 1
    let v = 0;
    if (t < 0.05) {
      const env = Math.exp(-t * 60);
      v += (Math.random() * 2 - 1) * env * 0.6;
      v += Math.sin(2 * Math.PI * 1200 * t) * env * 0.3;
    }
    // metallic click 2
    if (t > 0.18 && t < 0.25) {
      const tt = t - 0.18;
      const env = Math.exp(-tt * 80);
      v += (Math.random() * 2 - 1) * env * 0.5;
      v += Math.sin(2 * Math.PI * 1800 * tt) * env * 0.4;
    }
    // metallic click 3
    if (t > 0.3 && t < 0.4) {
      const tt = t - 0.3;
      const env = Math.exp(-tt * 70);
      v += (Math.random() * 2 - 1) * env * 0.4;
      v += Math.sin(2 * Math.PI * 1500 * tt) * env * 0.3;
    }
    data[i] = v * 0.8;
  }
  return buf;
}

export default function AuditoryLocalizationTest({
  trials = 10,
  successThresholdDeg = 25,
  onFinish,
}: Props) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const footstepBufRef = useRef<AudioBuffer | null>(null);
  const reloadBufRef = useRef<AudioBuffer | null>(null);
  const trialsRef = useRef<Trial[]>([]);
  const currentTrialRef = useRef<Trial | null>(null);

  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [trialIdx, setTrialIdx] = useState(0);
  const [showReveal, setShowReveal] = useState<{
    trueAngle: number;
    clickAngle: number;
    error: number;
  } | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [waitingForClick, setWaitingForClick] = useState(false);

  // setup audio context
  const ensureAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      footstepBufRef.current = createFootstepBuffer(ctx);
      reloadBufRef.current = createReloadBuffer(ctx);
    }
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }
  }, []);

  const playSpatial = useCallback(
    (angleDeg: number, distance: number, type: SoundType) => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const buf = type === "footstep" ? footstepBufRef.current : reloadBufRef.current;
      if (!buf) return;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 10;
      panner.rolloffFactor = 1;

      // ระยะ 1 (ใกล้) ถึง 6 (ไกล)
      const r = 1 + distance * 5;
      const rad = (angleDeg * Math.PI) / 180;
      const x = Math.cos(rad) * r;
      const z = Math.sin(rad) * r; // ใช้แกน z เป็นหน้า/หลัง
      panner.positionX.value = x;
      panner.positionY.value = 0;
      panner.positionZ.value = z;

      // gain เพิ่มเติมตามระยะ (ให้ "ความเบา-ดัง" เปลี่ยนชัดเจน)
      const gain = ctx.createGain();
      gain.gain.value = 1 - distance * 0.6;

      src.connect(panner).connect(gain).connect(ctx.destination);
      src.start();
    },
    []
  );

  const startTrial = useCallback(
    (idx: number) => {
      const angle = Math.random() * 360;
      const distance = Math.random(); // 0..1
      const soundType: SoundType = Math.random() < 0.5 ? "footstep" : "reload";
      const trial: Trial = {
        index: idx,
        angleDeg: angle,
        distance,
        soundType,
        playedAt: 0,
      };

      // delay สุ่ม 600-1500ms ก่อนเล่นเสียง เพื่อกัน reaction-cheat
      const delay = 600 + Math.random() * 900;
      setWaitingForClick(false);
      setShowReveal(null);

      setTimeout(() => {
        trial.playedAt = performance.now();
        currentTrialRef.current = trial;
        trialsRef.current.push(trial);
        playSpatial(angle, distance, soundType);
        setWaitingForClick(true);
      }, delay);
    },
    [playSpatial]
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waitingForClick || !arenaRef.current) return;
    const trial = currentTrialRef.current;
    if (!trial) return;

    const rect = arenaRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = e.clientX - rect.left - cx;
    const my = e.clientY - rect.top - cy;

    // ให้สอดคล้องกับ panner: x=cos(angle), z=sin(angle)
    // โดยมอง screen y ให้แทน z (ลงล่างของจอ = หน้า, ขึ้นบน = หลัง)
    let clickAngle = (Math.atan2(my, mx) * 180) / Math.PI;
    if (clickAngle < 0) clickAngle += 360;

    let trueAngle = trial.angleDeg;
    if (trueAngle < 0) trueAngle += 360;

    let diff = Math.abs(clickAngle - trueAngle) % 360;
    if (diff > 180) diff = 360 - diff;

    trial.clickedAt = performance.now();
    trial.clickAngleDeg = clickAngle;
    trial.angleErrorDeg = diff;
    trial.reactionMs = trial.clickedAt - trial.playedAt;
    trial.success = diff <= successThresholdDeg;

    setShowReveal({
      trueAngle,
      clickAngle,
      error: diff,
    });
    setWaitingForClick(false);

    // ถัดไป
    setTimeout(() => {
      const nextIdx = trial.index + 1;
      if (nextIdx >= trials) {
        finalize();
      } else {
        setTrialIdx(nextIdx);
        startTrial(nextIdx);
      }
    }, 1300);
  };

  const finalize = () => {
    setRunning(false);
    setFinished(true);
    setWaitingForClick(false);

    const ts = trialsRef.current.filter((t) => t.angleErrorDeg !== undefined);
    const total = ts.length;
    const avgErr =
      total > 0 ? ts.reduce((s, t) => s + (t.angleErrorDeg ?? 0), 0) / total : 0;
    const avgRt =
      total > 0 ? ts.reduce((s, t) => s + (t.reactionMs ?? 0), 0) / total : 0;
    const succ = ts.filter((t) => t.success).length;
    const near = ts.filter((t) => t.distance < 0.34);
    const mid = ts.filter((t) => t.distance >= 0.34 && t.distance < 0.67);
    const far = ts.filter((t) => t.distance >= 0.67);

    const r: SessionResult = {
      totalTrials: total,
      avgAngleErrorDeg: avgErr,
      avgReactionMs: avgRt,
      successRateOverall: total > 0 ? (succ / total) * 100 : 0,
      successRateNear:
        near.length > 0
          ? (near.filter((t) => t.success).length / near.length) * 100
          : 0,
      successRateMid:
        mid.length > 0
          ? (mid.filter((t) => t.success).length / mid.length) * 100
          : 0,
      successRateFar:
        far.length > 0
          ? (far.filter((t) => t.success).length / far.length) * 100
          : 0,
    };
    setResult(r);
    onFinish?.(r);
  };

  const start = async () => {
    await ensureAudio();
    trialsRef.current = [];
    currentTrialRef.current = null;
    setResult(null);
    setFinished(false);
    setShowReveal(null);
    setTrialIdx(0);
    setRunning(true);
    startTrial(0);
  };

  // กัน scroll/select ขณะเล่น
  useEffect(() => {
    if (running) {
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
    };
  }, [running]);

  // helper สำหรับวาด indicator ทิศทาง
  const angleToPoint = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    };
  };

  return (
    <div className="al-wrapper">
      <div className="al-hud">
        <div className="al-hud-item">
          <span className="al-hud-label">รอบ</span>
          <span className="al-hud-value">
            {Math.min(trialIdx + (running ? 1 : 0), trials)} / {trials}
          </span>
        </div>
        <div className="al-hud-item">
          <span className="al-hud-label">สถานะ</span>
          <span className="al-hud-value">
            {!running && !finished && "พร้อมเริ่ม"}
            {running && waitingForClick && "ฟัง & คลิกตามทิศทาง"}
            {running && !waitingForClick && !showReveal && "รอเสียง..."}
            {showReveal && "เฉลย"}
            {finished && "จบการทดสอบ"}
          </span>
        </div>
      </div>

      <div
        ref={arenaRef}
        className={`al-arena ${waitingForClick ? "al-cursor-crosshair" : ""}`}
        onClick={handleClick}
      >
        {/* ตัวเล่นตรงกลาง */}
        {running && (
          <div className="al-center">
            <div className="al-center-dot" />
            <div className="al-center-ring" />
          </div>
        )}

        {/* เฉลยตำแหน่งจริง */}
        {showReveal && arenaRef.current && (() => {
          const rect = arenaRef.current.getBoundingClientRect();
          const radius = Math.min(rect.width, rect.height) * 0.4;
          const truePt = angleToPoint(showReveal.trueAngle, radius);
          const clickPt = angleToPoint(showReveal.clickAngle, radius);
          return (
            <>
              <div
                className="al-marker al-marker-true"
                style={{
                  left: `calc(50% + ${truePt.x}px)`,
                  top: `calc(50% + ${truePt.y}px)`,
                }}
              >
                <span>เสียง</span>
              </div>
              <div
                className="al-marker al-marker-click"
                style={{
                  left: `calc(50% + ${clickPt.x}px)`,
                  top: `calc(50% + ${clickPt.y}px)`,
                }}
              >
                <span>คลิก</span>
              </div>
              <div className="al-error-badge">
                Error: {showReveal.error.toFixed(1)}°
              </div>
            </>
          );
        })()}

        {!running && !finished && (
          <div className="al-overlay">
            <h2>Auditory Localization & Reaction</h2>
            <p>
              สวมหูฟังเพื่อประสบการณ์ที่ดีที่สุด ฟังเสียง footstep / reload
              แล้วใช้เมาส์คลิกไปทิศทางที่ได้ยิน
            </p>
            <p className="al-hint">
              จำนวนรอบ: {trials} | เกณฑ์สำเร็จ: ภายใน {successThresholdDeg}°
            </p>
            <button className="al-btn" onClick={start}>
              เริ่มทดสอบ
            </button>
          </div>
        )}

        {finished && result && (
          <div className="al-overlay">
            <h2>ผลการทดสอบ</h2>
            <div className="al-result-grid">
              <div>
                <div className="al-result-label">Avg Angle Error</div>
                <div className="al-result-value">
                  {result.avgAngleErrorDeg.toFixed(1)}°
                </div>
              </div>
              <div>
                <div className="al-result-label">Audio Reaction</div>
                <div className="al-result-value">
                  {result.avgReactionMs.toFixed(0)} ms
                </div>
              </div>
              <div>
                <div className="al-result-label">Success (Overall)</div>
                <div className="al-result-value">
                  {result.successRateOverall.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="al-result-label">Near / Mid / Far</div>
                <div className="al-result-value al-small">
                  {result.successRateNear.toFixed(0)}% /{" "}
                  {result.successRateMid.toFixed(0)}% /{" "}
                  {result.successRateFar.toFixed(0)}%
                </div>
              </div>
            </div>
            <button className="al-btn" onClick={start}>
              ทดสอบอีกครั้ง
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
