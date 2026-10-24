import { Suspense } from "react";
import PageClient from "./PageClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-5 py-20">
          Sayfa yükleniyor...
        </main>
      }
    >
      <PageClient />
    </Suspense>
  );
}
