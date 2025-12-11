// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agrishare",
  description: "Land & agriculture sharing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="text-lg font-bold">Agrishare</div>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">
                Ana Sayfa
              </a>
              <a href="/lands" className="hover:underline">
                Araziler
              </a>
              <a href="/owner/dashboard" className="hover:underline">
                Arazi Sahibi
              </a>
              <a href="/entrepreneur/dashboard" className="hover:underline">
                Girişimci
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
