-- =============================================================================
-- 00004_add_image_thumbnail_url.sql
-- Saroj Couture — add a dedicated thumbnail URL to the images table
--
-- The real upload pipeline (Next.js API route + sharp) now produces two
-- WebP renditions per photo — a ~1200px full-size image and a ~400px
-- thumbnail — and stores both in Supabase Storage. `url` keeps the
-- full-size image; `thumbnail_url` is the new column for the small one,
-- used for list/grid previews so the browser never has to load the
-- full-size file just to show a thumbnail.
-- =============================================================================

ALTER TABLE images ADD COLUMN thumbnail_url text NOT NULL DEFAULT '';
ALTER TABLE images ALTER COLUMN thumbnail_url DROP DEFAULT;
