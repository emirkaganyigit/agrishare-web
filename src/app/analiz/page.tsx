import Link from "next/link";

import {
  BrainCircuit,
  CloudSun,
  Calculator,
  Sprout,
  ArrowUpRight,
  FileText
} from "lucide-react";

const modules = [
  {
    title: "Kapsamlı Arazi Raporu",
    description:
      "İklim, toprak, ürün ve finans verilerini tek raporda birleştir. PDF olarak kaydet.",
    icon: FileText,
    href: "/rapor",
    ready: true
  },
  {
    title: "AI Tarım Danışmanı",
    description:
      "Arazi, iklim ve gelir verilerini yapay zekâ ile değerlendir.",
    icon: BrainCircuit,
    href: "/danisman",
    ready: true
  },
  {
    title: "Tarımsal Gelir Simülatörü",
    description:
      "Ürün verimini, üretim giderlerini ve gelir senaryolarını hesapla.",
    icon: Calculator,
    href: "/simulasyon",
    ready: true
  },
  {
    title: "İklim Analizi",
    description:
      "Arazi ilanlarında geçmiş sıcaklık, yağış ve don verilerini incele.",
    icon: CloudSun,
    href: "/araziler",
    ready: true
  },
  {
    title: "Akıllı Ürün Eşleştirme",
    description:
      "Arazilerin geçmiş iklim verileriyle üç ürünü karşılaştır.",
    icon: Sprout,
    href: "/eslestirme",
    ready: true
  }
];

export default function AnalysisPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <p className="text-xs font-bold tracking-widest text-green-700">
        AGRISHARE INTELLIGENCE
      </p>

      <h1 className="mt-5 text-4xl font-black sm:text-5xl">
        Akıllı Tarım Analizi
      </h1>

      <p className="mt-5 max-w-2xl text-sm leading-8 text-gray-500">
        Tarımsal üretim kararlarını gerçek iklim verileri,
        örnek finansal modeller ve yapay zekâyla destekle.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {modules.map(module => (
          <article
            key={module.title}
            className="rounded-3xl border border-green-100 bg-white p-8 shadow-sm"
          >
            <span className="inline-flex rounded-2xl bg-green-50 p-4 text-green-800">
              <module.icon size={29} />
            </span>

            <div className="mt-6">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                module.ready
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-50 text-yellow-800"
              }`}>
                {module.ready ? "AKTİF" : "YAKINDA"}
              </span>
            </div>

            <h2 className="mt-5 text-xl font-bold">
              {module.title}
            </h2>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              {module.description}
            </p>

            {module.ready && (
              <Link
                href={module.href}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-bold text-white"
              >
                Özelliği Aç
                <ArrowUpRight size={17} />
              </Link>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
