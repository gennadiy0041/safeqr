export type ObjectType =
  | "fire_extinguisher"
  | "first_aid_kit"
  | "evacuation_exit"
  | "electrical_panel"
  | "emergency_button"
  | "safety_sign"
  | "equipment";

export type ObjectStatus = "ok" | "warning" | "critical";

export type ReportPriority = "low" | "medium" | "high" | "critical";
export type ReportStatus = "open" | "in_progress" | "resolved";

export interface Organization {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  floor: string | null;
  description: string | null;
}

export interface SafetyObject {
  id: string;
  organization_id: string;
  location_id: string | null;
  type: ObjectType;
  name: string;
  code: string;
  meta: Record<string, unknown>;
  status: ObjectStatus;
  responsible_name: string | null;
  last_checked_at: string | null;
  next_check_due: string | null;
  created_at: string;
  locations?: Location | null;
}

export interface FirstAidItem {
  id: string;
  kit_id: string;
  name: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
}

export interface Report {
  id: string;
  object_id: string;
  organization_id: string;
  report_number: string;
  category: string;
  description: string | null;
  priority: ReportPriority;
  status: ReportStatus;
  photo_url: string | null;
  reported_by: string | null;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  safety_objects?: SafetyObject | null;
}

export interface CheckRecord {
  id: string;
  object_id: string;
  checked_by: string | null;
  checklist: Record<string, boolean>;
  passed: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  object_id: string;
  actor: string | null;
  action: string;
  description: string;
  created_at: string;
}

export const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
  fire_extinguisher: "Огнетушитель",
  first_aid_kit: "Аптечка",
  evacuation_exit: "Эвакуационный выход",
  electrical_panel: "Электрощит",
  emergency_button: "Аварийный выключатель",
  safety_sign: "Знак безопасности",
  equipment: "Оборудование",
};

export const OBJECT_TYPE_ICONS: Record<ObjectType, string> = {
  fire_extinguisher: "🧯",
  first_aid_kit: "🩹",
  evacuation_exit: "🚪",
  electrical_panel: "⚡",
  emergency_button: "🛑",
  safety_sign: "🪧",
  equipment: "🧰",
};

export const STATUS_LABELS: Record<ObjectStatus, string> = {
  ok: "В норме",
  warning: "Требует внимания",
  critical: "Критично",
};

export const PRIORITY_LABELS: Record<ReportPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Открыта",
  in_progress: "В работе",
  resolved: "Устранена",
};
