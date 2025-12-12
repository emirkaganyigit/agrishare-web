"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

// Buraya Supabase'teki entrepreneur profilinin UUID'sini yapıştır:
const ENTREPRENEUR_ID = "BURAYA_GIRISIMCI_UUID_GELECEK";

export default function RequestForm({ landId }: { landId: string }) {
  const [targetProduct, setTargetProduct] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [preferredCity, setPreferredCity] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!targetProduct) {
      setError("Hedef ürün alanı zorunludur.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("requests").insert([
      {
        entrepreneur_id: ENTREPRENEUR_ID,
        land_id: landId,
        target_product: targetProduct,
        budget_range: budgetRange || null,
        preferred_city: preferredCity || null,
        note: note || null,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      setError("Talep kaydedilirken bir hata oluştu.");
    } else {
      setMessage("Talebin başarıyla oluşturuldu!");
      setTargetProduct("");
      setBudgetRange("");
      setPreferredCity("");
      setNote("");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-700">
          Hedef ürün / üretim planı *
        </label>
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          placeholder="Zeytin, sebze, üzüm vb."
          value={targetProduct}
          onChange={(e) => setTargetProduct(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Bütçe aralığı
        </label>
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          placeholder="Örn: 100k-250k"
          value={budgetRange}
          onChange={(e) => setBudgetRange(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Tercih edilen şehir
        </label>
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          placeholder="İzmir, Manisa vb."
          value={preferredCity}
          onChange={(e) => setPreferredCity(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">
          Ek notlar
        </label>
        <textarea
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          rows={3}
          placeholder="Beklentilerin, süre, ortaklık modeli vb."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Gönderiliyor..." : "Talep Oluştur"}
      </button>

      {message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </form>
  );
}
