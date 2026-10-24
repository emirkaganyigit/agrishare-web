"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function AuthMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    client.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <Link
        href="/ilan-ver"
        className="rounded-full bg-[#164c35] px-4 py-2.5 text-white hover:bg-green-800"
      >
        + İlan Ver
      </Link>

      {user ? (
        <>
          <Link href="/teklifler" className="hover:text-green-700">Tekliflerim</Link>
          <Link href="/panel" className="hover:text-green-700">
            Panelim
          </Link>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-gray-500 hover:text-green-800"
          >
            Çıkış
          </button>
        </>
      ) : (
        <Link
          href="/giris"
          className="rounded-full border border-green-200 px-4 py-2.5 hover:bg-green-50"
        >
          Giriş Yap
        </Link>
      )}
    </>
  );
}
