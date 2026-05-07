# Auditory Localization & Reaction Game

เกมทดสอบการระบุทิศทางจากเสียง 3D เหมาะกับผู้เล่น FPS / Tactical Shooter ที่ต้องใช้ sound cue เช่น footsteps หรือ reload

## วิธีเล่น

1. ใส่หูฟัง
2. กดทดสอบเสียงซ้าย/ขวาเพื่อเช็กอุปกรณ์
3. กดเริ่มทดสอบ
4. เมื่อได้ยินเสียง ให้คลิกตำแหน่งที่คิดว่าเสียงมาจากทิศนั้น
5. ถ้าไม่คลิกภายในเวลาที่กำหนด จะถูกนับเป็น missed/timeout

## ค่าที่วัด

- `score` คะแนนรวม 0-100
- `accuracy` เปอร์เซ็นต์รอบที่คลิกใกล้ทิศจริงตาม threshold
- `reactionTimeMs` เวลาเฉลี่ยหลังเสียงเล่นจนถึงคลิก
- `avgAngleErrorDeg` ความคลาดเคลื่อนเฉลี่ยเป็นองศา
- `successRateNear/Mid/Far` อัตราสำเร็จตามระยะเสียง
- `missedCount` จำนวนรอบที่ไม่ตอบทันเวลา

## Props

| prop | type | default | description |
|---|---|---:|---|
| `playerId` | `string` | - | ระบบหลักส่งมาให้ |
| `sessionId` | `string` | - | ระบบหลักส่งมาให้ |
| `onGameComplete` | `(result: GameResult) => void` | - | callback เมื่อเกมจบ |
| `trials` | `number` | `10` | จำนวนรอบทดสอบ |
| `successThresholdDeg` | `number` | `25` | ค่าคลาดเคลื่อนสูงสุดที่ถือว่าสำเร็จ |
| `responseTimeoutMs` | `number` | `3000` | เวลาตอบต่อรอบ |

## rawData

```ts
{
  totalTrials: number;
  successCount: number;
  missedCount: number;
  avgAngleErrorDeg: number;
  successRateNear: number;
  successRateMid: number;
  successRateFar: number;
  trials: Array<{
    index: number;
    angleDeg: number;
    clickAngleDeg: number | null;
    angleErrorDeg: number | null;
    reactionMs: number | null;
    distance: number;
    soundType: "footstep" | "reload";
    success: boolean | null;
    timedOut: boolean;
  }>;
}
```
