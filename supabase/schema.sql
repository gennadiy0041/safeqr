-- =====================================================================
-- SafeQR — схема базы данных (Supabase / PostgreSQL)
-- Выполните этот файл в Supabase Studio → SQL Editor → New query → Run
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Организации (предприятия-клиенты)
-- ---------------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Локации внутри предприятия (цеха, корпуса, этажи)
-- ---------------------------------------------------------------------
create table locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  floor text,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Объекты безопасности — главная таблица
-- ---------------------------------------------------------------------
create type object_type as enum (
  'fire_extinguisher',
  'first_aid_kit',
  'evacuation_exit',
  'electrical_panel',
  'emergency_button',
  'safety_sign',
  'equipment'
);

create type object_status as enum ('ok', 'warning', 'critical');

create table safety_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  type object_type not null,
  name text not null,                 -- напр. "Огнетушитель №001"
  code text not null unique,           -- короткий код для QR, напр. "8F72K"
  meta jsonb not null default '{}'::jsonb, -- тип ОП-5, масса, доп. характеристики
  status object_status not null default 'ok',
  responsible_name text,
  last_checked_at timestamptz,
  next_check_due timestamptz,
  created_at timestamptz not null default now()
);

create index idx_safety_objects_code on safety_objects(code);
create index idx_safety_objects_org on safety_objects(organization_id);
create index idx_safety_objects_status on safety_objects(status);

-- ---------------------------------------------------------------------
-- 4. Содержимое аптечек
-- ---------------------------------------------------------------------
create table first_aid_items (
  id uuid primary key default gen_random_uuid(),
  kit_id uuid not null references safety_objects(id) on delete cascade,
  name text not null,
  quantity integer not null default 0,
  minimum_quantity integer not null default 0,
  unit text not null default 'шт.'
);

create index idx_first_aid_items_kit on first_aid_items(kit_id);

-- ---------------------------------------------------------------------
-- 5. Проблемы / репорты
-- ---------------------------------------------------------------------
create type report_priority as enum ('low', 'medium', 'high', 'critical');
create type report_status as enum ('open', 'in_progress', 'resolved');

create table reports (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references safety_objects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  report_number text not null unique,   -- напр. "SR-00142"
  category text not null,               -- "отсутствует", "повреждён", ...
  description text,
  priority report_priority not null default 'medium',
  status report_status not null default 'open',
  photo_url text,
  reported_by text,                     -- имя/должность (без авторизации работника в MVP)
  assigned_to text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index idx_reports_object on reports(object_id);
create index idx_reports_status on reports(status);
create index idx_reports_org on reports(organization_id);

-- ---------------------------------------------------------------------
-- 6. Проверки (чек-листы)
-- ---------------------------------------------------------------------
create table checks (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references safety_objects(id) on delete cascade,
  checked_by text,
  checklist jsonb not null default '{}'::jsonb, -- {"on_place": true, "seal_present": true, ...}
  passed boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_checks_object on checks(object_id);

-- ---------------------------------------------------------------------
-- 7. История изменений (аудит-лог)
-- ---------------------------------------------------------------------
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references safety_objects(id) on delete cascade,
  actor text,
  action text not null,        -- "report_created", "quantity_changed", "check_passed", "report_resolved"
  description text not null,
  created_at timestamptz not null default now()
);

create index idx_activity_logs_object on activity_logs(object_id);

-- ---------------------------------------------------------------------
-- Функция генерации номера репорта SR-00001, SR-00002, ...
-- ---------------------------------------------------------------------
create sequence if not exists report_number_seq start 1;

create or replace function generate_report_number()
returns text as $$
begin
  return 'SR-' || lpad(nextval('report_number_seq')::text, 5, '0');
end;
$$ language plpgsql;

alter table reports alter column report_number set default generate_report_number();
