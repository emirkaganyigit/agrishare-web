import type { CropKey } from "@/lib/simulation";

export type SoilProfile = {
  ph: number | null;
  ece_dsm: number | null;
  organic_matter_pct: number | null;
  texture: string | null;
  drainage: string | null;
  sampled_at: string | null;
};

export type SoilMetric = {
  title: string;
  score: number;
  explanation: string;
};

export type SoilReview = {
  observed: number;
  total: 4;
  soilScore: number | null;
  metrics: SoilMetric[];
  notes: string[];
};

const phRanges: Record<CropKey, [number, number]> = {
  bugday: [6, 7],
  nohut: [6, 8],
  aycicegi: [6, 7.5]
};

// Tamamı prototip amaçlı deneysel ağırlıklardır.
// Resmî bitki yetiştirme standardı değildir.
const textureScores: Record<
  CropKey,
  Record<string, number>
> = {
  bugday: {
    kumlu: 55,
    kumlu_tinli: 90,
    tinli: 100,
    killi_tinli: 90,
    killi: 70
  },
  nohut: {
    kumlu: 75,
    kumlu_tinli: 90,
    tinli: 100,
    killi_tinli: 80,
    killi: 50
  },
  aycicegi: {
    kumlu: 60,
    kumlu_tinli: 90,
    tinli: 100,
    killi_tinli: 85,
    killi: 70
  }
};

const textureNames: Record<string, string> = {
  kumlu: "Kumlu",
  kumlu_tinli: "Kumlu-tınlı",
  tinli: "Tınlı",
  killi_tinli: "Killi-tınlı",
  killi: "Killi"
};

const drainageScores: Record<string, number> = {
  iyi: 100,
  orta: 65,
  zayif: 20
};

const drainageNames: Record<string, string> = {
  iyi: "İyi",
  orta: "Orta",
  zayif: "Zayıf"
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function screenSoil(
  soil: SoilProfile | null,
  crop: CropKey
): SoilReview {
  const metrics: SoilMetric[] = [];
  const notes: string[] = [];

  if (!soil) {
    return {
      observed: 0,
      total: 4,
      soilScore: null,
      metrics: [],
      notes: [
        "Bu arazi için toprak ölçümü kaydedilmemiş.",
        "Toprak verisi olmadan birleşik endeks hesaplanmaz."
      ]
    };
  }

  // 1. pH göstergesi
  if (
    soil.ph !== null &&
    Number.isFinite(soil.ph)
  ) {
    const [minimum, maximum] = phRanges[crop];

    const distance =
      soil.ph < minimum
        ? minimum - soil.ph
        : soil.ph > maximum
        ? soil.ph - maximum
        : 0;

    const score = Math.round(
      clamp(100 - distance * 40)
    );

    metrics.push({
      title: "Toprak pH",
      score,
      explanation:
        `Ölçüm: ${soil.ph}. ` +
        `Deneysel ürün karşılaştırma aralığı: ` +
        `${minimum}–${maximum}.`
    });
  }

  // 2. ECe göstergesi
  // Genel toprak tuzluluğu sınıflarına dayalı
  // prototip puanıdır; ürün bazlı verim kaybı
  // tahmini değildir.
  if (
    soil.ece_dsm !== null &&
    Number.isFinite(soil.ece_dsm)
  ) {
    let score = 20;
    let label = "Yüksek tuzluluk göstergesi";

    if (soil.ece_dsm < 2) {
      score = 100;
      label = "Düşük tuzluluk göstergesi";
    } else if (soil.ece_dsm < 4) {
      score = 80;
      label = "Hafif tuzluluk göstergesi";
    } else if (soil.ece_dsm < 8) {
      score = 50;
      label = "Artmış tuzluluk göstergesi";
    }

    metrics.push({
      title: "Toprak tuzluluğu",
      score,
      explanation:
        `ECe: ${soil.ece_dsm} dS/m. ${label}. ` +
        "Bu puan ürün bazlı tuzluluk toleransı hesabı değildir."
    });
  }

  // 3. Toprak bünyesi
  if (
    soil.texture &&
    textureScores[crop][soil.texture] !== undefined
  ) {
    metrics.push({
      title: "Toprak bünyesi",
      score: textureScores[crop][soil.texture],
      explanation:
        `${textureNames[soil.texture]}. ` +
        "Ürüne göre deneysel karşılaştırma puanı."
    });
  }

  // 4. Drenaj
  if (
    soil.drainage &&
    drainageScores[soil.drainage] !== undefined
  ) {
    metrics.push({
      title: "Drenaj",
      score: drainageScores[soil.drainage],
      explanation:
        `Beyan edilen drenaj: ` +
        `${drainageNames[soil.drainage]}.`
    });
  }

  // Organik madde bilgi amaçlı kaydedilir.
  if (
    soil.organic_matter_pct !== null &&
    Number.isFinite(soil.organic_matter_pct)
  ) {
    notes.push(
      `Organik madde: %${soil.organic_matter_pct}. ` +
      "Bu sürümde puana dahil edilmedi."
    );
  }

  if (soil.sampled_at) {
    notes.push(
      `Beyan edilen numune tarihi: ${soil.sampled_at}.`
    );
  }

  notes.push(
    "Ölçümler kullanıcı beyanıdır; " +
    "Agrishare tarafından laboratuvar doğrulaması yapılmamıştır."
  );

  const complete = metrics.length === 4;

  if (!complete) {
    notes.push(
      "Birleşik iklim-toprak endeksi için " +
      "pH, ECe, bünye ve drenaj bilgilerinin " +
      "tamamı gerekir."
    );
  }

  const soilScore = complete
    ? Math.round(
        metrics.reduce((sum, item) => sum + item.score, 0) / 4
      )
    : null;

  return {
    observed: metrics.length,
    total: 4,
    soilScore,
    metrics,
    notes
  };
}
