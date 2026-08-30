# Saroj Couture — Database Schema & RLS Guide

## Files written

| File | Purpose |
|---|---|
| [`supabase/migrations/00001_initial_schema.sql`](file:///home/ghotra/Projects/couture/supabase/migrations/00001_initial_schema.sql) | Tables, indexes, trigger, RLS policies |
| [`supabase/migrations/00002_seed_uncategorised.sql`](file:///home/ghotra/Projects/couture/supabase/migrations/00002_seed_uncategorised.sql) | Seeds the catch-all "Uncategorised" category |
| [`supabase/create_owner_user.sql`](file:///home/ghotra/Projects/couture/supabase/create_owner_user.sql) | Instructions + verification query for the owner account |

---

## 1. Table summary

### `categories`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `DEFAULT gen_random_uuid()` |
| `name` | `text NOT NULL` | Display name e.g. "Ghagra Choli" |
| `slug` | `text NOT NULL UNIQUE` | URL-safe e.g. "ghagra-choli" |
| `display_order` | `integer NOT NULL DEFAULT 0` | Lower = first; drag-reorder target |
| `cover_image_url` | `text` NULLABLE | Supabase Storage public URL |
| `is_visible` | `boolean NOT NULL DEFAULT true` | Controls public visibility |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Auto-maintained by trigger |

### `garments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `DEFAULT gen_random_uuid()` |
| `title` | `text NOT NULL` | |
| `slug` | `text NOT NULL UNIQUE` | Auto-generated; suffix on collision |
| `category_id` | `uuid NOT NULL FK → categories(id)` | `ON DELETE RESTRICT` |
| `fabric` | `text` NULLABLE | e.g. "Pure Georgette" |
| `description` | `text` NULLABLE | ~500 chars recommended |
| `price` | `integer` NULLABLE | INR whole rupees; NULL when `on_enquiry` |
| `price_type` | `text NOT NULL DEFAULT 'fixed'` | CHECK: `fixed` / `starting_from` / `on_enquiry` |
| `is_featured` | `boolean NOT NULL DEFAULT false` | Homepage featured section |
| `status` | `text NOT NULL DEFAULT 'published'` | CHECK: `published` / `hidden` |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Auto-maintained by trigger |

### `images`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `DEFAULT gen_random_uuid()` |
| `garment_id` | `uuid NOT NULL FK → garments(id)` | `ON DELETE CASCADE` |
| `url` | `text NOT NULL` | Full-size WebP Storage URL |
| `alt_text` | `text` NULLABLE | Owner-editable SEO text |
| `display_order` | `integer NOT NULL DEFAULT 0` | `0` = cover image |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |

---

## 2. RLS policies — plain English + SQL summary

### How Supabase roles map to your users

| Supabase role | Who is it? |
|---|---|
| `anon` | Any visitor who has NOT logged in — the general public |
| `authenticated` | Any user who has logged in with a valid JWT — in this project, **only the owner** (sign-ups are disabled) |

> [!IMPORTANT]
> Disable sign-ups immediately after creating the owner account: **Dashboard → Authentication → Providers → Email → Allow new users to sign up → OFF**. This makes `authenticated` synonymous with "the owner."

---

### `categories` policies

| Policy name | Role | Operation | Rule |
|---|---|---|---|
| `anon_select_visible_categories` | `anon` | SELECT | `is_visible = true` |
| `auth_select_all_categories` | `authenticated` | SELECT | always (admin needs hidden rows) |
| `auth_insert_categories` | `authenticated` | INSERT | always |
| `auth_update_categories` | `authenticated` | UPDATE | always |
| `auth_delete_categories` | `authenticated` | DELETE | always (FK RESTRICT is the safety net) |

**Key design note:** `anon` has no INSERT/UPDATE/DELETE policy at all. When RLS is enabled and there is no matching policy for an operation, Postgres **denies** it by default. The database itself rejects the write — not the UI.

---

### `garments` policies

| Policy name | Role | Operation | Rule |
|---|---|---|---|
| `anon_select_published_garments` | `anon` | SELECT | `status = 'published'` **AND** parent category `is_visible = true` |
| `auth_select_all_garments` | `authenticated` | SELECT | always |
| `auth_insert_garments` | `authenticated` | INSERT | always |
| `auth_update_garments` | `authenticated` | UPDATE | always |
| `auth_delete_garments` | `authenticated` | DELETE | always |

**Key design note on the anon SELECT:** The `EXISTS (SELECT 1 FROM categories c WHERE c.id = garments.category_id AND c.is_visible = true)` sub-select runs in real time. The moment an owner toggles a category to hidden, every garment in that category disappears from all public queries instantly — no cache to flush.

---

### `images` policies

| Policy name | Role | Operation | Rule |
|---|---|---|---|
| `anon_select_published_images` | `anon` | SELECT | parent garment `status = 'published'` **AND** parent category `is_visible = true` |
| `auth_select_all_images` | `authenticated` | SELECT | always |
| `auth_insert_images` | `authenticated` | INSERT | always |
| `auth_update_images` | `authenticated` | UPDATE | always |
| `auth_delete_images` | `authenticated` | DELETE | always |

**Key design note:** Images inherit their parent garment's visibility through a two-table JOIN in the `USING` clause. An anonymous caller cannot even read the image URL metadata for a hidden garment, let alone modify it.

---

## 3. Creating the owner auth user

You have **two options** — both result in the same outcome.

### Option A — Supabase Dashboard (recommended for a single owner)

1. Open your Supabase project in the browser.
2. Go to **Authentication → Users**.
3. Click **"Add user"** (or "Invite user").
4. Enter the owner email (e.g. `owner@sarojcouture.com`) and a strong password.
5. Tick **"Auto Confirm"** (or verify via email if you prefer).
6. The user appears in the list. Click the row to reveal the **UUID** — this is the **owner UID**.
7. Save the UUID somewhere safe (you can always recover it with the SQL below).

### Option B — cURL with the service-role key (fully scripted)

```bash
curl -X POST 'https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/admin/users' \
  -H 'apikey: <SERVICE_ROLE_KEY>' \
  -H 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{
        "email": "owner@sarojcouture.com",
        "password": "REPLACE_WITH_STRONG_PASSWORD",
        "email_confirm": true
      }'
```

The JSON response contains `"id": "<UUID>"` — that is the owner UID.

### How the owner UID is used

The current RLS policies use `TO authenticated` without checking a specific UID. This works safely because sign-ups are disabled — there is only ever one `authenticated` user. 

If you want **extra paranoia** (recommended for production), replace any write policy's `USING (true)` with:

```sql
USING (auth.uid() = 'PASTE-YOUR-OWNER-UUID-HERE')
```

For example:

```sql
-- Extra-paranoid version of auth_insert_garments
CREATE POLICY auth_insert_garments
    ON garments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = '12345678-abcd-...');
```

This means even if a second user were accidentally created, they could not write to the database.

### Verification query (run in SQL Editor after creating the user)

```sql
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'owner@sarojcouture.com';
```

---

## 4. Testing that anonymous writes are rejected by the database

These steps use the Supabase JavaScript client with the **anon key** (the public key). The anon key is the same one your Next.js frontend uses for unauthenticated visitors. Because we are calling the database directly, a rejection here proves the *database* is enforcing the rule — not just the UI hiding a button.

### Prerequisites

- Your Supabase project URL and anon key (from **Settings → API** in the dashboard).
- Node.js installed locally, or you can use the browser console on any page that loads `@supabase/supabase-js`.
- At least one row in `categories` (run `00002_seed_uncategorised.sql` first, or insert via the dashboard).

---

### Test 1 — Anonymous INSERT is rejected

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://<YOUR_PROJECT_REF>.supabase.co',
  '<YOUR_ANON_KEY>'           // ← public anon key, NOT service role
  // No session / no login
)

const { data, error } = await supabase
  .from('garments')
  .insert({
    title:       'Hacker Test Garment',
    slug:        'hacker-test-garment',
    category_id: '<any valid category UUID>',
    price_type:  'fixed',
    status:      'published'
  })

console.log('data:', data)    // expected: null
console.log('error:', error)  // expected: { code: '42501', message: 'permission denied ...' }
```

**Expected result:** `error.code === '42501'` (PostgreSQL permission denied). The row is not inserted. You can confirm via `SELECT count(*) FROM garments WHERE slug = 'hacker-test-garment'` in the SQL Editor — it returns 0.

---

### Test 2 — Anonymous UPDATE is rejected

```js
const { data, error } = await supabase
  .from('categories')
  .update({ name: 'Hacked' })
  .eq('slug', 'uncategorised')

console.log('data:', data)    // expected: null
console.log('error:', error)  // expected: permission denied (42501)
```

---

### Test 3 — Anonymous DELETE is rejected

```js
const { data, error } = await supabase
  .from('garments')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000')  // "delete everything"

console.log('data:', data)    // expected: null
console.log('error:', error)  // expected: permission denied (42501)
```

---

### Test 4 — Anonymous SELECT cannot see hidden garments

```js
// Assume you have one garment with status = 'hidden' in the DB

const { data, error } = await supabase
  .from('garments')
  .select('id, title, status')
  .eq('status', 'hidden')

console.log('data:', data)   // expected: []  (empty — RLS filtered it out)
console.log('error:', error) // expected: null (not an error; just no rows returned)
```

> [!NOTE]
> For SELECT, RLS silently filters rows rather than returning an error. This is intentional and standard Postgres RLS behaviour. The database returns an empty result set — not a 403. The write tests (INSERT/UPDATE/DELETE) return explicit errors because there is no anon policy for those operations at all.

---

### Test 5 — Verify via the Supabase SQL Editor (no client needed)

In **SQL Editor**, run:

```sql
-- Simulate what the anon role sees
SET LOCAL role TO anon;
SELECT count(*) FROM garments WHERE status = 'hidden';  -- must return 0
SELECT count(*) FROM categories WHERE is_visible = false; -- must return 0

-- Try to insert as anon (will fail with permission denied)
SET LOCAL role TO anon;
INSERT INTO garments (title, slug, category_id, price_type, status)
VALUES ('Test', 'test-slug', (SELECT id FROM categories LIMIT 1), 'fixed', 'published');
-- Expected: ERROR:  permission denied for table garments
```

> [!TIP]
> The `SET LOCAL role TO anon` trick is the most direct way to confirm RLS at the database level without writing any client code. It impersonates the anon role for the duration of the transaction.
