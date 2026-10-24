import { NextResponse } from "next/server";


type ArchiveData = {
  daily?: {
    time?: string[];
    temperature_2m_mean?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_sum?: (number | null)[];
  };
};

const monthNames = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"
];

function round(value: number) {
  return Math.round(value * 10) / 10;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const latValue = params.get("lat");
  const lonValue = params.get("lon");

  if (latValue === null || lonValue === null) {
    return NextResponse.json(
      { error: "Koordinatlar gerekli." },
      { status: 400 }
    );
  }

  const latitude = Number(latValue);
  const longitude = Number(lonValue);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return NextResponse.json(
      { error: "Geçersiz koordinatlar." },
      { status: 400 }
    );
  }

  // Son üç tamamlanmış takvim yılı.
  const endYear = new Date().getUTCFullYear() - 1;
  const startYear = endYear - 2;
  const yearCount = endYear - startYear + 1;

  const url = new URL(
    "https://archive-api.open-meteo.com/v1/archive"
  );

  url.searchParams.set("latitude", latitude.toFixed(2));
  url.searchParams.set("longitude", longitude.toFixed(2));
  url.searchParams.set("start_date", `${startYear}-01-01`);
  url.searchParams.set("end_date", `${endYear}-12-31`);
  url.searchParams.set(
    "daily",
    "temperature_2m_mean,temperature_2m_min,precipitation_sum"
  );
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "İklim veri servisine erişilemiyor." },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as ArchiveData;
    const daily = payload.daily;

    if (
      !daily?.time ||
      !daily.temperature_2m_mean ||
      !daily.temperature_2m_min ||
      !daily.precipitation_sum
    ) {
      throw new Error("Eksik iklim verisi");
    }

    const monthly = Array.from(
      { length: 12 },
      (_, index) => ({
        month: monthNames[index],
        temperatureSum: 0,
        temperatureDays: 0,
        rainSum: 0,
        rainDays: 0
      })
    );

    let totalTemperature = 0;
    let totalTemperatureDays = 0;
    let totalRain = 0;
    let totalRainDays = 0;
    let frostDays = 0;

    for (let i = 0; i < daily.time.length; i++) {
      const monthIndex =
        Number(daily.time[i]?.slice(5, 7)) - 1;

      if (monthIndex < 0 || monthIndex > 11) continue;

      const group = monthly[monthIndex];
      const temperature = daily.temperature_2m_mean[i];
      const minimum = daily.temperature_2m_min[i];
      const rain = daily.precipitation_sum[i];

      if (
        typeof temperature === "number" &&
        Number.isFinite(temperature)
      ) {
        group.temperatureSum += temperature;
        group.temperatureDays += 1;
        totalTemperature += temperature;
        totalTemperatureDays += 1;
      }

      if (
        typeof rain === "number" &&
        Number.isFinite(rain)
      ) {
        group.rainSum += rain;
        group.rainDays += 1;
        totalRain += rain;
        totalRainDays += 1;
      }

      if (
        typeof minimum === "number" &&
        minimum < 0
      ) {
        frostDays += 1;
      }
    }

    if (
      totalTemperatureDays < 300 * yearCount ||
      totalRainDays < 300 * yearCount
    ) {
      throw new Error("Yeterli geçmiş iklim verisi yok.");
    }

    const result = {
      period: `${startYear}–${endYear}`,
      averageTemperature: round(
        totalTemperature / totalTemperatureDays
      ),
      annualPrecipitation: round(totalRain / yearCount),
      frostDaysPerYear: round(frostDays / yearCount),
      monthly: monthly.map(group => ({
        month: group.month,
        temperature:
          group.temperatureDays > 0
            ? round(
                group.temperatureSum / group.temperatureDays
              )
            : null,
        precipitation: round(group.rainSum / yearCount)
      })),
      source: "Open-Meteo Historical Weather API"
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "Geçmiş iklim verileri alınamadı. Daha sonra tekrar dene."
      },
      { status: 503 }
    );
  }
}
