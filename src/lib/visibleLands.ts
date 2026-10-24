import type { Land } from "@/lib/lands";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Demo ilanları yalnızca geliştirici açıkça isterse,
// sadece development ortamında göster.
const allowDemo =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ENABLE_DEMO_LANDS === "true";

export function visibleLands(lands: Land[]): Land[] {
  if (allowDemo) {
    return lands;
  }

  // Gerçek Supabase ilanlarımız UUID kimliğine sahip.
  // Bu kontrol bir güvenlik yetkilendirmesi değildir;
  // yalnızca eski örnek verileri arayüzden ayırır.
  return lands.filter(land => UUID_REGEX.test(land.id));
}
