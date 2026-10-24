"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent
} from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import RealtimeConversation from "@/components/RealtimeConversation";
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

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const statusText = {
  pending: "Değerlendirme bekliyor",
  accepted: "Teklif kabul edildi",
  rejected: "Teklif reddedildi"
};

export default function OfferConversationPage() {
  const { id } = useParams<{ id: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [landTitle, setLandTitle] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = useCallback(async () => {
    const client = supabase;
    if (!client) return;

    const { data, error: queryError } = await client
      .from("offer_messages")
      .select("id,sender_id,body,created_at")
      .eq("offer_id", id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (queryError) {
      setError(queryError.message);
    } else {
      setMessages((data || []) as Message[]);
    }
  }, [id]);

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

      const { data, error: offerError } = await client!
        .from("offers")
        .select(
          "id,land_id,sender_id,proposed_price,initial_message,status,created_at"
        )
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (offerError || !data) {
        setError(offerError?.message || "Teklif bulunamadı veya erişim iznin yok.");
        setLoading(false);
        return;
      }

      const current = data as Offer;
      setOffer(current);

      const { data: land } = await client!
        .from("lands")
        .select("title,owner_id")
        .eq("id", current.land_id)
        .maybeSingle();

      if (!active) return;

      setLandTitle(land?.title || "Arazi ilanı");
      setOwnerId(land?.owner_id || "");

      await loadMessages();

      if (active) setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [id, loadMessages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const client = supabase;
    const body = text.trim();

    if (!client || !offer || !userId || !body || busy) return;

    setBusy(true);
    setError("");

    const { error: insertError } = await client
      .from("offer_messages")
      .insert({
        offer_id: offer.id,
        sender_id: userId,
        body
      });

    setBusy(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setText("");
    await loadMessages();
  }

  async function changeStatus(
    nextStatus: "accepted" | "rejected"
  ) {
    const client = supabase;

    if (
      !client ||
      !offer ||
      !userId ||
      ownerId !== userId ||
      busy
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { data, error: updateError } = await client
      .from("offers")
      .update({ status: nextStatus })
      .eq("id", offer.id)
      .select("status")
      .single();

    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOffer(prev =>
      prev ? { ...prev, status: data.status } : prev
    );
  }


  const refreshOffer = useCallback(async () => {
    const client = supabase;
    if (!client) return;

    const { data, error } = await client
      .from("offers")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return;

    setOffer(current =>
      current
        ? {
            ...current,
            status: data.status as Offer["status"]
          }
        : current
    );
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        Görüşme yükleniyor...
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        <h1 className="text-2xl font-bold">Giriş yapmalısın</h1>
        <Link href="/giris" className="mt-5 inline-block text-green-700">
          Giriş Yap
        </Link>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20">
        <h1 className="text-2xl font-bold">Teklife erişilemiyor</h1>
        <p className="mt-4 text-sm text-red-600">{error}</p>
        <Link href="/teklifler" className="mt-5 inline-block text-green-700">
          Tekliflere dön
        </Link>
      </main>
    );
  }

  const isOwner = ownerId === userId;

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <Link
        href="/teklifler"
        className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
      >
        <ArrowLeft size={18} /> Tekliflere dön
      </Link>

      <div className="mt-7 rounded-3xl border border-green-100 bg-white p-7">
        <p className="text-xs font-bold tracking-widest text-green-700">
          AGRISHARE GÖRÜŞME
        </p>

        <h1 className="mt-3 text-2xl font-black">
          {landTitle}
        </h1>

        <Link
          href={`/araziler/${offer.land_id}`}
          className="mt-2 inline-block text-sm text-green-700 underline"
        >
          Arazi ilanını görüntüle
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-green-50 p-5">
          <div>
            <p className="text-xs text-gray-500">Önerilen tutar</p>
            <p className="mt-1 text-xl font-black text-green-900">
              {offer.proposed_price !== null
                ? formatPrice(Number(offer.proposed_price))
                : "Belirtilmedi"}
            </p>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-green-800">
            {statusText[offer.status]}
          </span>
        </div>

        {isOwner && offer.status === "pending" && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => changeStatus("accepted")}
              className="inline-flex items-center gap-2 rounded-xl bg-green-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <CheckCircle2 size={18} /> Kabul Et
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => changeStatus("rejected")}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-800 disabled:opacity-50"
            >
              <XCircle size={18} /> Reddet
            </button>
          </div>
        )}

        <p className="mt-5 text-xs text-gray-400">
          Teklifin kabul edilmesi otomatik kiralama, satış veya
          ortaklık sözleşmesi oluşturmaz.
        </p>
      </div>

      <div className="mt-6">
        <RealtimeConversation
          offerId={offer.id}
          onMessage={loadMessages}
          onOffer={refreshOffer}
        />
      </div>

      <section className="mt-7 overflow-hidden rounded-3xl border border-green-100 bg-white">
        <div className="flex items-center justify-between border-b border-green-100 p-6">
          <h2 className="text-lg font-bold">Mesajlaşma</h2>

          <button
            type="button"
            onClick={loadMessages}
            aria-label="Mesajları yenile"
            className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm text-green-800"
          >
            <RefreshCw size={16} /> Yenile
          </button>
        </div>

        <div className="max-h-[540px] min-h-[300px] space-y-5 overflow-y-auto bg-[#f7faf5] p-6">
          <div
            className={`max-w-[85%] rounded-2xl p-4 ${
              offer.sender_id === userId
                ? "ml-auto bg-green-800 text-white"
                : "mr-auto border border-green-100 bg-white"
            }`}
          >
            <p className="text-xs font-bold opacity-70">
              İlk teklif mesajı
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
              {offer.initial_message}
            </p>
            <p className="mt-2 text-xs opacity-60">
              {new Date(offer.created_at).toLocaleString("tr-TR")}
            </p>
          </div>

          {messages.map(message => {
            const mine = message.sender_id === userId;

            return (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl p-4 ${
                  mine
                    ? "ml-auto bg-green-800 text-white"
                    : "mr-auto border border-green-100 bg-white"
                }`}
              >
                <p className="text-xs font-bold opacity-70">
                  {mine ? "Sen" : "Karşı taraf"}
                </p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {message.body}
                </p>
                <p className="mt-2 text-xs opacity-60">
                  {new Date(message.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
            );
          })}
        </div>

        <form onSubmit={sendMessage} className="border-t border-green-100 p-5">
          <label htmlFor="new-message" className="sr-only">
            Yeni mesaj
          </label>

          <textarea
            id="new-message"
            required
            maxLength={2000}
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Mesajını yaz..."
            className="w-full resize-none rounded-xl border border-green-100 p-4 text-sm outline-green-600"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={busy || !text.trim()}
              className="flex items-center gap-2 rounded-xl bg-green-900 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              <Send size={17} /> Mesaj Gönder
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
