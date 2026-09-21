import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { INSTRUCTIONS } from "@/lib/instructions";
import {
  FirstAidItem,
  OBJECT_TYPE_ICONS,
  OBJECT_TYPE_LABELS,
  Report,
  SafetyObject,
} from "@/lib/types";
import { FirstAidItemsList } from "@/components/FirstAidItemsList";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ObjectPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { reported?: string; checked?: string };
}) {
  const supabase = createClient();

  const { data: object } = await supabase
    .from("safety_objects")
    .select("*, locations(*)")
    .eq("code", params.code)
    .single<SafetyObject>();

  if (!object) notFound();

  const [{ data: items }, { data: reports }] = await Promise.all([
    object.type === "first_aid_kit"
      ? supabase.from("first_aid_items").select("*").eq("kit_id", object.id)
      : Promise.resolve({ data: [] as FirstAidItem[] }),
    supabase
      .from("reports")
      .select("*")
      .eq("object_id", object.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const instructions = INSTRUCTIONS[object.type];
  const openReports = (reports as Report[] | null)?.filter((r) => r.status !== "resolved") ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 pb-28 pt-6">
      {searchParams.reported && (
        <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
          <p className="font-semibold text-orange-700">🟠 Проблема зарегистрирована</p>
          <p className="text-sm text-orange-700">№ {searchParams.reported}</p>
        </div>
      )}
      {searchParams.checked && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-ok">✅ Проверка сохранена</p>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-3xl">{OBJECT_TYPE_ICONS[object.type]}</span>
        <StatusBadge status={object.status} />
      </div>

      <h1 className="text-xl font-bold text-ink">{object.name}</h1>
      <p className="text-sm text-slate-500">{OBJECT_TYPE_LABELS[object.type]}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
        {object.meta && typeof object.meta === "object" &&
          Object.entries(object.meta as Record<string, unknown>).map(([k, v]) => (
            <div key={k}>
              <dt className="text-slate-400">{k}</dt>
              <dd className="font-medium text-ink">{String(v)}</dd>
            </div>
          ))}
        <div>
          <dt className="text-slate-400">Место</dt>
          <dd className="font-medium text-ink">{object.locations?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Ответственный</dt>
          <dd className="font-medium text-ink">{object.responsible_name ?? "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-400">Последняя проверка</dt>
          <dd className="font-medium text-ink">{formatDate(object.last_checked_at)}</dd>
        </div>
      </dl>

      {openReports.length > 0 && (
        <div className="mt-4 space-y-2">
          {openReports.map((r) => (
            <div key={r.id} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-semibold text-crit">
                🔴 {r.category} · № {r.report_number}
              </p>
              {r.description && <p className="text-red-700">{r.description}</p>}
            </div>
          ))}
        </div>
      )}

      {object.type === "first_aid_kit" && (
        <FirstAidItemsList items={(items as FirstAidItem[]) ?? []} objectId={object.id} objectCode={object.code} />
      )}

      {instructions && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Что нужно знать
          </h2>
          <p className="mb-2 text-sm">
            <span className="font-medium">Для чего:</span> {instructions.purpose}
          </p>
          <p className="mb-1 text-sm font-medium">Как использовать:</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {instructions.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {instructions.warning && (
            <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-700">
              ⚠️ {instructions.warning}
            </p>
          )}
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md space-y-2 border-t bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Link
          href={`/o/${object.code}/report`}
          className="block w-full rounded-xl bg-crit py-3 text-center font-semibold text-white"
        >
          Сообщить о проблеме
        </Link>
        <Link
          href={`/o/${object.code}/check`}
          className="block w-full rounded-xl bg-ink py-3 text-center font-semibold text-white"
        >
          Проверить объект
        </Link>
      </div>
    </main>
  );
}
