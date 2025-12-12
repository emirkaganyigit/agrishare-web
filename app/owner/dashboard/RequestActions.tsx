"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = "pending" | "accepted" | "rejected";

export default function RequestActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: Status;
}) {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(currentStatus);

  async function update(nextStatus: Status) {
    setLoading(true);

    const { error } = await supabase
      .from("requests")
      .update({ status: nextStatus })
      .eq("id", requestId);

    if (error) {
      console.error(error);
      alert("Durum güncellenemedi.");
    } else {
      setStatus(nextStatus);
    }

    setLoading(false);
  }

  const badgeClass =
    status === "pending"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : status === "accepted"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-red-50 text-red-700 border-red-200";

  const badgeText =
    status === "pending" ? "Beklemede" : status === "accepted" ? "Kabul" : "Reddedildi";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
        {badgeText}
      </span>

      <button
        disabled={loading || status === "accepted"}
        onClick={() => update("accepted")}
        className="rounded-md border px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-50"
      >
        Kabul
      </button>

      <button
        disabled={loading || status === "rejected"}
        onClick={() => update("rejected")}
        className="rounded-md border px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-50"
      >
        Reddet
      </button>

      {status !== "pending" && (
        <button
          disabled={loading}
          onClick={() => update("pending")}
          className="rounded-md border px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-50"
          title="Yanlışlıkla işaretlediysem geri al"
        >
          Geri al
        </button>
      )}
    </div>
  );
}
