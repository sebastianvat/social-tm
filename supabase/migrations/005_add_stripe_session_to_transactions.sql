ALTER TABLE token_transactions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
