"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function OfferForm({ landId }: { landId: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const realId = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(landId);

  useEffect(() => {
    const client = supabase;
    if (!client || !realId) {
      setChecking(false);
      return;
    }

    let active = true;

    async function load() {
      const { data: auth } = await client!.auth.getUser();
      const { data: land } = await client!
        .from("lands")
        .select("owner_id")
        .eq("id", landId)
        .maybeSingle();

      if (!active) return;

      setUserId(auth.user?.id ?? null);
      setOwnerId(land?.owner_id ?? null);
      setChecking(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [landId, realId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = supabase;
    if (!client) return;

    if (message.trim().length < 10) {
      setError("Mesaj en az 10 karakter olmalı.");
      return;
    }

    if (
      amount !== "" &&
      (!Number.isFinite(Number(amount)) || Number(amount) < 0)
    ) {
      setError("Geçerli bir teklif tutarı gir.");
      return;
    }

    setBusy(true);
    setError("");

    const { data: auth, error: authError } =
      await client.auth.getUser();

    if (authError || !auth.user) {
      setError("Oturum sona ermiş. Tekrar giriş yap.");
      setBusy(false);
      return;
    }

    const { data, error: insertError } = await client
      .from("offers")
      .insert({
        land_id: landId,
        sender_id: auth.user.id,
        proposed_price: amount === "" ? null : Number(amount),
        initial_message: message.trim()
      })
      .select("id")
      .single();

    setBusy(false);

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Bu araziye zaten teklif gönderdin. Tekliflerim sayfasından görüşmeyi aç."
          : insertError.message
      );
      return;
    }

    router.push(`/teklifler/${data.id}`);
  }

  if (!realId) {
    return (
      <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
        Bu örnek bir ilan. Gerçek bir kullanıcı ilanına teklif gönderebilirsin.
      </p>
    );
  }

  if (checking) {
    return <p className="text-sm text-gray-500">Yükleniyor...</p>;
  }

  if (userId && ownerId === userId) {
    return (
      <div className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
        Bu ilan sana ait.
        <Link href="/teklifler" className="mt-2 block font-bold underline">
          Gelen teklifleri gör
        </Link>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Arazi sahibine teklif göndermek için giriş yapmalısın.
        </p>
        <Link
          href="/giris"
          className="block rounded-xl bg-green-900 p-4 text-center font-bold text-white"
        >
          Giriş Yap
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-bold">Araziye teklif gönder</h2>

      <label className="block text-sm font-semibold">
        Teklif tutarı (TL) — isteğe bağlı
        <input
          type="number"
          min="0"
          step="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Örn. 75000"
          className="mt-2 w-full rounded-xl border border-green-100 p-3"
        />
      </label>

      <label className="block text-sm font-semibold">
        Mesajın
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Bu araziyle ilgileniyorum. Üretim planım..."
          className="mt-2 w-full rounded-xl border border-green-100 p-3"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-700">{error}</p>
      )}

      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-900 p-4 font-bold text-white disabled:opacity-50"
      >
        <Send size={18} />
        {busy ? "Gönderiliyor..." : "Teklif Gönder"}
      </button>

      <p className="text-xs leading-5 text-gray-500">
        Teklifin yalnızca sen ve arazi sahibi tarafından görüntülenebilir.
        Kabul edilmesi hukuken bağlayıcı bir sözleşme oluşturmaz.
      </p>
    </form>
  );
}
