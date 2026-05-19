ALTER TABLE "order_items"
ADD COLUMN IF NOT EXISTS "shipped_quantity" integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "fulfillment_status" text NOT NULL DEFAULT 'waiting';

UPDATE "order_items"
SET "shipped_quantity" = LEAST(GREATEST(COALESCE("shipped_quantity", 0), 0), "quantity"),
    "fulfillment_status" = CASE
      WHEN LEAST(GREATEST(COALESCE("shipped_quantity", 0), 0), "quantity") <= 0 THEN 'waiting'
      WHEN LEAST(GREATEST(COALESCE("shipped_quantity", 0), 0), "quantity") >= "quantity" THEN 'shipped'
      ELSE 'partial'
    END;

ALTER TABLE "order_items"
DROP CONSTRAINT IF EXISTS "order_items_shipped_quantity_check",
ADD CONSTRAINT "order_items_shipped_quantity_check"
CHECK ("shipped_quantity" >= 0 AND "shipped_quantity" <= "quantity");

ALTER TABLE "order_items"
DROP CONSTRAINT IF EXISTS "order_items_fulfillment_status_check",
ADD CONSTRAINT "order_items_fulfillment_status_check"
CHECK ("fulfillment_status" IN ('waiting', 'partial', 'shipped'));
