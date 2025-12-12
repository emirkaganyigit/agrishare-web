// app/lands/[id]/page.tsx
import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import RequestForm from "./RequestForm";

interface LandDetail {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  city: string;
  district: string | null;
  size_dekar: number;
  soil_type: string | null;
  irrigation: string | null;
  suitable_for: string[] | null;
  created_at: string;
}

interface OwnerProfile {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
}

async function getLandWithOwner(id: string) {
  const { data: land, error: landError } = await supabase
    .from("lands")
    .select(
      `
      id,
      owner_id,
      title,
      description,
      city,
      district,
      size_dekar,
      soil_type,
      irrigation,
      suitable_for,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (landError || !land) {
    console.error("Land fetch error:", landError);
    return null;
  }

  const { data: owner, error: ownerError } = await supabase
    .from("profiles")
    .select("id, name, city, phone")
    .eq("id", land.owner_id)
    .single();

  if (ownerError || !owner) {
    console.error("Owner fetch error:", ownerError);
  }

  return {
    land: land as LandDetail,
    owner: (owner ?? null) as OwnerProfile | null,
  };
}

export default async function LandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 🔴 Önemli kısım: params bir Promise, await et
  const { id } = await params;

  const result = await getLandWithOwner(id);

  if (!result) {
    notFound();
  }

  const { land, owner } = result;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-xs text-slate-500">Arazi Detayı</p>
        <h1 className="mt-1 text-xl font-semibold">{land.title}</h1>
        <p className="mt-1 text-xs text-slate-600">
          {land.city} {land.district && `- ${land.district}`} •{" "}
          {land.size_dekar} dekar
        </p>

        {land.description && (
          <p className="mt-3 text-sm text-slate-800">{land.description}</p>
        )}

        <div className="mt-4 grid gap-3 text-xs text-slate-700 md:grid-cols-2">
          <div>
            <span className="font-semibold">Toprak tipi: </span>
            {land.soil_type || "-"}
          </div>
          <div>
            <span className="font-semibold">Sulama: </span>
            {land.irrigation || "-"}
          </div>
          <div>
            <span className="font-semibold">Uygun ürünler: </span>
            {land.suitable_for && land.suitable_for.length > 0
              ? land.suitable_for.join(", ")
              : "-"}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold">
            Bu arazi için talep oluştur
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Tarım yapmak istediğin ürünü, bütçeni ve beklentilerini yaz. Şu an
            girişimci hesabı sabit bir test kullanıcıya bağlı; auth tarafını
            sonra bağlayacağız.
          </p>

          <div className="mt-4">
            <RequestForm landId={land.id} />
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 text-sm shadow-sm">
          <h3 className="text-sm font-semibold">Arazi Sahibi Bilgileri</h3>
          {owner ? (
            <div className="mt-2 space-y-1 text-xs text-slate-700">
              <p>
                <span className="font-semibold">İsim: </span>
                {owner.name || "-"}
              </p>
              <p>
                <span className="font-semibold">Şehir: </span>
                {owner.city || "-"}
              </p>
              <p>
                <span className="font-semibold">Telefon: </span>
                {owner.phone || "-"}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Arazi sahibinin profili bulunamadı.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
