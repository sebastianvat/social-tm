-- Brand profile fields for AI content guidance
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS tone text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS content_pillars text[],
  ADD COLUMN IF NOT EXISTS visual_style text,
  ADD COLUMN IF NOT EXISTS posting_rules text,
  ADD COLUMN IF NOT EXISTS hashtag_groups jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS competitor_notes text;
