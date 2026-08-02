-- ==============================================================================
-- iNSIGHTS Layer 2: Workspaces & Collaboration Migration
-- Copy and paste this into your Supabase SQL Editor and click "Run".
-- ==============================================================================

-- 1. Create Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL, -- User's Clerk ID or email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Workspace Members Table (for Collaboration)
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_identifier TEXT NOT NULL, -- The collaborator's Clerk ID or email address
    role TEXT NOT NULL DEFAULT 'collaborator', -- 'owner' or 'collaborator'
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, user_identifier)
);

-- 3. Modify Blueprints Table to link to Workspaces
ALTER TABLE public.blueprints 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- 4. Set up RLS (Row Level Security) policies
-- Note: Assuming basic RLS for public tables based on anon/service roles for this initial implementation. 
-- In a strict production environment, tie these to auth.uid().
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on workspaces" ON public.workspaces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role full access on workspace_members" ON public.workspace_members FOR ALL USING (true) WITH CHECK (true);
