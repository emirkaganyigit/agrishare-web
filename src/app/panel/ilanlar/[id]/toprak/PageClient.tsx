"use client";

import {
  useEffect,
  useState,
  type FormEvent
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  Save,
  Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type FormData = {
  ph: string;
  ece_dsm: string;
  organic_matter_pct: string;
  texture: string;
  drainage: string;
  sampled_at: string;
};

const emptyForm: FormData = {
  ph: "",
  ece_dsm: "",
  organic_matter_pct: "",
  texture: "",
  drainage: "",
  sampled_at: ""
};

const inputClass =
  "mt-2 w-full rounded-xl border border-green-100 " +
  "bg-white px-4 py-3 text-sm outline-green-600";

export default function SoilEditPage() {
  const { id } = useParams<{ id: string }>();

  const [title, setTitle] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function change(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setNotice("");
  }

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setError("Supabase bağlantısı bulunamadı.");
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      const { data: auth } = await client!.auth.getUser();

      if (!active) return;

      if (!auth.user) {
        setError("Toprak bilgilerini düzenlemek için giriş yapmalısın.");
        setLoading(false);
        return;
      }

      const { data: land, error: landError } = await client!
        .from("lands")
        .select("id,title")
        .eq("id", id)
        .eq("owner_id", auth.user.id)
        .maybeSingle();

      if (!active) return;

      if (landError || !land) {
        setError(
          landError?.message ||
          "İlan bulunamadı veya bu ilana erişim yetkin yok."
        );
        setLoading(false);
        return;
      }

      setTitle(land.title);

      const { data: soil, error: soilError } = await client!
        .from("land_soil_profiles")
        .select(
          "ph,ece_dsm,organic_matter_pct,texture,drainage,sampled_at"
        )
        .eq("land_id", id)
        .maybeSingle();

      if (!active) return;

      if (soilError) {
        setError(soilError.message);
      } else if (soil) {
        setExists(true);
        setForm({
          ph: soil.ph == null ? "" : String(soil.ph),
          ece_dsm:
            soil.ece_dsm == null ? "" : String(soil.ece_dsm),
          organic_matter_pct:
            soil.organic_matter_pct == null
              ? ""
              : String(soil.organic_matter_pct),
          texture: soil.texture ?? "",
          drainage: soil.drainage ?? "",
          sampled_at: soil.sampled_at ?? ""
        });
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  function parseOptionalNumber(
    value: string,
    label: string,
    min: number,
    max: number
  ) {
    if (value.trim() === "") return null;

    const n = Number(value.replace(",", "."));

    if (!Number.isFinite(n) || n < min || n > max) {
      throw new Error(
        `${label}: ${min} ile ${max} arasında bir sayı gir.`
      );
    }

    return n;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const client = supabase;
    if (!client || !title || busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const fields = {
        ph: parseOptionalNumber(form.ph, "pH", 0, 14),
        ece_dsm: parseOptionalNumber(
          form.ece_dsm, "ECe", 0, 100
        ),
        organic_matter_pct: parseOptionalNumber(
          form.organic_matter_pct, "Organik madde", 0, 100
        ),
        texture: form.texture || null,
        drainage: form.drainage || null,
        sampled_at: form.sampled_at || null
      };

      if (
        Object.values(fields).every(value => value === null)
      ) {
        throw new Error(
          "En az bir toprak bilgisi girmelisin."
        );
      }

      if (
        fields.sampled_at &&
        fields.sampled_at >
          new Date().toISOString().slice(0, 10)
      ) {
        throw new Error(
          "Numune tarihi gelecekte olamaz."
        );
      }

      // Ekleme ve güncellemeyi ayrı yapıyoruz.
      // Böylece land_id alanına UPDATE izni gerekmez.
      const query = exists
        ? client
            .from("land_soil_profiles")
            .update(fields)
            .eq("land_id", id)
        : client
            .from("land_soil_profiles")
            .insert({ land_id: id, ...fields });

      const { error: saveError } = await query
        .select("land_id")
        .single();

      if (saveError) {
        throw new Error(saveError.message);
      }

      setExists(true);
      setNotice("Toprak bilgileri kaydedildi.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kaydetme sırasında hata oluştu."
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteProfile() {
    const client = supabase;

    if (!client || !exists || busy) return;

    if (
      !window.confirm(
        "Bu ilanın toprak bilgileri silinsin mi? " +
        "İlan ve teklif kayıtları korunacak."
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    const { error: deleteError } = await client
      .from("land_soil_profiles")
      .delete()
      .eq("land_id", id)
      .select("land_id")
      .single();

    setBusy(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setExists(false);
    setForm({ ...emptyForm });
    setNotice("Toprak kaydı silindi.");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        Toprak bilgileri yükleniyor...
      </main>
    );
  }

  if (!title) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="text-2xl font-bold">
          Toprak bilgileri açılamadı
        </h1>
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
        <Link href="/panel" className="mt-5 inline-block text-green-700">
          Panele dön
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link
        href="/panel"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
      >
        <ArrowLeft size={18} />
        Panele dön
      </Link>

      <h1 className="mt-8 flex items-center gap-3 text-3xl font-black">
        <FlaskConical className="text-green-700" />
        Toprak Analizi
      </h1>

      <p className="mt-4 text-gray-600">
        {title}
      </p>

      <div className="mt-7 rounded-xl bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        Bu bilgiler ilan ziyaretçileriyle paylaşılacaktır.
        Yalnızca kendi arazine ait ölçümleri gir.
        Laboratuvar raporu yoksa alanları boş bırak.
        Kaydedilen veriler kullanıcı beyanıdır;
        Agrishare tarafından doğrulanmış değildir.
      </div>

      <form
        onSubmit={save}
        className="mt-8 space-y-6 rounded-3xl border border-green-100 bg-white p-7"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Toprak pH
            <input
              type="number"
              min="0"
              max="14"
              step="0.01"
              value={form.ph}
              onChange={e => change("ph", e.target.value)}
              placeholder="Örn. 7.20"
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-semibold">
            Tuzluluk — ECe (dS/m)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.ece_dsm}
              onChange={e => change("ece_dsm", e.target.value)}
              placeholder="Örn. 1.40"
              className={inputClass}
            />
          </label>
        </div>

        <p className="text-xs leading-6 text-gray-500">
          ECe alanına yalnızca doygunluk çamuru ekstraktından
          ölçülen değeri gir. Raporunda EC1:5 veya farklı
          bir yöntem yazıyorsa bu alanı boş bırak.
        </p>

        <label className="block text-sm font-semibold">
          Organik madde (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.organic_matter_pct}
            onChange={e =>
              change("organic_matter_pct", e.target.value)
            }
            placeholder="Örn. 2.50"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold">
          Toprak bünyesi
          <select
            value={form.texture}
            onChange={e => change("texture", e.target.value)}
            className={inputClass}
          >
            <option value="">Bilinmiyor</option>
            <option value="kumlu">Kumlu</option>
            <option value="kumlu_tinli">Kumlu-tınlı</option>
            <option value="tinli">Tınlı</option>
            <option value="killi_tinli">Killi-tınlı</option>
            <option value="killi">Killi</option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Drenaj durumu
          <select
            value={form.drainage}
            onChange={e => change("drainage", e.target.value)}
            className={inputClass}
          >
            <option value="">Bilinmiyor</option>
            <option value="iyi">İyi</option>
            <option value="orta">Orta</option>
            <option value="zayif">Zayıf</option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Numune / ölçüm tarihi (isteğe bağlı)
          <input
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={form.sampled_at}
            onChange={e =>
              change("sampled_at", e.target.value)
            }
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {notice && (
          <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 px-6 py-4 font-bold text-white disabled:opacity-50"
        >
          <Save size={18} />
          {busy ? "İşleniyor..." : "Toprak Bilgilerini Kaydet"}
        </button>
      </form>

      {exists && (
        <div className="mt-7 rounded-2xl border border-red-100 bg-white p-6">
          <h2 className="font-bold">
            Toprak kaydını kaldır
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Bu işlem ilanı silmez. Yalnızca toprak ölçümlerini kaldırır.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={deleteProfile}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-800 disabled:opacity-50"
          >
            <Trash2 size={17} />
            Toprak Kaydını Sil
          </button>
        </div>
      )}
    </main>
  );
}
