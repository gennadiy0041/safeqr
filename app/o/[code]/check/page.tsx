import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SafetyObject } from "@/lib/types";
import { CheckForm } from "@/components/CheckForm";

export const dynamic = "force-dynamic";

const CHECKLIST_BY_TYPE: Record<string, { key: string; label: string }[]> = {
  fire_extinguisher: [
    { key: "on_place", label: "На месте" },
    { key: "access_clear", label: "Доступ свободен" },
    { key: "seal_present", label: "Пломба присутствует" },
    { key: "gauge_ok", label: "Манометр в норме" },
    { key: "case_ok", label: "Корпус без повреждений" },
    { key: "not_expired", label: "Срок проверки не истёк" },
  ],
  first_aid_kit: [
    { key: "on_place", label: "На месте" },
    { key: "seal_present", label: "Пломба/замок в порядке" },
    { key: "items_complete", label: "Комплектация в норме" },
    { key: "not_expired", label: "Срок годности не истёк" },
  ],
  evacuation_exit: [
    { key: "unblocked", label: "Выход не заблокирован" },
    { key: "door_ok", label: "Дверь исправна" },
    { key: "sign_present", label: "Знак на месте" },
    { key: "light_ok", label: "Освещение исправно" },
  ],
  default: [
    { key: "on_place", label: "На месте" },
    { key: "condition_ok", label: "Состояние в норме" },
  ],
};

export default async function CheckPage({ params }: { params: { code: string } }) {
  const supabase = createClient();
  const { data: object } = await supabase
    .from("safety_objects")
    .select("*")
    .eq("code", params.code)
    .single<SafetyObject>();

  if (!object) notFound();

  const checklist = CHECKLIST_BY_TYPE[object.type] ?? CHECKLIST_BY_TYPE.default;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-white px-5 pb-10 pt-6">
      <h1 className="text-lg font-bold text-ink">Проверка объекта</h1>
      <p className="mb-4 text-sm text-slate-500">{object.name}</p>
      <CheckForm objectId={object.id} objectCode={object.code} checklist={checklist} />
    </main>
  );
}
