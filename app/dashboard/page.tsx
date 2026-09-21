import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";
import { PriorityBadge } from "@/components/StatusBadge";
import { Report, SafetyObject } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: objects }, { data: reports }] = await Promise.all([
    supabase.from("safety_objects").select("*"),
    supabase
      .from("reports")
      .select("*, safety_objects(*)")
      .order("created_at", { ascending: false }),
  ]);

  const allObjects = (objects as SafetyObject[]) ?? [];
  const allReports = (reports as Report[]) ?? [];

  const openReports = allReports.filter((r) => r.status !== "resolved");
  const criticalReports = openReports.filter((r) => r.priority === "critical" || r.priority === "high");
  const overdue = allObjects.filter(
    (o) => o.next_check_due && new Date(o.next_check_due) < new Date()
  );
  const resolvedToday = allReports.filter(
    (r) => r.resolved_at && new Date(r.resolved_at).toDateString() === new Date().toDateString()
  );

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">SafeQR — панель руководителя</h1>
          <p className="text-sm text-slate-500">Мониторинг объектов безопасности предприятия в реальном времени</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-slate-500 underline">Выйти</button>
        </form>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Объектов" value={allObjects.length} />
        <StatTile label="Открытых проблем" value={openReports.length} tone="warn" />
        <StatTile label="Критических" value={criticalReports.length} tone="crit" />
        <StatTile label="Просрочено проверок" value={overdue.length} tone="warn" />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">🔴 Критические проблемы</h2>
        {criticalReports.length === 0 ? (
          <p className="text-sm text-slate-400">Критических проблем нет.</p>
        ) : (
          <div className="space-y-3">
            {criticalReports.map((r) => (
              <ReportRow key={r.id} report={r} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-ink">
          🟠 Все открытые проблемы ({openReports.length})
        </h2>
        <div className="space-y-3">
          {openReports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Реестр объектов</h2>
          <p className="text-sm text-slate-400">🟢 Устранено сегодня: {resolvedToday.length}</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Объект</th>
                <th className="px-4 py-2">Статус</th>
                <th className="px-4 py-2">Последняя проверка</th>
                <th className="px-4 py-2">Ответственный</th>
              </tr>
            </thead>
            <tbody>
              {allObjects.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <Link href={`/o/${o.code}`} className="font-medium text-ink hover:underline">
                      {o.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    {o.status === "ok" ? "🟢" : o.status === "warning" ? "🟠" : "🔴"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {o.last_checked_at ? new Date(o.last_checked_at).toLocaleDateString("ru-RU") : "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{o.responsible_name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warn" | "crit";
}) {
  const toneClass =
    tone === "crit" ? "text-crit" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-3xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  return (
    <Link
      href={`/dashboard/reports/${report.id}`}
      className="block rounded-xl border border-red-200 bg-red-50 p-4 hover:bg-red-100"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">
          {report.safety_objects?.name ?? "Объект"} · {report.category}
          {report.photo_url && <span title="Есть фото"> 📷</span>}
        </p>
        <PriorityBadge priority={report.priority} />
      </div>
      <p className="text-sm text-slate-600">{report.description}</p>
      <p className="mt-1 text-xs text-slate-400">
        № {report.report_number} · {new Date(report.created_at).toLocaleString("ru-RU")}
      </p>
    </Link>
  );
}
