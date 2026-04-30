# Auditory Localization & Reaction Game

ทดสอบความสามารถในการ **ฟังเสียงเพื่อระบุตำแหน่งศัตรู** (sound cue) ซึ่งสำคัญมากในเกมแนว **FPS** หรือ **Tactical Shooter** เช่นการได้ยินเสียง footstep หรือ reload แล้วต้องตอบสนองให้ทันและแม่นยำ

## วิธีเล่น

- **สวมหูฟัง** เพื่อประสบการณ์ที่ดีที่สุด (ระบบใช้ HRTF spatial audio)
- หน้าจอจะมืดและมีจุดผู้เล่นอยู่ตรงกลาง
- ระบบจะส่งเสียง **footstep** (ฝีเท้า) หรือ **reload** (รีโหลด) ใน 3D
- ผู้เล่นต้อง **สะบัดเมาส์ (Flick)** ไปยังทิศทางที่ได้ยินเสียง แล้ว **คลิกซ้าย 1 ครั้ง** เพื่อยืนยัน
- ระบบจะเฉลยตำแหน่งจริงและคำนวณความคลาดเคลื่อน

## วิธีคำนวณคะแนน

```
score = successRateOverall × 0.7 + (100 − avgAngleErrorDeg × 1.1) × 0.3
```

- `successRateOverall` = % ของ trial ที่ angle error ≤ `successThresholdDeg` (default 25°)
- `accuracyScore` = `100 − avgAngleErrorDeg × 1.1` (ยิ่ง angle error น้อย ยิ่งคะแนนสูง)

## รูปแบบ rawData

```ts
{
  totalTrials: number;
  successCount: number;
  avgAngleErrorDeg: number;
  successRateNear: number;        // ระยะใกล้ (เสียงดัง)
  successRateMid: number;
  successRateFar: number;          // ระยะไกล (เสียงเบา)
  trials: Array<{
    angleDeg: number;              // มุมเสียงจริง
    clickAngleDeg: number | null;  // มุมที่ผู้เล่นคลิก
    angleErrorDeg: number | null;
    reactionMs: number | null;     // เวลาตอบสนอง
    distance: number;              // 0 (ใกล้) - 1 (ไกล)
    soundType: "footstep" | "reload";
    success: boolean | null;
  }>;
}
```

ระบบหลักจะเก็บ `rawData` ลง column `raw_data_json` เพื่อใช้วิเคราะห์เชิงลึก เช่น:
- ผู้เล่นแยก left/right ดีกว่า front/back ไหม
- ระยะไกลหูไวลดลงกี่ %
- footstep กับ reload ต่างกันไหม

## วิธีใช้ใน main app ของอาจารย์

```tsx
import AuditoryLocalizationGame from "@/games/auditory-localization/AuditoryLocalizationGame";

<AuditoryLocalizationGame
  playerId={currentPlayer.id}
  sessionId={currentSession.id}
  onGameComplete={(result) => {
    saveToDatabase(result);
    goToNextGame();
  }}
/>
```

## Props

| prop | type | required | default | description |
|---|---|---|---|---|
| `playerId` | `string` | ✓ | — | ระบบหลักส่งมาให้ |
| `sessionId` | `string` | ✓ | — | ระบบหลักส่งมาให้ |
| `onGameComplete` | `(result: GameResult) => void` | ✓ | — | callback เมื่อจบเกม |
| `trials` | `number` | — | `10` | จำนวนรอบที่จะเล่น |
| `successThresholdDeg` | `number` | — | `25` | เกณฑ์ angle error ที่ถือว่าสำเร็จ |

## หมายเหตุทางเทคนิค

- ใช้ `Web Audio API` + `PannerNode` panningModel = `"HRTF"` (เปิด HRTF ในเบราว์เซอร์ทุกตัวที่รองรับ)
- เสียงทั้ง footstep และ reload **synthesize ในเบราว์เซอร์** ไม่โหลดไฟล์เสียง — ลด deploy footprint
- ก่อนเริ่มเกมต้อง user-gesture (คลิกปุ่มเริ่ม) เพื่อปลดล็อก AudioContext ตามนโยบายของเบราว์เซอร์

## ไฟล์ในโมดูลนี้

```
auditory-localization/
├─ AuditoryLocalizationGame.tsx   เกมหลัก (component + sub-components)
├─ logic.ts                        audio + helpers + buildResult + custom hook
├─ types.ts                        internal types
└─ README.md                       ไฟล์นี้
```
