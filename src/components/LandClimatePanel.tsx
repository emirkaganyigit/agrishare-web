"use client";

import { useEffect, useState } from "react";
import {
  CloudSun,
  Droplets,
  Snowflake,
  Thermometer
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

type ClimateData = {
  period: string;
  averageTemperature: number;
  annualPrecipitation: number;
  frostDaysPerYear: number;
  monthly: {
    month: string;
    temperature: number | null;
    precipitation: number;
  }[];
  source: string;
};

type Props = {
  latitude: number | null;
  longitude: number | null;
};

export default function LandClimatePanel({
  latitude,
  longitude
}: Props) {
  const [data, setData] = useState<ClimateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (latitude == null || longitude == null) {
      setData(null);
      return;
    }

    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const response = await fetch(
          `/api/climate?lat=${latitude}&lon=${longitude}`,
          { signal: controller.signal }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "İklim verileri yüklenemedi."
          );
        }

        if (!controller.signal.aborted) {
          setData(result as ClimateData);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "İklim verileri alınamadı."
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
  }, [latitude, longitude]);

  if (latitude == null || longitude == null) {
    return (
      <div className="rounded-2xl bg-green-50 p-7">
        <CloudSun className="text-green-700" size={28} />
        <h2 className="mt-4 text-xl font-bold">
          İklim analizi
        </h2>
        <p className="mt-3 text-sm leading-7 text-gray-500">
          Bu ilanın henüz harita konumu bulunmuyor.
          İlan sahibi panelinden yaklaşık konum eklediğinde
          iklim verileri gösterilecek.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div role="status" className="rounded-2xl bg-white p-8">
        <CloudSun className="animate-pulse text-green-700" />
        <p className="mt-4 text-sm text-gray-500">
          Geçmiş iklim verileri hesaplanıyor...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-7">
        <h2 className="text-xl font-bold">İklim analizi</h2>
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      icon: Thermometer,
      label: "Ortalama sıcaklık",
      value: `${data.averageTemperature.toLocaleString("tr-TR")} °C`
    },
    {
      icon: Droplets,
      label: "Yıllık ort. yağış",
      value: `${data.annualPrecipitation.toLocaleString("tr-TR")} mm`
    },
    {
      icon: Snowflake,
      label: "Yıllık ort. donlu gün",
      value: `${data.frostDaysPerYear.toLocaleString("tr-TR")} gün`
    }
  ];

  return (
    <section className="rounded-3xl border border-green-100 bg-white p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <CloudSun className="shrink-0 text-green-700" size={28} />
        <div>
          <h2 className="text-2xl font-black">
            Arazi İklim Analizi
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {data.period} geçmiş iklim verileri
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {metrics.map(metric => (
          <div
            key={metric.label}
            className="rounded-2xl bg-[#f0f6eb] p-5"
          >
            <metric.icon
              className="text-green-700"
              size={24}
            />
            <p className="mt-4 text-xs text-gray-500">
              {metric.label}
            </p>
            <p className="mt-2 text-xl font-black text-green-900">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold">
          Aylık ortalama sıcaklık (°C)
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Geçmiş üç yılın aylık ortalamaları
        </p>

        <div className="mt-6 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.monthly}
              margin={{ top: 10, right: 10, bottom: 0, left: -15 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="temperature"
                name="Sıcaklık (°C)"
                stroke="#15803d"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold">
          Ortalama aylık toplam yağış (mm)
        </h3>

        <div className="mt-6 h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.monthly}
              margin={{ top: 10, right: 10, bottom: 0, left: -15 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="precipitation"
                name="Yağış (mm)"
                fill="#3b82a0"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-amber-50 p-4 text-xs leading-6 text-amber-950">
        Veriler bölgesel meteorolojik modellerden elde edilir.
        Parsel üzerinde yapılmış ölçüm değildir.
        Donlu gün sayısı geçmiş dönemi gösterir;
        gelecek don olaylarının tahmini olarak kullanılmamalıdır.
      </div>

      <p className="mt-6 text-xs leading-6 text-gray-500">
        Kaynak:{" "}
        <a
          href="https://open-meteo.com/en/docs/historical-weather-api"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-green-700 underline"
        >
          Open-Meteo Historical Weather API
        </a>
        {" "}— CC BY 4.0. Gösterilen değerler Agrishare
        tarafından günlük kaynak verilerden hesaplanmıştır.
      </p>
    </section>
  );
}
