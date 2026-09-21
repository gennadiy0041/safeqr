"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------
// Сообщить о проблеме
// ---------------------------------------------------------------------
export async function createReport(objectId: string, objectCode: string, formData: FormData) {
  const supabase = createClient();

  const { data: obj } = await supabase
    .from("safety_objects")
    .select("organization_id")
    .eq("id", objectId)
    .single();

  if (!obj) throw new Error("Объект не найден");

  const category = String(formData.get("category") ?? "Другое");
  const description = String(formData.get("description") ?? "");
  const reportedBy = String(formData.get("reported_by") ?? "");
  const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
  const priority =
    category === "Выход заблокирован" || category === "Огнетушитель отсутствует"
      ? "critical"
      : category === "Давление не соответствует норме" || category === "Поврежден"
      ? "high"
      : "medium";

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      object_id: objectId,
      organization_id: obj.organization_id,
      category,
      description,
      reported_by: reportedBy || "Аноним",
      priority,
      status: "open",
      photo_url: photoUrl,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("activity_logs").insert({
    object_id: objectId,
    actor: reportedBy || "Аноним",
    action: "report_created",
    description: `Зарегистрирована проблема: ${category}`,
  });

  // Поднимаем статус объекта, если репорт серьёзный
  if (priority === "critical" || priority === "high") {
    await supabase.from("safety_objects").update({ status: "critical" }).eq("id", objectId);
  } else {
    await supabase.from("safety_objects").update({ status: "warning" }).eq("id", objectId);
  }

  revalidatePath(`/o/${objectCode}`);
  revalidatePath("/dashboard");
  redirect(`/o/${objectCode}?reported=${report.report_number}`);
}

// ---------------------------------------------------------------------
// Пройти проверку (чек-лист)
// ---------------------------------------------------------------------
export async function createCheck(objectId: string, objectCode: string, formData: FormData) {
  const supabase = createClient();

  const checklist: Record<string, boolean> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("chk_")) {
      checklist[key.replace("chk_", "")] = value === "on";
    }
  }
  const checkedBy = String(formData.get("checked_by") ?? "");
  const passed = Object.values(checklist).every(Boolean) && Object.keys(checklist).length > 0;

  await supabase.from("checks").insert({
    object_id: objectId,
    checked_by: checkedBy || "Аноним",
    checklist,
    passed,
  });

  await supabase
    .from("safety_objects")
    .update({
      last_checked_at: new Date().toISOString(),
      status: passed ? "ok" : "warning",
    })
    .eq("id", objectId);

  await supabase.from("activity_logs").insert({
    object_id: objectId,
    actor: checkedBy || "Аноним",
    action: passed ? "check_passed" : "check_failed",
    description: passed ? "Проверка пройдена успешно" : "Проверка выявила замечания",
  });

  revalidatePath(`/o/${objectCode}`);
  revalidatePath("/dashboard");
  redirect(`/o/${objectCode}?checked=1`);
}

// ---------------------------------------------------------------------
// Изменить количество в аптечке
// ---------------------------------------------------------------------
export async function adjustFirstAidQuantity(
  itemId: string,
  objectId: string,
  objectCode: string,
  delta: number,
  actor: string
) {
  const supabase = createClient();

  const { data: item } = await supabase
    .from("first_aid_items")
    .select("*")
    .eq("id", itemId)
    .single();
  if (!item) throw new Error("Позиция не найдена");

  const newQuantity = Math.max(0, item.quantity + delta);

  await supabase.from("first_aid_items").update({ quantity: newQuantity }).eq("id", itemId);

  await supabase.from("activity_logs").insert({
    object_id: objectId,
    actor: actor || "Аноним",
    action: "quantity_changed",
    description: `${item.name}: ${item.quantity} → ${newQuantity}`,
  });

  if (newQuantity < item.minimum_quantity) {
    const { data: existingOpen } = await supabase
      .from("reports")
      .select("id")
      .eq("object_id", objectId)
      .eq("category", "Требуется пополнение")
      .eq("status", "open")
      .maybeSingle();

    if (!existingOpen) {
      await supabase.from("reports").insert({
        object_id: objectId,
        organization_id: (
          await supabase.from("safety_objects").select("organization_id").eq("id", objectId).single()
        ).data?.organization_id,
        category: "Требуется пополнение",
        description: `${item.name}: ${newQuantity} шт., минимальный запас: ${item.minimum_quantity} шт.`,
        priority: "medium",
        status: "open",
        reported_by: "Система (автоматически)",
      });
    }
    await supabase.from("safety_objects").update({ status: "warning" }).eq("id", objectId);
  }

  revalidatePath(`/o/${objectCode}`);
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------
// Действия руководителя: назначить / изменить статус репорта
// ---------------------------------------------------------------------
export async function updateReportStatus(reportId: string, status: "open" | "in_progress" | "resolved") {
  const supabase = createClient();

  const patch: Record<string, unknown> = { status };
  if (status === "resolved") patch.resolved_at = new Date().toISOString();

  const { data: report, error } = await supabase
    .from("reports")
    .update(patch)
    .eq("id", reportId)
    .select()
    .single();

  if (error) throw error;

  if (report && status === "resolved") {
    // Если у объекта больше нет открытых репортов — статус "в норме"
    const { data: openReports } = await supabase
      .from("reports")
      .select("id")
      .eq("object_id", report.object_id)
      .neq("status", "resolved");

    if (!openReports || openReports.length === 0) {
      await supabase.from("safety_objects").update({ status: "ok" }).eq("id", report.object_id);
    }

    await supabase.from("activity_logs").insert({
      object_id: report.object_id,
      actor: "Руководитель",
      action: "report_resolved",
      description: `Проблема ${report.report_number} устранена`,
    });
  }

  revalidatePath("/dashboard");
}

export async function assignReport(reportId: string, assignee: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("reports")
    .update({ assigned_to: assignee, status: "in_progress" })
    .eq("id", reportId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

// ---------------------------------------------------------------------
// Аутентификация руководителя
// ---------------------------------------------------------------------
export async function signIn(formData: FormData) {
  const supabase = createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
