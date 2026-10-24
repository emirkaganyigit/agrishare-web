"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MapPin, Ruler, Droplets, ArrowUpRight, Heart
} from "lucide-react";
import {
  Land, formatPrice, formatArea
} from "@/lib/lands";

export default function LandCard({ land }: { land: Land }) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("agrishare-favorites") || "[]");
      setFavorite(Array.isArray(ids) && ids.includes(land.id));
    } catch {
      setFavorite(false);
    }
  }, [land.id]);

  function toggleFavorite() {
    try {
      const ids = JSON.parse(localStorage.getItem("agrishare-favorites") || "[]");
      const current: string[] = Array.isArray(ids) ? ids : [];
      const next = current.includes(land.id)
        ? current.filter(id => id !== land.id)
        : [...current, land.id];
      localStorage.setItem("agrishare-favorites", JSON.stringify(next));
      setFavorite(next.includes(land.id));
    } catch {
      // Depolama kullanılamıyorsa işlem yapılmaz.
    }
  }

  return (
    <article className="group overflow-hidden rounded-3xl border border-[#e4eae0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden bg-green-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={land.image}
          alt={land.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <span className="absolute left-4 top-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-green-900">
          {land.type}
        </span>

        <button
          type="button"
          aria-label={favorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          aria-pressed={favorite}
          onClick={toggleFavorite}
          className="absolute right-4 top-4 rounded-full bg-white p-3 text-green-900"
        >
          <Heart size={19} className={favorite ? "fill-red-500 text-red-500" : ""} />
        </button>
      </div>

      <div className="p-5">
        <p className="flex items-center gap-1 text-xs text-[#74917a]">
          <MapPin size={15} />
          {land.district}, {land.city}
        </p>

        <Link
          href={`/araziler/${land.id}`}
          className="mt-3 block min-h-14 text-lg font-bold leading-snug text-[#1b3b2a] hover:text-green-700"
        >
          {land.title}
        </Link>

        <div className="mt-5 flex flex-wrap gap-4 border-b border-green-50 pb-5 text-xs text-[#6e8576]">
          <span className="flex items-center gap-1">
            <Ruler size={16} /> {formatArea(land.area)}
          </span>
          <span className="flex items-center gap-1">
            <Droplets size={16} />
            {land.irrigation ? "Sulama var" : "Sulama belirtilmedi"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-5">
          <div>
            <p className="text-xs text-[#91a092]">
              {land.type === "Kiralık" ? "Yıllık kira" : land.type === "Satılık" ? "Satış bedeli" : "Temsili teklif"}
            </p>
            <p className="mt-1 text-xl font-black text-[#195138]">
              {formatPrice(land.price)}
            </p>
          </div>
          <Link
            href={`/araziler/${land.id}`}
            className="rounded-full bg-[#eaf3e3] p-3 text-green-800 hover:bg-[#cbe9ba]"
            aria-label="İlanı incele"
          >
            <ArrowUpRight size={21} />
          </Link>
        </div>
      </div>
    </article>
  );
}
