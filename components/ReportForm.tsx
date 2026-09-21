"use client";

import { useState } from "react";
import Link from "next/link";
import { createReport } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 МБ

export function ReportForm({
  objectId,
  objectCode,
  categories,
}: {
  objectId: string;
  objectCode: string;
  categories: string[];
}) {
  const [category, setCategory] = useState(categories[0]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setPhotoUrl("");

    if (!file.type.startsWith("image/")) {
      setUploadError("Можно приложить только изображение.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setUploadError("Файл слишком большой (максимум 5 МБ).");
      e.target.value = "";
      return;
    }

    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${objectCode}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("report-photos").upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from("report-photos").getPublicUrl(path);
      setPhotoUrl(data.publicUrl);
    } catch {
      setUploadError("Не удалось загрузить фото. Можно отправить репорт без него.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={(fd) => createReport(objectId, objectCode, fd)} className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Что произошло?</p>
        <div className="space-y-2">
          {categories.map((c) => (
            <label
              key={c}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                category === c ? "border-ink bg-slate-50" : "border-slate-200"
              }`}
            >
              <input
                type="radio"
                name="category"
                value={c}
                checked={category === c}
                onChange={() => setCategory(c)}
                className="accent-ink"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Комментарий</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Опишите проблему подробнее…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Ваше имя / должность</label>
        <input
          type="text"
          name="reported_by"
          placeholder="Иванов И.И., оператор станка"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Фото (необязательно)</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink"
        />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Превью фото проблемы"
            className="mt-2 h-28 w-28 rounded-lg border border-slate-200 object-cover"
          />
        )}
        {uploading && <p className="mt-1 text-xs text-slate-400">Загрузка фото…</p>}
        {uploadError && <p className="mt-1 text-xs text-crit">{uploadError}</p>}
        {photoUrl && !uploading && <p className="mt-1 text-xs text-ok">Фото прикреплено ✓</p>}
        <input type="hidden" name="photo_url" value={photoUrl} />
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="w-full rounded-xl bg-crit py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "ЗАГРУЗКА ФОТО…" : "ОТПРАВИТЬ"}
      </button>
      <Link href={`/o/${objectCode}`} className="block text-center text-sm text-slate-500">
        Отмена
      </Link>
    </form>
  );
}
