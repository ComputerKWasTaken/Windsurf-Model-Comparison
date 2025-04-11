-- Update schema for Supabase database
-- This script temporarily enables model updates and insertions
-- It can be run after either supabase-init-schema.sql OR supabase-secure-schema.sql

-- First, drop ALL existing policies on the models table to avoid conflicts
DROP POLICY IF EXISTS "Admin can select models" ON models;
DROP POLICY IF EXISTS "Admin can insert models" ON models;
DROP POLICY IF EXISTS "Admin can update models" ON models;
DROP POLICY IF EXISTS "Models are viewable by everyone" ON models;
DROP POLICY IF EXISTS "Restricted model updates" ON models;
DROP POLICY IF EXISTS "Allow model insertion" ON models;
DROP POLICY IF EXISTS "Allow model updates" ON models;

-- Create policies that allow model management
-- Anyone can view models
CREATE POLICY "Models are viewable by everyone" 
  ON models FOR SELECT USING (true);

-- Allow insertion of new models
CREATE POLICY "Allow model insertion" 
  ON models FOR INSERT WITH CHECK (true);

-- Allow updating of models
CREATE POLICY "Allow model updates" 
  ON models FOR UPDATE USING (true);

-- Note: This schema intentionally has permissive policies for model management
-- It should only be used temporarily for administrative purposes
-- After model updates are complete, apply the secure schema with supabase-secure-schema.sql
