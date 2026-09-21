import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SafetyObject } from "@/lib/types";
import { ReportForm } from "@/components/ReportForm";

export const dynamic = "force-dynamic";

const CATEGORIES_BY_TYPE: Record<string, string[]> = {
  fire_extinguisher: [
    "Огнетушитель отсутствует",
    "Поврежден",
    "Нет пломбы",
    "Просрочена проверка",
    "Давление не соответствует норме",
    "Другое",
  ],
  first_aid_kit: ["Отсутствуют предметы", "Просрочен срок годности", "Аптечка повреждена", "Другое"],
  evacuation_exit: ["Выход заблокирован", "Дверь неисправна", "Нет знака", "Освещение неисправно", "Маршрут недоступен", "Другое"],
  default: ["Неисправность", "Повреждение", "Другое"],
};

export default async function ReportPage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data: object } = await supabase
    .from("safety_objects")
    .select("*")
    .eq("code", params.code)
    .single<SafetyObject>();

  if (!object) notFound();

  const categories = CATEGORIES_BY_TYPE[object.type] ?? CATEGORIES_BY_TYPE.default;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 pb-10 pt-6">
      <h1 className="text-lg font-bold text-ink">Сообщить о проблеме</h1>
      <p className="mb-4 text-sm text-slate-500">{object.name}</p>
      <ReportForm objectId={object.id} objectCode={object.code} categories={categories} />
    </main>
  );
}
