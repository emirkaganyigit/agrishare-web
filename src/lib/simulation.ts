// AGRISHARE - Finansal simülasyon motoru
// Buradaki ürün değerleri yalnızca örnek varsayımlardır.

export const crops = {
  bugday: {
    name: "Buğday (dane)",
    yieldKg: 400,
    priceKg: 12,
    costPerDecare: 2800
  },
  nohut: {
    name: "Nohut (dane)",
    yieldKg: 130,
    priceKg: 32,
    costPerDecare: 2600
  },
  aycicegi: {
    name: "Ayçiçeği (tohum)",
    yieldKg: 220,
    priceKg: 24,
    costPerDecare: 3400
  }
} as const;

export type CropKey = keyof typeof crops;

export type SimulationInput = {
  areaM2: number;
  yieldKgPerDecare: number;
  pricePerKg: number;
  productionCostPerDecare: number;
  rentPerDecare: number;
  fixedAnnualCost: number;
  setupCost: number;
};

export const scenarios = [
  {
    name: "Kötümser",
    yieldFactor: 0.80,
    priceFactor: 0.85,
    costFactor: 1.10
  },
  {
    name: "Baz",
    yieldFactor: 1,
    priceFactor: 1,
    costFactor: 1
  },
  {
    name: "İyimser",
    yieldFactor: 1.15,
    priceFactor: 1.10,
    costFactor: 1.05
  }
] as const;

export function runScenario(
  input: SimulationInput,
  scenario: (typeof scenarios)[number]
) {
  const decares = input.areaM2 / 1000;

  // Üretim miktarı
  const harvestKg =
    decares *
    input.yieldKgPerDecare *
    scenario.yieldFactor;

  // Satış fiyatı
  const salePrice =
    input.pricePerKg * scenario.priceFactor;

  // Brüt gelir
  const revenue = harvestKg * salePrice;

  // Üretim giderleri
  const productionCost =
    decares *
    input.productionCostPerDecare *
    scenario.costFactor;

  // Kira gideri
  const rentCost =
    decares * input.rentPerDecare;

  // Toplam yıllık gider
  const totalAnnualCost =
    productionCost +
    rentCost +
    input.fixedAnnualCost;

  // Yıllık faaliyet sonucu
  const annualNet = revenue - totalAnnualCost;

  // İlk yıldaki tek seferlik kuruluş gideri
  const firstYearNet = annualNet - input.setupCost;

  // Satış fiyatı başabaş noktası
  const breakEvenPrice =
    harvestKg > 0
      ? totalAnnualCost / harvestKg
      : null;

  const margin =
    revenue > 0
      ? (annualNet / revenue) * 100
      : null;

  return {
    name: scenario.name,
    decares,
    harvestKg,
    salePrice,
    revenue,
    productionCost,
    rentCost,
    totalAnnualCost,
    annualNet,
    firstYearNet,
    breakEvenPrice,
    margin
  };
}
