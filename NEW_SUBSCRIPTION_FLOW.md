# Subscription Flow - No Trial Model

## Overview

This app uses a **weekly subscription** model with **no free trial**. Users must have an active paid subscription to access the dashboard and generate content.

---

## User Journey

### 1. Sign Up
- User creates account via sign-in page
- Account is created but dashboard is NOT accessible
- User has no content or websites yet

### 2. Subscribe
- User visits `/pricing` page
- User clicks "Subscribe" button
- Redirected to Stripe checkout
- After successful payment:
  - Stripe webhook fires: `checkout.session.completed`
  - Subscription record created in database
  - User redirected to `/dashboard`

### 3. Onboarding
- User redirected to `/onboarding` if not completed
- User enters:
  - Website URL and name
  - Description and target audience
  - 3+ seed keywords (comma-separated)
- User clicks "Complete Setup"
- API validates active subscription exists
- Website record created in database
- User redirected to `/dashboard`

### 4. Content Generation (Automatic)
**Triggered by:** `checkout.session.completed` webhook

The system automatically:
1. Researches keywords using DataForSEO API
   - Expands seed keywords
   - Filters by difficulty (<60) and competition
2. Inserts discovered keywords into database
3. Selects top 7 keywords by search volume
4. Creates 7-day content plan:
   - Day 1: Today
   - Day 2: Tomorrow
   - ...
   - Day 7: Today + 6 days
5. Calendar displays with skeleton loading states

### 5. Using the Dashboard
- User sees 7-day calendar with keywords
- User can:
  - Generate articles for ANY day (including past days)
  - Change keywords for any day
  - View generated articles
  - Scroll through calendar

### 6. Weekly Renewal
**Triggered by:** `invoice.paid` webhook

When subscription renews:
1. Stripe automatically charges customer
2. Webhook fires: `invoice.paid`
3. System checks for content coverage:
   - Counts existing content plans for next 7 days
   - If < 7 days exist, generates more content
4. System generates next 7 days:
   - Fetches existing keywords
   - Filters out used keywords
   - If < 7 available, discovers new keywords via DataForSEO
   - Creates 7 new content plans starting from (last_date + 1)
5. User always has 7+ days of content scheduled

### 7. Cancellation
- User cancels subscription via Stripe portal
- Stripe sets `cancel_at_period_end: true`
- User retains access until period end (7 days from start)
- At period end:
  - Stripe webhook fires: `customer.subscription.deleted`
  - Subscription status set to `canceled`
  - User loses dashboard access
  - User redirected to `/pricing` page

### 8. Resubscription
- User can resubscribe at any time
- All historical data preserved:
  - Websites
  - Keywords
  - Content plans
  - Generated articles
- Content generation resumes from last scheduled date

---

## Technical Implementation

### Access Control
**File:** `libs/subscription.ts`

```typescript
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;

  const activeStatuses = ['active', 'trialing'];
  const isActiveStatus = activeStatuses.includes(subscription.status);

  // If canceled but still within period, user retains access
  if (subscription.cancel_at_period_end && subscription.current_period_end) {
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    return isActiveStatus && now < periodEnd;
  }

  return isActiveStatus;
}
```

### Dashboard Gating
**File:** `app/dashboard/layout.tsx`

```typescript
export default async function DashboardLayout({ children }) {
  const requiresUpgrade = await needsUpgrade(user.id);

  if (requiresUpgrade) {
    redirect("/pricing");
  }

  // ... render dashboard
}
```

### Onboarding Validation
**File:** `app/api/onboarding/complete/route.ts`

```typescript
// Check if user has active subscription
const { data: subscription } = await supabase
  .from("subscriptions")
  .select("status")
  .eq("user_id", user.id)
  .single();

if (!subscription || subscription.status !== 'active') {
  return NextResponse.json(
    { error: "Active subscription required. Please subscribe to continue." },
    { status: 403 }
  );
}
```

### Webhook Handlers
**File:** `app/api/webhook/stripe/route.ts`

#### checkout.session.completed
- Creates subscription record
- Calls `ensureContentCoverage(userId, 7)`
- Generates initial 7 days of content

#### invoice.paid
- Updates subscription status to active
- Calls `ensureContentCoverage(userId, 7)`
- Generates next 7 days if needed

#### customer.subscription.deleted
- Updates subscription status to canceled
- User loses access at next dashboard visit

### Content Generation Logic
**File:** `libs/content-generation.ts`

