/*
# Create core tables: profiles, lines, swaps

## Overview
This migration creates the three tables the EquipSwap Newsan app needs:
- `profiles`: stores user role and linea, linked to auth.users
- `lines`: production lines (sectors)
- `swaps`: equipment change tickets

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per authenticated user
- `email` (text) — user email, copied from auth
- `role` (text) — user role: 'calidad', 'produccion', 'sistemas', 'admin', or NULL (sin rol)
- `linea` (text) — assigned production line (optional)
- `created_at` (timestamptz)

### lines
- `id` (uuid, PK)
- `name` (text, unique) — line name
- `created_at` (timestamptz)

### swaps
- `id` (uuid, PK)
- `line_id` (text) — line name
- `model` (text)
- `color_model` (text)
- `newsan_code` (text)
- `material` (text)
- `master_box` (text)
- `new_master_box` (text)
- `old_imei_1` (text)
- `old_imei_2` (text)
- `new_imei` (text)
- `new_imei_2` (text)
- `quality_inspector` (text)
- `quality_observation` (text)
- `quality_status` (text)
- `systems_observation` (text)
- `status` (text)
- `shift` (text)
- `supervisor` (text)
- `quantity` (integer)
- `it_confirmation` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- RLS enabled on all three tables.
- All tables allow authenticated users full CRUD (shared data model — all logged-in
  users can see and manage swaps, lines, and profiles).
- No user_id ownership scoping because the app is a shared internal tool.
*/

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text,
  linea text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
CREATE POLICY "profiles_insert_authenticated"
  ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;
CREATE POLICY "profiles_update_authenticated"
  ON public.profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_delete_authenticated" ON public.profiles;
CREATE POLICY "profiles_delete_authenticated"
  ON public.profiles FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- TABLE: lines
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lines_select_authenticated" ON public.lines;
CREATE POLICY "lines_select_authenticated"
  ON public.lines FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "lines_insert_authenticated" ON public.lines;
CREATE POLICY "lines_insert_authenticated"
  ON public.lines FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lines_update_authenticated" ON public.lines;
CREATE POLICY "lines_update_authenticated"
  ON public.lines FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "lines_delete_authenticated" ON public.lines;
CREATE POLICY "lines_delete_authenticated"
  ON public.lines FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- TABLE: swaps
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id text,
  model text,
  color_model text,
  newsan_code text,
  material text,
  master_box text,
  new_master_box text,
  old_imei_1 text,
  old_imei_2 text,
  new_imei text,
  new_imei_2 text,
  quality_inspector text,
  quality_observation text,
  quality_status text,
  systems_observation text,
  status text,
  shift text,
  supervisor text,
  quantity integer DEFAULT 1,
  it_confirmation text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "swaps_select_authenticated" ON public.swaps;
CREATE POLICY "swaps_select_authenticated"
  ON public.swaps FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "swaps_insert_authenticated" ON public.swaps;
CREATE POLICY "swaps_insert_authenticated"
  ON public.swaps FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "swaps_update_authenticated" ON public.swaps;
CREATE POLICY "swaps_update_authenticated"
  ON public.swaps FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "swaps_delete_authenticated" ON public.swaps;
CREATE POLICY "swaps_delete_authenticated"
  ON public.swaps FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TRIGGER: auto-update updated_at on swaps
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS swaps_updated_at ON public.swaps;
CREATE TRIGGER swaps_updated_at
  BEFORE UPDATE ON public.swaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
