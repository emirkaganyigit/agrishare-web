"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";
import Link from "next/link";
import {
  Sprout,
  FileText,
  CloudSun,
  Droplets,
  Thermometer,
  ArrowRight,
  AlertTriangle,
  Calculator,
  BrainCircuit
} from "lucide-react";

import { useLands, formatPrice } from "@/lib/lands";
import {
  assessCrops,
  type ClimateSummary
} from "@/lib/cropSuitability";
import type { CropKey } from "@/lib/simulation";
import { supabase } from "@/lib/supabase";
import {
  screenSoil,
  type SoilProfile
} from "@/lib/soilScreening";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const numberFormat = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 1
});

function display(value: number) {
  return numberFormat.format(value);
}

function ScoreBar({
  value,
  label
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold text-green-950">
          {value}/100
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-green-100">
        <div
          className="h-full rounded-full bg-green-700 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function MatchingPage() {
  const allLands = useLands();

  const [landId, setLandId] = useState("");
  const [selectedCrop, setSelectedCrop] =
    useState<CropKey>("bugday");

  const [climate, setClimate] =
    useState<ClimateSummary | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [soil, setSoil] =
    useState<SoilProfile | null>(null);

  const [soilLoading, setSoilLoading] = useState(false);
  const [soilError, setSoilError] = useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(window.location.search);

    const id = params.get("arazi");

    if (id) setLandId(id);
  }, []);

  // Yalnızca konumu bulunan gerçek ilanlar.
  const lands = allLands.filter(land =>
    UUID_REGEX.test(land.id) &&
    land.latitude != null &&
    land.longitude != null
  );

  const land = lands.find(item => item.id === landId);

  const latitude = land?.latitude ?? null;
  const longitude = land?.longitude ?? null;

  // Arazi değiştiğinde yeni iklim verisini yükle.
  useEffect(() => {
    if (latitude == null || longitude == null) {
      setClimate(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    async function loadClimate() {
      setLoading(true);
      setError("");
      setClimate(null);

      try {
        const url =
          `/api/climate?lat=${latitude}&lon=${longitude}`;

        const response = await fetch(url, {
          signal: controller.signal
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(
            payload.error || "İklim verileri alınamadı."
          );
        }

        if (!controller.signal.aborted) {
          setClimate(payload as ClimateSummary);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "İklim servisine erişilemiyor."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadClimate();

    return () => controller.abort();
  }, [latitude, longitude]);

  useEffect(() => {
    const client = supabase;
    let active = true;

    setSoil(null);
    setSoilError("");

    if (!client || !UUID_REGEX.test(landId)) {
      setSoilLoading(false);
      return;
    }

    setSoilLoading(true);

    async function loadSoil() {
      const { data, error: queryError } = await client!
        .from("land_soil_profiles")
        .select(
          "ph,ece_dsm,organic_matter_pct,texture,drainage,sampled_at"
        )
        .eq("land_id", landId)
        .maybeSingle();

      if (!active) return;

      if (queryError) {
        setSoilError(queryError.message);
      } else if (data) {
        setSoil({
          ph: data.ph == null ? null : Number(data.ph),
          ece_dsm:
            data.ece_dsm == null
              ? null
              : Number(data.ece_dsm),
          organic_matter_pct:
            data.organic_matter_pct == null
              ? null
              : Number(data.organic_matter_pct),
          texture: data.texture,
          drainage: data.drainage,
          sampled_at: data.sampled_at
        });
      }

      setSoilLoading(false);
    }

    void loadSoil();

    return () => {
      active = false;
    };
  }, [landId]);

  const assessment = useMemo(() => {
    if (!climate || !land) return null;

    try {
      return {
        results: assessCrops(
          climate,
          Number(land.area),
          land.type,
          Number(land.price),
          land.irrigation
        ),
        error: ""
      };
    } catch (err) {
      return {
        results: [],
        error:
          err instanceof Error
            ? err.message
            : "Ürün karşılaştırması yapılamadı."
      };
    }
  }, [climate, land]);

  const results = assessment?.results || [];

  // Dört temel toprak verisi varsa
  // iklim %60, toprak %40 ağırlıklı endeks.
  // Eksik veri varsa yalnızca iklim puanı.
  const rankedResults = results
    .map(item => {
      const soilReview = screenSoil(soil, item.crop);

      const combinedIndex =
        soilReview.soilScore === null
          ? null
          : Math.round(
              item.index * 0.6 +
              soilReview.soilScore * 0.4
            );

      return {
        ...item,
        soilReview,
        combinedIndex,
        displayIndex: combinedIndex ?? item.index
      };
    })
    .sort((a, b) => b.displayIndex - a.displayIndex);

  const detail = rankedResults.find(
    item => item.crop === selectedCrop
  ) || rankedResults[0];

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-800">
        <Sprout size={17} />
        AGRISHARE INTELLIGENCE
      </div>

      <h1 className="mt-6 text-3xl font-black sm:text-5xl">
        Akıllı Ürün–Arazi Eşleştirme
      </h1>

      <p className="mt-5 max-w-3xl text-sm leading-8 text-gray-500">
        Bir arazi seçerek buğday, nohut ve ayçiçeğini
        geçmiş iklim verileri üzerinden karşılaştır.
        Sonuçlar deneysel iklim taraması niteliğindedir.
      </p>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle
            size={22}
            className="shrink-0 text-amber-700"
          />
          <p className="text-sm leading-7 text-amber-950">
            Puanlar bilimsel olarak doğrulanmış bir
            parsel uygunluk modeli değildir.
            Toprak pH'ı, tuzluluk, drenaj, sulama kapasitesi,
            ürün çeşidi ve yetiştirme takvimi değerlendirmeye
            alınmamıştır. Yalnızca ön karşılaştırma amacı taşır.
          </p>
        </div>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[320px_1fr]">
        {/* ARAZİ SEÇİMİ */}
        <aside className="rounded-3xl border border-green-100 bg-white p-7">
          <h2 className="text-xl font-black">
            Arazi seçimi
          </h2>

          <label className="mt-6 block text-sm font-semibold">
            İlanlar

            <select
              value={landId}
              onChange={event => {
                setLandId(event.target.value);
                setSelectedCrop("bugday");
              }}
              className="mt-2 w-full rounded-xl border border-green-100 bg-white p-3 text-sm"
            >
              <option value="">Arazi seçiniz</option>

              {lands.map(item => (
                <option key={item.id} value={item.id}>
                  {item.city} / {item.district}
                  {" — "}
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          {lands.length === 0 && (
            <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Konumu kaydedilmiş gerçek bir ilan bulunamadı.
              İlan düzenleme ekranından harita konumu ekle.
            </p>
          )}

          {land && (
            <div className="mt-6 space-y-3 rounded-xl bg-green-50 p-5">
              <p className="font-bold text-green-950">
                {land.title}
              </p>

              <p className="text-sm text-green-800">
                {land.district}, {land.city}
              </p>

              <p className="text-sm text-green-800">
                {display(Number(land.area))} m²
              </p>

              <p className="text-xs text-gray-500">
                Sulama beyanı:{" "}
                {land.irrigation
                  ? "Var"
                  : "Belirtilmemiş"}
              </p>

              <Link
                href={`/araziler/${land.id}`}
                className="inline-flex items-center gap-1 text-sm font-bold text-green-800 underline"
              >
                İlanı görüntüle
                <ArrowRight size={15} />
              </Link>
            </div>
          )}

          {land && (
            <div className="mt-7 border-t border-green-100 pt-6">
              <h3 className="font-bold">
                Toprak bilgileri
              </h3>

              {soilLoading ? (
                <p className="mt-3 text-sm text-gray-500">
                  Toprak profili yükleniyor...
                </p>
              ) : soilError ? (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {soilError}
                </p>
              ) : !soil ? (
                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Bu ilan için toprak profili henüz girilmemiş.
                  Sonuçlar yalnızca iklim üzerinden hesaplanıyor.
                </p>
              ) : (
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>pH: {soil.ph ?? "Bilinmiyor"}</p>
                  <p>
                    ECe: {soil.ece_dsm ?? "Bilinmiyor"}
                    {soil.ece_dsm !== null ? " dS/m" : ""}
                  </p>
                  <p>
                    Organik madde:{" "}
                    {soil.organic_matter_pct ?? "Bilinmiyor"}
                    {soil.organic_matter_pct !== null ? " %" : ""}
                  </p>
                  <p className="text-xs leading-6 text-gray-500">
                    Veriler ilan sahibinin beyanıdır.
                    Laboratuvar doğrulaması yapılmamıştır.
                  </p>
                </div>
              )}
            </div>
          )}

          {climate && (
            <div className="mt-7 border-t border-green-100 pt-6">
              <h3 className="flex items-center gap-2 font-bold">
                <CloudSun size={20} className="text-green-700" />
                İklim özeti
              </h3>

              <p className="mt-2 text-xs text-gray-500">
                {climate.period} geçmiş dönem
              </p>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs text-gray-500">
                    <Thermometer size={16} />
                    Ortalama sıcaklık
                  </span>
                  <strong className="text-sm">
                    {display(climate.averageTemperature)} °C
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-xs text-gray-500">
                    <Droplets size={16} />
                    Yıllık yağış
                  </span>
                  <strong className="text-sm">
                    {display(climate.annualPrecipitation)} mm
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">
                    Donlu gün / yıl
                  </span>
                  <strong className="text-sm">
                    {display(climate.frostDaysPerYear)}
                  </strong>
                </div>
              </div>

              <p className="mt-5 text-xs leading-6 text-gray-500">
                Donlu gün ortalaması bilgilendirme amaçlıdır;
                ürün puanına doğrudan dahil değildir.
              </p>
            </div>
          )}
        </aside>

        {/* ÜRÜN KARŞILAŞTIRMASI */}
        <section>
          {!land && (
            <div className="rounded-3xl border border-green-100 bg-white p-10">
              <Sprout size={38} className="text-green-700" />
              <h2 className="mt-6 text-2xl font-black">
                Karşılaştırmaya başla
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-500">
                Sol taraftan bir arazi seçtiğinde
                geçmiş iklim verileri yüklenecek ve
                ürünler karşılaştırılacak.
              </p>
            </div>
          )}

          {land && loading && (
            <div
              role="status"
              className="rounded-3xl border border-green-100 bg-white p-10"
            >
              <CloudSun
                size={32}
                className="animate-pulse text-green-700"
              />
              <p className="mt-4 text-sm text-gray-500">
                İklim verileri yükleniyor...
              </p>
            </div>
          )}

          {land && !loading && (error || assessment?.error) && (
            <p
              role="alert"
              className="rounded-2xl bg-red-50 p-6 text-sm text-red-700"
            >
              {error || assessment?.error}
            </p>
          )}

          {land && !loading && results.length > 0 && (
            <div className="space-y-7">
              <div className="rounded-3xl border border-green-100 bg-white p-7">
                <h2 className="text-2xl font-black">
                  Ürün karşılaştırması
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-500">
                  Yüksek puan, yalnızca bu modelin
                  tanımlı sıcaklık ve yağış göstergelerinde
                  daha az uyarı üretildiğini ifade eder.
                </p>

                <div className="mt-7 space-y-4">
                  {rankedResults.map((item, index) => (
                    <button
                      type="button"
                      key={item.crop}
                      onClick={() =>
                        setSelectedCrop(item.crop)
                      }
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        detail.crop === item.crop
                          ? "border-green-700 bg-green-50"
                          : "border-green-100 bg-white hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs text-gray-400">
                            Model sırası {index + 1}
                          </p>
                          <h3 className="mt-2 text-lg font-bold">
                            {item.name}
                          </h3>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-black text-green-900">
                            {item.displayIndex}/100
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.combinedIndex === null
                            ? "İklim endeksi"
                            : "İklim + toprak (deneysel)"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 h-3 overflow-hidden rounded-full bg-green-100">
                        <div
                          className="h-full rounded-full bg-green-700"
                          style={{
                            width: `${item.displayIndex}%`
                          }}
                        />
                      </div>

                      <p className="mt-4 text-xs text-gray-500">
                        İncelemek için seç
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {detail && (
                <article className="rounded-3xl border border-green-100 bg-white p-7">
                  <h2 className="text-2xl font-black">
                    {detail.name} — Değerlendirme ayrıntıları
                  </h2>

                  <p className="mt-2 text-xs text-gray-500">
                    Varsayılan yetişme dönemi:{" "}
                    {detail.seasonLabel}
                  </p>

                  <div className="mt-8 space-y-6">
                    <ScoreBar
                      value={detail.temperatureScore}
                      label="Sıcaklık göstergesi (%50 ağırlık)"
                    />

                    <ScoreBar
                      value={detail.rainfallScore}
                      label="Yağış göstergesi (%50 ağırlık)"
                    />
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-green-50 p-5">
                      <p className="text-xs text-gray-500">
                        Mevsimsel ortalama sıcaklık
                      </p>

                      <p className="mt-2 text-xl font-black">
                        {display(detail.seasonTemperature)} °C
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        Deneysel karşılaştırma aralığı:{" "}
                        {detail.temperatureRange[0]}–
                        {detail.temperatureRange[1]} °C
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-50 p-5">
                      <p className="text-xs text-gray-500">
                        Mevsimsel toplam yağış ortalaması
                      </p>

                      <p className="mt-2 text-xl font-black">
                        {display(detail.seasonRainfall)} mm
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        Model su referansı:{" "}
                        {detail.waterReference} mm
                      </p>
                    </div>
                  </div>

                  <div className="mt-9 border-t border-green-100 pt-7">
                    <h3 className="text-lg font-bold">
                      Toprak ön değerlendirmesi
                    </h3>

                    <p className="mt-3 text-sm text-gray-500">
                      Mevcut gösterge:{" "}
                      {detail.soilReview.observed}/4
                    </p>

                    {detail.soilReview.soilScore === null ? (
                      <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        Birleşik puan hesaplanmadı.
                        Dört temel toprak göstergesinin
                        tamamı gerekli.
                      </p>
                    ) : (
                      <div className="mt-4 rounded-xl bg-green-50 p-5">
                        <p className="text-xs text-gray-500">
                          Deneysel toprak endeksi
                        </p>
                        <p className="mt-2 text-2xl font-black text-green-900">
                          {detail.soilReview.soilScore}/100
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          Birleşik endeks:{" "}
                          {detail.combinedIndex}/100
                        </p>
                      </div>
                    )}

                    <div className="mt-5 space-y-4">
                      {detail.soilReview.metrics.map(metric => (
                        <div
                          key={metric.title}
                          className="rounded-xl border border-green-100 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-bold">
                              {metric.title}
                            </h4>
                            <strong className="text-green-800">
                              {metric.score}/100
                            </strong>
                          </div>
                          <p className="mt-2 text-xs leading-6 text-gray-500">
                            {metric.explanation}
                          </p>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-5 list-disc space-y-2 pl-5 text-xs leading-6 text-gray-500">
                      {detail.soilReview.notes.map(note => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <h3 className="mt-8 font-bold">
                    Dikkat edilmesi gerekenler
                  </h3>

                  <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-gray-600">
                    {detail.notes.map(note => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>

                  <div className="mt-8 rounded-2xl bg-[#f1f6ed] p-6">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <Calculator
                        size={19}
                        className="text-green-700"
                      />
                      Ayrı finansal model
                    </p>

                    <p className="mt-4 text-xs text-gray-500">
                      Temsili verim, fiyat ve maliyetlerle
                      hesaplanan yıllık faaliyet sonucu
                    </p>

                    <p
                      className={`mt-2 text-2xl font-black ${
                        detail.annualNetExample >= 0
                          ? "text-green-800"
                          : "text-red-700"
                      }`}
                    >
                      {formatPrice(detail.annualNetExample)}
                    </p>

                    <p className="mt-3 text-xs leading-6 text-gray-500">
                      Bu tutar iklim puanını etkilemez.
                      Satın alma bedeli, vergi ve finansman
                      maliyeti hesaplamaya dahil değildir.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href={`/rapor?arazi=${encodeURIComponent(land.id)}&urun=${detail.crop}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-5 py-3 text-sm font-bold text-green-900"
                    >
                      <FileText size={18} />
                      Kapsamlı Rapor
                    </Link>

                    <Link
                      href={`/danisman?arazi=${encodeURIComponent(land.id)}&urun=${detail.crop}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-bold text-white"
                    >
                      <BrainCircuit size={18} />
                      AI ile değerlendir
                    </Link>

                    <Link
                      href={`/simulasyon?arazi=${encodeURIComponent(land.id)}&urun=${detail.crop}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-5 py-3 text-sm font-bold text-green-900"
                    >
                      <Calculator size={18} />
                      Gelir simülatörü
                    </Link>
                  </div>
                </article>
              )}

              <div className="rounded-2xl bg-amber-50 p-6 text-xs leading-7 text-amber-950">
                <strong>Yöntem uyarısı:</strong> Aylık geçmiş
                sıcaklık ve yağış ortalamaları kullanılır.
                Yıllar arasındaki değişkenlik, aşırı hava olayları,
                bitki su tüketimi (ETc), etkili yağış, büyüme
                evreleri ve toprak su bütçesi hesaplanmaz.
                Ürün sıralaması saha analizi yerine geçmez.
              </div>

              <p className="text-xs leading-6 text-gray-500">
                Meteorolojik veri:{" "}
                <a
                  className="font-semibold text-green-700 underline"
                  href="https://open-meteo.com/en/docs/historical-weather-api"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open-Meteo
                </a>
                . Su referansları için:{" "}
                <a
                  className="font-semibold text-green-700 underline"
                  href="https://www.fao.org/4/s2022e/s2022e07.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  FAO Crop Water Needs
                </a>
                . Nohut ve sıcaklık referansları prototip
                varsayımlarıdır.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
