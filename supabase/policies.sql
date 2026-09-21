-- =====================================================================
-- SafeQR — политики безопасности (Row Level Security)
-- Выполните ПОСЛЕ schema.sql
--
-- Логика MVP:
--   • Любой человек, отсканировавший QR (без входа в систему), может
--     ЧИТАТЬ карточку объекта и СОЗДАВАТЬ репорт/проверку/менять
--     количество в аптечке — это анонимный работник на производстве.
--   • Только авторизованные пользователи (руководители/ответственные,
--     Supabase Auth) видят dashboard и могут менять статус репортов.
--   • В проде вместо полностью анонимного доступа рекомендуется включить
--     Supabase Auth Anonymous Sign-in, чтобы в логах было видно
--     хотя бы сессию устройства — см. README, раздел "Продакшн".
-- =====================================================================

alter table organizations   enable row level security;
alter table locations       enable row level security;
alter table safety_objects  enable row level security;
alter table first_aid_items enable row level security;
alter table reports         enable row level security;
alter table checks          enable row level security;
alter table activity_logs   enable row level security;

-- --- Публичное чтение объектов и их содержимого (нужно для страницы /o/[code]) ---
create policy "public read organizations" on organizations
  for select using (true);

create policy "public read locations" on locations
  for select using (true);

create policy "public read safety_objects" on safety_objects
  for select using (true);

create policy "public read first_aid_items" on first_aid_items
  for select using (true);

create policy "public read reports" on reports
  for select using (true);

create policy "public read checks" on checks
  for select using (true);

create policy "public read activity_logs" on activity_logs
  for select using (true);

-- --- Публичная запись: работник сканирует QR и сообщает о проблеме ---
create policy "anyone can create report" on reports
  for insert with check (true);

create policy "anyone can create check" on checks
  for insert with check (true);

create policy "anyone can log activity" on activity_logs
  for insert with check (true);

-- Изменение количества в аптечке — тоже анонимно на этапе MVP
create policy "anyone can update first_aid_items" on first_aid_items
  for update using (true) with check (true);

-- --- Управление статусами объектов/репортов — только авторизованные ---
create policy "authenticated can update safety_objects" on safety_objects
  for update using (auth.role() = 'authenticated');

create policy "authenticated can update reports" on reports
  for update using (auth.role() = 'authenticated');

-- --- Полное управление (создание объектов, локаций, аптечек) — только авторизованные ---
create policy "authenticated manage organizations" on organizations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated manage locations" on locations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated manage safety_objects insert/delete" on safety_objects
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated delete safety_objects" on safety_objects
  for delete using (auth.role() = 'authenticated');

create policy "authenticated manage first_aid_items insert/delete" on first_aid_items
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated delete first_aid_items" on first_aid_items
  for delete using (auth.role() = 'authenticated');
