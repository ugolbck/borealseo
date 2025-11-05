// Database types matching the Supabase schema

export type CrawlStatus = 'pending' | 'crawling' | 'completed' | 'failed';
export type KeywordStatus = 'monitoring' | 'target' | 'ranking';
export type ContentPlanStatus = 'planned' | 'generating' | 'draft' | 'published' | 'failed';
export type ArticleStatus = 'draft' | 'ready' | 'published';
export type BriefStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid';
export type PlanType = 'trial' | 'weekly' | 'monthly' | 'pro' | 'agency' | 'ltd';

// User Profile (extends auth.users)
export interface UserProfile {
  id: string;
  is_verified: boolean;
  has_completed_onboarding: boolean;
  created_at: string;
  updated_at: string;
}

// Website
export interface Website {
  id: string;
  user_id: string;
  url: string;
  name: string;
  description: string | null;
  target_audience: string | null;
  initial_keywords: string[] | null;
  is_active: boolean;
  last_crawled_at: string | null;
  crawl_status: CrawlStatus;
  created_at: string;
  updated_at: string;
}

export interface NewWebsite {
  user_id: string;
  url: string;
  name: string;
  description?: string;
  target_audience?: string;
  initial_keywords?: string[];
}

// Page
export interface Page {
  id: string;
  website_id: string;
  url: string;
  url_hash: string;
  title: string | null;
  meta_description: string | null;
  has_h1: boolean;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  word_count: number | null;
  seo_score: number | null;
  issues_count: number;
  critical_issues: number;
  issue_types: any | null;
  last_analyzed_at: string | null;
  created_at: string;
}

// Keyword
export interface Keyword {
  id: string;
  website_id: string;
  keyword: string;
  search_volume: number | null;
  difficulty: number | null;
  current_ranking: number | null;
  target_page_id: string | null;
  status: KeywordStatus;
  is_auto_discovered: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewKeyword {
  website_id: string;
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  current_ranking?: number;
  target_page_id?: string;
  status?: KeywordStatus;
  is_auto_discovered?: boolean;
}

// Content Plan
export interface ContentPlan {
  id: string;
  website_id: string;
  keyword_id: string | null;
  title: string;
  target_keyword: string;
  scheduled_for: string;
  status: ContentPlanStatus;
  brief_storage_url: string | null;
  content_storage_url: string | null;
  word_count: number | null;
  published_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewContentPlan {
  website_id: string;
  keyword_id?: string;
  title: string;
  target_keyword: string;
  scheduled_for: string;
  status?: ContentPlanStatus;
}

// Article
export interface Article {
  id: string;
  content_plan_id: string;
  title: string;
  meta_description: string | null;
  content: string;
  word_count: number | null;
  headings: string[];
  internal_link_suggestions: string[];
  status: ArticleStatus;
  generated_at: string;
  last_modified: string;
  created_at: string;
  updated_at: string;
}

export interface NewArticle {
  content_plan_id: string;
  title: string;
  meta_description?: string;
  content: string;
  word_count?: number;
  headings?: string[];
  internal_link_suggestions?: string[];
  status?: ArticleStatus;
}

// Content Brief
export interface ContentBrief {
  id: string;
  website_id: string;
  keyword: string;
  brief: string | null;
  status: BriefStatus;
  error_message: string | null;
  credits_used: number;
  created_at: string;
  updated_at: string;
}

// Site Audit
export interface SiteAudit {
  id: string;
  website_id: string;
  overall_score: number | null;
  total_pages: number;
  pages_with_issues: number;
  critical_issues: number;
  warning_issues: number;
  summary: any | null;
  completed_at: string;
  created_at: string;
}

// Subscription
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  plan_type: PlanType;
  cancel_at_period_end: boolean;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
}

export interface NewSubscription {
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  status: SubscriptionStatus;
  plan_type: PlanType;
  cancel_at_period_end?: boolean;
  current_period_start: string;
  current_period_end: string;
}

// Helper types for API responses
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
