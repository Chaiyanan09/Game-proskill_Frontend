import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "E-Sport Skill Tester",
  description:
    "ชุดเกมทดสอบความสามารถของนักกีฬา E-sport - Peripheral Awareness และ Auditory Localization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <Link href="/" className="app-header-title">
              <span>E-Sport</span> Skill Tester
            </Link>
            <nav className="app-nav">
              <Link href="/">Home</Link>
              <Link href="/peripheral">Peripheral</Link>
              <Link href="/auditory">Auditory</Link>
            </nav>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">
            Built with Next.js + TypeScript • Deploy on Vercel
          </footer>
        </div>
      </body>
    </html>
  );
}