#### generateNextWeekContentPlan(websiteId, userId)
1. Get website details
2. Fetch existing keywords
3. Filter out used keywords
4. If < 7 available:
   - Generate new keywords via DataForSEO
   - Insert into database
5. Select top 7 keywords by search volume
6. Find last scheduled date
7. Create 7 content plans starting from (last_date + 1) or today
8. Return success

#### ensureContentCoverage(userId, daysToEnsure = 7)
1. Fetch all user websites
2. For each website:
   - Count existing content plans for next N days
   - If < N days exist:
     - Call `generateNextWeekContentPlan()`
3. Return success

---

## Database Schema

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status subscription_status_enum, -- 'active', 'canceled', 'past_due', etc.
  plan_type plan_type_enum, -- 'weekly', 'ltd'
  cancel_at_period_end BOOLEAN,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### user_profiles
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  is_verified BOOLEAN DEFAULT false,
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### content_plan
```sql
CREATE TABLE content_plan (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL,
  target_keyword TEXT,
  keyword_id UUID,
  title TEXT,
  scheduled_for TIMESTAMPTZ,
  status content_plan_status_enum, -- 'planned', 'draft', 'published'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## Edge Cases Handled

### 1. User has multiple websites
- Each website gets independent 7-day content plans
- `ensureContentCoverage()` loops through all websites
- Each website independently generates keywords

### 2. User runs out of keywords
- System detects < 7 available keywords
- Automatically calls DataForSEO to discover more
- Inserts new keywords into database
- Continues content generation

### 3. Payment fails on renewal
- Stripe retries payment automatically
- Subscription remains active during retry period
- If all retries fail:
  - `customer.subscription.deleted` fires
  - User loses access
- User can update payment method via Stripe portal

### 4. User waits days/weeks before resubscribing
- All historical data preserved
- Content generation continues from last scheduled date
- May create gap in calendar (expected behavior)
- User can manually generate articles for past days

### 5. Webhook fires multiple times
- `upsert` operation on subscriptions (idempotent)
- `ensureContentCoverage()` checks existing content before generating
- No duplicate content plans created

---

## Configuration

**Weekly Subscription:**
- Duration: 7 days
- Price: $14.99/week
- Stripe Price ID: `process.env.STRIPE_WEEKLY_PRICE_ID`

**LTD Subscription:**
- Duration: 100 years (effectively lifetime)
- Price: Set in Stripe
- Stripe Price ID: `process.env.STRIPE_LTD_PRICE_ID`

**Content Generation:**
- Days per generation: 7
- Keyword difficulty threshold: < 60
- Competition filter: LOW or MEDIUM
- Search volume sorting: Descending

---

## Testing Checklist

### New User Flow
- [ ] Sign up → redirected to pricing
- [ ] Subscribe → redirected to dashboard → redirected to onboarding
- [ ] Complete onboarding → redirected to dashboard
- [ ] Verify 7 days of content generated
- [ ] Verify keywords populated in database

### Content Generation
- [ ] Generate article for today
- [ ] Generate article for past day
- [ ] Change keyword for any day
- [ ] Verify skeleton loading states

### Renewal Flow
- [ ] Wait 7 days (or manually trigger webhook)
- [ ] Verify next 7 days generated
- [ ] Verify no duplicate content

### Cancellation Flow
- [ ] Cancel subscription
- [ ] Verify access retained until period end
- [ ] After period end, verify redirect to pricing
- [ ] Resubscribe and verify access restored

### Edge Cases
- [ ] Multiple websites → all get content
- [ ] Run out of keywords → new ones generated
- [ ] Payment fails → user loses access
- [ ] Webhook duplicate → no duplicates created

---

## Monitoring

**Key Metrics:**
- Subscription creation rate
- Content generation success rate
- Keyword discovery API success rate
- Weekly renewal rate
- Cancellation rate

**Log Messages:**
- `✅ Generated initial content for subscriber {userId}`
- `✅ Generated content for user {userId} after payment`
- `⚠️ Only {count} available keywords, generating more...`
- `❌ No keywords available. Please add more seed keywords.`

**Stripe Webhook Events:**
- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

---

## Summary

The system is now:
- ✅ Fully automated
- ✅ No trial complexity
- ✅ Simple pay-to-access model
- ✅ Automatic content generation on payment
- ✅ Automatic renewal handling
- ✅ Graceful cancellation with period retention
- ✅ Handles multiple websites
- ✅ Auto-discovers keywords when needed
- ✅ Allows past day article generation
- ✅ Clean, minimal code
