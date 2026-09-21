-- =====================================================================
-- SafeQR — Supabase Storage: bucket для фото к репортам
-- Выполните ПОСЛЕ policies.sql (один раз на проект)
--
-- Логика та же, что и в policies.sql: анонимный работник, отсканировавший
-- QR, может приложить фото к репорту (insert) и любой может его посмотреть
-- (select) — фото публичны по прямой ссылке. Менять/удалять файлы могут
-- только авторизованные пользователи (руководители).
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('report-photos', 'report-photos', true)
on conflict (id) do nothing;

create policy "public read report-photos"
on storage.objects for select
using (bucket_id = 'report-photos');

create policy "anyone can upload report-photos"
on storage.objects for insert
with check (bucket_id = 'report-photos');

create policy "authenticated update report-photos"
on storage.objects for update
using (bucket_id = 'report-photos' and auth.role() = 'authenticated');

create policy "authenticated delete report-photos"
on storage.objects for delete
using (bucket_id = 'report-photos' and auth.role() = 'authenticated');
