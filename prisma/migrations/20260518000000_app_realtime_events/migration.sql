CREATE SCHEMA IF NOT EXISTS "app_private";

CREATE TABLE IF NOT EXISTS "app_realtime_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_name" text NOT NULL,
  "operation" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "app_realtime_events" ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE "app_realtime_events" TO authenticated;
GRANT INSERT, DELETE ON TABLE "app_realtime_events" TO service_role;

DROP POLICY IF EXISTS "App realtime events: authenticated read" ON "app_realtime_events";
CREATE POLICY "App realtime events: authenticated read"
ON "app_realtime_events"
FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE FUNCTION "app_private"."notify_app_realtime_event"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO "app_realtime_events" ("table_name", "operation")
  VALUES (TG_TABLE_NAME, TG_OP);

  DELETE FROM "app_realtime_events"
  WHERE "created_at" < CURRENT_TIMESTAMP - INTERVAL '1 day';

  RETURN NULL;
END;
$$;

DO $$
DECLARE
  watched_table text;
  watched_tables text[] := ARRAY[
    'users',
    'categories',
    'suppliers',
    'customers',
    'setting_options',
    'parts',
    'part_variants',
    'orders',
    'order_items',
    'order_revisions',
    'client_payments',
    'supplier_payments'
  ];
BEGIN
  FOREACH watched_table IN ARRAY watched_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'notify_app_realtime_event', watched_table);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION app_private.notify_app_realtime_event()',
      'notify_app_realtime_event',
      watched_table
    );
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION "supabase_realtime";
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_realtime_events'
  ) THEN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "app_realtime_events";
  END IF;
END;
$$;
