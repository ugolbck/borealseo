-- Complete Boreal SEO Schema - Single Migration
-- Drop everything and start fresh

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE crawl_status_enum AS ENUM ('pending', 'crawling', 'completed', 'failed');
CREATE TYPE keyword_status_enum AS ENUM ('monitoring', 'target', 'ranking');
CREATE TYPE content_plan_status_enum AS ENUM ('planned', 'generating', 'draft', 'published', 'failed');
CREATE TYPE article_status_enum AS ENUM ('draft', 'ready', 'published');
CREATE TYPE brief_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid');
CREATE TYPE plan_type_enum AS ENUM ('weekly', 'monthly', 'pro', 'agency', 'ltd');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  has_completed_onboarding BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Websites table
CREATE TABLE public.websites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT,
  initial_keywords JSONB, -- Array of initial keywords from onboarding
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_crawled_at TIMESTAMPTZ,
  crawl_status crawl_status_enum DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX websites_user_id_idx ON public.websites(user_id);
CREATE INDEX websites_url_idx ON public.websites(url);

ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own websites"
  ON public.websites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own websites"
  ON public.websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own websites"
  ON public.websites FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own websites"
  ON public.websites FOR DELETE
  USING (auth.uid() = user_id);

-- Pages table (metadata only, no full content)
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  has_h1 BOOLEAN DEFAULT false,
  h1_count INTEGER DEFAULT 0,
  h2_count INTEGER DEFAULT 0,
  h3_count INTEGER DEFAULT 0,
  word_count INTEGER,
  seo_score INTEGER,
  issues_count INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  issue_types JSONB,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX pages_website_id_idx ON public.pages(website_id);
CREATE INDEX pages_url_hash_idx ON public.pages(url_hash);
CREATE INDEX pages_seo_score_idx ON public.pages(seo_score);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pages of their websites"
  ON public.pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = pages.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Keywords table (KEYWORD POOL)
-- Stores 100-400 keywords per website generated during onboarding
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  difficulty INTEGER,
  seed_keyword TEXT,  -- Which user keyword generated this
  score INTEGER,      -- Calculated: (search_volume/50) + (100-difficulty)
  current_ranking INTEGER,
  target_page_id UUID REFERENCES public.pages(id),
  status keyword_status_enum DEFAULT 'target' NOT NULL,
  is_auto_discovered BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX keywords_website_id_idx ON public.keywords(website_id);
CREATE INDEX keywords_keyword_idx ON public.keywords(keyword);
CREATE INDEX keywords_ranking_idx ON public.keywords(current_ranking);
CREATE INDEX keywords_website_score_idx ON public.keywords(website_id, score DESC);
CREATE INDEX keywords_seed_keyword_idx ON public.keywords(website_id, seed_keyword);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view keywords of their websites"
  ON public.keywords FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = keywords.website_id
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage keywords of their websites"
  ON public.keywords FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = keywords.website_id
      AND websites.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.keywords IS 'Keyword pool: 100-400 keywords per website generated from user seed keywords during onboarding';
COMMENT ON COLUMN public.keywords.seed_keyword IS 'The user-provided keyword that generated this keyword via DataForSEO API';
COMMENT ON COLUMN public.keywords.score IS 'Calculated as (search_volume/50) + (100-difficulty) for ranking best keywords. Higher score = better keyword.';

-- Content plan table (DAILY ASSIGNMENTS)
-- One keyword assigned to each date for each website
CREATE TABLE public.content_plan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_keyword TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  scheduled_date DATE,  -- DATE only for easier queries
  status content_plan_status_enum DEFAULT 'planned' NOT NULL,
  brief_storage_url TEXT,
  content_storage_url TEXT,
  word_count INTEGER,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX content_plan_website_id_idx ON public.content_plan(website_id);
CREATE INDEX content_plan_status_idx ON public.content_plan(status);
CREATE INDEX content_plan_scheduled_idx ON public.content_plan(scheduled_for);
CREATE INDEX content_plan_scheduled_date_idx ON public.content_plan(scheduled_date);
CREATE UNIQUE INDEX content_plan_website_date_unique ON public.content_plan(website_id, scheduled_date);

ALTER TABLE public.content_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content plan of their websites"
  ON public.content_plan FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = content_plan.website_id
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage content plan of their websites"
  ON public.content_plan FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = content_plan.website_id
      AND websites.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.content_plan IS 'Daily assignments: One keyword assigned to each date for each website. Keywords assigned progressively (7 days at a time)';
COMMENT ON COLUMN public.content_plan.scheduled_date IS 'The date (DATE type) for this content plan - one plan per day per website. Used alongside scheduled_for timestamp.';

-- Articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_plan_id UUID NOT NULL REFERENCES public.content_plan(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meta_description TEXT,
  content TEXT NOT NULL,
  word_count INTEGER,
  headings JSONB DEFAULT '[]'::jsonb,
  internal_link_suggestions JSONB DEFAULT '[]'::jsonb,
  status article_status_enum DEFAULT 'draft' NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_modified TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX articles_content_plan_id_idx ON public.articles(content_plan_id);
CREATE INDEX articles_status_idx ON public.articles(status);
CREATE INDEX articles_generated_at_idx ON public.articles(generated_at);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view articles of their websites"
  ON public.articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.content_plan
      JOIN public.websites ON websites.id = content_plan.website_id
      WHERE content_plan.id = articles.content_plan_id
      AND websites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage articles of their websites"
  ON public.articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.content_plan
      JOIN public.websites ON websites.id = content_plan.website_id
      WHERE content_plan.id = articles.content_plan_id
      AND websites.user_id = auth.uid()
    )
  );

-- Content briefs table
CREATE TABLE public.content_briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  brief TEXT,
  status brief_status_enum DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX content_briefs_website_id_idx ON public.content_briefs(website_id);
CREATE INDEX content_briefs_keyword_idx ON public.content_briefs(keyword);
CREATE INDEX content_briefs_status_idx ON public.content_briefs(status);

ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content briefs of their websites"
  ON public.content_briefs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = content_briefs.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Site audits table
CREATE TABLE public.site_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  overall_score INTEGER,
  total_pages INTEGER NOT NULL,
  pages_with_issues INTEGER NOT NULL,
  critical_issues INTEGER NOT NULL,
  warning_issues INTEGER NOT NULL,
  summary JSONB,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX site_audits_website_id_idx ON public.site_audits(website_id);
CREATE INDEX site_audits_completed_idx ON public.site_audits(completed_at);

ALTER TABLE public.site_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits of their websites"
  ON public.site_audits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.websites
      WHERE websites.id = site_audits.website_id
      AND websites.user_id = auth.uid()
    )
  );

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status_enum NOT NULL,
  plan_type plan_type_enum NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);
CREATE INDEX subscriptions_current_period_end_idx ON public.subscriptions(current_period_end);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON public.keywords
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_plan_updated_at BEFORE UPDATE ON public.content_plan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_briefs_updated_at BEFORE UPDATE ON public.content_briefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
