"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Inbox, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/lands";

type Offer = {
  id: string;
  land_id: string;
  sender_id: string;
  proposed_price: number | null;
  initial_message: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

const statuses = {
  pending: "Bekliyor",
  accepted: "Kabul edildi",
  rejected: "Reddedildi"
};

export default function OffersPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [landNames, setLandNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setError("Supabase yapılandırması bulunamadı.");
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

      setUserId(auth.user.id);

      const { data, error: queryError } = await client!
        .from("offers")
        .select(
          "id,land_id,sender_id,proposed_price,initial_message,status,created_at"
        )
        .order("created_at", { ascending: false });

      if (!active) return;

      if (queryError) {
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const rows = (data || []) as Offer[];
      setOffers(rows);

      const ids = [...new Set(rows.map(o => o.land_id))];

      if (ids.length) {
        const { data: lands, error: landError } = await client!
          .from("lands")
          .select("id,title")
          .in("id", ids);

        if (!active) return;

        if (landError) {
          setError(landError.message);
        } else {
          const names: Record<string, string> = {};

          for (const land of lands || []) {
            names[land.id] = land.title;
          }

          setLandNames(names);
        }
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [revision]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("agrishare-offers-list")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "offers"
        },
        () => setRevision(value => value + 1)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers"
        },
        () => setRevision(value => value + 1)
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <main className="mx-auto max-w-6xl px-5 py-20">Yükleniyor...</main>;
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-20">
        <h1 className="text-3xl font-bold">Giriş yapmalısın</h1>
        <Link href="/giris" className="mt-5 inline-block text-green-700">
          Giriş Yap
        </Link>
      </main>
    );
  }

  const received = offers.filter(o => o.sender_id !== userId);
  const sent = offers.filter(o => o.sender_id === userId);

  function offerList(items: Offer[]) {
    if (!items.length) {
      return (
        <p className="rounded-2xl bg-white p-8 text-sm text-gray-500">
          Henüz bu bölümde teklif yok.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {items.map(offer => (
          <Link
            href={`/teklifler/${offer.id}`}
            key={offer.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-100 bg-white p-6 transition hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">
                {statuses[offer.status]}
              </span>

              <h3 className="mt-3 font-bold">
                {landNames[offer.land_id] || "Arazi ilanı"}
              </h3>

              <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                {offer.initial_message}
              </p>

              <p className="mt-3 text-xs text-gray-400">
                {new Date(offer.created_at).toLocaleDateString("tr-TR")}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-green-900">
                {offer.proposed_price !== null
                  ? formatPrice(Number(offer.proposed_price))
                  : "Tutar belirtilmedi"}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-green-700">
                Görüşmeyi aç <ArrowUpRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-14">
      <p className="text-xs font-bold tracking-widest text-green-700">
        AGRISHARE / TEKLİFLER
      </p>

      <h1 className="mt-3 text-4xl font-black">Tekliflerim</h1>

      <p className="mt-4 text-sm text-gray-500">
        Gelen teklifleri yönet ve gönderdiğin teklifleri takip et.
      </p>

      {error && (
        <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      <section className="mt-12">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold">
          <Inbox className="text-green-700" />
          Gelen teklifler ({received.length})
        </h2>
        {offerList(received)}
      </section>

      <section className="mt-14">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold">
          <Send className="text-green-700" />
          Gönderdiğim teklifler ({sent.length})
        </h2>
        {offerList(sent)}
      </section>
    </main>
  );
}
