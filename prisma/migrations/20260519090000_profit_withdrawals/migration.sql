CREATE TABLE IF NOT EXISTS "profit_withdrawals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "amount_cny" DECIMAL(12,2) NOT NULL,
  "payment_date" DATE NOT NULL,
  "payment_method" TEXT NOT NULL,
  "note" TEXT,
  "created_by" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profit_withdrawals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "profit_withdrawals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "profit_withdrawals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "profit_withdrawals_payment_method_check" CHECK ("payment_method" IN ('cash', 'bank', 'alipay', 'wechat', 'other')),
  CONSTRAINT "profit_withdrawals_amount_cny_check" CHECK ("amount_cny" > 0)
);

CREATE INDEX IF NOT EXISTS "profit_withdrawals_order_id_idx" ON "profit_withdrawals"("order_id");

ALTER TABLE "profit_withdrawals" ENABLE ROW LEVEL SECURITY;
