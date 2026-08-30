-- =============================================================================
-- 00005_harden_rls_owner_check.sql
-- Saroj Couture — bind write/admin-read RLS policies to the actual owner
--
-- Every `TO authenticated` policy added in 00001 uses `USING (true)`. That is
-- only safe because sign-ups are disabled in the Supabase dashboard, a
-- setting that lives outside version control and isn't re-asserted anywhere
-- in the schema or app code — create_owner_user.sql calls this out directly.
-- If sign-ups were ever re-enabled (by accident, or a dashboard reset), any
-- newly created account would instantly get full read/write access to every
-- table.
--
-- is_owner() adds a second, self-contained layer that doesn't depend on that
-- toggle: it trusts only the very first user ever created in auth.users (the
-- owner account from create_owner_user.sql), by creation time. Any later
-- sign-up — accidental or malicious — is authenticated but not the owner, so
-- every policy below still rejects it.
--
-- SECURITY DEFINER is required because `authenticated`/`anon` have no direct
-- grant on auth.users; the function runs as its owner (the migration role,
-- normally `postgres`/`supabase_admin`), which does.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT auth.uid() IS NOT NULL
       AND auth.uid() = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
$$;

REVOKE ALL ON FUNCTION public.is_owner() FROM public;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
ALTER POLICY auth_select_all_categories ON categories USING (is_owner());
ALTER POLICY auth_insert_categories     ON categories WITH CHECK (is_owner());
ALTER POLICY auth_update_categories     ON categories USING (is_owner()) WITH CHECK (is_owner());
ALTER POLICY auth_delete_categories     ON categories USING (is_owner());

-- ---------------------------------------------------------------------------
-- garments
-- ---------------------------------------------------------------------------
ALTER POLICY auth_select_all_garments ON garments USING (is_owner());
ALTER POLICY auth_insert_garments     ON garments WITH CHECK (is_owner());
ALTER POLICY auth_update_garments     ON garments USING (is_owner()) WITH CHECK (is_owner());
ALTER POLICY auth_delete_garments     ON garments USING (is_owner());

-- ---------------------------------------------------------------------------
-- images
-- ---------------------------------------------------------------------------
ALTER POLICY auth_select_all_images ON images USING (is_owner());
ALTER POLICY auth_insert_images     ON images WITH CHECK (is_owner());
ALTER POLICY auth_update_images     ON images USING (is_owner()) WITH CHECK (is_owner());
ALTER POLICY auth_delete_images     ON images USING (is_owner());
