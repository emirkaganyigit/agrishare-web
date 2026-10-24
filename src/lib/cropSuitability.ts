import {
  crops,
  runScenario,
  scenarios,
  type CropKey
} from "@/lib/simulation";

export type ClimateSummary = {
  period: string;
  averageTemperature: number;
  annualPrecipitation: number;
  frostDaysPerYear: number;
  monthly: {
    month: string;
    temperature: number | null;
    precipitation: number;
  }[];
};

export type CropAssessment = {
  crop: CropKey;
  name: string;
  index: number;
  temperatureScore: number;
  rainfallScore: number;
  seasonTemperature: number;
  seasonRainfall: number;
  waterReference: number;
  seasonLabel: string;
  temperatureRange: [number, number];
  annualNetExample: number;
  notes: string[];
};

type CropRule = {
  months: number[];
  seasonLabel: string;
  tempMin: number;
  tempMax: number;
  waterReference: number;
};

// Bu değerler prototip tarama kurallarıdır.
// Parsel bazlı agronomik uygunluk sınırları değildir.
// Ay numaraları: Ocak=1, Aralık=12.
const rules: Record<CropKey, CropRule> = {
  bugday: {
    months: [10, 11, 12, 1, 2, 3, 4, 5, 6],
    seasonLabel: "Ekim–Haziran",
    tempMin: 8,
    tempMax: 22,
    waterReference: 450
  },
  nohut: {
    months: [3, 4, 5, 6],
    seasonLabel: "Mart–Haziran",
    tempMin: 15,
    tempMax: 27,
    waterReference: 300
  },
  aycicegi: {
    months: [4, 5, 6, 7, 8],
    seasonLabel: "Nisan–Ağustos",
    tempMin: 18,
    tempMax: 27,
    waterReference: 600
  }
};

const clamp = (value: number) =>
  Math.max(0, Math.min(100, value));

const round = (value: number) =>
  Math.round(value * 10) / 10;

export function assessCrops(
  climate: ClimateSummary,
  areaM2: number,
  listingType: string,
  listingPrice: number,
  irrigationDeclared: boolean
): CropAssessment[] {
  if (
    !Array.isArray(climate.monthly) ||
    climate.monthly.length !== 12 ||
    !climate.monthly.every(month =>
      month.temperature !== null &&
      Number.isFinite(month.temperature) &&
      Number.isFinite(month.precipitation) &&
      month.precipitation >= 0
    )
  ) {
    throw new Error("12 aylık iklim verisi eksik.");
  }

  if (
    !Number.isFinite(areaM2) ||
    areaM2 <= 0 ||
    !Number.isFinite(listingPrice) ||
    listingPrice < 0
  ) {
    throw new Error("Arazi alanı veya fiyatı geçersiz.");
  }

  return (Object.keys(rules) as CropKey[])
    .map(crop => {
      const rule = rules[crop];
      const preset = crops[crop];

      const months = rule.months.map(
        month => climate.monthly[month - 1]
      );

      // Mevsim boyunca ilgili aylara ait
      // üç yıllık aylık ortalama değerler.
      const seasonTemperature =
        months.reduce(
          (sum, month) => sum + Number(month.temperature),
          0
        ) / months.length;

      const seasonRainfall = months.reduce(
        (sum, month) => sum + month.precipitation,
        0
      );

      // Aralık dışına çıkılan her 1 °C için
      // deneysel 12 puanlık azalma.
      const temperatureDistance =
        seasonTemperature < rule.tempMin
          ? rule.tempMin - seasonTemperature
          : seasonTemperature > rule.tempMax
          ? seasonTemperature - rule.tempMax
          : 0;

      const temperatureScore = clamp(
        100 - temperatureDistance * 12
      );

      // Bu bir yağış göstergesidir.
      // Gerçek bitki su tüketimi hesaplaması değildir.
      const rainfallScore = clamp(
        (seasonRainfall / rule.waterReference) * 100
      );

      const index = Math.round(
        temperatureScore * 0.5 +
        rainfallScore * 0.5
      );

      const rentPerDecare =
        listingType === "Kiralık"
          ? listingPrice / (areaM2 / 1000)
          : 0;

      // Önceki sprintteki örnek finansal modeli kullan.
      const finance = runScenario(
        {
          areaM2,
          yieldKgPerDecare: preset.yieldKg,
          pricePerKg: preset.priceKg,
          productionCostPerDecare: preset.costPerDecare,
          rentPerDecare,
          fixedAnnualCost: 10000,
          setupCost: 0
        },
        scenarios[1]
      );

      const notes: string[] = [];

      if (seasonTemperature < rule.tempMin) {
        notes.push(
          "Mevsimsel ortalama sıcaklık modelin alt " +
          "referans değerinin altında."
        );
      } else if (seasonTemperature > rule.tempMax) {
        notes.push(
          "Mevsimsel ortalama sıcaklık modelin üst " +
          "referans değerinin üzerinde."
        );
      } else {
        notes.push(
          "Mevsimsel ortalama sıcaklık modelin " +
          "deneysel aralığında."
        );
      }

      if (rainfallScore < 60) {
        notes.push(
          "Dönem yağışı su referansının %60'ından az. " +
          "Toprak nemi ve sulama ihtiyacı ayrıca araştırılmalı."
        );
      } else {
        notes.push(
          "Dönem yağışı referansla karşılaştırıldı; " +
          "bu, gerçek su ihtiyacının karşılandığını kanıtlamaz."
        );
      }

      notes.push(
        irrigationDeclared
          ? "İlanda sulama imkânı belirtilmiş; " +
            "kapasite ve kullanılabilirlik doğrulanmalı."
          : "Sulama durumu doğrulanmamış. " +
            "Bu, sulama bulunmadığı anlamına gelmez."
      );

      notes.push(
        "Toprak analizi, drenaj, eğim, çeşit ve gerçek " +
        "ekim takvimi değerlendirmeye dahil değil."
      );

      return {
        crop,
        name: preset.name,
        index,
        temperatureScore: Math.round(temperatureScore),
        rainfallScore: Math.round(rainfallScore),
        seasonTemperature: round(seasonTemperature),
        seasonRainfall: round(seasonRainfall),
        waterReference: rule.waterReference,
        seasonLabel: rule.seasonLabel,
        temperatureRange: [rule.tempMin, rule.tempMax] as [number, number],
        annualNetExample: Math.round(finance.annualNet),
        notes
      };
    })
    .sort((a, b) => b.index - a.index);
}
