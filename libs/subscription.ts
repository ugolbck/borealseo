import { createClient } from "@/libs/supabase/server";
import { Subscription, SubscriptionStatus, PlanType } from "@/types/database";

export interface UserAccess {
  hasAccess: boolean;
  subscription: Subscription | null;
  planType: PlanType | null;
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
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Check if subscription is active and within period
  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing'];
  const isActiveStatus = activeStatuses.includes(subscription.status);

  // If canceled but still within period, user retains access
  if (subscription.cancel_at_period_end && subscription.current_period_end) {
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    return isActiveStatus && now < periodEnd;
  }

  return isActiveStatus;
}

/**
 * Get comprehensive user access information
 */
export async function getUserAccess(userId: string): Promise<UserAccess> {
  const subscription = await getUserSubscription(userId);
  const hasAccess = await hasActiveSubscription(userId);

  return {
    hasAccess,
    subscription,
    planType: subscription?.plan_type || null,
  };
}

/**
 * Check if user needs to upgrade (no active subscription)
 */
export async function needsUpgrade(userId: string): Promise<boolean> {
  return !(await hasActiveSubscription(userId));
}
