CREATE TABLE IF NOT EXISTS "part_code_aliases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "part_id" uuid NOT NULL,
  "code" text NOT NULL,
  "normalized_code" text NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "part_code_aliases_part_id_fkey"
    FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "part_code_aliases_code_key"
ON "part_code_aliases" ("code");

CREATE UNIQUE INDEX IF NOT EXISTS "part_code_aliases_normalized_code_key"
ON "part_code_aliases" ("normalized_code");

CREATE INDEX IF NOT EXISTS "part_code_aliases_part_id_idx"
ON "part_code_aliases" ("part_id");

ALTER TABLE "part_code_aliases" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "part_code_aliases" TO service_role;
GRANT SELECT ON TABLE "part_code_aliases" TO authenticated;

