import { ObjectStatus, STATUS_LABELS } from "@/lib/types";

const STYLES: Record<ObjectStatus, string> = {
  ok: "bg-green-50 text-ok border-green-200",
  warning: "bg-amber-50 text-warn border-amber-200",
  critical: "bg-red-50 text-crit border-red-200",
};

const DOT: Record<ObjectStatus, string> = {
  ok: "bg-ok",
  warning: "bg-warn",
  critical: "bg-crit",
};

export function StatusBadge({ status }: { status: ObjectStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${STYLES[status]}`}
    >
      <span className={`status-dot ${DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "bg-slate-100 text-slate-600",
    medium: "bg-amber-50 text-warn",
    high: "bg-orange-50 text-orange-600",
    critical: "bg-red-50 text-crit",
  };
  const labels: Record<string, string> = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
    critical: "Критический",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[priority] ?? styles.medium
      }`}
    >
      {labels[priority] ?? priority}
    </span>
  );
}
