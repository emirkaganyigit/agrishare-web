// app/entrepreneur/dashboard/page.tsx
import { Request } from "@/types/agrishare";

const myMockRequests: Request[] = [
  {
    id: "r1",
    entrepreneurId: "ent-1",
    targetProduct: "Zeytin",
    budgetRange: "100k-200k",
    preferredCity: "İzmir",
    note: "En az 5 yıl uzun vadeli kiralama arıyorum.",
  },
];

export default function EntrepreneurDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Girişimci Paneli</h1>
      <p className="text-sm text-slate-700">
        Burada arazi taleplerini yönetip yeni talep oluşturacaksın. Şimdilik
        örnek veri gösteriliyor.
      </p>

      <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
        + Yeni Talep Oluştur (Form henüz dummy)
      </button>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Taleplerim</h2>
        <div className="space-y-2">
          {myMockRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl bg-white p-4 text-sm shadow-sm"
            >
              <div className="font-medium">
                Hedef ürün: {req.targetProduct}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Tercih edilen şehir: {req.preferredCity ?? "-"}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                Bütçe aralığı: {req.budgetRange ?? "-"}
              </div>
              {req.note && (
                <div className="mt-2 text-xs text-slate-700">{req.note}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
