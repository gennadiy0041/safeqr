"use client";

import Link from "next/link";
import { createCheck } from "@/app/actions";

export function CheckForm({
  objectId,
  objectCode,
  checklist,
}: {
  objectId: string;
  objectCode: string;
  checklist: { key: string; label: string }[];
}) {
  return (
    <form action={(fd) => createCheck(objectId, objectCode, fd)} className="space-y-4">
      <div className="space-y-2">
        {checklist.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3 text-sm"
          >
            <input type="checkbox" name={`chk_${item.key}`} className="h-4 w-4 accent-ok" />
            {item.label}
          </label>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Ваше имя / должность</label>
        <input
          type="text"
          name="checked_by"
          placeholder="Иванов И.И."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <button type="submit" className="w-full rounded-xl bg-ink py-3 font-semibold text-white">
        ПРОЙТИ ПРОВЕРКУ
      </button>
      <Link href={`/o/${objectCode}`} className="block text-center text-sm text-slate-500">
        Отмена
      </Link>
    </form>
  );
}
