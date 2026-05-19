CREATE TABLE IF NOT EXISTS "part_supplier_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "part_variant_id" uuid NOT NULL,
  "supplier_id" uuid NOT NULL,
  "purchase_price_cny" decimal(12,2) NOT NULL,
  "wholesale_price_cny" decimal(12,2),
  "note" text,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "part_supplier_prices_part_variant_id_fkey"
    FOREIGN KEY ("part_variant_id") REFERENCES "part_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "part_supplier_prices_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "part_supplier_prices" (
  "part_variant_id",
  "supplier_id",
  "purchase_price_cny",
  "wholesale_price_cny",
  "note",
  "created_at",
  "updated_at"
)
SELECT
  "canonical_id",
  "supplier_id",
  "purchase_price_cny",
  "wholesale_price_cny",
  "note",
  "created_at",
  "updated_at"
FROM (
  SELECT DISTINCT ON ("canonical_id", "supplier_id")
    first_value("id") OVER variant_group AS "canonical_id",
    "supplier_id",
    "purchase_price_cny",
    "wholesale_price_cny",
    "note",
    "created_at",
    "updated_at"
  FROM "part_variants"
  WHERE "supplier_id" IS NOT NULL
    AND "purchase_price_cny" IS NOT NULL
  WINDOW variant_group AS (
    PARTITION BY "part_id", COALESCE("brand", ''), "type"
    ORDER BY "purchase_price_cny" ASC NULLS LAST, "created_at" ASC, "id" ASC
  )
  ORDER BY "canonical_id", "supplier_id", "purchase_price_cny" ASC NULLS LAST, "created_at" ASC
) deduped
ON CONFLICT DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS "part_supplier_prices_part_variant_id_supplier_id_key"
ON "part_supplier_prices" ("part_variant_id", "supplier_id");

CREATE INDEX IF NOT EXISTS "part_supplier_prices_part_variant_id_idx"
ON "part_supplier_prices" ("part_variant_id");

CREATE INDEX IF NOT EXISTS "part_supplier_prices_supplier_id_idx"
ON "part_supplier_prices" ("supplier_id");

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "part_supplier_price_id" uuid;

UPDATE "order_items" order_item
SET
  "part_variant_id" = variants."canonical_id",
  "part_supplier_price_id" = price."id"
FROM (
  SELECT
    "id",
    first_value("id") OVER (
      PARTITION BY "part_id", COALESCE("brand", ''), "type"
      ORDER BY "purchase_price_cny" ASC NULLS LAST, "created_at" ASC, "id" ASC
    ) AS "canonical_id"
  FROM "part_variants"
) variants
LEFT JOIN "part_supplier_prices" price
  ON price."part_variant_id" = variants."canonical_id"
  AND price."supplier_id" = order_item."supplier_id"
WHERE order_item."part_variant_id" = variants."id"
  AND order_item."part_supplier_price_id" IS NULL;

DELETE FROM "part_variants" variant
USING (
  SELECT
    "id",
    first_value("id") OVER (
      PARTITION BY "part_id", COALESCE("brand", ''), "type"
      ORDER BY "purchase_price_cny" ASC NULLS LAST, "created_at" ASC, "id" ASC
    ) AS "canonical_id"
  FROM "part_variants"
) variants
WHERE variant."id" = variants."id"
  AND variant."id" <> variants."canonical_id";

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_part_supplier_price_id_fkey"
  FOREIGN KEY ("part_supplier_price_id") REFERENCES "part_supplier_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "order_items_part_supplier_price_id_idx"
ON "order_items" ("part_supplier_price_id");

DROP INDEX IF EXISTS "part_variants_part_id_brand_type_supplier_id_key";
DROP INDEX IF EXISTS "part_variants_supplier_id_idx";

ALTER TABLE "part_variants" DROP CONSTRAINT IF EXISTS "part_variants_supplier_id_fkey";

ALTER TABLE "part_variants" DROP COLUMN IF EXISTS "purchase_price_cny";
ALTER TABLE "part_variants" DROP COLUMN IF EXISTS "wholesale_price_cny";
ALTER TABLE "part_variants" DROP COLUMN IF EXISTS "supplier_id";

CREATE UNIQUE INDEX IF NOT EXISTS "part_variants_part_id_brand_type_key"
ON "part_variants" ("part_id", COALESCE("brand", ''), "type");

ALTER TABLE "part_supplier_prices" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "part_supplier_prices" TO service_role;
GRANT SELECT ON TABLE "part_supplier_prices" TO authenticated;
