-- Initial setup script for Supabase database
-- Use this script to initialize the database structure

-- Drop tables if they exist (for clean restarts)
DROP TABLE IF EXISTS votes;
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

-- Create votes table with rate limiting fields
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "modelId" TEXT NOT NULL REFERENCES models(id),
  category TEXT NOT NULL,
  rating FLOAT NOT NULL,
  timestamp BIGINT NOT NULL,
  "userBrowserId" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
CREATE INDEX votes_model_idx ON votes("modelId");
CREATE INDEX votes_user_idx ON votes("userBrowserId");
CREATE INDEX votes_category_idx ON votes(category);
CREATE INDEX votes_timestamp_idx ON votes(timestamp);

-- Enable Row Level Security
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies for initial setup (admin access)
-- These policies allow full access for initial data loading
CREATE POLICY "Admin can select models" 
  ON models FOR SELECT USING (true);

CREATE POLICY "Admin can insert models" 
  ON models FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update models" 
  ON models FOR UPDATE USING (true);

CREATE POLICY "Admin can select votes" 
  ON votes FOR SELECT USING (true);

CREATE POLICY "Admin can insert votes" 
  ON votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can select rate_limits" 
  ON rate_limits FOR SELECT USING (true);

CREATE POLICY "Admin can insert rate_limits" 
  ON rate_limits FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update rate_limits" 
  ON rate_limits FOR UPDATE USING (true);
