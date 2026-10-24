"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type LandType = "Kiralık" | "Satılık" | "Ortak Üretim";

export type Land = {
  id: string;
  title: string;
  city: string;
  district: string;
  area: number;
  price: number;
  type: LandType;
  irrigation: boolean;
  image: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
};

type LandRow = {
  id: string;
  title: string;
  city: string;
  district: string;
  area: number | string;
  price: number | string;
  type: LandType;
  irrigation: boolean;
  description: string;
  image_url: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export const cities = [
  "İzmir", "Konya", "Antalya", "Balıkesir",
  "Ankara", "Manisa", "Bursa", "İstanbul"
];

const fallbackImage =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=85";

export const exampleLands: Land[] = [
  {
    id: "1",
    title: "Sulama imkânına sahip verimli tarım arazisi",
    city: "İzmir",
    district: "Torbalı",
    area: 18000,
    price: 85000,
    type: "Kiralık",
    irrigation: true,
    image: fallbackImage,
    description: "Ulaşımı kolay, tarımsal üretime uygun örnek arazi."
  },
  {
    id: "2",
    title: "Ortak üretim için geniş tarım alanı",
    city: "Konya",
    district: "Çumra",
    area: 42000,
    price: 120000,
    type: "Ortak Üretim",
    irrigation: false,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=85",
    description: "Ortak üretim için değerlendirilebilecek örnek arazi."
  },
  {
    id: "3",
    title: "Zeytinlik ve tarımsal üretim alanı",
    city: "Balıkesir",
    district: "Edremit",
    area: 12500,
    price: 95000,
    type: "Kiralık",
    irrigation: true,
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=900&q=85",
    description: "Zeytin yetiştiriciliğine yönelik örnek ilan."
  },
  {
    id: "4",
    title: "Seracılık için değerlendirilebilecek arazi",
    city: "Antalya",
    district: "Serik",
    area: 8500,
    price: 110000,
    type: "Kiralık",
    irrigation: true,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
    description: "Seracılık için değerlendirilebilecek örnek arazi."
  },
  {
    id: "5",
    title: "Geniş tarla ve üretim yatırımı fırsatı",
    city: "Manisa",
    district: "Salihli",
    area: 26000,
    price: 1450000,
    type: "Satılık",
    irrigation: false,
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=900&q=85",
    description: "Örnek satılık tarım arazisi."
  },
  {
    id: "6",
    title: "Meyve yetiştiriciliği için bahçe",
    city: "Bursa",
    district: "İnegöl",
    area: 15500,
    price: 78000,
    type: "Ortak Üretim",
    irrigation: true,
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=900&q=85",
    description: "Meyve üretimi için örnek iş birliği ilanı."
  }
];

export function rowToLand(row: LandRow): Land {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    district: row.district,
    area: Number(row.area),
    price: Number(row.price),
    type: row.type,
    irrigation: row.irrigation,
    image: row.image_url || fallbackImage,
    description: row.description,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude)
  };
}

export function useLands() {
  const [lands, setLands] = useState<Land[]>(exampleLands);

  useEffect(() => {
    let active = true;
    let previousDemos: Land[] = [];

    // Eski Sprint 1 demo ilanlarını koru.
    try {
      const stored = JSON.parse(
        localStorage.getItem("agrishare-demo-lands") || "[]"
      );

      if (Array.isArray(stored)) {
        previousDemos = stored;
      }
    } catch {
      previousDemos = [];
    }

    setLands([...previousDemos, ...exampleLands]);

    if (supabase) {
      supabase
        .from("lands")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(100)
        .then(({ data, error }) => {
          if (!active) return;

          if (error) {
            console.error("İlanlar alınamadı:", error.message);
            return;
          }

          const databaseLands = (data || []).map(rowToLand);

          setLands([
            ...databaseLands,
            ...previousDemos,
            ...exampleLands
          ]);
        });
    }

    return () => {
      active = false;
    };
  }, []);

  return lands;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatArea(value: number) {
  return `${value.toLocaleString("tr-TR")} m²`;
}
