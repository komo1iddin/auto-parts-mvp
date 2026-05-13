CREATE TABLE IF NOT EXISTS "setting_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" text NOT NULL,
  "value" text NOT NULL,
  "label" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "setting_options_kind_value_key" UNIQUE ("kind", "value")
);

ALTER TABLE "setting_options" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "setting_options" TO service_role;

INSERT INTO "setting_options" ("kind", "value", "label", "sort_order")
VALUES
  ('part_quality_type', 'original', 'Original', 10),
  ('part_quality_type', 'oem', 'OEM', 20),
  ('part_quality_type', 'copy', 'Kopiya', 30),
  ('part_quality_type', 'analog', 'Analog', 40)
ON CONFLICT ("kind", "value") DO NOTHING;

INSERT INTO "setting_options" ("kind", "value", "label", "sort_order")
SELECT 'brand', trim("brand"), trim("brand"), row_number() over (order by trim("brand")) * 10
FROM (
  SELECT DISTINCT "brand"
  FROM "parts"
  WHERE "brand" IS NOT NULL AND trim("brand") <> ''
) brands
ON CONFLICT ("kind", "value") DO NOTHING;
