"use client";

import { useState, useTransition } from "react";
import { adjustFirstAidQuantity } from "@/app/actions";
import { FirstAidItem } from "@/lib/types";

export function FirstAidItemsList({
  items,
  objectId,
  objectCode,
}: {
  items: FirstAidItem[];
  objectId: string;
  objectCode: string;
}) {
  const [pending, startTransition] = useTransition();
  const [actor, setActor] = useState("");

  return (
    <section className="mt-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Содержимое
      </h2>
      <input
        type="text"
        placeholder="Ваше имя (для истории)"
        value={actor}
        onChange={(e) => setActor(e.target.value)}
        className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Предмет</th>
              <th className="px-3 py-2 text-right font-medium">Кол-во</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const low = item.quantity < item.minimum_quantity;
              return (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{item.name}</td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      low ? "text-crit" : "text-ink"
                    }`}
                  >
                    {item.quantity} {item.unit}
                    {low && " 🟠"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            adjustFirstAidQuantity(item.id, objectId, objectCode, -1, actor)
                          )
                        }
                        className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
                      >
                        −
                      </button>
                      <button
                        disabled={pending}
                        onClick={() =>
                          startTransition(() =>
                            adjustFirstAidQuantity(item.id, objectId, objectCode, 1, actor)
                          )
                        }
                        className="h-7 w-7 rounded-md border border-slate-200 text-slate-600 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.some((i) => i.quantity < i.minimum_quantity) && (
        <p className="mt-2 rounded-lg bg-orange-50 p-2 text-sm text-orange-700">
          🟠 Требуется пополнение — руководитель уже уведомлён.
        </p>
      )}
    </section>
  );
}
