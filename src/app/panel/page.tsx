"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  Plus,
  Sprout,
  UserRound,
  Pencil,
  Archive,
  Inbox,
  ArrowUpRight
} from "lucide-react";
import {
  rowToLand,
  formatPrice,
  formatArea,
  type Land
} from "@/lib/lands";
import { supabase } from "@/lib/supabase";

type ManagedLand = {
  land: Land;
  status: "active" | "archived";
};

export default function PanelPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<ManagedLand[]>([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
        return;
      }

      setUser(auth.user);

      const { data, error: queryError } = await client!
        .from("lands")
        .select("*")
        .eq("owner_id", auth.user.id)
        .order("created_at", { ascending: false });

      if (!active) return;

      if (queryError) {
        setError(queryError.message);
      } else {
        setItems(
          (data || []).map(row => ({
            land: rowToLand(row),
            status: row.status as "active" | "archived"
          }))
        );
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-20">
        Panel yükleniyor...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-black">
          Hesabına giriş yap
        </h1>
        <Link
          href="/giris"
          className="mt-6 inline-block rounded-xl bg-green-900 px-6 py-3 font-bold text-white"
        >
          Giriş Yap
        </Link>
      </main>
    );
  }

  const activeItems = items.filter(i => i.status === "active");
  const archivedItems = items.filter(i => i.status === "archived");

  function listingCards(entries: ManagedLand[]) {
    if (!entries.length) {
      return (
        <div className="rounded-2xl border border-green-100 bg-white p-8 text-sm text-gray-500">
          Bu bölümde henüz ilan bulunmuyor.
        </div>
      );
    }

    return (
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {entries.map(({ land, status }) => (
          <article
            key={land.id}
            className="overflow-hidden rounded-2xl border border-green-100 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={land.image}
              alt={land.title}
              className="h-44 w-full object-cover"
            />

            <div className="p-5">
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                {status === "active" ? "Yayında" : "Arşivlendi"}
              </span>

              <h3 className="mt-4 min-h-12 font-bold leading-6">
                {land.title}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {land.district}, {land.city}
              </p>

              <p className="mt-2 text-xs text-gray-400">
                {formatArea(land.area)}
              </p>

              <p className="mt-4 text-xl font-black text-green-900">
                {formatPrice(land.price)}
              </p>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-green-100 pt-5">
                <Link
                  href={`/panel/ilanlar/${land.id}/duzenle`}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-900 px-4 py-3 text-sm font-bold text-white"
                >
                  <Pencil size={16} />
                  Düzenle
                </Link>
                <Link
                  href={`/panel/ilanlar/${land.id}/toprak`}
                  className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-4 py-3 text-sm font-bold text-green-900"
                >
                  <Sprout size={16} />
                  Toprak Analizi
                </Link>

                {status === "active" && (
                  <Link
                    href={`/araziler/${land.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-900"
                  >
                    Görüntüle
                    <ArrowUpRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <p className="text-xs font-bold tracking-widest text-green-700">
        AGRISHARE / HESABIM
      </p>

      <h1 className="mt-3 text-4xl font-black">
        Kullanıcı panelim
      </h1>

      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-6">
          <UserRound className="text-green-800" />
          <p className="mt-4 break-all text-sm font-semibold">
            {user.email}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Hesabım
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <Sprout className="text-green-800" />
          <p className="mt-4 text-2xl font-black">
            {activeItems.length}
          </p>
          <p className="text-xs text-gray-400">
            Yayındaki ilanlarım
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6">
          <Archive className="text-green-800" />
          <p className="mt-4 text-2xl font-black">
            {archivedItems.length}
          </p>
          <p className="text-xs text-gray-400">
            Arşivlenen ilanlarım
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-bold text-green-900"
        >
          <UserRound size={18} />
          Profilim
        </Link>
        <Link
          href="/ilan-ver"
          className="inline-flex items-center gap-2 rounded-xl bg-green-900 px-5 py-3 text-sm font-bold text-white"
        >
          <Plus size={18} />
          Yeni İlan
        </Link>

        <Link
          href="/teklifler"
          className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-bold text-green-900"
        >
          <Inbox size={18} />
          Tekliflerim
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-7 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-black">
          Yayındaki ilanlarım
        </h2>
        {listingCards(activeItems)}
      </section>

      <section className="mt-14">
        <h2 className="mb-6 text-2xl font-black">
          Arşivlenen ilanlarım
        </h2>
        {listingCards(archivedItems)}
      </section>
    </main>
  );
}
