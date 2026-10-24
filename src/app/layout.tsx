import type { Metadata } from "next";
import Link from "next/link";
import { Leaf } from "lucide-react";
import AuthMenu from "@/components/AuthMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agrishare | Akıllı Tarım Arazisi Platformu",
  description:
    "Tarım arazilerini keşfet, ilan ver ve tarımsal iş birlikleri kur."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>
        <header className="sticky top-0 z-50 border-b border-green-950/10 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="rounded-xl bg-[#164c35] p-2.5 text-white">
                <Leaf size={23} />
              </span>
              <span className="text-2xl font-black tracking-tight">
                agri<span className="text-[#79aa50]">share.</span>
              </span>
            </Link>

            <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#42634f] sm:gap-7">
              <Link href="/araziler">Araziler</Link>
              <Link href="/analiz">Akıllı Analiz</Link>
              <Link href="/simulasyon">Gelir Simülasyonu</Link>
              <Link href="/danisman">AI Danışmanı</Link>
              <Link href="/eslestirme">Ürün Eşleştirme</Link>
              <Link href="/rapor">Arazi Raporu</Link>
              <AuthMenu />
            </nav>
          </div>
        </header>

        {children}

        <footer className="mt-20 bg-[#102f24] px-5 py-12 text-white">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row">
            <div>
              <h2 className="text-2xl font-black">agrishare.</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/65">
                Arazi sahipleri ve tarım girişimcilerini buluşturan
                dijital tarım platformu.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm text-white/70">
              <Link href="/araziler">Arazi ilanları</Link>
              <Link href="/ilan-ver">İlan oluştur</Link>
              <Link href="/analiz">Akıllı analiz</Link>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/45">
            Agrishare geliştirme sürümü
          </p>
        </footer>
      </body>
    </html>
  );
}
