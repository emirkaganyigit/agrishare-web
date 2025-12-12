"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "owner" | "entrepreneur";

export default function AuthPage() {
  const supabase = createSupabaseBrowserClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("entrepreneur");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function ensureProfile(userId: string, selectedRole?: Role, selectedName?: string) {
    // RLS kapalıysa direkt çalışır. Sonra RLS açınca policy ekleyeceğiz.
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      role: selectedRole ?? role,
      name: selectedName ?? name,
    });
    if (error) console.error("ensureProfile error:", error);
  }

  async function onSubmit() {
    setLoading(true);
    setMsg(null);
    setErr(null);

    try {
      if (mode === "signup") {
        if (!email || !password || !name) {
          setErr("Signup için isim, e-posta ve şifre zorunlu.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role, name }, // user_metadata
          },
        });

        if (error) throw error;

        // user hemen dönerse profile oluştur
        if (data.user) await ensureProfile(data.user.id, role, name);

        setMsg("Kayıt oluşturuldu. Eğer e-posta onayı açıksa mailini kontrol et.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // login sonrası profile garantiye al
        if (data.user) {
          const metaRole = (data.user.user_metadata?.role as Role | undefined) ?? role;
          const metaName = (data.user.user_metadata?.name as string | undefined) ?? name;
          await ensureProfile(data.user.id, metaRole, metaName);

          // role'e göre yönlendir
          window.location.href =
            metaRole === "owner" ? "/owner/dashboard" : "/entrepreneur/dashboard";
        }
      }
    } catch (e: any) {
      setErr(e.message ?? "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl bg-white p-5 shadow-sm">
      <h1 className="text-xl font-semibold">
        {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
      </h1>

      <div className="flex gap-2 text-sm">
        <button
          className={`rounded border px-3 py-1 ${mode === "login" ? "bg-slate-100" : ""}`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={`rounded border px-3 py-1 ${mode === "signup" ? "bg-slate-100" : ""}`}
          onClick={() => setMode("signup")}
        >
          Signup
        </button>
      </div>

      {mode === "signup" && (
        <>
          <div>
            <label className="block text-xs font-medium">İsim</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
            />
          </div>

          <div>
            <label className="block text-xs font-medium">Rol</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="entrepreneur">Girişimci</option>
              <option value="owner">Arazi Sahibi</option>
            </select>
          </div>
        </>
      )}

      <div>
        <label className="block text-xs font-medium">E-posta</label>
        <input
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="mail@example.com"
        />
      </div>

      <div>
        <label className="block text-xs font-medium">Şifre</label>
        <input
          type="password"
          className="mt-1 w-full rounded border px-2 py-1 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "İşleniyor..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
      </button>

      {msg && <p className="text-xs text-emerald-700">{msg}</p>}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
