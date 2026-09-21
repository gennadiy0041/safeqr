-- =====================================================================
-- SafeQR — Supabase Storage: bucket для фото к репортам
-- Выполните ПОСЛЕ policies.sql (один раз на проект)
--
-- Логика та же, что и в policies.sql: анонимный работник, отсканировавший
-- QR, может приложить фото к репорту (insert) и любой может его посмотреть
-- (select) — фото публичны по прямой ссылке. Менять/удалять файлы могут
-- только авторизованные пользователи (руководители).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-photos', 'report-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
