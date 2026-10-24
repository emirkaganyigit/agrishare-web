"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Sprout, Upload, ArrowRight } from "lucide-react";
import { cities, LandType } from "@/lib/lands";
import { supabase } from "@/lib/supabase";
import LandLocationPicker from "@/components/LandLocationPicker";

export default function AddListingPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("İzmir");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<LandType>("Kiralık");
  const [irrigation, setIrrigation] = useState(false);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setChecking(false);
      return;
    }

    client.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const field =
    "mt-2 w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 text-sm outline-green-600";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const client = supabase;

    if (!client) {
      setError("Supabase yapılandırması bulunamadı.");
      return;
    }

    if (
      title.trim().length < 8 ||
      !district.trim() ||
      !Number.isFinite(Number(area)) ||
      Number(area) <= 0 ||
      !Number.isFinite(Number(price)) ||
      price === "" ||
      Number(price) < 0
    ) {
      setError("İlan bilgilerini kontrol et.");
      return;
    }

    if (
      photo &&
      (
        photo.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(photo.type)
      )
    ) {
      setError("Fotoğraf JPEG, PNG veya WebP olmalı ve 5 MB'ı geçmemeli.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await client.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("İlan yayınlamak için giriş yapmalısın.");
      }

      let imageUrl: string | null = null;

      if (photo) {
        const extension: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp"
        };

        const path =
          `${authData.user.id}/${crypto.randomUUID()}.${extension[photo.type]}`;

        const { error: uploadError } = await client.storage
          .from("land-photos")
          .upload(path, photo, {
            contentType: photo.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = client.storage
          .from("land-photos")
          .getPublicUrl(path);

        imageUrl = publicData.publicUrl;
      }

      const { data, error: insertError } = await client
        .from("lands")
        .insert({
          owner_id: authData.user.id,
          title: title.trim(),
          city,
          district: district.trim(),
          area: Number(area),
          price: Number(price),
          type,
          irrigation,
          description: description.trim(),
          latitude,
          longitude,
          image_url: imageUrl
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      router.push(`/araziler/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "İlan kaydedilemedi."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        Oturum kontrol ediliyor...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-black">İlan vermek için giriş yap</h1>
        <p className="mt-4 text-gray-500">
          Agrishare üzerinde ilan yayınlamak için hesabın olmalı.
        </p>
        <Link
          href="/giris"
          className="mt-7 inline-flex rounded-xl bg-green-900 px-8 py-4 font-bold text-white"
        >
          Giriş Yap / Kayıt Ol
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
      <p className="text-xs font-bold tracking-widest text-green-700">
        AGRISHARE / İLAN VER
      </p>

      <h1 className="mt-3 text-4xl font-black">
        Yeni arazi ilanı oluştur
      </h1>

      <p className="mt-4 text-sm text-gray-500">
        İlanın veritabanına kaydedilecek ve diğer kullanıcılar tarafından
        görüntülenebilecek.
      </p>

      <div className="mt-7 rounded-xl bg-yellow-50 p-5 text-sm text-yellow-900">
        Henüz ilan moderasyonu bulunmuyor. Test için gerçek
        kişisel bilgileri, tam parsel adreslerini veya özel belgeleri
        paylaşma.
      </div>

      <form
        onSubmit={submit}
        className="mt-8 space-y-7 rounded-3xl border border-green-100 bg-white p-7 sm:p-10"
      >
        <div className="flex items-center gap-3">
          <Sprout className="text-green-700" size={26} />
          <h2 className="text-xl font-bold">Arazi bilgileri</h2>
        </div>

        <label className="block text-sm font-semibold">
          İlan başlığı *
          <input
            required
            minLength={8}
            maxLength={150}
            className={field}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Örn. İzmir'de sulamalı tarla"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Şehir *
            <select
              className={field}
              value={city}
              onChange={e => setCity(e.target.value)}
            >
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
          </label>

          <label className="block text-sm font-semibold">
            İlçe *
            <input
              required
              className={field}
              value={district}
              onChange={e => setDistrict(e.target.value)}
              placeholder="Örn. Torbalı"
            />
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Arazi büyüklüğü (m²) *
            <input
              type="number"
              min="1"
              step="1"
              required
              className={field}
              value={area}
              onChange={e => setArea(e.target.value)}
            />
          </label>

          <label className="block text-sm font-semibold">
            Bedel (TL) *
            <input
              type="number"
              min="0"
              step="1"
              required
              className={field}
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          İlan tipi *
          <select
            className={field}
            value={type}
            onChange={e => setType(e.target.value as LandType)}
          >
            <option>Kiralık</option>
            <option>Satılık</option>
            <option>Ortak Üretim</option>
          </select>
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={irrigation}
            onChange={e => setIrrigation(e.target.checked)}
          />
          Sulama imkânı var
        </label>

        <div className="space-y-3">
          <h3 className="text-lg font-bold">
            Arazi konumu (isteğe bağlı)
          </h3>
          <LandLocationPicker
            latitude={latitude}
            longitude={longitude}
            onSelect={(lat, lon) => {
              setLatitude(lat);
              setLongitude(lon);
            }}
          />
        </div>

        <label className="block text-sm font-semibold">
          Arazi açıklaması
          <textarea
            className={field}
            rows={5}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Arazi özellikleri, ulaşım ve kullanım koşulları..."
          />
        </label>

        <label className="block text-sm font-semibold">
          <span className="mb-3 flex items-center gap-2">
            <Upload size={19} />
            Arazi fotoğrafı (isteğe bağlı)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className={field}
            onChange={e => setPhoto(e.target.files?.[0] || null)}
          />
          <span className="mt-2 block text-xs font-normal text-gray-500">
            JPEG, PNG veya WebP — en fazla 5 MB.
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#164c35] px-6 py-4 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
        >
          {loading ? "İlan kaydediliyor..." : "İlanı Yayınla"}
          {!loading && <ArrowRight size={19} />}
        </button>
      </form>
    </main>
  );
}
