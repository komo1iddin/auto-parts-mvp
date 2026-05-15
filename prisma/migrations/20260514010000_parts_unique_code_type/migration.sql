ALTER TABLE public.parts DROP CONSTRAINT IF EXISTS parts_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS parts_code_type_key
ON public.parts (code, type);
