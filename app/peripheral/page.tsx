import PeripheralAwarenessTest from "@/components/PeripheralAwarenessTest";

export default function PeripheralPage() {
  return (
    <div>
      <h1 className="game-page-title">Peripheral Awareness Test</h1>
      <p className="game-page-desc">
        ใช้เมาส์ประคองวงกลมกลางจอตลอดเวลา
        ขณะเดียวกันให้สังเกตสัญลักษณ์ตัวเลข (1, 2, 3, 4)
        ที่โผล่ขึ้นมาตามมุมจอเสี้ยววินาที แล้วกดเลขนั้นบนคีย์บอร์ดให้ทัน
        โดยที่สายตาและเมาส์ยังต้องอยู่ที่เป้าหมายกลางจอ
      </p>
      <PeripheralAwarenessTest durationSec={60} />
    </div>
  );
}
