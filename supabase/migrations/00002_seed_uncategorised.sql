-- =============================================================================
-- 00002_seed_uncategorised.sql
-- Saroj Couture — seed the mandatory "Uncategorised" catch-all category
--
-- This row is the safety-net target when a real category is deleted.
-- display_order = 999999 keeps it at the bottom of any ordered list.
-- is_visible = false means it never appears on the public website.
-- The application layer prevents the owner from deleting this row.
-- =============================================================================

INSERT INTO categories (name, slug, display_order, cover_image_url, is_visible)
VALUES ('Uncategorised', 'uncategorised', 999999, NULL, false);
