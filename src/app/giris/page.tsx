"use client";

import {
  useEffect,
  useState,
  type FormEvent
} from "react";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    client.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/panel");
    });
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase ayarları bulunamadı. .env.local dosyasını kontrol et.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/giris`
          }
        });

        if (authError) throw authError;

        if (data.session) {
          router.push("/panel");
        } else {
          setNotice(
            "Kayıt isteğin alındı. Hesap doğrulaması gerekiyorsa e-postana gelen bağlantıyı aç."
          );
        }
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
          });

        if (authError) throw authError;

        router.push("/panel");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-green-100 bg-white px-4 py-3.5 text-sm text-green-950 outline-green-600";

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-8 shadow-xl sm:p-10">
        <div className="mx-auto flex w-fit rounded-2xl bg-green-900 p-4 text-white">
          <Leaf size={28} />
        </div>

        <h1 className="mt-7 text-center text-3xl font-black">
          {mode === "login" ? "Tekrar hoş geldin" : "Agrishare'ye katıl"}
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-gray-500">
          {mode === "login"
            ? "Hesabına giriş yap ve arazilerini yönet."
            : "Ücretsiz hesabını oluştur ve arazi paylaşmaya başla."}
        </p>

        <div className="mt-8 grid grid-cols-2 rounded-xl bg-green-50 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setNotice("");
            }}
            className={`rounded-lg py-3 text-sm font-bold ${
              mode === "login" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setNotice("");
            }}
            className={`rounded-lg py-3 text-sm font-bold ${
              mode === "signup" ? "bg-white shadow-sm" : "text-gray-500"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold">
            <span className="mb-2 flex items-center gap-2">
              <Mail size={17} /> E-posta
            </span>
            <input
              className={inputClass}
              type="email"
              required
              autoComplete="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </label>

          <label className="block text-sm font-semibold">
            <span className="mb-2 flex items-center gap-2">
              <Lock size={17} /> Şifre
            </span>
            <input
              className={inputClass}
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="En az 6 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#164c35] px-5 py-4 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {loading
              ? "İşleniyor..."
              : mode === "login"
                ? "Giriş Yap"
                : "Hesap Oluştur"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </main>
  );
}
