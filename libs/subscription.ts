import { createClient } from "@/libs/supabase/server";
import { UserProfile, Subscription, SubscriptionStatus, PlanType } from "@/types/database";
import config from "@/config";

export interface UserAccess {
  hasAccess: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  trialDaysRemaining: number;
  subscription: Subscription | null;
  planType: PlanType;
}

/**
 * Check if user's trial period is active
 */
export async function checkTrialStatus(userId: string): Promise<{
  isActive: boolean;
  daysRemaining: number;
  endsAt: Date | null;
}> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('trial_started_at, trial_ends_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { isActive: false, daysRemaining: 0, endsAt: null };
  }

  if (!profile.trial_ends_at) {
    return { isActive: false, daysRemaining: 0, endsAt: null };
  }

  const now = new Date();
  const trialEnd = new Date(profile.trial_ends_at);
  const isActive = now < trialEnd;
  const daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    isActive,
    daysRemaining,
    endsAt: trialEnd
  };
}

/**
 * Get user's subscription status
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !subscription) {
    return null;
  }

  return subscription;
}

/**
 * Check if user has active subscription (not trial)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing'];
  return activeStatuses.includes(subscription.status);
}

/**
 * Get comprehensive user access information
 */
export async function getUserAccess(userId: string): Promise<UserAccess> {
  const [trialStatus, subscription] = await Promise.all([
    checkTrialStatus(userId),
    getUserSubscription(userId),
  ]);

  const hasActiveSubscription = subscription &&
    ['active', 'trialing'].includes(subscription.status);

  const hasAccess = trialStatus.isActive || !!hasActiveSubscription;

  return {
    hasAccess,
    isTrialing: trialStatus.isActive && !hasActiveSubscription,
    trialEndsAt: trialStatus.endsAt,
    trialDaysRemaining: trialStatus.daysRemaining,
    subscription,
    planType: subscription?.plan_type || 'trial',
  };
}

/**
 * Check if user can access a specific feature
 */
export async function canAccessFeature(
  userId: string,
  feature: 'content_calendar' | 'keyword_research' | 'article_generation' | 'site_audit'
): Promise<boolean> {
  const access = await getUserAccess(userId);

  // During trial, users have limited access
  if (access.isTrialing) {
    switch (feature) {
      case 'content_calendar':
        return true; // Can view current + next day only
      case 'keyword_research':
        return true; // Limited keywords
      case 'article_generation':
        return true; // Basic generation
      case 'site_audit':
        return false; // Not available in trial
      default:
        return false;
    }
  }

  // With active subscription, all features available
  return access.hasAccess;
}

/**
 * Get trial period configuration from config
 */
export function getTrialConfig() {
  return {
    durationDays: config.trial?.durationDays || 2,
    features: config.trial?.features || [],
  };
}

/**
 * Initialize trial for a new user (called automatically by database trigger)
 */
export async function initializeTrial(userId: string): Promise<void> {
  const supabase = await createClient();
  const trialConfig = getTrialConfig();

  const trialStartedAt = new Date();
  const trialEndsAt = new Date(trialStartedAt.getTime() + trialConfig.durationDays * 24 * 60 * 60 * 1000);

  await supabase
    .from('user_profiles')
    .update({
      trial_started_at: trialStartedAt.toISOString(),
      trial_ends_at: trialEndsAt.toISOString(),
    })
    .eq('id', userId);
}

/**
 * Check if user needs to upgrade (trial expired and no subscription)
 */
export async function needsUpgrade(userId: string): Promise<boolean> {
  const access = await getUserAccess(userId);
  return !access.hasAccess;
}
