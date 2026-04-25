-- Сид dev: один tenant (UUID = claim Keycloak `tenant_id`), published entity type, сущности и v1 документ.
-- Keycloak: у пользователей `tenant_id` = 00000000-0000-0000-0000-000000000001, у client `aprilhub-shell` — mapper tenant_id.
-- Удаляет существующие строки (для пустой/тестовой БД).
BEGIN;
DELETE FROM profile_versions;
DELETE FROM entities;
DELETE FROM entity_types;
DELETE FROM tenants;
INSERT INTO tenants (id) VALUES ('00000000-0000-0000-0000-000000000001');
INSERT INTO entity_types (id, tenant_id, namespace, code, schema_json, schema_version, status, published_schema_json, published_schema_version, published_at) VALUES
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '00000000-0000-0000-0000-000000000001',
  'default',
  'person',
  '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}'::jsonb,
  1,
  'published',
  '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}'::jsonb,
  1,
  now()
);
INSERT INTO entities (entity_id, tenant_id, entity_type_id) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
INSERT INTO profile_versions (tenant_id, entity_id, version, document) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, '{"name": "Demo profile"}'),
('00000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '{"name": "Merge source"}');
COMMIT;
