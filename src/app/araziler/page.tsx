"use client";

import { visibleLands } from "@/lib/visibleLands";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import LandCard from "@/components/LandCard";
import { cities, useLands, LandType } from "@/lib/lands";

export default function LandsPage() {
  const lands = visibleLands(useLands());

  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<"Tümü" | LandType>("Tümü");
  const [sort, setSort] = useState("default");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setKeyword(params.get("q") || "");
    setCity(params.get("sehir") || "");
  }, []);

  const results = lands.filter(land => {
    const text = `${land.title} ${land.city} ${land.district} ${land.description}`.toLocaleLowerCase("tr-TR");
    return (
      (!keyword || text.includes(keyword.toLocaleLowerCase("tr-TR"))) &&
      (!city || land.city === city) &&
      (type === "Tümü" || land.type === type)
    );
  });

  if (sort === "low") results.sort((a, b) => a.price - b.price);
  if (sort === "high") results.sort((a, b) => b.price - a.price);
  if (sort === "large") results.sort((a, b) => b.area - a.area);

  const inputStyle = "w-full rounded-xl border border-green-100 bg-white px-4 py-3 text-sm outline-green-600";

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="text-xs font-bold tracking-widest text-green-700">
        AGRISHARE / ARAZİLER
      </p>
      <h1 className="mt-3 text-4xl font-black">Tarım arazilerini keşfet</h1>
      <p className="mt-3 text-gray-500">
        Kiralık, satılık ve ortak üretim fırsatlarını incele.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-green-100 bg-white p-6">
          <h2 className="mb-7 flex items-center gap-2 font-bold">
            <SlidersHorizontal size={20} /> Filtreler
          </h2>

          <div className="space-y-6">
            <label className="block text-sm font-semibold">
              Anahtar kelime
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 text-gray-400" size={19} />
                <input
                  className={`${inputStyle} pl-10`}
                  placeholder="Arazi ara..."
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
              </div>
            </label>

            <label className="block text-sm font-semibold">
              Şehir
              <select className={`mt-2 ${inputStyle}`} value={city} onChange={e => setCity(e.target.value)}>
                <option value="">Tüm şehirler</option>
                {cities.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              İlan tipi
              <select
                className={`mt-2 ${inputStyle}`}
                value={type}
                onChange={e => setType(e.target.value as "Tümü" | LandType)}
              >
                <option>Tümü</option>
                <option>Kiralık</option>
                <option>Satılık</option>
                <option>Ortak Üretim</option>
              </select>
            </label>

            <button
              onClick={() => {
                setKeyword("");
                setCity("");
                setType("Tümü");
                setSort("default");
              }}
              className="w-full rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-800 hover:bg-green-100"
            >
              Filtreleri temizle
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              <strong className="text-green-900">{results.length}</strong> ilan bulundu
            </p>

            <select
              aria-label="İlanları sırala"
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="rounded-xl border border-green-100 bg-white px-4 py-3 text-sm"
            >
              <option value="default">Önerilen sıralama</option>
              <option value="low">Fiyat: düşükten yükseğe</option>
              <option value="high">Fiyat: yüksekten düşüğe</option>
              <option value="large">Alan: büyükten küçüğe</option>
            </select>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {results.map(land => <LandCard key={land.id} land={land} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-green-100 bg-white p-12 text-center">
              <Search className="mx-auto text-green-600" size={30} />
              <h3 className="mt-4 text-lg font-bold">İlan bulunamadı</h3>
              <p className="mt-2 text-sm text-gray-500">
                Farklı filtrelerle tekrar arama yapabilirsin.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
