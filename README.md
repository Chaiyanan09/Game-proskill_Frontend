# E-Sport Skill Tester 🎮

ชุดเกมเล็กๆ สำหรับทดสอบทักษะนักกีฬา E-sport เขียนด้วย **Next.js + TypeScript** และจัดสไตล์ด้วย **Global CSS** พร้อม deploy ขึ้น **Vercel**

โปรเจคนี้ทำเฉพาะ **Frontend** (ยังไม่มี Backend) แต่ละเกมแยกเป็น React Component ในโฟลเดอร์ `components/` เพื่อให้นำไปรวมกับเกมของคนอื่นได้ง่าย

## 🎯 เกมที่มีอยู่

### 1. Peripheral Awareness Test (`/peripheral`)
ทดสอบการประมวลผลข้อมูลรอบนอก
- ใช้เมาส์ประคองเป้าหมายตรงกลางจอ
- กดเลข 1-4 บนคีย์บอร์ดให้ตรงกับสัญลักษณ์ที่โผล่ตามมุมจอ
- วัดผล: **Peripheral Accuracy (%)**, **Tracking Deviation (px)**, **Detection Speed (ms)**

### 2. Auditory Localization & Reaction (`/auditory`)
ทดสอบการระบุทิศทางจากเสียง (FPS / Tactical Shooter)
- ฟังเสียง footstep / reload ผ่านระบบเสียง 3D (HRTF)
- คลิกเมาส์ไปทิศทางที่ได้ยิน
- วัดผล: **Angle Error (°)**, **Audio Reaction Time (ms)**, **Success Rate by Distance**

---

## 📁 โครงสร้างโปรเจค

```
Game Proskill/
├── app/
│   ├── layout.tsx              # Root layout + nav
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global CSS ทั้งหมด
│   ├── peripheral/page.tsx     # หน้าเกม 1
│   └── auditory/page.tsx       # หน้าเกม 2
├── components/
│   ├── PeripheralAwarenessTest.tsx
│   └── AuditoryLocalizationTest.tsx
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 🚀 เริ่มต้นใน VS Code (Step-by-step)

### 1. ติดตั้งสิ่งที่ต้องใช้

ติดตั้งให้เรียบร้อยก่อน:

- **Node.js** (เวอร์ชัน 18 ขึ้นไป) → https://nodejs.org/
- **Git** → https://git-scm.com/downloads
- **VS Code** → https://code.visualstudio.com/

ตรวจเช็กว่าติดตั้งครบ เปิด terminal ขึ้นมาแล้วพิมพ์:
```bash
node -v
npm -v
git --version
```

### 2. เปิดโปรเจคใน VS Code

```bash
cd "D:\Proskill\Game Proskill"
code .
```

หรือเปิด VS Code แล้ว File → Open Folder → เลือกโฟลเดอร์ `Game Proskill`

### 3. ติดตั้ง dependencies

เปิด terminal ใน VS Code (Ctrl + `` ` ``) แล้วรัน:

```bash
npm install
```

### 4. รัน dev server

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ **http://localhost:3000**

---


## 🧩 การนำ Component ไปใช้ในโปรเจคอื่น

ทั้งสอง component ออกแบบมาให้ standalone — แค่ก็อปไฟล์ใน `components/` กับ class ที่เกี่ยวข้องใน `globals.css` ไปวางในโปรเจค Next.js / React โปรเจคอื่นได้เลย

### ตัวอย่างการเรียกใช้

```tsx
import PeripheralAwarenessTest from "@/components/PeripheralAwarenessTest";

export default function MyPage() {
  return (
    <PeripheralAwarenessTest
      durationSec={60}
      cueLifeMs={700}
      cueIntervalMs={[900, 2100]}
      onFinish={(result) => {
        // ส่งผลไปยัง backend / state ของเกมรวม
        console.log(result);
        // {
        //   totalCues: number,
        //   correctCount: number,
        //   missedCount: number,
        //   wrongCount: number,
        //   accuracyPct: number,
        //   avgDetectionMs: number,
        //   avgTrackingDeviationPx: number,
        // }
      }}
    />
  );
}
```

```tsx
import AuditoryLocalizationTest from "@/components/AuditoryLocalizationTest";

<AuditoryLocalizationTest
  trials={10}
  successThresholdDeg={25}
  onFinish={(result) => {
    // {
    //   totalTrials, avgAngleErrorDeg, avgReactionMs,
    //   successRateOverall, successRateNear, successRateMid, successRateFar
    // }
  }}
/>
```

---

## 🛠 Scripts

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | เปิด dev server ที่ localhost:3000 |
| `npm run build` | build production |
| `npm start` | รัน production server (ต้อง build ก่อน) |
| `npm run lint` | ตรวจ lint |

---

## 📌 หมายเหตุ

- เสียงในเกม Auditory ถูกสร้างผ่าน **Web Audio API** ไม่ต้องโหลดไฟล์เสียงเพิ่ม
- ใช้ **PannerNode + HRTF** เพื่อให้รู้สึกถึงทิศทางจริง — แนะนำใส่หูฟังตอนเล่น
- Component เป็น `"use client"` เพราะต้องใช้ DOM/Audio APIs

Have fun! 🎮
