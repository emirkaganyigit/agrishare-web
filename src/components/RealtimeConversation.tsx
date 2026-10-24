"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  offerId: string;
  onMessage: () => void | Promise<void>;
  onOffer: () => void | Promise<void>;
};

export default function RealtimeConversation({
  offerId,
  onMessage,
  onOffer
}: Props) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel(`agrishare-conversation-${offerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "offer_messages",
          filter: `offer_id=eq.${offerId}`
        },
        () => {
          void onMessage();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "offers",
          filter: `id=eq.${offerId}`
        },
        () => {
          void onOffer();
        }
      )
      .subscribe(status => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnected(false);
        }
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [offerId, onMessage, onOffer]);

  return (
    <div
      role="status"
      className="flex items-center gap-2 text-xs text-gray-500"
    >
      <Radio
        size={16}
        className={
          connected ? "text-green-600" : "text-yellow-600"
        }
      />
      {connected
        ? "Canlı bağlantı aktif"
        : "Canlı bağlantı kuruluyor veya kesildi"}
    </div>
  );
}
