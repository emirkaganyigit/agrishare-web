"use client";

import { visibleLands } from "@/lib/visibleLands";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Ruler, Droplets, Sprout } from "lucide-react";
import { useLands, formatPrice, formatArea } from "@/lib/lands";
import OfferForm from "@/components/OfferForm";
import LandLocationPicker from "@/components/LandLocationPicker";
import LandClimatePanel from "@/components/LandClimatePanel";

export default function DetailPage() {
  const params = useParams<{ id: string }>();
  const lands = visibleLands(useLands());
  const land = lands.find(item => item.id === params.id);

  if (!land) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-20">
        <h1 className="text-2xl font-bold">İlan yükleniyor veya bulunamadı</h1>
        <Link className="mt-5 inline-block text-green-700" href="/araziler">
          İlanlara dön
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <Link
        href="/araziler"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
      >
        <ArrowLeft size={17} /> İlanlara dön
      </Link>

      <div className="mt-7 grid gap-9 lg:grid-cols-[1fr_350px]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={land.image}
            alt={land.title}
            className="h-[350px] w-full rounded-3xl object-cover sm:h-[450px]"
          />

          <span className="mt-8 inline-block rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-800">
            {land.type}
          </span>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            {land.title}
          </h1>

          <p className="mt-4 flex items-center gap-2 text-gray-500">
            <MapPin size={19} /> {land.district}, {land.city}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-2xl bg-white p-6">
              <Ruler className="text-green-700" />
              <div>
                <p className="text-xs text-gray-400">Arazi büyüklüğü</p>
                <p className="font-bold">{formatArea(land.area)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-white p-6">
              <Droplets className="text-green-700" />
              <div>
                <p className="text-xs text-gray-400">Sulama durumu</p>
                <p className="font-bold">
                  {land.irrigation ? "Sulama var" : "Belirtilmedi"}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-7 rounded-2xl bg-white p-7">
            <h2 className="text-xl font-bold">Arazi hakkında</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-gray-600">
              {land.description}
            </p>
          </section>

          {land.latitude != null && land.longitude != null && (
            <section className="mt-7 rounded-3xl bg-white p-7">
              <h2 className="mb-5 text-xl font-bold">
                Arazinin yaklaşık konumu
              </h2>
              <LandLocationPicker
                latitude={land.latitude}
                longitude={land.longitude}
                readOnly
              />
            </section>
          )}

          <div className="mt-7">
            <LandClimatePanel
              latitude={land.latitude ?? null}
              longitude={land.longitude ?? null}
            />
          </div>

          <div className="mt-7 rounded-3xl bg-[#16402e] p-7 text-white">
            <h2 className="text-xl font-bold">
              Bu arazinin gelir potansiyelini hesapla
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Farklı ürün ve maliyet senaryolarını karşılaştır.
              Hesaplamalar varsayımsaldır.
            </p>
            <Link
              href={`/simulasyon?arazi=${encodeURIComponent(land.id)}`}
              className="mt-6 inline-flex rounded-xl bg-lime-200 px-6 py-3 text-sm font-bold text-green-950"
            >
              Gelir Simülasyonu Yap
            </Link>
            <Link
              href={`/danisman?arazi=${encodeURIComponent(land.id)}`}
              className="mt-3 inline-flex rounded-xl border border-lime-200 px-6 py-3 text-sm font-bold text-white sm:ml-3"
            >
              AI ile Değerlendir
            </Link>
            <Link
              href={`/eslestirme?arazi=${encodeURIComponent(land.id)}`}
              className="mt-3 inline-flex rounded-xl border border-lime-200 px-6 py-3 text-sm font-bold text-white sm:ml-3"
            >
              Ürünleri Karşılaştır
            </Link>
            <Link
              href={`/rapor?arazi=${encodeURIComponent(land.id)}`}
              className="mt-3 inline-flex rounded-xl border border-lime-200 px-6 py-3 text-sm font-bold text-white sm:ml-3"
            >
              Arazi Raporunu Gör
            </Link>
          </div>
        </div>

        <aside>
          <div className="sticky top-28 rounded-3xl border border-green-100 bg-white p-7 shadow-sm">
            <p className="text-sm text-gray-400">
              {land.type === "Kiralık"
                ? "Yıllık kira bedeli"
                : land.type === "Satılık"
                ? "Satış bedeli"
                : "Temsili teklif bedeli"}
            </p>

            <p className="mt-2 text-3xl font-black text-green-900">
              {formatPrice(land.price)}
            </p>

            <div className="my-7 border-t border-green-100" />

            <OfferForm landId={land.id} />
          </div>
        </aside>
      </div>
    </main>
  );
}
