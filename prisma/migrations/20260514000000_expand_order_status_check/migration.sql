alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders add constraint orders_status_check check (
  status = any (array[
    'draft'::text,
    'calculating'::text,
    'confirmed'::text,
    'supplier_ordered'::text,
    'partially_paid'::text,
    'paid'::text,
    'shipped'::text,
    'arrived'::text,
    'closed'::text,
    'problem'::text,
    'updated'::text,
    'cancelled'::text
  ])
);
