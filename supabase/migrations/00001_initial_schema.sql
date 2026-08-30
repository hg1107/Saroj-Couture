-- =============================================================================
-- 00001_initial_schema.sql
-- Saroj Couture — initial database schema
-- Tables: categories, garments, images
-- Includes: indexes, updated_at trigger, RLS policies
-- =============================================================================


-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================

-- pgcrypto is already enabled in Supabase by default; included for completeness.
-- gen_random_uuid() used for PK defaults.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1a. categories
-- ---------------------------------------------------------------------------
CREATE TABLE categories (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             text        NOT NULL,
    slug             text        NOT NULL UNIQUE,
    display_order    integer     NOT NULL DEFAULT 0,
    cover_image_url  text,                         -- nullable
    is_visible       boolean     NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_categories_display_order ON categories (display_order);
CREATE INDEX idx_categories_is_visible    ON categories (is_visible);


-- ---------------------------------------------------------------------------
-- 1b. garments
-- ---------------------------------------------------------------------------
CREATE TABLE garments (
    id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    title        text    NOT NULL,
    slug         text    NOT NULL UNIQUE,
    category_id  uuid    NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    fabric       text,                             -- nullable
    description  text,                             -- nullable
    price        integer,                          -- nullable; NULL when price_type = 'on_enquiry'
    price_type   text    NOT NULL DEFAULT 'fixed'
                         CHECK (price_type IN ('fixed', 'starting_from', 'on_enquiry')),
    is_featured  boolean NOT NULL DEFAULT false,
    status       text    NOT NULL DEFAULT 'published'
                         CHECK (status IN ('published', 'hidden')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_garments_category_id  ON garments (category_id);
CREATE INDEX idx_garments_status       ON garments (status);
CREATE INDEX idx_garments_is_featured  ON garments (is_featured);
CREATE INDEX idx_garments_created_at   ON garments (created_at);
-- Most common public query: published garments in a visible category, newest first
CREATE INDEX idx_garments_public_query ON garments (status, category_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- 1c. images
-- ---------------------------------------------------------------------------
CREATE TABLE images (
    id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    garment_id    uuid    NOT NULL REFERENCES garments (id) ON DELETE CASCADE,
    url           text    NOT NULL,
    alt_text      text,                            -- nullable; owner-editable
    display_order integer NOT NULL DEFAULT 0,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_images_garment_id            ON images (garment_id);
CREATE INDEX idx_images_garment_display_order ON images (garment_id, display_order);


-- =============================================================================
-- 2. TRIGGER — keep updated_at current on categories & garments
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_garments_updated_at
    BEFORE UPDATE ON garments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================
-- RLS must be explicitly enabled per table; policies are defined below.
-- All write operations (INSERT, UPDATE, DELETE) require the caller to be
-- an authenticated Supabase user.  Because sign-ups are disabled on this
-- project, the only authenticated user that can ever exist is the manually-
-- created owner account — so "authenticated" is synonymous with "owner".

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE garments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE images     ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- 3a. categories — RLS policies
-- ---------------------------------------------------------------------------

-- POLICY: anon_select_visible_categories
--
-- Plain English:
--   An anonymous (unauthenticated) visitor may read a category row ONLY when
--   that category's is_visible column is true.  Hidden categories are completely
--   invisible to the public website.  No authentication token = no hidden data.
--
CREATE POLICY anon_select_visible_categories
    ON categories
    FOR SELECT
    TO anon
    USING (is_visible = true);


-- POLICY: auth_select_all_categories
--
-- Plain English:
--   An authenticated user (the owner) can read every category row regardless
--   of visibility.  The admin UI needs to display hidden categories so the
--   owner can manage them.
--
CREATE POLICY auth_select_all_categories
    ON categories
    FOR SELECT
    TO authenticated
    USING (true);


-- POLICY: auth_insert_categories
--
-- Plain English:
--   Only an authenticated user can create new category rows.  An anonymous
--   visitor attempting an INSERT will be rejected by the database with a
--   "permission denied" error — not just hidden by the UI.
--
CREATE POLICY auth_insert_categories
    ON categories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);


-- POLICY: auth_update_categories
--
-- Plain English:
--   Only an authenticated user can update any category row.  Covers renaming,
--   toggling visibility, changing cover image, and drag-reordering.
--
CREATE POLICY auth_update_categories
    ON categories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- POLICY: auth_delete_categories
--
-- Plain English:
--   Only an authenticated user can delete a category row.  The application
--   layer enforces the "reassign garments first" rule; the database permits
--   the DELETE for any authenticated user (the FK RESTRICT on garments still
--   blocks deletion if garments remain — double safety net).
--
CREATE POLICY auth_delete_categories
    ON categories
    FOR DELETE
    TO authenticated
    USING (true);


-- ---------------------------------------------------------------------------
-- 3b. garments — RLS policies
-- ---------------------------------------------------------------------------

-- POLICY: anon_select_published_garments
--
-- Plain English:
--   An anonymous visitor may read a garment row ONLY when BOTH of these are
--   true simultaneously:
--     1. The garment's status = 'published'  (not hidden by the owner).
--     2. The garment's parent category has is_visible = true.
--   This prevents two leakage scenarios:
--     - A hidden garment appearing on a public URL.
--     - A garment in a hidden category being reachable via /garment/<slug>.
--   The EXISTS sub-select joins categories in real time, so toggling a
--   category's visibility instantly hides all its garments for public users.
--
CREATE POLICY anon_select_published_garments
    ON garments
    FOR SELECT
    TO anon
    USING (
        status = 'published'
        AND EXISTS (
            SELECT 1
            FROM categories c
            WHERE c.id = garments.category_id
              AND c.is_visible = true
        )
    );


-- POLICY: auth_select_all_garments
--
-- Plain English:
--   An authenticated owner can read every garment regardless of status or
--   category visibility.  Required for the admin garment list to show hidden
--   items so the owner can edit or re-publish them.
--
CREATE POLICY auth_select_all_garments
    ON garments
    FOR SELECT
    TO authenticated
    USING (true);


-- POLICY: auth_insert_garments
--
-- Plain English:
--   Only an authenticated user can create new garment rows.
--
CREATE POLICY auth_insert_garments
    ON garments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);


-- POLICY: auth_update_garments
--
-- Plain English:
--   Only an authenticated user can modify garment rows (title, fabric,
--   description, price, status, is_featured, category reassignment).
--
CREATE POLICY auth_update_garments
    ON garments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- POLICY: auth_delete_garments
--
-- Plain English:
--   Only an authenticated user can delete a garment row.  Cascading image
--   deletion is handled automatically by the FK ON DELETE CASCADE on images.
--
CREATE POLICY auth_delete_garments
    ON garments
    FOR DELETE
    TO authenticated
    USING (true);


-- ---------------------------------------------------------------------------
-- 3c. images — RLS policies
-- ---------------------------------------------------------------------------

-- POLICY: anon_select_published_images
--
-- Plain English:
--   An anonymous visitor may read an image row ONLY when the image's parent
--   garment is published AND that garment's category is visible.  This mirrors
--   the garment SELECT policy exactly — images inherit their parent's
--   visibility.  If a garment is hidden, its image metadata rows cannot be
--   fetched by the public even if they know the Storage URL (the file is
--   public, but the database row that builds galleries is protected here).
--
CREATE POLICY anon_select_published_images
    ON images
    FOR SELECT
    TO anon
    USING (
        EXISTS (
            SELECT 1
            FROM garments g
            JOIN categories c ON c.id = g.category_id
            WHERE g.id         = images.garment_id
              AND g.status     = 'published'
              AND c.is_visible = true
        )
    );


-- POLICY: auth_select_all_images
--
-- Plain English:
--   An authenticated owner can read every image row regardless of garment
--   status or category visibility.  Required for the admin edit-garment form
--   to load images of a hidden garment.
--
CREATE POLICY auth_select_all_images
    ON images
    FOR SELECT
    TO authenticated
    USING (true);


-- POLICY: auth_insert_images
--
-- Plain English:
--   Only an authenticated user can add image rows.  The upload flow first
--   puts the file in Storage, then inserts a row here recording the URL.
--   An unauthenticated INSERT is rejected at the database level.
--
CREATE POLICY auth_insert_images
    ON images
    FOR INSERT
    TO authenticated
    WITH CHECK (true);


-- POLICY: auth_update_images
--
-- Plain English:
--   Only an authenticated user can update image rows.  Covers editing
--   alt_text and changing display_order (drag-reorder in the admin form).
--
CREATE POLICY auth_update_images
    ON images
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- POLICY: auth_delete_images
--
-- Plain English:
--   Only an authenticated user can delete image rows.  Individual image
--   removal from the edit-garment form triggers this; whole-garment deletion
--   cascades via the FK and does not need this policy.
--
CREATE POLICY auth_delete_images
    ON images
    FOR DELETE
    TO authenticated
    USING (true);
