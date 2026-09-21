import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="text-5xl">🛡️</div>
      <h1 className="text-2xl font-bold text-ink">SafeQR</h1>
      <p className="text-slate-600">
        Цифровая система контроля объектов безопасности предприятия.
        Отсканируйте QR-код на объекте (огнетушителе, аптечке, эвакуационном
        выходе), чтобы открыть его карточку.
      </p>
      <Link
        href="/dashboard"
        className="rounded-xl bg-ink px-5 py-3 font-medium text-white shadow-sm transition hover:bg-slate-800"
      >
        Панель руководителя →
      </Link>
      <p className="text-xs text-slate-400">
        Демо-объекты появятся после выполнения supabase/seed.sql — см. README.
      </p>
    </main>
  );
}
