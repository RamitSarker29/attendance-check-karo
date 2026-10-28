-- ============================================================================
-- ATTENDANCE CHECK KARO - SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Run this entire script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- It creates the secure user_workspaces table, enables RLS, and adds strict ownership policies.

-- 1. Create the user_workspaces table
CREATE TABLE IF NOT EXISTS public.user_workspaces (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL DEFAULT '',
  college TEXT,
  semester_name TEXT NOT NULL DEFAULT 'Current Semester',
  subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  routine JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendance_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  semester_archives JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_workspaces_user_id ON public.user_workspaces(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_workspaces ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Drop existing policies if re-running script
DROP POLICY IF EXISTS "Users can view own workspace" ON public.user_workspaces;
DROP POLICY IF EXISTS "Users can insert own workspace" ON public.user_workspaces;
DROP POLICY IF EXISTS "Users can update own workspace" ON public.user_workspaces;
DROP POLICY IF EXISTS "Users can delete own workspace" ON public.user_workspaces;

-- Policy 1: SELECT - Authenticated users can only read their own workspace
CREATE POLICY "Users can view own workspace"
  ON public.user_workspaces
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policy 2: INSERT - Authenticated users can only create their own workspace
CREATE POLICY "Users can insert own workspace"
  ON public.user_workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy 3: UPDATE - Authenticated users can only update their own workspace
CREATE POLICY "Users can update own workspace"
  ON public.user_workspaces
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Policy 4: DELETE - Authenticated users can only delete their own workspace
CREATE POLICY "Users can delete own workspace"
  ON public.user_workspaces
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5. Automatically maintain updated_at on updates
CREATE OR REPLACE FUNCTION public.handle_user_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_workspaces_updated_at ON public.user_workspaces;
CREATE TRIGGER tr_user_workspaces_updated_at
  BEFORE UPDATE ON public.user_workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_workspace_updated_at();

-- 6. Trigger to automatically initialize an empty workspace when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_workspaces (user_id, email, name, college, semester_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', NULL),
    'Current Semester'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
