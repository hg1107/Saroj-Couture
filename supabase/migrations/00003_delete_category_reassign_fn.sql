-- =============================================================================
-- 00003_delete_category_reassign_fn.sql
-- Saroj Couture — atomic "delete category, reassign its garments" function
--
-- Deleting a category from the admin UI must never delete the garments in
-- it. Instead every garment in that category is repointed at the
-- 'Uncategorised' catch-all, and only then is the category row removed.
-- Doing this as two separate client round-trips (UPDATE, then DELETE) is
-- not atomic — a failure between the two steps can leave garments
-- reassigned but the category still present, or worse. Wrapping both
-- statements in a single PL/pgSQL function makes Postgres run them in one
-- transaction: either both happen or neither does.
--
-- SECURITY INVOKER (the default) means the function runs with the calling
-- role's privileges, so the existing RLS policies (auth_update_garments,
-- auth_delete_categories — both `TO authenticated`) still apply. Only the
-- `authenticated` role is granted EXECUTE, so anon callers are rejected
-- before the function body ever runs.
-- =============================================================================

CREATE OR REPLACE FUNCTION delete_category_reassign(p_category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_fallback_id uuid;
    v_slug        text;
BEGIN
    SELECT slug INTO v_slug FROM categories WHERE id = p_category_id;

    IF v_slug IS NULL THEN
        RAISE EXCEPTION 'Category % does not exist', p_category_id;
    END IF;

    IF v_slug = 'uncategorised' THEN
        RAISE EXCEPTION 'The Uncategorised category cannot be deleted';
    END IF;

    SELECT id INTO v_fallback_id FROM categories WHERE slug = 'uncategorised';

    IF v_fallback_id IS NULL THEN
        RAISE EXCEPTION 'Uncategorised fallback category is missing — run 00002_seed_uncategorised.sql';
    END IF;

    UPDATE garments
       SET category_id = v_fallback_id
     WHERE category_id = p_category_id;

    DELETE FROM categories WHERE id = p_category_id;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_category_reassign(uuid) TO authenticated;
