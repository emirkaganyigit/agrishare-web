// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AuthButton from "./components/AuthButton";

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
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            {/* Sol taraf: Logo / Başlık */}
            <div className="text-lg font-bold">Agrishare</div>

            {/* Orta: Navigation */}
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="hover:underline">
                Ana Sayfa
              </a>
              <a href="/lands" className="hover:underline">
                Araziler
              </a>
            </nav>

            {/* Sağ taraf: Auth */}
            <AuthButton />
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
