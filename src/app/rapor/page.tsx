"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import {
  FileText,
  Printer,
  CloudSun,
  FlaskConical,
  Sprout,
  Calculator,
  BrainCircuit,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";

import {
  useLands,
  formatPrice,
  formatArea
} from "@/lib/lands";

import {
  assessCrops,
  type ClimateSummary
} from "@/lib/cropSuitability";

import {
  screenSoil,
  type SoilProfile
} from "@/lib/soilScreening";

import {
  crops,
  scenarios,
  runScenario,
  type CropKey
} from "@/lib/simulation";

import { supabase } from "@/lib/supabase";
import "./print.css";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 1
  }).format(n);

type ReportSnapshot = {
  landId: string;
  climate: ClimateSummary;
  soil: SoilProfile | null;
};

function Section({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="report-section rounded-2xl border border-green-100 bg-white p-6">
      <h2 className="text-xl font-black text-green-950">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function LandReportPage() {
  const allLands = useLands();

  const [landId, setLandId] = useState("");
  const [crop, setCrop] = useState<CropKey>("bugday");

  const [snapshot, setSnapshot] =
    useState<ReportSnapshot | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [aiAnswer, setAiAnswer] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const id = params.get("arazi");
    const requestedCrop = params.get("urun");

    if (id) setLandId(id);

    if (
      requestedCrop &&
      Object.prototype.hasOwnProperty.call(
        crops,
        requestedCrop
      )
    ) {
      setCrop(requestedCrop as CropKey);
    }
  }, []);

  const lands = allLands.filter(
    item =>
      UUID.test(item.id) &&
      item.latitude != null &&
      item.longitude != null
  );

  const land = lands.find(item => item.id === landId);

  // Araziye ait iklim ve toprak verilerini birlikte getir.
  useEffect(() => {
    const client = supabase;

    setSnapshot(null);
    setError("");
    setAiAnswer("");
    setAiError("");

    if (!landId || !land || !client) {
      setLoading(false);
      return;
    }

    const latitude = land.latitude;
    const longitude = land.longitude;

    if (latitude == null || longitude == null) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);

      try {
        const climateRequest = fetch(
          `/api/climate?lat=${latitude}&lon=${longitude}`,
          { signal: controller.signal }
        );

        const soilRequest = client!
          .from("land_soil_profiles")
          .select(
            "ph,ece_dsm,organic_matter_pct,texture,drainage,sampled_at"
          )
          .eq("land_id", landId)
          .maybeSingle();

        const [climateResponse, soilResponse] =
          await Promise.all([
            climateRequest,
            soilRequest
          ]);

        if (!climateResponse.ok) {
          const details = await climateResponse.json();
          throw new Error(
            details.error || "İklim verisi alınamadı."
          );
        }

        if (soilResponse.error) {
          throw new Error(soilResponse.error.message);
        }

        const climateData =
          (await climateResponse.json()) as ClimateSummary;

        const raw = soilResponse.data;

        const soil: SoilProfile | null = raw
          ? {
              ph:
                raw.ph == null
                  ? null
                  : Number(raw.ph),

              ece_dsm:
                raw.ece_dsm == null
                  ? null
                  : Number(raw.ece_dsm),

              organic_matter_pct:
                raw.organic_matter_pct == null
                  ? null
                  : Number(raw.organic_matter_pct),

              texture: raw.texture,
              drainage: raw.drainage,
              sampled_at: raw.sampled_at
            }
          : null;

        if (!controller.signal.aborted) {
          setSnapshot({
            landId,
            climate: climateData,
            soil
          });
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Rapor verileri yüklenemedi."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [landId, land]);

  // Yalnızca doğru araziye ait veri kullanılır.
  const ready =
    !!land &&
    !!snapshot &&
    snapshot.landId === land.id;

  const analysis = useMemo(() => {
    if (!ready || !land || !snapshot) return null;

    try {
      const rows = assessCrops(
        snapshot.climate,
        Number(land.area),
        land.type,
        Number(land.price),
        land.irrigation
      ).map(item => {
        const soilReview = screenSoil(
          snapshot.soil,
          item.crop
        );

        const combined =
          soilReview.soilScore === null
            ? null
            : Math.round(
                item.index * 0.6 +
                soilReview.soilScore * 0.4
              );

        return {
          ...item,
          soilReview,
          combined,
          rankingIndex: combined ?? item.index
        };
      }).sort(
        (a, b) => b.rankingIndex - a.rankingIndex
      );

      return { rows, error: "" };
    } catch (err) {
      return {
        rows: [],
        error:
          err instanceof Error
            ? err.message
            : "Hesaplama yapılamadı."
      };
    }
  }, [ready, land, snapshot]);

  const selected = analysis?.rows.find(
    item => item.crop === crop
  );

  const financial = useMemo(() => {
    if (!ready || !land) return [];

    const preset = crops[crop];
    const area = Number(land.area);
    const price = Number(land.price);

    const annualRentPerDecare =
      land.type === "Kiralık"
        ? price / (area / 1000)
        : 0;

    return scenarios.map(scenario =>
      runScenario(
        {
          areaM2: area,
          yieldKgPerDecare: preset.yieldKg,
          pricePerKg: preset.priceKg,
          productionCostPerDecare:
            preset.costPerDecare,
          rentPerDecare: annualRentPerDecare,
          fixedAnnualCost: 10000,
          setupCost: 0
        },
        scenario
      )
    );
  }, [ready, land, crop]);

  async function generateAI() {
    if (!land || !ready || !supabase || aiLoading) {
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiAnswer("");

    try {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !data.session?.access_token
      ) {
        throw new Error(
          "AI değerlendirmesi için giriş yapmalısın."
        );
      }

      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify({
          landId: land.id,
          crop,
          question:
            "Bu arazinin geçmiş iklim ve varsa toprak " +
            "ölçümlerini değerlendir. Seçilen ürünün " +
            "risklerini, eksik bilgileri ve temsili " +
            "finansal senaryoları açıkla."
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "AI raporu oluşturulamadı."
        );
      }

      if (typeof payload.answer !== "string") {
        throw new Error("AI yanıtı boş geldi.");
      }

      setAiAnswer(payload.answer);
    } catch (err) {
      setAiError(
        err instanceof Error
          ? err.message
          : "AI bağlantısı başarısız."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function changeLand(next: string) {
    setLandId(next);
    setAiAnswer("");
    setAiError("");
  }

  function changeCrop(next: CropKey) {
    setCrop(next);
    setAiAnswer("");
    setAiError("");
  }

  return (
    <main
      id="agrishare-report"
      className="mx-auto max-w-6xl px-5 py-12 sm:px-8"
    >
      <div className="report-no-print">
        <Link
          href="/analiz"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
        >
          <ArrowLeft size={17} />
          Akıllı Analiz
        </Link>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">
              Arazi Analiz Raporu
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              İklim, toprak, ürün ve finansal göstergeler.
            </p>
          </div>

          <button
            type="button"
            disabled={!ready || !!analysis?.error}
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <Printer size={18} />
            PDF Olarak Kaydet
          </button>
        </div>

        <div className="mt-8 grid gap-5 rounded-2xl border border-green-100 bg-white p-6 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Arazi
            <select
              value={landId}
              onChange={e => changeLand(e.target.value)}
              className="mt-2 w-full rounded-xl border border-green-100 p-3"
            >
              <option value="">Arazi seç</option>
              {lands.map(item => (
                <option key={item.id} value={item.id}>
                  {item.city} — {item.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold">
            Finansal analiz ürünü
            <select
              value={crop}
              onChange={e =>
                changeCrop(e.target.value as CropKey)
              }
              className="mt-2 w-full rounded-xl border border-green-100 p-3"
            >
              {(Object.keys(crops) as CropKey[]).map(key => (
                <option key={key} value={key}>
                  {crops[key].name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {!land && (
        <p className="report-no-print mt-8 rounded-2xl bg-white p-7 text-gray-500">
          Rapor oluşturmak için konumu kayıtlı bir
          arazi seçmelisin.
        </p>
      )}

      {land && loading && (
        <p
          role="status"
          className="report-no-print mt-8 rounded-2xl bg-white p-7"
        >
          Arazi, iklim ve toprak bilgileri yükleniyor...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="report-no-print mt-7 rounded-xl bg-red-50 p-5 text-red-700"
        >
          {error}
        </p>
      )}

      {analysis?.error && (
        <p
          role="alert"
          className="report-no-print mt-7 rounded-xl bg-red-50 p-5 text-red-700"
        >
          {analysis.error}
        </p>
      )}

      {ready && analysis && !analysis.error && selected && snapshot && (
        <div className="report-document mt-9 space-y-6">
          <div className="report-section rounded-2xl bg-[#16402e] p-8 text-white">
            <p className="text-xs font-bold tracking-widest text-lime-200">
              AGRISHARE / ARAZİ DEĞERLENDİRME
            </p>

            <h2 className="mt-4 text-3xl font-black">
              {land!.title}
            </h2>

            <p className="mt-3 text-sm text-white/80">
              {land!.district}, {land!.city}
              {" · "}
              {formatArea(land!.area)}
            </p>

            <p className="mt-6 text-xs text-white/70">
              Rapor tarihi:{" "}
              {new Date().toLocaleDateString("tr-TR")}
            </p>
          </div>

          <Section title="1. Arazi bilgileri">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <p>
                <strong>Konum:</strong>{" "}
                {land!.district}, {land!.city}
              </p>
              <p>
                <strong>Alan:</strong>{" "}
                {formatArea(land!.area)}
              </p>
              <p>
                <strong>İlan türü:</strong>{" "}
                {land!.type}
              </p>
              <p>
                <strong>Sulama beyanı:</strong>{" "}
                {land!.irrigation
                  ? "Var"
                  : "Belirtilmemiş"}
              </p>
            </div>
            <p className="mt-4 text-xs leading-6 text-gray-500">
              Konum yaklaşık koordinat üzerinden değerlendirilir.
              Parselin tam sınırları, eğimi veya rakımı
              doğrulanmış değildir.
            </p>
          </Section>

          <Section title="2. Geçmiş iklim">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [
                  "Ortalama sıcaklık",
                  `${fmt(snapshot.climate.averageTemperature)} °C`
                ],
                [
                  "Yıllık ortalama yağış",
                  `${fmt(snapshot.climate.annualPrecipitation)} mm`
                ],
                [
                  "Yıllık ortalama donlu gün",
                  `${fmt(snapshot.climate.frostDaysPerYear)} gün`
                ]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl bg-green-50 p-4"
                >
                  <p className="text-xs text-gray-500">
                    {label}
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Dönem: {snapshot.climate.period}.
              Kaynak: Open-Meteo Historical Weather API.
              Geçmiş iklim verileri hava tahmini değildir.
            </p>
          </Section>

          <Section title="3. Toprak ölçümleri">
            {!snapshot.soil ? (
              <p className="text-sm text-amber-800">
                Bu arazi için toprak analizi kaydedilmemiş.
                Birleşik iklim-toprak endeksi üretilmedi.
              </p>
            ) : (
              <>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <p>
                    <strong>pH:</strong>{" "}
                    {snapshot.soil.ph ?? "Bilinmiyor"}
                  </p>
                  <p>
                    <strong>ECe:</strong>{" "}
                    {snapshot.soil.ece_dsm == null
                      ? "Bilinmiyor"
                      : `${snapshot.soil.ece_dsm} dS/m`}
                  </p>
                  <p>
                    <strong>Organik madde:</strong>{" "}
                    {snapshot.soil.organic_matter_pct == null
                      ? "Bilinmiyor"
                      : `%${snapshot.soil.organic_matter_pct}`}
                  </p>
                  <p>
                    <strong>Numune tarihi:</strong>{" "}
                    {snapshot.soil.sampled_at || "Belirtilmemiş"}
                  </p>
                  <p>
                    <strong>Bünye:</strong>{" "}
                    {snapshot.soil.texture || "Bilinmiyor"}
                  </p>
                  <p>
                    <strong>Drenaj:</strong>{" "}
                    {snapshot.soil.drainage || "Bilinmiyor"}
                  </p>
                </div>
                <p className="mt-4 text-xs leading-6 text-gray-500">
                  Toprak bilgileri ilan sahibi beyanıdır.
                  Laboratuvar doğrulaması yapılmamıştır.
                </p>
              </>
            )}
          </Section>

          <Section title="4. Ürün karşılaştırması">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-green-100">
                    <th className="py-3">Ürün</th>
                    <th className="py-3">İklim</th>
                    <th className="py-3">Toprak</th>
                    <th className="py-3">Birleşik</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.rows.map(item => (
                    <tr
                      key={item.crop}
                      className="border-b border-green-50"
                    >
                      <td className="py-3 font-semibold">
                        {item.name}
                      </td>
                      <td className="py-3">
                        {item.index}/100
                      </td>
                      <td className="py-3">
                        {item.soilReview.soilScore === null
                          ? "Eksik veri"
                          : `${item.soilReview.soilScore}/100`}
                      </td>
                      <td className="py-3 font-bold">
                        {item.combined === null
                          ? "Hesaplanmadı"
                          : `${item.combined}/100`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 text-xs leading-6 text-gray-500">
              Puanlar deneysel tarama endeksleridir.
              İklim endeksi sıcaklık ve yağışı,
              toprak endeksi pH, ECe, bünye ve drenajı
              karşılaştırır. Birleşik endeks yalnızca
              tüm temel toprak göstergeleri varsa üretilir.
            </p>
          </Section>

          <Section title={`5. Finansal senaryolar — ${crops[crop].name}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              {financial.map(item => (
                <div
                  key={item.name}
                  className="rounded-xl bg-green-50 p-4"
                >
                  <p className="text-sm font-bold">
                    {item.name}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    Brüt gelir
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.revenue)}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    Yıllık gider
                  </p>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.totalAnnualCost)}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    Yıllık faaliyet sonucu
                  </p>
                  <p className={`mt-1 text-lg font-black ${
                    item.annualNet >= 0
                      ? "text-green-800"
                      : "text-red-700"
                  }`}>
                    {formatPrice(item.annualNet)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-6 text-gray-500">
              Ürün verimi, fiyat ve giderler temsili
              varsayımlardır. Sabit yıllık gider 10.000 TL,
              ilk yatırım gideri 0 TL kabul edilmiştir.
              Satılık ilanlarda alım bedeli dahil değildir.
              Finansal sonuçlar yatırım garantisi oluşturmaz.
            </p>
          </Section>

          <Section title="6. Bulgular ve eksik bilgiler">
            <div className="space-y-4 text-sm leading-7 text-gray-600">
              <p>
                <strong>Seçilen ürün:</strong>{" "}
                {selected.name}
              </p>
              <p>
                <strong>Mevsimsel ortalama sıcaklık:</strong>{" "}
                {fmt(selected.seasonTemperature)} °C
              </p>
              <p>
                <strong>Mevsimsel yağış:</strong>{" "}
                {fmt(selected.seasonRainfall)} mm
              </p>

              <ul className="list-disc space-y-2 pl-5">
                {[...selected.notes, ...selected.soilReview.notes]
                  .map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
              </ul>
            </div>
          </Section>

          <Section title="7. AI değerlendirmesi (isteğe bağlı)">
            <div className="report-no-print">
              <p className="text-sm leading-7 text-gray-500">
                AI değerlendirmesi, mevcut Groq kotanı kullanır.
                Bu adım isteğe bağlıdır.
              </p>

              <button
                type="button"
                disabled={aiLoading}
                onClick={generateAI}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                <BrainCircuit size={18} />
                {aiLoading
                  ? "AI analizi oluşturuluyor..."
                  : "AI Yorumunu Ekle"}
              </button>

              {aiError && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
                >
                  {aiError}
                </p>
              )}
            </div>

            {aiAnswer ? (
              <div className="report-ai-content mt-6 whitespace-pre-wrap break-words text-sm leading-8 text-gray-700">
                {aiAnswer}
              </div>
            ) : (
              <p className="report-no-print mt-4 text-sm text-gray-500">
                Henüz AI yorumu eklenmedi.
              </p>
            )}
          </Section>

          <div className="report-section rounded-2xl bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="shrink-0 text-amber-700"
                size={21}
              />
              <div className="text-xs leading-7 text-amber-950">
                <strong>Raporun sınırları:</strong>{" "}
                Bu doküman kullanıcı beyanları, bölgesel geçmiş
                iklim verileri ve doğrulanmamış deneysel
                model varsayımlarına dayanır.
                Tarımsal üretim planı, laboratuvar analizi,
                yerinde uzman incelemesi veya yatırım
                danışmanlığı yerine geçmez.
              </div>
            </div>
          </div>

          <p className="text-xs leading-6 text-gray-500">
            Veri kaynakları: Supabase üzerinde tutulan
            Agrishare ilan ve toprak kayıtları;
            Open-Meteo Historical Weather API;
            Agrishare deneysel ürün ve finans modelleri.
          </p>
        </div>
      )}
    </main>
  );
}
