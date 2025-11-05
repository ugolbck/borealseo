-- Add proper SEO difficulty tracking
-- Remove the fake difficulty from suggestions API, add real difficulty from difficulty API

ALTER TABLE public.keywords
  DROP COLUMN IF EXISTS difficulty,
  ADD COLUMN ads_competition DECIMAL(3,2),  -- 0.00-1.00 from suggestions API (Google Ads competition)
  ADD COLUMN seo_difficulty INTEGER;         -- 0-100 from bulk difficulty API (real SEO difficulty)

-- Update comments
COMMENT ON COLUMN public.keywords.ads_competition IS 'Google Ads competition level (0.00-1.00) from keyword suggestions API. Not used for scoring.';
COMMENT ON COLUMN public.keywords.seo_difficulty IS 'Real SEO difficulty (0-100) from DataForSEO bulk keyword difficulty API. Used for filtering (<35) and scoring.';
COMMENT ON COLUMN public.keywords.score IS 'Calculated as (search_volume/50) + (100-seo_difficulty) for ranking best keywords. Higher score = better keyword.';
