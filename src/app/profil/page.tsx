"use client";

import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import Link from "next/link";

import {
  UserRound,
  Save,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type UserType = "owner" | "entrepreneur" | "both";

type ProfileForm = {
  display_name: string;
  user_type: UserType;
  city: string;
  bio: string;
};

const emptyForm: ProfileForm = {
  display_name: "",
  user_type: "both",
  city: "",
  bio: ""
};

const inputClass =
  "mt-2 w-full rounded-xl border border-green-100 " +
  "bg-white px-4 py-3 text-sm outline-green-600";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [exists, setExists] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setError("Supabase bağlantısı bulunamadı.");
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      const { data: auth, error: authError } =
        await client!.auth.getUser();

      if (!active) return;

      if (authError || !auth.user) {
        setLoading(false);
        return;
      }

      setUserId(auth.user.id);
      setEmail(auth.user.email ?? "");

      const { data, error: profileError } = await client!
        .from("profiles")
        .select("display_name,user_type,city,bio")
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setError(profileError.message);
      } else if (data) {
        setExists(true);
        setForm({
          display_name: data.display_name ?? "",
          user_type: data.user_type as UserType,
          city: data.city ?? "",
          bio: data.bio ?? ""
        });
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId || saving) return;

    const values = {
      display_name: form.display_name.trim(),
      user_type: form.user_type,
      city: form.city.trim(),
      bio: form.bio.trim()
    };

    if (
      values.display_name.length < 2 ||
      values.display_name.length > 60 ||
      values.city.length > 80 ||
      values.bio.length > 500
    ) {
      setError("Profil alanlarının uzunluklarını kontrol et.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    // Kullanıcı kimliğini sadece Supabase oturumundan al.
    // İlk kayıtta INSERT, sonraki kayıtlarda UPDATE.
    const query = exists
      ? supabase
          .from("profiles")
          .update({
            ...values,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", userId)
      : supabase
          .from("profiles")
          .insert({
            user_id: userId,
            ...values
          });

    const { error: saveError } = await query
      .select("user_id")
      .single();

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setExists(true);
    setNotice("Profil bilgileri kaydedildi.");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        Profil yükleniyor...
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        <h1 className="text-3xl font-black">
          Profiline erişmek için giriş yap
        </h1>

        {error && (
          <p className="mt-4 text-red-700">{error}</p>
        )}

        <Link
          href="/giris"
          className="mt-6 inline-block rounded-xl bg-green-900 px-6 py-3 font-bold text-white"
        >
          Giriş Yap
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
        Panelime dön
      </Link>

      <div className="mt-8 flex items-center gap-3">
        <UserRound size={32} className="text-green-800" />
        <h1 className="text-3xl font-black">
          Profilim
        </h1>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Agrishare hesabını ve platformdaki rolünü tanımla.
      </p>

      <div className="mt-7 rounded-2xl border border-green-100 bg-white p-6">
        <p className="text-xs text-gray-500">
          Hesap e-posta adresin
        </p>
        <p className="mt-2 break-all font-bold text-green-900">
          {email}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          E-posta adresin bu profil formundan değiştirilemez.
        </p>
      </div>

      <form
        onSubmit={save}
        className="mt-7 space-y-6 rounded-3xl border border-green-100 bg-white p-7"
      >
        <label className="block text-sm font-semibold">
          Görünen ad
          <input
            required
            minLength={2}
            maxLength={60}
            value={form.display_name}
            onChange={e =>
              setForm({
                ...form,
                display_name: e.target.value
              })
            }
            placeholder="Adın veya işletme adın"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold">
          Kullanıcı türü
          <select
            value={form.user_type}
            onChange={e =>
              setForm({
                ...form,
                user_type: e.target.value as UserType
              })
            }
            className={inputClass}
          >
            <option value="owner">
              Arazi sahibiyim
            </option>
            <option value="entrepreneur">
              Tarım girişimcisiyim
            </option>
            <option value="both">
              Her iki rolde de bulunuyorum
            </option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Şehir
          <input
            maxLength={80}
            value={form.city}
            onChange={e =>
              setForm({
                ...form,
                city: e.target.value
              })
            }
            placeholder="Örn. İzmir"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold">
          Kısa tanıtım
          <textarea
            rows={5}
            maxLength={500}
            value={form.bio}
            onChange={e =>
              setForm({
                ...form,
                bio: e.target.value
              })
            }
            placeholder="Tarımsal ilgi alanların, deneyimin veya hedeflerin..."
            className={inputClass}
          />
          <span className="mt-2 block text-right text-xs font-normal text-gray-400">
            {form.bio.length}/500
          </span>
        </label>

        <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
          <ShieldCheck
            size={20}
            className="shrink-0 text-green-700"
          />
          <p className="text-xs leading-6 text-green-900">
            Bu sürümde profil bilgilerini yalnızca sen
            görüntüleyebilirsin. Başka kullanıcıların
            profillerine erişim izni yoktur.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-xl bg-green-50 p-4 text-sm text-green-800"
          >
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 px-5 py-4 font-bold text-white disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? "Kaydediliyor..." : "Profili Kaydet"}
        </button>
      </form>
    </main>
  );
}
