ALTER TABLE "client_payments"
DROP CONSTRAINT IF EXISTS "client_payments_amount_cny_check";

ALTER TABLE "client_payments"
ADD CONSTRAINT "client_payments_amount_cny_check" CHECK ("amount_cny" <> 0);
