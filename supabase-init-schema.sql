-- Initial setup script for Supabase database
-- Use this script to initialize the database structure

-- Drop tables if they exist (for clean restarts)
DROP TABLE IF EXISTS model_pair_votes;
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS models;

-- Create models table
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  "costCredits" FLOAT NOT NULL,
  "contextWindow" INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  "logoUrl" TEXT,
  ratings JSONB NOT NULL DEFAULT '{"overall": 1200, "agentic": 1200, "planning": 1200, "debugging": 1200, "refactoring": 1200, "explaining": 1200}',
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create model_pair_votes table for pairwise voting
CREATE TABLE model_pair_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_a_id TEXT NOT NULL REFERENCES models(id),
  model_b_id TEXT NOT NULL REFERENCES models(id),
  category TEXT NOT NULL,
  vote INTEGER NOT NULL, -- 0 = model_a wins, 1 = model_b wins
  timestamp BIGINT NOT NULL,
  "userBrowserId" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_vote_pair UNIQUE (model_a_id, model_b_id, category, "userBrowserId")
);

-- Create rate limiting table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS rate_limits (
  "userBrowserId" TEXT PRIMARY KEY,
  last_vote_time BIGINT NOT NULL,
  hourly_vote_count INTEGER NOT NULL DEFAULT 1,
  hourly_window_start BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX model_pair_votes_a_idx ON model_pair_votes(model_a_id);
CREATE INDEX model_pair_votes_b_idx ON model_pair_votes(model_b_id);
CREATE INDEX model_pair_votes_user_idx ON model_pair_votes("userBrowserId");
CREATE INDEX model_pair_votes_category_idx ON model_pair_votes(category);
CREATE INDEX model_pair_votes_timestamp_idx ON model_pair_votes(timestamp);

-- Enable Row Level Security
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_pair_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for initial setup (admin access)
-- These policies allow full access for initial data loading
CREATE POLICY "Admin can select models" 
  ON models FOR SELECT USING (true);

CREATE POLICY "Admin can insert models" 
  ON models FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update models" 
  ON models FOR UPDATE USING (true);

CREATE POLICY "Admin can select model_pair_votes" 
  ON model_pair_votes FOR SELECT USING (true);

CREATE POLICY "Admin can insert model_pair_votes" 
  ON model_pair_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can select rate_limits" 
  ON rate_limits FOR SELECT USING (true);

CREATE POLICY "Admin can insert rate_limits" 
  ON rate_limits FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update rate_limits" 
  ON rate_limits FOR UPDATE USING (true);
