-- =====================================================================
-- SafeQR — демо-данные для презентации на AQMOLA POWER
-- Выполните ПОСЛЕ schema.sql и policies.sql
-- Создаёт: 1 предприятие, 4 локации, 20 объектов
-- (10 огнетушителей, 3 аптечки, 4 эвакуационных выхода, 3 прочих),
-- один "красный" репорт и одну "историю проверки" — чтобы dashboard
-- не был пустым на демонстрации.
-- =====================================================================

do $$
declare
  v_org_id uuid;
  v_loc_tsex1 uuid;
  v_loc_tsex2 uuid;
  v_loc_admin uuid;
  v_loc_sklad uuid;
  v_obj_ext001 uuid;
  v_obj_kit003 uuid;
  v_obj_exit002 uuid;
  i int;
begin
  insert into organizations (name, address)
  values ('Учебный производственный участок «AQMOLA POWER — пилот»', 'г. Кокшетау, ул. Абая, 1')
  returning id into v_org_id;

  insert into locations (organization_id, name, floor, description)
  values (v_org_id, 'Цех №1', '1', 'Производственная зона, станки')
  returning id into v_loc_tsex1;

  insert into locations (organization_id, name, floor, description)
  values (v_org_id, 'Цех №2', '1', 'Сборочная линия')
  returning id into v_loc_tsex2;

  insert into locations (organization_id, name, floor, description)
  values (v_org_id, 'Административный корпус', '2', 'Офисные помещения')
  returning id into v_loc_admin;

  insert into locations (organization_id, name, floor, description)
  values (v_org_id, 'Склад', '1', 'Складские помещения')
  returning id into v_loc_sklad;

  -- 10 огнетушителей
  for i in 1..10 loop
    insert into safety_objects (organization_id, location_id, type, name, code, meta, status, responsible_name, last_checked_at, next_check_due)
    values (
      v_org_id,
      case when i <= 4 then v_loc_tsex1 when i <= 7 then v_loc_tsex2 when i <= 9 then v_loc_admin else v_loc_sklad end,
      'fire_extinguisher',
      'Огнетушитель №' || lpad(i::text, 3, '0'),
      substr(md5(random()::text || i::text), 1, 6),
      jsonb_build_object('subtype', 'ОП-5', 'weight_kg', 5),
      'ok',
      case when i % 2 = 0 then 'Иванов И.И.' else 'Петров А.А.' end,
      now() - interval '5 days',
      now() + interval '85 days'
    )
    returning id into v_obj_ext001;
  end loop;

  -- Делаем огнетушитель №001 "красным" для демонстрации репорта
  update safety_objects
     set status = 'critical'
   where organization_id = v_org_id and name = 'Огнетушитель №001'
  returning id into v_obj_ext001;

  insert into reports (object_id, organization_id, category, description, priority, status, reported_by)
  values (
    v_obj_ext001, v_org_id,
    'Давление не соответствует норме',
    'Манометр показывает недостаточное давление, стрелка в красной зоне',
    'high', 'open', 'Сидоров К.К. (оператор станка, Цех №1)'
  );

  insert into activity_logs (object_id, actor, action, description)
  values (v_obj_ext001, 'Сидоров К.К.', 'report_created', 'Зарегистрирована проблема: низкое давление');

  -- 3 аптечки
  for i in 1..3 loop
    insert into safety_objects (organization_id, location_id, type, name, code, meta, status, responsible_name, last_checked_at, next_check_due)
    values (
      v_org_id,
      case when i = 1 then v_loc_tsex1 when i = 2 then v_loc_admin else v_loc_sklad end,
      'first_aid_kit',
      'Аптечка №' || lpad(i::text, 3, '0'),
      substr(md5(random()::text || 'kit' || i::text), 1, 6),
      '{}'::jsonb,
      'ok',
      'Петров А.А.',
      now() - interval '2 days',
      now() + interval '28 days'
    )
    returning id into v_obj_kit003;
  end loop;

  -- Наполнение для Аптечки №003 (последней созданной в цикле — склад); сделаем её именно №3
  update safety_objects set name = 'Аптечка №003' where organization_id = v_org_id and type = 'first_aid_kit' and location_id = v_loc_sklad;
  select id into v_obj_kit003 from safety_objects where organization_id = v_org_id and name = 'Аптечка №003';

  insert into first_aid_items (kit_id, name, quantity, minimum_quantity, unit) values
    (v_obj_kit003, 'Бинт стерильный', 3, 5, 'шт.'),
    (v_obj_kit003, 'Пластырь', 20, 10, 'шт.'),
    (v_obj_kit003, 'Антисептик', 2, 2, 'шт.'),
    (v_obj_kit003, 'Перчатки', 10, 5, 'пар');

  update safety_objects set status = 'warning' where id = v_obj_kit003;

  insert into activity_logs (object_id, actor, action, description)
  values (v_obj_kit003, 'Иванов И.И.', 'quantity_changed', 'Использовано: 2 стерильных бинта (5 → 3)');

  insert into reports (object_id, organization_id, category, description, priority, status, reported_by)
  values (v_obj_kit003, v_org_id, 'Требуется пополнение', 'Стерильный бинт: 3 шт., минимальный запас: 5 шт.', 'medium', 'open', 'Система (автоматически)');

  -- Наполнение для остальных двух аптечек (без дефицита)
  for v_obj_kit003 in select id from safety_objects where organization_id = v_org_id and type = 'first_aid_kit' and name != 'Аптечка №003' loop
    insert into first_aid_items (kit_id, name, quantity, minimum_quantity, unit) values
      (v_obj_kit003, 'Бинт стерильный', 5, 5, 'шт.'),
      (v_obj_kit003, 'Пластырь', 20, 10, 'шт.'),
      (v_obj_kit003, 'Антисептик', 2, 2, 'шт.'),
      (v_obj_kit003, 'Перчатки', 10, 5, 'пар');
  end loop;

  -- 4 эвакуационных выхода
  for i in 1..4 loop
    insert into safety_objects (organization_id, location_id, type, name, code, meta, status, responsible_name, last_checked_at, next_check_due)
    values (
      v_org_id,
      case when i <= 2 then v_loc_tsex1 when i = 3 then v_loc_tsex2 else v_loc_admin end,
      'evacuation_exit',
      'Эвакуационный выход №' || i,
      substr(md5(random()::text || 'exit' || i::text), 1, 6),
      jsonb_build_object('building', case when i <= 3 then 'Производственный' else 'Административный' end, 'floor', 1),
      'ok',
      'Начальник участка',
      now() - interval '10 days',
      now() + interval '80 days'
    )
    returning id into v_obj_exit002;
  end loop;

  -- Делаем выход №2 критическим (заблокирован) — второй демо-кейс
  update safety_objects set status = 'critical' where organization_id = v_org_id and name = 'Эвакуационный выход №2' returning id into v_obj_exit002;

  insert into reports (object_id, organization_id, category, description, priority, status, reported_by)
  values (v_obj_exit002, v_org_id, 'Выход заблокирован', 'Перед эвакуационным выходом стоит оборудование', 'critical', 'open', 'Смирнова О.П. (мастер цеха)');

  -- 3 прочих объекта (электрощит, аварийная кнопка, знак безопасности)
  insert into safety_objects (organization_id, location_id, type, name, code, meta, status, responsible_name, last_checked_at, next_check_due)
  values
    (v_org_id, v_loc_tsex1, 'electrical_panel', 'Электрощит №1', substr(md5(random()::text || 'ep1'), 1, 6), '{}'::jsonb, 'ok', 'Иванов И.И.', now() - interval '3 days', now() + interval '87 days'),
    (v_org_id, v_loc_tsex2, 'emergency_button', 'Аварийный выключатель №1', substr(md5(random()::text || 'eb1'), 1, 6), '{}'::jsonb, 'ok', 'Петров А.А.', now() - interval '3 days', now() + interval '87 days'),
    (v_org_id, v_loc_sklad, 'safety_sign', 'Знак «Курение запрещено»', substr(md5(random()::text || 'sign1'), 1, 6), '{}'::jsonb, 'ok', 'Петров А.А.', now() - interval '20 days', now() + interval '160 days');

end $$;
