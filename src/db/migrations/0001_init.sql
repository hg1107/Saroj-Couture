-- =============================================================================
-- 0001_init.sql
-- Saroj Couture — self-hosted PostgreSQL schema
--
-- Replaces the old Supabase schema (supabase/migrations/00001–00006). There is
-- no RLS here: the database is only reachable by the Next.js server, and every
-- public query filters on visibility explicitly (see lib/queries/*), while
-- every admin action / route checks the owner session first (lib/auth).
--
-- Image *files* never live in the database — only their metadata. The files
-- themselves sit on disk under STORAGE_DIR (see lib/storage):
--   private/originals/...  the untouched upload, byte-for-byte (never served)
--   public/...             WebP renditions (thumb / medium / large) served at /media
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name             text        NOT NULL,
    slug             text        NOT NULL UNIQUE,
    display_order    integer     NOT NULL DEFAULT 0,
    cover_image_url  text,
    is_visible       boolean     NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_display_order ON categories (display_order);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The mandatory catch-all. Deleting a category moves its garments here.
-- Hidden from the public site; the app never lets the owner delete it.
INSERT INTO categories (name, slug, display_order, is_visible)
VALUES ('Uncategorised', 'uncategorised', 999999, false);

-- -----------------------------------------------------------------------------
-- garments
-- -----------------------------------------------------------------------------
CREATE TABLE garments (
    id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title        text        NOT NULL,
    slug         text        NOT NULL UNIQUE,
    category_id  uuid        NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    fabric       text,
    description  text,
    price        integer,    -- NULL when price_type = 'on_enquiry'
    price_type   text        NOT NULL DEFAULT 'fixed'
                             CHECK (price_type IN ('fixed', 'starting_from', 'on_enquiry')),
    is_featured  boolean     NOT NULL DEFAULT false,
    status       text        NOT NULL DEFAULT 'published'
                             CHECK (status IN ('published', 'hidden')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_garments_category_id  ON garments (category_id);
-- Most common public query: published garments, newest first
CREATE INDEX idx_garments_public_query ON garments (status, category_id, created_at DESC);
CREATE INDEX idx_garments_featured     ON garments (created_at DESC) WHERE is_featured AND status = 'published';

CREATE TRIGGER trg_garments_updated_at
    BEFORE UPDATE ON garments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- images — one row per garment photo
-- -----------------------------------------------------------------------------
CREATE TABLE images (
    id              uuid        PRIMARY KEY,   -- generated at upload time; also the on-disk folder name
    garment_id      uuid        NOT NULL REFERENCES garments (id) ON DELETE CASCADE,
    url             text        NOT NULL,      -- largest public rendition (/media/.../large.webp)
    thumbnail_url   text        NOT NULL,      -- smallest public rendition (/media/.../thumb.webp)
    width           integer     NOT NULL,      -- original pixel size, after EXIF rotation
    height          integer     NOT NULL,
    original_format text        NOT NULL,      -- jpeg / png / webp / avif / heif / tiff
    original_bytes  bigint      NOT NULL,
    alt_text        text,
    display_order   integer     NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_images_garment_display_order ON images (garment_id, display_order);

-- -----------------------------------------------------------------------------
-- Admin auth — single owner account, server-side sessions
-- -----------------------------------------------------------------------------
CREATE TABLE admin_users (
    id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    email          text        NOT NULL UNIQUE,   -- stored lower-cased
    password_hash  text        NOT NULL,          -- scrypt, see lib/auth/password.ts
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Only a SHA-256 of the session token is stored, so a leaked DB dump can't
-- be replayed as a login cookie.
CREATE TABLE sessions (
    token_hash  text        PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    expires_at  timestamptz NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);

-- -----------------------------------------------------------------------------
-- Rate limiting (login attempts) — fixed window, shared across processes
-- -----------------------------------------------------------------------------
CREATE TABLE rate_limit_buckets (
    key      text        PRIMARY KEY,
    count    integer     NOT NULL DEFAULT 0,
    reset_at timestamptz NOT NULL
);
