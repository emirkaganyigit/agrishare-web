"use client";

import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import Link from "next/link";

import {
  BrainCircuit,
  CloudSun,
  Calculator,
  Sprout,
  Send,
  AlertCircle
} from "lucide-react";

import { useLands, formatPrice } from "@/lib/lands";
import { crops, type CropKey } from "@/lib/simulation";
import { supabase } from "@/lib/supabase";

type AdvisorResult = {
  answer: string;
  landTitle: string;
  cropName: string;
  provider: string;
  climate: {
    period: string;
    averageTemperature: number;
    annualPrecipitation: number;
    frostDaysPerYear: number;
    source: string;
  };
  finance: {
    scenario: string;
    revenueTL: number;
    annualCostTL: number;
    netTL: number;
  }[];
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function AdvisorPage() {
  const allLands = useLands();

  const [landId, setLandId] = useState("");
  const [crop, setCrop] = useState<CropKey>("bugday");

  const [question, setQuestion] = useState(
    "Bu arazide bu ürünü yetiştirmenin avantajları " +
    "ve riskleri nelerdir? İklim ve finansal " +
    "senaryoları değerlendir."
  );

  const [result, setResult] =
    useState<AdvisorResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(window.location.search);

    const id = params.get("arazi");

    if (id) setLandId(id);

    const cropFromUrl = params.get("urun");

    if (
      cropFromUrl &&
      Object.prototype.hasOwnProperty.call(crops, cropFromUrl)
    ) {
      setCrop(cropFromUrl as CropKey);
    }
  }, []);

  const lands = allLands.filter(land =>
    UUID_REGEX.test(land.id) &&
    land.latitude != null &&
    land.longitude != null
  );

  const selectedLand = lands.find(
    land => land.id === landId
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedLand || !supabase || loading) {
      setError(
        "Konumu bulunan gerçek bir arazi seçmelisin."
      );
      return;
    }

    if (
      question.trim().length < 10 ||
      question.length > 500
    ) {
      setError("Soru 10–500 karakter arasında olmalı.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !data.session?.access_token
      ) {
        throw new Error(
          "AI analizi için giriş yapmalısın."
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
          landId: selectedLand.id,
          crop,
          question: question.trim()
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error || "AI analizi oluşturulamadı."
        );
      }

      if (
        typeof payload.answer !== "string" ||
        !payload.climate ||
        !Array.isArray(payload.finance)
      ) {
        throw new Error("Eksik API yanıtı alındı.");
      }

      setResult(payload as AdvisorResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Beklenmeyen hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-800">
        <BrainCircuit size={18} />
        AGRISHARE INTELLIGENCE
      </div>

      <h1 className="mt-6 text-3xl font-black sm:text-5xl">
        AI Tarım Danışmanı
      </h1>

      <p className="mt-5 max-w-3xl text-sm leading-8 text-gray-500">
        Arazini seç, yetiştirmek istediğin ürünü belirle
        ve yapay zekâdan iklim ile gelir verilerine dayanan
        bir değerlendirme al.
      </p>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#eaf4e5] px-4 py-2 text-xs font-bold text-green-800">
        <Sprout size={15} />
        Groq AI — Ücretsiz geliştirme kotası
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[380px_1fr]">

        {/* SOL: ANALİZ FORMU */}
        <section className="rounded-3xl border border-green-100 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black">
            Analiz Oluştur
          </h2>

          <form onSubmit={submit} className="mt-7 space-y-6">
            <label className="block text-sm font-bold">
              Arazi seç

              <select
                required
                value={landId}
                onChange={e => {
                  setLandId(e.target.value);
                  setResult(null);
                }}
                className="mt-2 w-full rounded-xl border border-green-100 bg-white p-3 text-sm"
              >
                <option value="">Arazi seçiniz</option>

                {lands.map(land => (
                  <option key={land.id} value={land.id}>
                    {land.city} / {land.district}
                    {" — "}
                    {land.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedLand && (
              <div className="rounded-xl bg-green-50 p-5">
                <p className="font-bold text-green-900">
                  {selectedLand.title}
                </p>

                <p className="mt-2 text-sm text-green-700">
                  {selectedLand.area.toLocaleString("tr-TR")} m²
                  {" · "}
                  {selectedLand.type}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {selectedLand.district}, {selectedLand.city}
                </p>
              </div>
            )}

            {lands.length === 0 && (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                Konumu kaydedilmiş gerçek ilan bulunamadı.
                Önce kullanıcı panelinden ilanına harita
                konumu ekle.

                <Link
                  href="/panel"
                  className="mt-3 block font-bold underline"
                >
                  Panele git
                </Link>
              </div>
            )}

            <label className="block text-sm font-bold">
              Yetiştirilecek ürün

              <select
                value={crop}
                onChange={e => {
                  setCrop(e.target.value as CropKey);
                  setResult(null);
                }}
                className="mt-2 w-full rounded-xl border border-green-100 bg-white p-3 text-sm"
              >
                {(Object.keys(crops) as CropKey[]).map(key => (
                  <option key={key} value={key}>
                    {crops[key].name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-bold">
              AI danışmanına sorun

              <textarea
                required
                minLength={10}
                maxLength={500}
                rows={6}
                value={question}
                onChange={e => {
                  setQuestion(e.target.value);
                  setResult(null);
                }}
                className="mt-2 w-full resize-none rounded-xl border border-green-100 p-4 text-sm leading-7 outline-green-600"
                placeholder="Bu arazide hangi riskler var?"
              />

              <span className="mt-2 block text-right text-xs font-normal text-gray-400">
                {question.length}/500
              </span>
            </label>

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700"
              >
                <AlertCircle
                  size={18}
                  className="mb-2"
                />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !selectedLand}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#164c35] px-5 py-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? (
                <>
                  <BrainCircuit
                    size={19}
                    className="animate-pulse"
                  />
                  Analiz oluşturuluyor...
                </>
              ) : (
                <>
                  <Send size={18} />
                  AI Analizi Oluştur
                </>
              )}
            </button>

            <p className="text-xs leading-6 text-gray-500">
              Giriş gereklidir. Geliştirme kotası:
              24 saatte 5 analiz, istekler arasında
              en az 45 saniye.
            </p>
          </form>
        </section>

        {/* SAĞ: AI RAPORU */}
        <section aria-live="polite">
          {loading && (
            <div className="rounded-3xl border border-green-100 bg-white p-9">
              <BrainCircuit
                size={37}
                className="animate-pulse text-green-700"
              />

              <h2 className="mt-6 text-xl font-bold">
                Tarımsal veriler analiz ediliyor
              </h2>

              <p className="mt-4 text-sm text-gray-500">
                İklim, maliyet ve üretim senaryoları
                Groq AI tarafından değerlendiriliyor.
              </p>
            </div>
          )}

          {!loading && !result && (
            <div className="rounded-3xl border border-green-100 bg-white p-9">
              <BrainCircuit
                size={42}
                className="text-green-700"
              />

              <h2 className="mt-6 text-2xl font-black">
                Agrishare AI Analizi
              </h2>

              <p className="mt-4 text-sm leading-8 text-gray-500">
                Sol taraftan bir arazi ve ürün seçerek
                analiz oluşturabilirsin.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: CloudSun, label: "İklim değerlendirmesi" },
                  { icon: Sprout, label: "Ürün değerlendirmesi" },
                  { icon: Calculator, label: "Gelir senaryoları" },
                  { icon: AlertCircle, label: "Risk analizi" }
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl bg-green-50 p-4"
                  >
                    <item.icon
                      size={20}
                      className="text-green-700"
                    />
                    <span className="text-sm font-semibold">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6">
              {/* AI YANITI */}
              <article className="rounded-3xl border border-green-100 bg-white p-7 shadow-sm sm:p-9">
                <h2 className="flex items-center gap-3 text-2xl font-black">
                  <BrainCircuit className="text-green-700" />
                  AI Değerlendirme Raporu
                </h2>

                <p className="mt-3 text-sm text-gray-500">
                  {result.landTitle}
                  {" — "}
                  {result.cropName}
                </p>

                <div className="mt-7 whitespace-pre-wrap break-words text-sm leading-8 text-[#294a36]">
                  {result.answer}
                </div>

                <p className="mt-6 border-t border-green-100 pt-4 text-xs text-gray-500">
                  Model sağlayıcısı: {result.provider}.
                  Bu rapor bir karar destek çıktısıdır;
                  profesyonel saha analizi yerine geçmez.
                </p>
              </article>

              {/* İKLİM */}
              <article className="rounded-3xl border border-green-100 bg-white p-7">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <CloudSun className="text-green-700" />
                  Gerçek İklim Verileri
                </h2>

                <p className="mt-2 text-xs text-gray-500">
                  Geçmiş dönem: {result.climate.period}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    [
                      "Ortalama sıcaklık",
                      `${result.climate.averageTemperature} °C`
                    ],
                    [
                      "Yıllık yağış",
                      `${result.climate.annualPrecipitation} mm`
                    ],
                    [
                      "Donlu gün/yıl",
                      `${result.climate.frostDaysPerYear}`
                    ]
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl bg-green-50 p-4"
                    >
                      <p className="text-xs text-gray-500">
                        {label}
                      </p>
                      <p className="mt-3 text-xl font-black text-green-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs leading-6 text-gray-500">
                  Kaynak:{" "}
                  <a
                    href="https://open-meteo.com/en/docs/historical-weather-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 underline"
                  >
                    Open-Meteo Historical Weather API
                  </a>
                  . Bölgesel geçmiş meteorolojik verilerdir,
                  arazi üzerindeki doğrudan ölçümler değildir.
                </p>
              </article>

              {/* GELİR SONUÇLARI */}
              <article className="rounded-3xl border border-green-100 bg-white p-7">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Calculator className="text-green-700" />
                  Gelir Senaryoları
                </h2>

                <p className="mt-3 text-xs leading-6 text-gray-500">
                  Agrishare hesaplama motoru.
                  Temsili fiyat, verim ve maliyet varsayımları.
                </p>

                <div className="mt-6 space-y-3">
                  {result.finance.map(item => (
                    <div
                      key={item.scenario}
                      className="rounded-xl bg-green-50 p-5"
                    >
                      <p className="font-bold">
                        {item.scenario}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-gray-500">Gelir</p>
                          <strong className="text-sm">
                            {formatPrice(item.revenueTL)}
                          </strong>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Gider</p>
                          <strong className="text-sm">
                            {formatPrice(item.annualCostTL)}
                          </strong>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">Net sonuç</p>
                          <strong
                            className={`text-sm ${
                              item.netTL >= 0
                                ? "text-green-800"
                                : "text-red-700"
                            }`}
                          >
                            {formatPrice(item.netTL)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/simulasyon"
                  className="mt-6 inline-block text-sm font-bold text-green-700 underline"
                >
                  Gelir simülatörüne git
                </Link>
              </article>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
