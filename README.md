# E-Sport Skill Tester 🎮

โปรเจกต์นี้เป็น **Frontend Game Module** สำหรับทดสอบทักษะผู้เล่นเกม / นักกีฬา E-Sport  
พัฒนาด้วย **React + TypeScript + Vite**

โปรเจกต์นี้ **ไม่มี Backend และไม่เชื่อมต่อ Database โดยตรง**  
แต่ละเกมจะส่งผลลัพธ์กลับออกมาผ่าน `onGameComplete(result)` เพื่อให้ระบบหลักนำไปบันทึกลง Database ต่อ

---

## เกมที่มีในโปรเจกต์

### 1. Peripheral Awareness

เกมทดสอบการมองเห็นรอบข้าง สมาธิ และความเร็วในการตอบสนอง

**วิธีเล่น**
- ผู้เล่นต้องโฟกัสเป้าหมายที่อยู่กลางจอ
- ระหว่างเล่นจะมี cue / ตัวเลขโผล่ขึ้นตามตำแหน่งรอบจอ
- ผู้เล่นต้องกดปุ่มตัวเลขให้ตรงกับ cue ที่ปรากฏ

**สิ่งที่วัดผล**
- `Accuracy` — ความถูกต้องในการตอบ cue
- `Reaction Time` — เวลาตั้งแต่ cue ปรากฏจนผู้เล่นกดตอบ
- `Missed` — จำนวน cue ที่ไม่ได้ตอบภายในเวลาที่กำหนด
- `Wrong` — จำนวนครั้งที่กดผิดตอนมี cue
- `False Press` — จำนวนครั้งที่กดมั่วตอนยังไม่มี cue
- `Tracking Deviation` — ค่าความคลาดเคลื่อนในการโฟกัส/ติดตามเป้าหมายกลางจอ

---

### 2. Auditory Localization & Reaction

เกมทดสอบการฟังทิศทางเสียง ความแม่นยำ และความเร็วในการตอบสนอง

**วิธีเล่น**
- ผู้เล่นควรใส่หูฟัง
- ระบบจะสุ่มเล่นเสียง 3D จากทิศทางต่าง ๆ
- ผู้เล่นต้องคลิกตำแหน่งที่คิดว่าเสียงมาจากทิศนั้น

**สิ่งที่วัดผล**
- `Accuracy` — ความถูกต้องในการระบุทิศทางเสียง
- `Angle Error` — ค่าความคลาดเคลื่อนระหว่างทิศเสียงจริงกับตำแหน่งที่ผู้เล่นคลิก
- `Reaction Time` — เวลาตั้งแต่เสียงเริ่มเล่นจนผู้เล่นคลิกตอบ
- `Wrong` — จำนวนครั้งที่คลิกแล้วผิดทิศทาง
- `Timeout` — จำนวนครั้งที่ไม่ได้คลิกภายในเวลาที่กำหนด

---

## รูปแบบการส่งผลลัพธ์

ทุกเกมจะรับ `playerId`, `sessionId` และ `onGameComplete()` จากระบบหลัก

เมื่อเล่นจบ เกมจะส่งผลลัพธ์กลับในรูปแบบ `GameResult`

```ts
export interface GameResult {
  schemaVersion: "1.0.0";
  gameId: string;
  gameName: string;

  playerId: string;
  sessionId: string;

  status: "completed" | "aborted" | "failed";

  score: number;
  accuracy?: number;
  reactionTimeMs?: number;
  responseTimesMs?: number[];

  startedAt: string;
  endedAt: string;
  durationMs: number;

  config?: Record<string, unknown>;
  rawData: Record<string, unknown>;
}
```

แนวทางนี้ทำให้เกมสามารถนำไปเสียบกับระบบหลักได้ง่าย โดยระบบหลักเป็นฝ่ายรับผลลัพธ์ไปบันทึกลง Database เอง

---

## เริ่มใช้งานโปรเจกต์

```bash
npm install
npm run dev
```

ตรวจสอบ TypeScript:

```bash
npm run type-check
```

Build สำหรับใช้งานจริง:

```bash
npm run build
```

---

## สรุป

โปรเจกต์นี้ทำหน้าที่เป็นชุดเกมทดสอบทักษะผู้เล่น โดยแต่ละเกมถูกแยกเป็นโมดูลและส่งผลลัพธ์ออกมาเป็นรูปแบบมาตรฐาน เหมาะสำหรับนำไปเชื่อมกับระบบหลักที่มี Database และระบบจัดการผู้เล่นภายนอก
