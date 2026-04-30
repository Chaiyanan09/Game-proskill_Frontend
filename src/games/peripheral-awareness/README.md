# Peripheral Awareness Game

ทดสอบความสามารถในการ **ประมวลผลข้อมูลรอบนอก** ของผู้เล่นเกม FPS / MOBA — โฟกัสเป้าหมายหลักไปพร้อมกับสังเกตสิ่งที่เกิดขึ้นรอบขอบจอ (เปรียบเหมือนการมอง mini-map หรือเช็กศัตรูที่โผล่มาด้านข้าง)

## วิธีเล่น

- ใช้เมาส์ประคอง **วงกลมที่กำลังเคลื่อนที่ตรงกลางจอ** ตลอดเวลา
- เมื่อมีสัญลักษณ์ตัวเลข `1 2 3 4` โผล่ขึ้นที่ **มุมจอ** เพียงเสี้ยววินาที ให้กดเลขนั้นบน **คีย์บอร์ด** ให้ทัน
- โดยที่สายตาและเมาส์ยังต้องอยู่ที่เป้าหมายกลางจอ

## วิธีคำนวณคะแนน

```
score = accuracy × 0.7 + (100 − avgTrackingDeviationPx) × 0.3
```

- `accuracy` = % ของ cue ที่ตอบถูก (0–100)
- `trackingScore` = `100 − avgTrackingDeviationPx` (ยิ่งเมาส์อยู่ใกล้เป้าหมาย ยิ่งคะแนนสูง)

ถ้า `avgTrackingDeviationPx` เกิน 100 จะถือเป็น 0

## รูปแบบ rawData

```ts
{
  totalCues: number;
  correctCount: number;
  missedCount: number;
  wrongCount: number;
  avgTrackingDeviationPx: number;
  cues: Array<{
    corner: "TL" | "TR" | "BL" | "BR";
    symbol: 1 | 2 | 3 | 4;
    correct: boolean | null;        // null = ไม่ได้ตอบ (missed)
    responseMs: number | null;
    trackingDevAtSpawn: number | null;
  }>;
}
```

ระบบหลักจะเก็บ `rawData` ลง column `raw_data_json` เพื่อใช้วิเคราะห์เชิงลึก เช่น:
- ผู้เล่นพลาด cue ที่มุมไหนบ่อยสุด
- เวลา reaction ของแต่ละมุมต่างกันไหม
- ตอนเจอ cue เมาส์อยู่ห่างเป้าหมายเท่าไร

## วิธีใช้ใน main app ของอาจารย์

```tsx
import PeripheralAwarenessGame from "@/games/peripheral-awareness/PeripheralAwarenessGame";

<PeripheralAwarenessGame
  playerId={currentPlayer.id}
  sessionId={currentSession.id}
  onGameComplete={(result) => {
    // result เป็นรูปแบบ GameResult ตาม contract
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
| `durationSec` | `number` | — | `60` | ระยะเวลาทดสอบ (วินาที) |
| `cueLifeMs` | `number` | — | `700` | สัญลักษณ์โผล่อยู่นานเท่าไหร่ |
| `cueIntervalMs` | `[number, number]` | — | `[900, 2100]` | ช่วงห่างระหว่าง cue (min, max) |

## ไฟล์ในโมดูลนี้

```
peripheral-awareness/
├─ PeripheralAwarenessGame.tsx   เกมหลัก (component + sub-components)
├─ logic.ts                       pure helpers + buildResult + custom hook
├─ types.ts                       internal types + constants
└─ README.md                      ไฟล์นี้
```
