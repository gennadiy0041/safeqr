import { signIn } from "@/app/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-1 text-xl font-bold text-ink">SafeQR — вход руководителя</h1>
      <p className="mb-6 text-sm text-slate-500">
        Используйте учётную запись, созданную в Supabase Auth (см. README).
      </p>

      {searchParams.error && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-crit">{searchParams.error}</p>
      )}

      <form action={signIn} className="space-y-3">
        <input
          type="email"
          name="email"
          placeholder="you@company.kz"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          required
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="w-full rounded-xl bg-ink py-3 font-semibold text-white">
          Войти
        </button>
      </form>
    </main>
  );
}
