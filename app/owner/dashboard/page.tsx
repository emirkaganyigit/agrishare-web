// app/owner/dashboard/page.tsx
import { redirect } from "next/navigation";
import NewLandForm from "./NewLandForm";
import RequestActions from "./RequestActions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LandRow = {
  id: string;
  title: string;
  city: string;
  district: string | null;
  size_dekar: number;
  created_at: string;
};

type Status = "pending" | "accepted" | "rejected";

type RequestRow = {
  id: string;
  land_id: string | null;
  entrepreneur_id: string;
  target_product: string;
  budget_range: string | null;
  preferred_city: string | null;
  note: string | null;
  created_at: string;
  status: Status;
};

type EntrepreneurProfile = {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
};

// ✅ async createSupabaseServerClient() döndüğü için:
// Supabase tipini Awaited<ReturnType<...>> ile alıyoruz
type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getOwnerLands(supabase: SupabaseServer, ownerId: string): Promise<LandRow[]> {
  const { data, error } = await supabase
    .from("lands")
    .select("id, title, city, district, size_dekar, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOwnerLands error:", error);
    return [];
  }

  // TS bazen supabase tiplerini daraltamaz; bu cast güvenli
  return (data ?? []) as unknown as LandRow[];
}

async function getRequestsForLandIds(
  supabase: SupabaseServer,
  landIds: string[]
): Promise<RequestRow[]> {
  if (landIds.length === 0) return [];

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, land_id, entrepreneur_id, target_product, budget_range, preferred_city, note, created_at, status"
    )
    .in("land_id", landIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getRequestsForLandIds error:", error);
    return [];
  }

  return (data ?? []) as unknown as RequestRow[];
}

async function getEntrepreneursByIds(
  supabase: SupabaseServer,
  ids: string[]
): Promise<EntrepreneurProfile[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, city, phone")
    .in("id", ids);

  if (error) {
    console.error("getEntrepreneursByIds error:", error);
    return [];
  }

  return (data ?? []) as unknown as EntrepreneurProfile[];
}

export default async function OwnerDashboardPage() {
  // ✅ burası kritik: await!
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr) console.error("auth.getUser error:", userErr);
  if (!user) redirect("/auth");

  const role = user.user_metadata?.role;
  if (role !== "owner") redirect("/entrepreneur/dashboard");

  const ownerId = user.id;

  const lands = await getOwnerLands(supabase, ownerId);
  const landIds = lands.map((l) => l.id);

  const requests = await getRequestsForLandIds(supabase, landIds);
  const entrepreneurIds = Array.from(new Set(requests.map((r) => r.entrepreneur_id)));
  const entrepreneurs = await getEntrepreneursByIds(supabase, entrepreneurIds);

  const entrepreneurMap = new Map(entrepreneurs.map((e) => [e.id, e]));

  const requestsByLand = new Map<string, RequestRow[]>();
  for (const r of requests) {
    if (!r.land_id) continue;
    const arr = requestsByLand.get(r.land_id) ?? [];
    arr.push(r);
    requestsByLand.set(r.land_id, arr);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Arazi Sahibi Paneli</h1>
        <p className="text-sm text-slate-700">
          Arazilerini yönetebilir ve arazilerine gelen talepleri görebilirsin.
        </p>
      </div>

      <NewLandForm />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Arazilerim ve Gelen Talepler</h2>

        {lands.length === 0 && (
          <p className="text-sm text-slate-500">
            Henüz arazin yok. Yukarıdan arazi ekleyebilirsin.
          </p>
        )}

        {lands.map((land) => {
          const incoming = requestsByLand.get(land.id) ?? [];

          return (
            <div key={land.id} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold">{land.title}</div>
                  <div className="text-xs text-slate-600">
                    {land.city}
                    {land.district ? ` / ${land.district}` : ""} • {land.size_dekar} dekar
                  </div>
                </div>

                <a
                  href={`/lands/${land.id}`}
                  className="text-xs font-medium text-emerald-700 underline"
                >
                  Arazi sayfasını aç
                </a>
              </div>

              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-700">
                  Gelen talepler ({incoming.length})
                </div>

                {incoming.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Bu araziye henüz talep gelmemiş.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {incoming.map((req) => {
                      const ent = entrepreneurMap.get(req.entrepreneur_id) ?? null;

                      return (
                        <div key={req.id} className="rounded-lg border p-3 text-xs">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="font-semibold">{req.target_product}</div>

                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                              <RequestActions requestId={req.id} currentStatus={req.status} />
                              <div className="text-[11px] text-slate-500">
                                {new Date(req.created_at).toLocaleString("tr-TR", {
                                  timeZone: "Europe/Istanbul",
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="mt-1 text-slate-700">
                            <span className="font-semibold">Girişimci: </span>
                            {ent?.name || req.entrepreneur_id}
                            {ent?.city ? ` (${ent.city})` : ""}
                            {ent?.phone ? ` • ${ent.phone}` : ""}
                          </div>

                          {(req.budget_range || req.preferred_city) && (
                            <div className="mt-1 text-slate-700">
                              {req.budget_range ? `Bütçe: ${req.budget_range}` : ""}
                              {req.budget_range && req.preferred_city ? " • " : ""}
                              {req.preferred_city ? `Tercih: ${req.preferred_city}` : ""}
                            </div>
                          )}

                          {req.note && (
                            <div className="mt-2 text-slate-700">
                              <span className="font-semibold">Not: </span>
                              {req.note}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
