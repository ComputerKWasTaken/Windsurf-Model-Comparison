-- Security-focused schema for Supabase database
-- Use this script AFTER initializing with supabase-init-schema.sql and loading initial data
-- This can also be used to restore security after using supabase-update-schema.sql

-- First, drop ALL existing policies to avoid conflicts
-- Drop admin policies from init schema
DROP POLICY IF EXISTS "Admin can select models" ON models;
DROP POLICY IF EXISTS "Admin can insert models" ON models;
DROP POLICY IF EXISTS "Admin can update models" ON models;
DROP POLICY IF EXISTS "Admin can select model_pair_votes" ON model_pair_votes;
DROP POLICY IF EXISTS "Admin can insert model_pair_votes" ON model_pair_votes;
DROP POLICY IF EXISTS "Admin can select rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Admin can insert rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Admin can update rate_limits" ON rate_limits;

-- Drop policies from update schema
DROP POLICY IF EXISTS "Allow model insertion" ON models;
DROP POLICY IF EXISTS "Allow model updates" ON models;

-- Drop policies from this schema (in case it's being reapplied)
DROP POLICY IF EXISTS "Models are viewable by everyone" ON models;
DROP POLICY IF EXISTS "Restricted model updates" ON models;
DROP POLICY IF EXISTS "Model pair votes are viewable by everyone" ON model_pair_votes;
DROP POLICY IF EXISTS "Validated model pair vote insertion" ON model_pair_votes;
DROP POLICY IF EXISTS "Allow public access to rate_limits" ON rate_limits;

-- Create restricted policies for normal operation

-- Models table policies
-- Anyone can view models
CREATE POLICY "Models are viewable by everyone" 
  ON models FOR SELECT USING (true);

-- No one can insert new models from client side
-- No one can delete models from client side

-- Only allow updating ratings and votes count
CREATE POLICY "Restricted model updates" 
  ON models FOR UPDATE USING (true)
  WITH CHECK (
    -- Only allow updating ratings and votes fields
    (SELECT array_length(ARRAY(
      SELECT jsonb_object_keys(jsonb_path_query_array(current_setting('request.json', true)::jsonb, '$.set'))
      EXCEPT
      SELECT unnest(ARRAY['ratings', 'votes'])
    ), 1)) IS NULL
  );

-- Model pair votes table policies
-- Anyone can view model pair votes
CREATE POLICY "Model pair votes are viewable by everyone" 
  ON model_pair_votes FOR SELECT USING (true);

-- Model pair votes can be inserted with validation
CREATE POLICY "Validated model pair vote insertion" 
  ON model_pair_votes FOR INSERT WITH CHECK (
    -- Ensure category is valid
    category IN ('overall', 'agentic', 'planning', 'debugging', 'refactoring', 'explaining') AND
    -- Ensure vote is either 0 or 1
    vote IN (0, 1)
  );

-- Rate limits table policies
-- Enable RLS on rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow public access to rate_limits for the trigger function to work
CREATE POLICY "Allow public access to rate_limits" 
  ON rate_limits FOR ALL USING (true);

-- Note: In a production environment with authenticated users, you would want to restrict this
-- to only allow users to access their own rate limits. Since we're using anonymous browser IDs,
-- we're using a more permissive policy here.

-- Create function to enforce rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_vote BIGINT;
  current_timestamp_ms BIGINT;
  hourly_count INTEGER;
  hourly_start BIGINT;
  one_hour BIGINT := 3600000; -- 1 hour in milliseconds
  vote_pair_key TEXT;
BEGIN
  -- Get current time in milliseconds
  current_timestamp_ms := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  
  -- Create a unique key for this vote pair (timestamp + userBrowserId)
  vote_pair_key := NEW.timestamp || '-' || NEW."userBrowserId";
  
  -- Check if we've already processed a vote with this exact timestamp from this user
  PERFORM 1 FROM model_pair_votes 
  WHERE "userBrowserId" = NEW."userBrowserId" AND timestamp = NEW.timestamp
  LIMIT 1;
  
  IF FOUND THEN
    RETURN NEW;
  END IF;
  
  SELECT 
    last_vote_time, 
    hourly_vote_count, 
    hourly_window_start 
  INTO 
    last_vote, 
    hourly_count, 
    hourly_start
  FROM rate_limits
  WHERE "userBrowserId" = NEW."userBrowserId";
  
  IF NOT FOUND THEN
    INSERT INTO rate_limits ("userBrowserId", last_vote_time, hourly_vote_count, hourly_window_start)
    VALUES (NEW."userBrowserId", current_timestamp_ms, 1, current_timestamp_ms);
    RETURN NEW;
  END IF;
  
  IF (current_timestamp_ms - last_vote) < 1000 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Please wait at least 1 second between votes';
  END IF;
  
  IF (current_timestamp_ms - hourly_start) > one_hour THEN
    UPDATE rate_limits 
    SET 
      last_vote_time = current_timestamp_ms,
      hourly_vote_count = 1,
      hourly_window_start = current_timestamp_ms,
      updated_at = NOW()
    WHERE "userBrowserId" = NEW."userBrowserId";
  ELSE
    IF hourly_count >= 50 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Maximum 50 votes per hour';
    END IF;
    UPDATE rate_limits 
    SET 
      last_vote_time = current_timestamp_ms,
      hourly_vote_count = hourly_count + 1,
      updated_at = NOW()
    WHERE "userBrowserId" = NEW."userBrowserId";
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rate limiting
DROP TRIGGER IF EXISTS enforce_rate_limit ON model_pair_votes;
CREATE TRIGGER enforce_rate_limit
  BEFORE INSERT ON model_pair_votes
  FOR EACH ROW
  EXECUTE FUNCTION check_rate_limit();
