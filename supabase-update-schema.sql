-- Update schema for Supabase database
-- This script temporarily enables model updates and insertions
-- It can be run after either supabase-init-schema.sql OR supabase-secure-schema.sql

-- First, drop ALL existing policies on all tables to avoid conflicts

-- Policies on 'models' table (from init, secure, update schemas)
DROP POLICY IF EXISTS "Admin can select models" ON models;
DROP POLICY IF EXISTS "Admin can insert models" ON models;
DROP POLICY IF EXISTS "Admin can update models" ON models;
DROP POLICY IF EXISTS "Models are viewable by everyone" ON models;
DROP POLICY IF EXISTS "Restricted model updates" ON models;
DROP POLICY IF EXISTS "Allow model insertion" ON models;
DROP POLICY IF EXISTS "Allow model updates" ON models;

-- Policies on 'model_pair_votes' table (from init, secure, update schemas)
DROP POLICY IF EXISTS "Admin can select model_pair_votes" ON model_pair_votes;
DROP POLICY IF EXISTS "Admin can insert model_pair_votes" ON model_pair_votes;
DROP POLICY IF EXISTS "Model pair votes are viewable by everyone" ON model_pair_votes;
DROP POLICY IF EXISTS "Allow model pair vote insertion" ON model_pair_votes;
DROP POLICY IF EXISTS "Validated model pair vote insertion" ON model_pair_votes;

-- Policies on 'rate_limits' table (from init, secure schemas)
DROP POLICY IF EXISTS "Admin can select rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Admin can insert rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Admin can update rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Allow public access to rate_limits" ON rate_limits;

-- Create policies that allow model management
-- Anyone can view models
CREATE POLICY "Models are viewable by everyone" 
  ON models FOR SELECT USING (true);

-- Allow insertion of new models
CREATE POLICY "Allow model insertion" 
  ON models FOR INSERT WITH CHECK (true);

-- Allow updating of models
CREATE POLICY "Allow model updates" 
  ON models FOR UPDATE USING (true) WITH CHECK (true); -- Added WITH CHECK (true) for consistency

-- Add permissive policies for model_pair_votes
CREATE POLICY "Model pair votes are viewable by everyone" 
  ON model_pair_votes FOR SELECT USING (true);
CREATE POLICY "Allow model pair vote insertion" 
  ON model_pair_votes FOR INSERT WITH CHECK (true);

-- Note: This schema intentionally has permissive policies for model management
-- It should only be used temporarily for administrative purposes
-- After model updates are complete, apply the secure schema with supabase-secure-schema.sql
