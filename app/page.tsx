import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="home-hero">
        <h1>E-Sport Skill Tester</h1>
        <p>
          ชุดเกมเล็กๆ สำหรับวัดทักษะนักกีฬา E-sport
          เริ่มต้นด้วย 2 บททดสอบหลักด้านล่างนี้
          แต่ละเกมเป็น React Component ที่นำไปต่อยอดรวมกับเกมอื่นๆ ได้
        </p>
      </section>

      <section className="home-grid">
        <Link href="/peripheral" className="home-card">
          <span className="home-card-tag">Test 01</span>
          <h3>Peripheral Awareness Test</h3>
          <p>
            ฝึกการประมวลผลข้อมูลรอบนอก โฟกัสเป้าหมายกลางจอพร้อมกับสังเกตสัญลักษณ์ที่โผล่ตามมุมจอ
            วัด Peripheral Accuracy, Tracking Deviation, Detection Speed
          </p>
          <span className="home-card-cta">เริ่มทดสอบ →</span>
        </Link>

        <Link href="/auditory" className="home-card">
          <span className="home-card-tag">Test 02</span>
          <h3>Auditory Localization & Reaction</h3>
          <p>
            ฝึกระบุทิศทางจากเสียง 3D ในเกม FPS / Tactical Shooter
            สะบัดเมาส์ไปทิศที่ได้ยินแล้วคลิกยืนยัน
            วัด Angle Error, Audio Reaction Time, Success Rate by Distance
          </p>
          <span className="home-card-cta">เริ่มทดสอบ →</span>
        </Link>
      </section>
    </div>
  );
}
