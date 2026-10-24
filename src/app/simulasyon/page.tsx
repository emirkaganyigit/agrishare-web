"use client";

import { visibleLands } from "@/lib/visibleLands";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Calculator,
  Sprout,
  TrendingUp,
  TrendingDown,
  Info,
  ArrowLeft,
  LandPlot
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import {
  crops,
  scenarios,
  runScenario,
  type CropKey
} from "@/lib/simulation";

import {
  useLands,
  formatPrice
} from "@/lib/lands";

type NumberFieldProps = {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
  description?: string;
};

function NumberField({
  label,
  value,
  unit,
  onChange,
  description
}: NumberFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-green-950">
        {label}
      </span>

      <div className="mt-2 flex overflow-hidden rounded-xl border border-green-100 bg-white focus-within:border-green-600">
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full min-w-0 px-4 py-3 text-sm outline-none"
        />
        <span className="flex items-center border-l border-green-100 bg-green-50 px-3 text-xs text-green-800">
          {unit}
        </span>
      </div>

      {description && (
        <p className="mt-2 text-xs leading-5 text-gray-500">
          {description}
        </p>
      )}
    </label>
  );
}

function MetricCard({
  title,
  value,
  color = "normal"
}: {
  title: string;
  value: string;
  color?: "normal" | "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl bg-[#f0f6eb] p-5">
      <p className="text-xs text-gray-500">{title}</p>

      <p
        className={`mt-3 break-words text-xl font-black sm:text-2xl ${
          color === "negative"
            ? "text-red-700"
            : color === "positive"
            ? "text-green-800"
            : "text-[#173d2c]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const numberFormat = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 2
});

function formatNumber(value: number) {
  return numberFormat.format(value);
}

export default function SimulationPage() {
  const lands = visibleLands(useLands());

  const [landId, setLandId] = useState("");
  const [areaOverride, setAreaOverride] =
    useState<string | null>(null);
  const [rentOverride, setRentOverride] =
    useState<string | null>(null);

  const [crop, setCrop] = useState<CropKey>("bugday");

  const [yieldKg, setYieldKg] = useState("400");
  const [priceKg, setPriceKg] = useState("12");
  const [costPerDecare, setCostPerDecare] =
    useState("2800");

  const [fixedCost, setFixedCost] = useState("10000");
  const [setupCost, setSetupCost] = useState("0");

  // İlan detayından gelindiyse URL'deki araziyi seç.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("arazi");

    if (id) {
      setLandId(id);
    }

    const cropFromUrl = params.get("urun");

    if (
      cropFromUrl &&
      Object.prototype.hasOwnProperty.call(crops, cropFromUrl)
    ) {
      const selected = cropFromUrl as CropKey;
      const preset = crops[selected];

      setCrop(selected);
      setYieldKg(String(preset.yieldKg));
      setPriceKg(String(preset.priceKg));
      setCostPerDecare(String(preset.costPerDecare));
    }
  }, []);

  const selectedLand = lands.find(
    item => item.id === landId
  );

  const areaM2 =
    areaOverride ??
    (selectedLand
      ? String(selectedLand.area)
      : "20000");

  // Kiralık ilanda ilan fiyatı yıllık kira kabul edilir.
  // Satış bedeli kira giderine dönüştürülmez.
  const rentPerDecare =
    rentOverride ??
    (selectedLand?.type === "Kiralık" &&
    selectedLand.area > 0
      ? String(
          Math.round(
            selectedLand.price /
            (selectedLand.area / 1000)
          )
        )
      : "0");

  function changeLand(id: string) {
    setLandId(id);
    setAreaOverride(null);
    setRentOverride(null);
  }

  function changeCrop(value: CropKey) {
    setCrop(value);

    const preset = crops[value];

    setYieldKg(String(preset.yieldKg));
    setPriceKg(String(preset.priceKg));
    setCostPerDecare(String(preset.costPerDecare));
  }

  const rawValues = [
    areaM2,
    yieldKg,
    priceKg,
    costPerDecare,
    rentPerDecare,
    fixedCost,
    setupCost
  ];

  const valid = rawValues.every(
    value =>
      value.trim() !== "" &&
      Number.isFinite(Number(value)) &&
      Number(value) >= 0
  ) &&
    Number(areaM2) > 0 &&
    Number(yieldKg) > 0;

  const results = valid
    ? scenarios.map(scenario =>
        runScenario(
          {
            areaM2: Number(areaM2),
            yieldKgPerDecare: Number(yieldKg),
            pricePerKg: Number(priceKg),
            productionCostPerDecare:
              Number(costPerDecare),
            rentPerDecare:
              Number(rentPerDecare),
            fixedAnnualCost: Number(fixedCost),
            setupCost: Number(setupCost)
          },
          scenario
        )
      )
    : [];

  const base = results[1];

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <Link
        href="/analiz"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
      >
        <ArrowLeft size={17} />
        Analiz sayfasına dön
      </Link>

      <div className="mt-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-800">
          <Calculator size={17} />
          AGRISHARE INTELLIGENCE
        </span>

        <h1 className="mt-5 text-3xl font-black sm:text-5xl">
          Tarımsal Gelir Simülatörü
        </h1>

        <p className="mt-5 max-w-3xl text-sm leading-8 text-gray-500">
          Bir arazi ve üretilecek ürünü seç.
          Tahmini üretim miktarını, giderlerini
          ve olası finansal sonuçlarını hesapla.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <Info className="shrink-0 text-amber-700" size={22} />
          <div>
            <p className="text-sm font-bold text-amber-950">
              Örnek hesaplama modeli
            </p>
            <p className="mt-2 text-xs leading-6 text-amber-900">
              Ürünlerin başlangıç verimleri, fiyatları ve
              maliyetleri temsili olarak belirlenmiştir.
              Resmî istatistik veya güncel piyasa fiyatı değildir.
              Değerleri kendi verilerine göre değiştir.
              Sonuçlar yatırım getirisi garantisi oluşturmaz.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-9 grid items-start gap-8 lg:grid-cols-[390px_1fr]">
        {/* SOL: GİRDİLER */}
        <section className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <LandPlot size={23} className="text-green-700" />
            Arazi ve üretim bilgileri
          </h2>

          <div className="mt-8 space-y-6">
            <label className="block text-sm font-semibold">
              Arazi seçimi
              <select
                className="mt-2 w-full rounded-xl border border-green-100 bg-white px-4 py-3 text-sm"
                value={landId}
                onChange={e => changeLand(e.target.value)}
              >
                <option value="">Manuel arazi bilgileri</option>

                {lands.map(land => (
                  <option key={land.id} value={land.id}>
                    {land.city} / {land.district} — {land.title}
                  </option>
                ))}
              </select>
            </label>

            {selectedLand && (
              <div className="rounded-xl bg-green-50 p-4">
                <p className="text-sm font-bold">
                  {selectedLand.title}
                </p>
                <p className="mt-2 text-xs text-green-800">
                  {selectedLand.area.toLocaleString("tr-TR")} m²
                  {" · "}
                  {selectedLand.type}
                </p>

                {selectedLand.type === "Satılık" && (
                  <p className="mt-3 text-xs leading-5 text-amber-800">
                    Satış bedeli yıllık gidere eklenmez.
                    Satın alma yatırımı bu modelin dışındadır.
                  </p>
                )}

                {selectedLand.type === "Ortak Üretim" && (
                  <p className="mt-3 text-xs leading-5 text-amber-800">
                    Ortak üretimde gelir paylaşımı bu sürümde
                    hesaplanmıyor.
                  </p>
                )}
              </div>
            )}

            <NumberField
              label="Arazi büyüklüğü"
              value={areaM2}
              unit="m²"
              onChange={setAreaOverride}
              description={
                valid
                  ? `${formatNumber(Number(areaM2) / 1000)} dekar`
                  : "1 dekar = 1.000 m²"
              }
            />

            <div className="border-t border-green-100 pt-6">
              <h3 className="flex items-center gap-2 font-bold">
                <Sprout size={20} className="text-green-700" />
                Ürün seçimi
              </h3>

              <select
                className="mt-4 w-full rounded-xl border border-green-100 bg-white px-4 py-3 text-sm"
                value={crop}
                onChange={e =>
                  changeCrop(e.target.value as CropKey)
                }
              >
                {(
                  Object.entries(crops) as [
                    CropKey,
                    (typeof crops)[CropKey]
                  ][]
                ).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name}
                  </option>
                ))}
              </select>
            </div>

            <NumberField
              label="Beklenen ürün verimi"
              value={yieldKg}
              unit="kg/da"
              onChange={setYieldKg}
            />

            <NumberField
              label="Ürün satış fiyatı"
              value={priceKg}
              unit="TL/kg"
              onChange={setPriceKg}
            />

            <NumberField
              label="Üretim gideri"
              value={costPerDecare}
              unit="TL/da"
              onChange={setCostPerDecare}
              description="Tohum, gübre, sulama, işçilik, hasat gibi üretim giderleri."
            />

            <NumberField
              label="Yıllık kira gideri"
              value={rentPerDecare}
              unit="TL/da"
              onChange={setRentOverride}
              description="Kiralık ilanlarda yıllık ilan bedeli başlangıç değeri olarak kullanılır."
            />

            <NumberField
              label="Diğer sabit yıllık giderler"
              value={fixedCost}
              unit="TL"
              onChange={setFixedCost}
              description="Sigorta, yönetim ve diğer sabit giderler."
            />

            <NumberField
              label="Tek seferlik başlangıç yatırımı"
              value={setupCost}
              unit="TL"
              onChange={setSetupCost}
              description="İlk yıldaki kuruluş ve ekipman giderleri."
            />
          </div>
        </section>

        {/* SAĞ: SONUÇLAR */}
        <section className="space-y-7">
          {!valid ? (
            <div
              role="alert"
              className="rounded-3xl border border-red-100 bg-white p-8 text-red-700"
            >
              Hesaplama için tüm alanları geçerli,
              sıfır veya pozitif sayılarla doldur.
              Arazi büyüklüğü ve verim sıfırdan büyük olmalı.
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-green-100 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-green-700" />
                  <h2 className="text-xl font-black">
                    Baz Senaryo Sonuçları
                  </h2>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Bir üretim dönemi için hesaplanan sonuçlar.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <MetricCard
                    title="Beklenen brüt gelir"
                    value={formatPrice(base.revenue)}
                  />

                  <MetricCard
                    title="Toplam yıllık gider"
                    value={formatPrice(base.totalAnnualCost)}
                  />

                  <MetricCard
                    title="Yıllık faaliyet sonucu"
                    value={formatPrice(base.annualNet)}
                    color={
                      base.annualNet >= 0
                        ? "positive"
                        : "negative"
                    }
                  />

                  <MetricCard
                    title="İlk yıl net sonuç"
                    value={formatPrice(base.firstYearNet)}
                    color={
                      base.firstYearNet >= 0
                        ? "positive"
                        : "negative"
                    }
                  />
                </div>

                <div className="mt-7 border-t border-green-100 pt-6">
                  <h3 className="font-bold">
                    Finansal özet
                  </h3>

                  <div className="mt-5 space-y-4 text-sm">
                    {[
                      [
                        "Arazi büyüklüğü",
                        `${formatNumber(base.decares)} da`
                      ],
                      [
                        "Beklenen üretim",
                        `${formatNumber(base.harvestKg)} kg`
                      ],
                      [
                        "Üretim giderleri",
                        formatPrice(base.productionCost)
                      ],
                      [
                        "Arazi kirası",
                        formatPrice(base.rentCost)
                      ],
                      [
                        "Başabaş satış fiyatı",
                        base.breakEvenPrice !== null
                          ? `${formatNumber(base.breakEvenPrice)} TL/kg`
                          : "Hesaplanamadı"
                      ],
                      [
                        "Faaliyet kâr marjı",
                        base.margin !== null
                          ? `%${formatNumber(base.margin)}`
                          : "Hesaplanamadı"
                      ]
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 border-b border-green-50 pb-3"
                      >
                        <span className="text-gray-500">
                          {label}
                        </span>
                        <strong className="text-right text-green-950">
                          {value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-green-100 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-black">
                  Üç Farklı Senaryo
                </h2>

                <p className="mt-3 text-xs leading-6 text-gray-500">
                  Verim, fiyat ve üretim gideri varsayımlarını
                  değiştirerek ilk yıl net sonuçlarını karşılaştırıyoruz.
                </p>

                <div className="mt-7 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={results}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        width={65}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="firstYearNet"
                        name="İlk yıl net sonuç (TL)"
                        radius={[5, 5, 0, 0]}
                      >
                        {results.map(result => (
                          <Cell
                            key={result.name}
                            fill={
                              result.firstYearNet >= 0
                                ? "#23834d"
                                : "#d65e53"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 space-y-3">
                  {results.map(result => (
                    <div
                      key={result.name}
                      className="flex items-center justify-between gap-4 rounded-xl bg-green-50 px-5 py-4"
                    >
                      <div>
                        <p className="text-sm font-bold">
                          {result.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatNumber(result.harvestKg)} kg
                          {" · "}
                          {formatNumber(result.salePrice)} TL/kg
                        </p>
                      </div>
                      <strong
                        className={
                          result.firstYearNet >= 0
                            ? "text-green-800"
                            : "text-red-700"
                        }
                      >
                        {formatPrice(result.firstYearNet)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-[#16402e] p-7 text-white">
                <div className="flex items-center gap-3">
                  {base.firstYearNet >= 0 ? (
                    <TrendingUp className="text-lime-300" />
                  ) : (
                    <TrendingDown className="text-orange-300" />
                  )}
                  <h2 className="text-xl font-bold">
                    Sonuç Değerlendirmesi
                  </h2>
                </div>

                <p className="mt-5 text-sm leading-8 text-white/80">
                  Seçilen varsayımlara göre bu üretim
                  döneminde{" "}
                  <strong>{formatNumber(base.harvestKg)} kg</strong>
                  {" "}ürün elde edilmesi ve{" "}
                  <strong>{formatPrice(base.revenue)}</strong>
                  {" "}brüt gelir oluşması hesaplanıyor.
                </p>

                <p className="mt-4 text-sm leading-8 text-white/80">
                  İlk yıl başlangıç yatırımı da düşüldüğünde
                  hesaplanan net sonuç{" "}
                  <strong>
                    {formatPrice(base.firstYearNet)}
                  </strong>.
                  {" "}Bu sonuç kullanılan varsayımlara
                  bağlıdır; gerçek gerçekleşmeler farklı olabilir.
                </p>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="mt-10 rounded-2xl border border-green-100 bg-white p-6 text-xs leading-7 text-gray-500">
        <strong className="text-green-950">
          Model varsayımları:
        </strong>
        {" "}Kötümser senaryoda verim %20, fiyat %15 azalır;
        üretim gideri %10 artar. İyimser senaryoda verim %15,
        fiyat %10 ve üretim gideri %5 artar.
        Kira ve sabit giderler değişmez.
        Vergi, finansman maliyeti, teşvik, enflasyon ve
        çok yıllık ürünlerin gelişme dönemleri modele dahil değildir.
        Hesaplamalar tarayıcıda yapılır; Supabase'e kaydedilmez.
      </div>
    </main>
  );
}
