-- Admin-adjustable fake follower boost for creators (displayed = followers_count + fake_followers)
-- Run in Supabase SQL Editor

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS fake_followers BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_creators_fake_followers ON creators (fake_followers);
