"use client";

import { useState, useTransition } from "react";
import { assignReport, updateReportStatus } from "@/app/actions";
import { ReportStatus } from "@/lib/types";

export function ReportActions({
  reportId,
  status,
  assignedTo,
}: {
  reportId: string;
  status: ReportStatus;
  assignedTo: string | null;
}) {
  const [assignee, setAssignee] = useState(assignedTo ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          placeholder="Назначить ответственного…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          disabled={pending || !assignee}
          onClick={() => startTransition(() => assignReport(reportId, assignee))}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Назначить
        </button>
      </div>

      <div className="flex gap-2">
        {status !== "resolved" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => updateReportStatus(reportId, "resolved"))}
            className="flex-1 rounded-lg bg-ok py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            ✅ Отметить устранённой
          </button>
        )}
        {status === "resolved" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => updateReportStatus(reportId, "open"))}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-ink disabled:opacity-40"
          >
            Вернуть в работу
          </button>
        )}
      </div>
    </div>
  );
}
