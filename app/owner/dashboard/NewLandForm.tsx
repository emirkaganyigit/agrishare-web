"use client";

import { useState, FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NewLandForm() {
  const supabase = createSupabaseBrowserClient();

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [sizeDekar, setSizeDekar] = useState("");
  const [description, setDescription] = useState("");
  const [soilType, setSoilType] = useState("");
  const [irrigation, setIrrigation] = useState("");
  const [suitableFor, setSuitableFor] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const suitableArray =
      suitableFor
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0) || null;

    const sizeNumber = Number(sizeDekar);

    if (!title || !city || !sizeNumber) {
      setError("Başlık, şehir ve büyüklük (dekar) zorunludur.");
      setLoading(false);
      return;
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      setError("Arazi eklemek için giriş yapmalısın.");
      setLoading(false);
      return;
    }

    const user = userData.user;
    const role = user.user_metadata?.role;

    if (role !== "owner") {
      setError("Arazi eklemek için arazi sahibi hesabı ile giriş yapmalısın.");
      setLoading(false);
      return;
    }

    const ownerId = user.id;

    const { error: insertError } = await supabase.from("lands").insert([
      {
        owner_id: ownerId,
        title,
        city,
        district: district || null,
        size_dekar: sizeNumber,
        description: description || null,
        soil_type: soilType || null,
        irrigation: irrigation || null,
        suitable_for: suitableArray,
      },
    ]);

    if (insertError) {
      console.error(insertError);
      setError("Kayıt eklenirken bir hata oluştu.");
    } else {
      setMessage("Arazi başarıyla eklendi! Sayfayı yenilersen listede görürsün.");
      setTitle("");
      setCity("");
      setDistrict("");
      setSizeDekar("");
      setDescription("");
      setSoilType("");
      setIrrigation("");
      setSuitableFor("");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold">Yeni Arazi Ekle</h2>

      <div>
        <label className="block text-xs font-medium text-slate-700">Başlık *</label>
        <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">Şehir *</label>
          <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">İlçe</label>
          <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={district} onChange={(e) => setDistrict(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Büyüklük (dekar) *</label>
          <input type="number" step="0.1" className="mt-1 w-full rounded border px-2 py-1 text-sm" value={sizeDekar} onChange={(e) => setSizeDekar(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Toprak tipi</label>
        <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={soilType} onChange={(e) => setSoilType(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Sulama durumu</label>
        <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={irrigation} onChange={(e) => setIrrigation(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Uygun ürünler (virgülle ayır)</label>
        <input className="mt-1 w-full rounded border px-2 py-1 text-sm" value={suitableFor} onChange={(e) => setSuitableFor(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700">Açıklama</label>
        <textarea className="mt-1 w-full rounded border px-2 py-1 text-sm" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {loading ? "Kaydediliyor..." : "Araziyi Kaydet"}
      </button>

      {message && <p className="text-xs text-emerald-700">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
