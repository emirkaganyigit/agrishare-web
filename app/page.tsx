// app/page.tsx
export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">
          Agrishare: Toprağı Paylaş, Geleceği Büyüt
        </h1>
        <p className="mt-3 text-sm text-slate-700">
          Arazi sahiplerini tarım yapmak isteyen girişimcilerle buluşturan
          dijital platform. Boş duran tarım arazileri üretime, gençler ise
          toprağa kavuşsun.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Arazi Sahibiyim</h2>
          <p className="mt-2 text-sm text-slate-700">
            Boş duran tarlanı, bahçeni veya arazini sisteme ekle; güvenli
            şekilde kiraya ver veya ortaklık kur.
          </p>
          <a
            href="/owner/dashboard"
            className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Arazi Sahibi Paneline Git
          </a>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Tarım Girişimcisiyim</h2>
          <p className="mt-2 text-sm text-slate-700">
            Kendi arazisi olmayan ama tarım yapmak isteyenler için uygun arazi
            bul, talep oluştur, eşleşmeleri takip et.
          </p>
          <a
            href="/entrepreneur/dashboard"
            className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Girişimci Paneline Git
          </a>
        </div>
      </section>
    </div>
  );
}
