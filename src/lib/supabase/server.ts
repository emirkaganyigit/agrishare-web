import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  // Next 16: cookies() bazı ortamlarda Promise gibi davranabiliyor
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Server Component’larda set bazen kısıtlı olabilir; middleware zaten cookie yeniliyor.
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // no-op
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // no-op
          }
        },
      },
    }
  );
}
