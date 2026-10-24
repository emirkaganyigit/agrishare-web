"use client";

import {
  useEffect,
  useState,
  type FormEvent
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Archive,
  RotateCcw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import LandLocationPicker from "@/components/LandLocationPicker";
import { cities, type LandType } from "@/lib/lands";

type EditableLand = {
  id: string;
  title: string;
  city: string;
  district: string;
  area: number;
  price: number;
  type: LandType;
  irrigation: boolean;
  description: string;
  latitude: number | null;
  longitude: number | null;
  status: "active" | "archived";
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-green-100 " +
  "bg-white px-4 py-3 text-sm outline-green-600";

export default function EditLandPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [land, setLand] = useState<EditableLand | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
        setError("Bu sayfayı kullanmak için giriş yapmalısın.");
        setLoading(false);
        return;
      }

      setUserId(auth.user.id);

      const { data, error: queryError } = await client!
        .from("lands")
        .select(
          "id,title,city,district,area,price,type,irrigation,description,status,latitude,longitude"
        )
        .eq("id", id)
        .eq("owner_id", auth.user.id)
        .maybeSingle();

      if (!active) return;

      if (queryError || !data) {
        setError(
          queryError?.message ||
          "İlan bulunamadı veya düzenleme yetkin yok."
        );
      } else {
        setLand({
          ...data,
          area: Number(data.area),
          price: Number(data.price),
          latitude: data.latitude == null ? null : Number(data.latitude),
          longitude: data.longitude == null ? null : Number(data.longitude)
        } as EditableLand);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!land || !supabase || !userId || busy) return;

    if (
      land.title.trim().length < 8 ||
      land.title.trim().length > 150 ||
      !land.district.trim() ||
      !Number.isFinite(land.area) ||
      land.area <= 0 ||
      !Number.isFinite(land.price) ||
      land.price < 0
    ) {
      setError("Lütfen ilan bilgilerini kontrol et.");
      return;
    }

    setBusy(true);
    setError("");

    const { error: updateError } = await supabase
      .from("lands")
      .update({
        title: land.title.trim(),
        city: land.city,
        district: land.district.trim(),
        area: land.area,
        price: land.price,
        type: land.type,
        irrigation: land.irrigation,
        description: land.description.trim(),
        latitude: land.latitude,
        longitude: land.longitude
      })
      .eq("id", id)
      .eq("owner_id", userId)
      .select("id")
      .single();

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  async function changeStatus(
    next: "active" | "archived"
  ) {
    if (!land || !supabase || !userId || busy) return;

    if (
      next === "archived" &&
      !window.confirm(
        "İlan yayından kaldırılacak. Geçmiş teklifler " +
        "ve mesajlar korunacak. Devam edilsin mi?"
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { error: updateError } = await supabase
      .from("lands")
      .update({ status: next })
      .eq("id", id)
      .eq("owner_id", userId)
      .select("id")
      .single();

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        İlan bilgileri yükleniyor...
      </main>
    );
  }

  if (!land) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        <h1 className="text-2xl font-bold">
          İlan düzenlenemiyor
        </h1>

        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>

        <Link
          href="/panel"
          className="mt-5 inline-block text-green-700"
        >
          Panele dön
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <Link
        href="/panel"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
      >
        <ArrowLeft size={18} />
        Panelime dön
      </Link>

      <h1 className="mt-7 text-3xl font-black">
        İlanı düzenle
      </h1>

      <p className="mt-3 text-sm text-gray-500">
        İlan bilgilerini değiştir veya yayın durumunu yönet.
      </p>

      <div className="mt-6 rounded-xl bg-green-50 p-4">
        <p className="text-sm font-bold text-green-900">
          Yayın durumu:{" "}
          {land.status === "active"
            ? "Yayında"
            : "Arşivlendi"}
        </p>
      </div>

      <form
        onSubmit={save}
        className="mt-8 space-y-6 rounded-3xl border border-green-100 bg-white p-7"
      >
        <label className="block text-sm font-semibold">
          İlan başlığı
          <input
            required
            minLength={8}
            maxLength={150}
            className={fieldClass}
            value={land.title}
            onChange={e =>
              setLand({ ...land, title: e.target.value })
            }
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Şehir
            <select
              className={fieldClass}
              value={land.city}
              onChange={e =>
                setLand({ ...land, city: e.target.value })
              }
            >
              {!cities.includes(land.city) && (
                <option value={land.city}>{land.city}</option>
              )}
              {cities.map(city => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            İlçe
            <input
              required
              className={fieldClass}
              value={land.district}
              onChange={e =>
                setLand({ ...land, district: e.target.value })
              }
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Alan (m²)
            <input
              required
              type="number"
              min="1"
              className={fieldClass}
              value={land.area}
              onChange={e =>
                setLand({
                  ...land,
                  area: Number(e.target.value)
                })
              }
            />
          </label>

          <label className="block text-sm font-semibold">
            Fiyat (TL)
            <input
              required
              type="number"
              min="0"
              className={fieldClass}
              value={land.price}
              onChange={e =>
                setLand({
                  ...land,
                  price: Number(e.target.value)
                })
              }
            />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          İlan türü
          <select
            className={fieldClass}
            value={land.type}
            onChange={e =>
              setLand({
                ...land,
                type: e.target.value as LandType
              })
            }
          >
            <option>Kiralık</option>
            <option>Satılık</option>
            <option>Ortak Üretim</option>
          </select>
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={land.irrigation}
            onChange={e =>
              setLand({
                ...land,
                irrigation: e.target.checked
              })
            }
          />
          Sulama imkânı var
        </label>

        <div className="space-y-3">
          <h3 className="text-lg font-bold">
            Yaklaşık arazi konumu
          </h3>
          <LandLocationPicker
            latitude={land.latitude}
            longitude={land.longitude}
            onSelect={(lat, lon) =>
              setLand({
                ...land,
                latitude: lat,
                longitude: lon
              })
            }
          />
        </div>

        <label className="block text-sm font-semibold">
          Açıklama
          <textarea
            rows={6}
            className={fieldClass}
            value={land.description}
            onChange={e =>
              setLand({
                ...land,
                description: e.target.value
              })
            }
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 px-6 py-4 font-bold text-white disabled:opacity-50"
        >
          <Save size={19} />
          {busy ? "Kaydediliyor..." : "Değişiklikleri kaydet"}
        </button>
      </form>

      <section className="mt-8 rounded-3xl border border-green-100 bg-white p-7">
        <h2 className="text-xl font-bold">
          Yayın yönetimi
        </h2>

        <p className="mt-3 text-sm leading-7 text-gray-500">
          İlanı yayından kaldırdığında genel arama ve ana
          sayfadan gizlenir. Geçmiş tekliflerin ve
          mesajların korunur.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            changeStatus(
              land.status === "active"
                ? "archived"
                : "active"
            )
          }
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-green-200 px-6 py-3 text-sm font-bold text-green-900 disabled:opacity-50"
        >
          {land.status === "active" ? (
            <>
              <Archive size={19} />
              Yayından kaldır
            </>
          ) : (
            <>
              <RotateCcw size={19} />
              Yeniden yayınla
            </>
          )}
        </button>
      </section>
    </main>
  );
}
