CREATE TABLE "customers" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "orders"
ADD COLUMN "customer_id" UUID;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
