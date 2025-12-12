// app/entrepreneur/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Status = "pending" | "accepted" | "rejected";

interface RequestRecord {
  id: string;
  land_id: string | null;
  target_product: string;
  budget_range: string | null;
  preferred_city: string | null;
  note: string | null;
  created_at: string;
  status: Status;
  lands?: {
    id: string;
    title: string;
    city: string;
    district: string | null;
  } | null;
}

type DbRequestRow = {
  id: string;
  land_id: string | null;
  target_product: string;
  budget_range: string | null;
  preferred_city: string | null;
  note: string | null;
  created_at: string;
  status: Status;
  lands: {
    id: string;
    title: string;
    city: string;
    district: string | null;
  } | null;
};

// ✅ async server client tipi
type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function getRequests(
  supabase: SupabaseServer,
  entrepreneurId: string
): Promise<RequestRecord[]> {
  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      id,
      land_id,
      target_product,
      budget_range,
      preferred_city,
      note,
      created_at,
      status,
      lands (
        id,
        title,
        city,
        district
      )
    `
    )
    .eq("entrepreneur_id", entrepreneurId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getRequests error:", error);
    return [];
  }

  const rows = (data ?? []) as unknown as DbRequestRow[];

  return rows.map((row) => ({
    id: row.id,
    land_id: row.land_id,
    target_product: row.target_product,
    budget_range: row.budget_range,
    preferred_city: row.preferred_city,
    note: row.note,
    created_at: row.created_at,
    status: row.status,
    lands: row.lands ?? null,
  }));
}

export default async function EntrepreneurDashboardPage() {
  // ✅ kritik: await!
  const supabase = await createSupabaseServerClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userErr) console.error("auth.getUser error:", userErr);
  if (!user) redirect("/auth");

  const role = user.user_metadata?.role;
  if (role !== "entrepreneur") redirect("/owner/dashboard");

  const entrepreneurId = user.id;

  const requests = await getRequests(supabase, entrepreneurId);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Girişimci Paneli</h1>
      <p className="text-sm text-slate-700">
        Oluşturduğun tüm talepleri burada görüntüleyebilirsin.
      </p>

      {requests.length === 0 && (
        <p className="text-sm text-slate-500">
          Henüz talebin yok. Bir arazi seçip talep oluşturabilirsin.
        </p>
      )}

      <div className="space-y-3">
        {requests.map((req) => {
          const badgeClass =
            req.status === "pending"
              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
              : req.status === "accepted"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200";

          const badgeText =
            req.status === "pending"
              ? "Beklemede"
              : req.status === "accepted"
              ? "Kabul"
              : "Reddedildi";

          return (
            <div
              key={req.id}
              className="rounded-xl bg-white p-4 shadow-sm text-sm border"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-800">
                  {req.target_product}
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}
                >
                  {badgeText}
                </span>
              </div>

              {req.lands ? (
                <p className="mt-1 text-xs text-slate-600">
                  Arazi: {req.lands.title} — {req.lands.city}
                  {req.lands.district && ` / ${req.lands.district}`}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-600">
                  Arazi bulunamadı (silinmiş olabilir)
                </p>
              )}

              {req.budget_range && (
                <p className="mt-1 text-xs text-slate-700">
                  Bütçe: {req.budget_range}
                </p>
              )}

              {req.preferred_city && (
                <p className="mt-1 text-xs text-slate-700">
                  Hedef şehir: {req.preferred_city}
                </p>
              )}

              {req.note && (
                <p className="mt-2 text-xs text-slate-700">Not: {req.note}</p>
              )}

              <p className="mt-2 text-[11px] text-slate-500">
                Oluşturulma:{" "}
                {new Date(req.created_at).toLocaleString("tr-TR", {
                  timeZone: "Europe/Istanbul",
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
