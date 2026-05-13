GRANT SELECT ON TABLE "setting_options" TO authenticated;

CREATE POLICY "Setting options: authenticated read"
ON "setting_options"
FOR SELECT
TO authenticated
USING (true);
