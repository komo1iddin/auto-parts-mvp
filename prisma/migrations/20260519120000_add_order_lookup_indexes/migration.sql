CREATE INDEX IF NOT EXISTS "orders_created_by_status_created_at_idx"
ON "orders" ("created_by", "status", "created_at");

CREATE INDEX IF NOT EXISTS "orders_created_by_status_updated_at_idx"
ON "orders" ("created_by", "status", "updated_at");

CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx"
ON "orders" ("status", "created_at");

CREATE INDEX IF NOT EXISTS "orders_status_updated_at_idx"
ON "orders" ("status", "updated_at");

CREATE INDEX IF NOT EXISTS "order_items_order_id_idx"
ON "order_items" ("order_id");

CREATE INDEX IF NOT EXISTS "order_revisions_order_id_idx"
ON "order_revisions" ("order_id");

CREATE INDEX IF NOT EXISTS "order_exports_order_id_idx"
ON "order_exports" ("order_id");
