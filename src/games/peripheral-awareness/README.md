# Peripheral Awareness Game

เกมทดสอบการประมวลผลข้อมูลรอบนอกของผู้เล่นเกม โดยให้ผู้เล่นประคองเป้าหมายกลางจอด้วยเมาส์ และกดเลข `1 2 3 4` ให้ตรงกับ cue ที่โผล่ตามมุมจอ

## วิธีเล่น

1. กดเริ่มทดสอบ
2. ใช้เมาส์ประคองวงกลมตรงกลางจอให้ใกล้เป้าหมายมากที่สุด
3. เมื่อมีตัวเลขโผล่ตามมุม ให้กดเลขนั้นบนคีย์บอร์ดก่อน cue หาย
4. ถ้ากดเลขตอนยังไม่มี cue จะถูกนับเป็น `falsePressCount`

## ค่าที่วัด

- `score` คะแนนรวม 0-100
- `accuracy` เปอร์เซ็นต์ cue ที่ตอบถูก
- `reactionTimeMs` เวลาเฉลี่ยที่ตอบ cue
- `avgTrackingDeviationPx` ระยะห่างเฉลี่ยระหว่างเมาส์กับเป้าหมาย
- `falsePressCount` จำนวนครั้งที่กดก่อนมี cue

## Props

| prop | type | default | description |
|---|---|---:|---|
| `playerId` | `string` | - | ระบบหลักส่งมาให้ |
| `sessionId` | `string` | - | ระบบหลักส่งมาให้ |
| `onGameComplete` | `(result: GameResult) => void` | - | callback เมื่อเกมจบ |
| `durationSec` | `number` | `60` | ระยะเวลาทดสอบ |
| `cueLifeMs` | `number` | `700` | ระยะเวลาที่ cue อยู่บนจอ |
| `cueIntervalMs` | `[number, number]` | `[900, 2100]` | ช่วงสุ่มระยะห่างระหว่าง cue |

## rawData

```ts
{
  totalCues: number;
  correctCount: number;
  missedCount: number;
  wrongCount: number;
  falsePressCount: number;
  avgTrackingDeviationPx: number;
  cues: Array<{
    corner: "TL" | "TR" | "BL" | "BR";
    symbol: 1 | 2 | 3 | 4;
    correct: boolean | null;
    responseMs: number | null;
    trackingDevAtSpawn: number | null;
  }>;
}
```
