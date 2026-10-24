"use client";

import { visibleLands } from "@/lib/visibleLands";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, ArrowRight, ArrowUpRight,
  Sprout, CloudSun, BrainCircuit,
  ChartNoAxesCombined, Handshake, ShieldCheck
} from "lucide-react";
import LandCard from "@/components/LandCard";
import { cities, useLands } from "@/lib/lands";

export default function Home() {
  const router = useRouter();
  const lands = visibleLands(useLands());
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (city) params.set("sehir", city);
    router.push(`/araziler?${params.toString()}`);
  }

  return (
    <main>
      <section className="mx-auto max-w-7xl px-5 pt-7 sm:px-8">
        <div className="hero-bg overflow-hidden rounded-[30px] px-7 py-20 text-white sm:px-16 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold text-lime-200">
              <Sprout size={16} />
              TOPRAĞIN POTANSİYELİNİ KEŞFET
            </span>

            <h1 className="mt-7 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              Tarımda yeni bir{" "}
              <span className="text-[#c5e69b]">başlangıç</span> burada.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/80">
              Hayalindeki araziyi bul, toprağını değerlendir,
              geleceğin tarımını birlikte büyüt.
            </p>

            <form
              onSubmit={search}
              className="mt-9 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl md:flex-row"
            >
              <label className="flex flex-1 items-center gap-3 px-4 py-3 text-green-800">
                <Search size={21} />
                <span className="sr-only">Arama</span>
                <input
                  className="w-full min-w-0 bg-transparent text-sm text-green-950 outline-none"
                  placeholder="Nasıl bir arazi arıyorsun?"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
              </label>

              <label className="flex items-center gap-2 border-t border-green-100 px-4 py-3 text-green-800 md:border-l md:border-t-0">
                <MapPin size={20} />
                <span className="sr-only">Şehir</span>
                <select
                  className="w-full bg-transparent text-sm text-green-950 outline-none"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                >
                  <option value="">Tüm şehirler</option>
                  {cities.map(item => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#b4df86] px-7 py-4 text-sm font-black text-green-950 hover:bg-lime-200"
              >
                Arazi Ara <ArrowRight size={18} />
              </button>
            </form>

            <p className="mt-7 flex items-center gap-2 text-xs text-white/70">
              <ShieldCheck size={17} />
              Arazi bilgileri ve üretim fırsatları tek platformda
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-green-100 bg-white p-7">
          <div className="flex items-center gap-4">
            <span className="rounded-2xl bg-green-50 p-4 text-green-800">
              <Sprout size={27} />
            </span>
            <div>
              <h2 className="font-bold">Kullanmadığın arazin mi var?</h2>
              <p className="mt-1 text-sm text-gray-500">
                Arazini ilan olarak yayınla ve üreticilerle buluş.
              </p>
            </div>
          </div>
          <Link href="/ilan-ver" className="flex items-center gap-2 text-sm font-bold text-green-800">
            Ücretsiz ilan ver <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[.2em] text-green-700">
              ARAZİ FIRSATLARI
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Keşfedilmeyi bekleyen araziler
            </h2>
            <p className="mt-3 text-sm text-gray-500">
              Sana uygun araziyi bul ve tarımsal üretime ilk adımı at.
            </p>
          </div>
          <Link href="/araziler" className="flex items-center gap-2 rounded-full border border-green-200 px-5 py-3 text-sm font-semibold">
            Tüm ilanlar <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lands.slice(0, 6).map(land => (
            <LandCard key={land.id} land={land} />
          ))}
        </div>
        <p className="mt-5 text-xs text-gray-400">
          Bu sürümdeki ilanlar örnek amaçlıdır.
        </p>
      </section>

      <section className="mt-12 bg-[#eaf2e6] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-center text-3xl font-black">
            Agrishare nasıl çalışır?
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "Arazi keşfet",
                text: "Konum, arazi büyüklüğü ve kullanım türüne göre ilanları incele."
              },
              {
                icon: Handshake,
                title: "İş birliği kur",
                text: "Arazi sahibiyle buluş, kiralama veya ortak üretimi değerlendir."
              },
              {
                icon: Sprout,
                title: "Üretimini planla",
                text: "İleride iklim ve finansal analizlerle üretim kararını destekle."
              }
            ].map((item, index) => (
              <div key={item.title} className="rounded-3xl bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="rounded-2xl bg-green-50 p-4 text-green-800">
                    <item.icon size={27} />
                  </span>
                  <span className="text-3xl font-black text-green-100">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-gray-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-3xl bg-[#16402e] p-9 text-white sm:p-14">
          <p className="text-xs font-bold tracking-widest text-lime-300">
            AGRISHARE INTELLIGENCE
          </p>
          <h2 className="mt-5 text-3xl font-black sm:text-4xl">
            Tarım kararlarını veriyle destekle.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            Konuma özel iklim analizi, gelir simülasyonu ve yapay zekâ
            destekli ürün önerileri sıradaki geliştirme aşamalarımız.
          </p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { icon: CloudSun, text: "İklim analizi" },
              { icon: ChartNoAxesCombined, text: "Gelir simülasyonu" },
              { icon: BrainCircuit, text: "AI tarım danışmanı" }
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-5">
                <item.icon className="text-lime-300" size={26} />
                <span className="text-sm font-semibold">{item.text}</span>
              </div>
            ))}
          </div>

          <Link href="/analiz" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#b5df86] px-6 py-3 text-sm font-bold text-green-950">
            Özellikleri keşfet <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
