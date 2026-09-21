import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PriorityBadge } from "@/components/StatusBadge";
import { Report, ActivityLog, REPORT_STATUS_LABELS } from "@/lib/types";
import { ReportActions } from "@/components/ReportActions";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*, safety_objects(*)")
    .eq("id", params.id)
    .single<Report>();

  if (!report) notFound();

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("object_id", report.object_id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-8">
      <Link href="/dashboard" className="text-sm text-slate-500">
        ← Назад к панели
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">
            {report.category} · № {report.report_number}
          </h1>
          <p className="text-sm text-slate-500">{report.safety_objects?.name}</p>
        </div>
        <PriorityBadge priority={report.priority} />
      </div>

      <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-ink">
        {report.description || "Без комментария."}
      </p>

      {report.photo_url && (
        <a href={report.photo_url} target="_blank" rel="noopener noreferrer" className="mt-4 block">
          <img
            src={report.photo_url}
            alt="Фото проблемы"
            className="max-h-80 w-full rounded-xl border border-slate-200 object-cover"
          />
        </a>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-400">Статус</dt>
          <dd className="font-medium">{REPORT_STATUS_LABELS[report.status]}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Сообщил(а)</dt>
          <dd className="font-medium">{report.reported_by ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Назначено</dt>
          <dd className="font-medium">{report.assigned_to ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Создано</dt>
          <dd className="font-medium">{new Date(report.created_at).toLocaleString("ru-RU")}</dd>
        </div>
      </dl>

      <ReportActions reportId={report.id} status={report.status} assignedTo={report.assigned_to} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          История объекта
        </h2>
        <ul className="space-y-2">
          {((logs as ActivityLog[]) ?? []).map((log) => (
            <li key={log.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <p className="text-ink">{log.description}</p>
              <p className="text-xs text-slate-400">
                {log.actor} · {new Date(log.created_at).toLocaleString("ru-RU")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
