// Генерирует QR-коды для всех объектов из базы и печатный лист А4
// с наклейками (SVG QR + название объекта).
//
// Запуск: npm run generate:qr
// (нужен заполненный .env.local и выполненный supabase/seed.sql
//  или собственные объекты, уже внесённые в базу)

import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    "❌ Не заданы NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "   Создайте .env.local (см. .env.example) и запустите снова."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const OUT_DIR = path.join(process.cwd(), "public", "qr");

const TYPE_LABELS = {
  fire_extinguisher: "Огнетушитель",
  first_aid_kit: "Аптечка",
  evacuation_exit: "Эвакуационный выход",
  electrical_panel: "Электрощит",
  emergency_button: "Аварийный выключатель",
  safety_sign: "Знак безопасности",
  equipment: "Оборудование",
};

async function main() {
  const { data: objects, error } = await supabase
    .from("safety_objects")
    .select("id, name, code, type")
    .order("name");

  if (error) {
    console.error("❌ Ошибка чтения объектов из Supabase:", error.message);
    process.exit(1);
  }

  if (!objects || objects.length === 0) {
    console.warn(
      "⚠️  В базе нет объектов. Выполните supabase/seed.sql в Supabase Studio, затем запустите снова."
    );
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const cards = [];

  for (const obj of objects) {
    const url = `${BASE_URL}/o/${obj.code}`;
    const svg = await QRCode.toString(url, { type: "svg", margin: 1, width: 240 });
    const fileName = `${obj.code}.svg`;
    await writeFile(path.join(OUT_DIR, fileName), svg, "utf-8");
    cards.push({ ...obj, url, fileName });
    console.log(`✅ ${obj.name.padEnd(35)} → /qr/${fileName}  (${url})`);
  }

  const sheetHtml = buildPrintSheet(cards);
  await writeFile(path.join(OUT_DIR, "print-sheet.html"), sheetHtml, "utf-8");

  console.log(`\n🖨  Печатный лист со всеми наклейками: public/qr/print-sheet.html`);
  console.log(`    Откройте его в браузере и распечатайте (Ctrl+P).`);
}

function buildPrintSheet(cards) {
  const items = cards
    .map(
      (c) => `
      <div class="card">
        <img src="./${c.fileName}" width="140" height="140" />
        <div class="label">${TYPE_LABELS[c.type] ?? c.type}</div>
        <div class="name">${c.name}</div>
        <div class="code">SafeQR · ${c.code}</div>
      </div>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<title>SafeQR — печать QR-наклеек</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .card {
    border: 1px dashed #cbd5e1; border-radius: 12px; padding: 12px;
    text-align: center; break-inside: avoid;
  }
  .label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-top: 6px; }
  .name { font-size: 13px; font-weight: 600; margin-top: 2px; }
  .code { font-size: 10px; color: #94a3b8; margin-top: 4px; }
  @media print {
    .grid { grid-template-columns: repeat(3, 1fr); }
  }
</style>
</head>
<body>
  <h1>SafeQR — QR-наклейки для демо-стенда</h1>
  <p>Всего объектов: ${cards.length}. Распечатайте, наклейте на демо-стенд перед защитой.</p>
  <div class="grid">
    ${items}
  </div>
</body>
</html>`;
}

main();
