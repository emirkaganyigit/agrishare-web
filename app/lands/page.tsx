// app/lands/page.tsx
import { supabase } from "@/lib/supabaseClient";
import { Land } from "@/types/agrishare";

interface DbLand {
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
}

async function getLands(): Promise<Land[]> {
  const { data, error } = await supabase
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
      suitable_for
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching lands:", error);
    return [];
  }

  const rows = (data ?? []) as DbLand[];

  return rows.map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description ?? undefined,
    city: row.city,
    district: row.district ?? undefined,
    sizeDekar: Number(row.size_dekar),
    soilType: row.soil_type ?? undefined,
    irrigation: row.irrigation ?? undefined,
    suitableFor: row.suitable_for ?? undefined,
  }));
}

export default async function LandsPage() {
  const lands = await getLands();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mevcut Araziler</h1>
      <p className="text-sm text-slate-700">
        Bu liste Supabase veritabanından okunuyor.
      </p>

      {lands.length === 0 && (
        <p className="text-sm text-slate-500">
          Henüz sistemde kayıtlı arazi yok. Supabase&apos;te
          <b> lands </b> tablosuna örnek kayıtlar ekleyebilirsin.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {lands.map((land) => (
          <div key={land.id} className="rounded-xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold">{land.title}</h2>
            <p className="mt-1 text-xs text-slate-600">
              {land.city} {land.district && `- ${land.district}`}
            </p>
            {land.description && (
              <p className="mt-2 text-sm">{land.description}</p>
            )}
            <p className="mt-2 text-xs text-slate-700">
              Büyüklük: <b>{land.sizeDekar} dekar</b>
            </p>
            {land.suitableFor && land.suitableFor.length > 0 && (
              <p className="mt-1 text-xs text-slate-700">
                Uygun ürünler: {land.suitableFor.join(", ")}
              </p>
            )}
            <a
              href={`/lands/${land.id}`}
              className="mt-3 inline-block text-xs font-medium text-emerald-700 underline"
            >
              Detay &amp; Talep Oluştur
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
