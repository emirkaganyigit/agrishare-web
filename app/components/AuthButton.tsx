"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "owner" | "entrepreneur" | undefined;

export default function AuthButton() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(undefined);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    setEmail(user?.email ?? null);
    setRole(user?.user_metadata?.role as Role);
    setLoading(false);
  }

  useEffect(() => {
    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (loading) {
    return <div className="text-xs text-slate-500">...</div>;
  }

  if (!email) {
    return (
      <a
        href="/auth"
        className="rounded-lg border px-3 py-1 text-xs font-medium hover:bg-slate-50"
      >
        Giriş / Kayıt
      </a>
    );
  }

  const dashboardHref =
    role === "owner" ? "/owner/dashboard" : "/entrepreneur/dashboard";

  return (
    <div className="flex items-center gap-2">
      <a
        href={dashboardHref}
        className="rounded-lg border px-3 py-1 text-xs font-medium hover:bg-slate-50"
      >
        Panel
      </a>

      <div className="hidden md:block text-xs text-slate-600">
        {email} {role ? `(${role})` : ""}
      </div>

      <button
        onClick={logout}
        className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
      >
        Çıkış
      </button>
    </div>
  );
}
