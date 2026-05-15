ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_part_id_fkey";
ALTER TABLE "parts" DROP CONSTRAINT IF EXISTS "parts_category_id_fkey";
ALTER TABLE "parts" DROP CONSTRAINT IF EXISTS "parts_supplier_id_fkey";

ALTER TABLE "parts" RENAME TO "parts_legacy";

CREATE TABLE "parts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text NOT NULL,
  "name" text,
  "category_id" uuid,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parts_code_key" UNIQUE ("code"),
  CONSTRAINT "parts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

WITH normalized AS (
  SELECT
    legacy.*,
    CASE
      WHEN nullif(trim(legacy."brand"), '') IS NOT NULL
        AND lower(legacy."code") LIKE '%-' || lower(trim(legacy."brand"))
      THEN left(legacy."code", length(legacy."code") - length(trim(legacy."brand")) - 1)
      WHEN lower(legacy."code") LIKE '%-' || lower(legacy."type")
      THEN left(legacy."code", length(legacy."code") - length(legacy."type") - 1)
      WHEN legacy."type" = 'original' AND lower(legacy."code") LIKE '%-original'
      THEN left(legacy."code", length(legacy."code") - 9)
      WHEN legacy."type" = 'copy' AND lower(legacy."code") LIKE '%-copy'
      THEN left(legacy."code", length(legacy."code") - 5)
      WHEN legacy."type" = 'analog' AND lower(legacy."code") LIKE '%-analog'
      THEN left(legacy."code", length(legacy."code") - 7)
      ELSE legacy."code"
    END AS family_code
  FROM "parts_legacy" legacy
),
ranked AS (
  SELECT
    *,
    row_number() OVER (
      PARTITION BY lower(family_code)
      ORDER BY
        CASE WHEN "type" = 'original' THEN 0 WHEN "name" IS NOT NULL THEN 1 ELSE 2 END,
        "created_at"
    ) AS row_number
  FROM normalized
)
INSERT INTO "parts" ("code", "name", "category_id", "created_at", "updated_at")
SELECT family_code, "name", "category_id", min("created_at"), max("updated_at")
FROM ranked
WHERE row_number = 1
GROUP BY family_code, "name", "category_id";

CREATE TABLE "part_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "part_id" uuid NOT NULL,
  "brand" text,
  "type" text NOT NULL DEFAULT 'original',
  "purchase_price_cny" decimal(12,2),
  "wholesale_price_cny" decimal(12,2),
  "selling_price_cny" decimal(12,2),
  "supplier_id" uuid,
  "image_url" text,
  "note" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "part_variants_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "part_variants_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

WITH normalized AS (
  SELECT
    legacy.*,
    CASE
      WHEN nullif(trim(legacy."brand"), '') IS NOT NULL
        AND lower(legacy."code") LIKE '%-' || lower(trim(legacy."brand"))
      THEN left(legacy."code", length(legacy."code") - length(trim(legacy."brand")) - 1)
      WHEN lower(legacy."code") LIKE '%-' || lower(legacy."type")
      THEN left(legacy."code", length(legacy."code") - length(legacy."type") - 1)
      WHEN legacy."type" = 'original' AND lower(legacy."code") LIKE '%-original'
      THEN left(legacy."code", length(legacy."code") - 9)
      WHEN legacy."type" = 'copy' AND lower(legacy."code") LIKE '%-copy'
      THEN left(legacy."code", length(legacy."code") - 5)
      WHEN legacy."type" = 'analog' AND lower(legacy."code") LIKE '%-analog'
      THEN left(legacy."code", length(legacy."code") - 7)
      ELSE legacy."code"
    END AS family_code
  FROM "parts_legacy" legacy
)
INSERT INTO "part_variants" (
  "id", "part_id", "brand", "type", "purchase_price_cny", "wholesale_price_cny",
  "selling_price_cny", "supplier_id", "image_url", "note", "created_at", "updated_at"
)
SELECT
  normalized."id",
  parts."id",
  nullif(trim(normalized."brand"), ''),
  normalized."type",
  normalized."purchase_price_cny",
  normalized."wholesale_price_cny",
  normalized."selling_price_cny",
  normalized."supplier_id",
  normalized."image_url",
  normalized."note",
  normalized."created_at",
  normalized."updated_at"
FROM normalized
JOIN "parts" ON lower("parts"."code") = lower(normalized.family_code);

ALTER TABLE "order_items" ADD COLUMN "part_variant_id" uuid;

UPDATE "order_items" order_item
SET
  "part_variant_id" = order_item."part_id",
  "part_id" = variant."part_id"
FROM "part_variants" variant
WHERE order_item."part_id" = variant."id";

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_part_variant_id_fkey" FOREIGN KEY ("part_variant_id") REFERENCES "part_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "part_variants_part_id_brand_type_supplier_id_key"
ON "part_variants" ("part_id", "brand", "type", "supplier_id");

CREATE INDEX "part_variants_part_id_idx" ON "part_variants" ("part_id");
CREATE INDEX "part_variants_supplier_id_idx" ON "part_variants" ("supplier_id");
CREATE INDEX "order_items_part_variant_id_idx" ON "order_items" ("part_variant_id");

ALTER TABLE "parts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "part_variants" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "parts" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "part_variants" TO service_role;
GRANT SELECT ON TABLE "parts" TO authenticated;
GRANT SELECT ON TABLE "part_variants" TO authenticated;

DROP TABLE "parts_legacy";

INSERT INTO "setting_options" ("kind", "value", "label", "sort_order")
VALUES
  ('part_quality_type', 'aftermarket', 'Aftermarket', 30),
  ('part_quality_type', 'copy', 'Copy', 40),
  ('part_quality_type', 'used', 'Used', 50),
  ('part_quality_type', 'refurbished', 'Refurbished', 60)
ON CONFLICT ("kind", "value") DO UPDATE
SET "label" = EXCLUDED."label", "sort_order" = EXCLUDED."sort_order";

UPDATE "setting_options"
SET "label" = 'Original', "sort_order" = 10
WHERE "kind" = 'part_quality_type' AND "value" = 'original';

UPDATE "setting_options"
SET "label" = 'OEM', "sort_order" = 20
WHERE "kind" = 'part_quality_type' AND "value" = 'oem';

UPDATE "part_variants"
SET "type" = 'aftermarket'
WHERE "type" = 'analog';

DELETE FROM "setting_options"
WHERE "kind" = 'part_quality_type' AND "value" = 'analog';
