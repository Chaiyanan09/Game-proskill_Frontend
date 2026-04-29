import AuditoryLocalizationTest from "@/components/AuditoryLocalizationTest";

export default function AuditoryPage() {
  return (
    <div>
      <h1 className="game-page-title">Auditory Localization & Reaction</h1>
      <p className="game-page-desc">
        สวมหูฟังเพื่อประสบการณ์ที่ดีที่สุด ระบบจะเล่นเสียง footstep หรือ reload
        ในตำแหน่ง 3D รอบตัวคุณ จงสะบัดเมาส์ไปยังทิศทางที่ได้ยินแล้วคลิกซ้าย 1 ครั้ง
        ระบบจะเฉลยตำแหน่งจริงและคำนวณความคลาดเคลื่อนเป็นองศา
      </p>
      <AuditoryLocalizationTest trials={10} />
    </div>
  );
}
