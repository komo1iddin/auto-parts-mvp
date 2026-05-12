ALTER TABLE "users"
ADD COLUMN "can_create_client_payments" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "client_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "amount_cny" DECIMAL(12,2) NOT NULL,
  "payment_date" DATE NOT NULL,
  "payment_method" TEXT NOT NULL,
  "note" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "client_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "client_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "client_payments_payment_method_check" CHECK ("payment_method" IN ('cash', 'bank', 'alipay', 'wechat', 'other')),
  CONSTRAINT "client_payments_amount_cny_check" CHECK ("amount_cny" > 0)
);

CREATE TABLE "supplier_payments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "supplier_id" UUID NOT NULL,
  "amount_cny" DECIMAL(12,2) NOT NULL,
  "payment_date" DATE NOT NULL,
  "payment_method" TEXT NOT NULL,
  "note" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "supplier_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "supplier_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "supplier_payments_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "supplier_payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "supplier_payments_payment_method_check" CHECK ("payment_method" IN ('cash', 'bank', 'alipay', 'wechat', 'other')),
  CONSTRAINT "supplier_payments_amount_cny_check" CHECK ("amount_cny" > 0)
);

CREATE INDEX "client_payments_order_id_idx" ON "client_payments"("order_id");
CREATE INDEX "supplier_payments_order_id_idx" ON "supplier_payments"("order_id");
CREATE INDEX "supplier_payments_supplier_id_idx" ON "supplier_payments"("supplier_id");

ALTER TABLE "client_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "supplier_payments" ENABLE ROW LEVEL SECURITY;
